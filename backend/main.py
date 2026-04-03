from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import random
import requests
import os
from dotenv import load_dotenv

# Load env variables
load_dotenv()
GOOGLE_API_KEY = os.getenv("GOOGLE_MAPS_API_KEY")

app = FastAPI()

# CORS
origins = [
    "http://localhost:3000",
    "http://localhost:8080",
    "http://localhost:8081"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------- FALLBACK ---------------- #

def generate_fallback_routes():
    return [
        {
            "time": 44,
            "distance": "12.4 km",
            "summary": "Fastest via Metro",
            "transfers": 1,
            "cost": 55,
            "reliability": 92,
            "crowd": "low",
            "auto_availability": 80,
            "explanation": ""
        },
        {
            "time": 28,
            "distance": "10.1 km",
            "summary": "Quickest via Auto/Cab",
            "transfers": 0,
            "cost": 85,
            "reliability": 88,
            "crowd": "medium",
            "auto_availability": 60,
            "explanation": ""
        },
        {
            "time": 54,
            "distance": "15.8 km",
            "summary": "Cheapest via Bus",
            "transfers": 2,
            "cost": 35,
            "reliability": 78,
            "crowd": "high",
            "auto_availability": 30,
            "explanation": ""
        }
    ]

# ---------------- GOOGLE ROUTES ---------------- #

def get_real_routes(origin, destination):
    url = "https://maps.googleapis.com/maps/api/directions/json"

    params = {
        "origin": origin,
        "destination": destination,
        "mode": "transit",
        "alternatives": "true",
        "key": GOOGLE_API_KEY
    }

    try:
        response = requests.get(url, params=params)
        data = response.json()

        print("Google API Status:", data.get("status"))

        if data.get("status") != "OK":
            print("Error:", data.get("error_message"))
            return None

        routes = []

        for route in data["routes"]:
            leg = route["legs"][0]

            duration = leg["duration"]["value"] // 60

            # Count transfers
            transfers = sum(1 for step in leg["steps"] if step.get("transit_details"))
            transfers = max(0, transfers - 1)

            routes.append({
                "time": duration,
                "distance": leg["distance"]["text"],
                "summary": route.get("summary", "Transit Route"),
                "transfers": transfers,
                "cost": random.randint(30, 90),
                "reliability": random.randint(70, 95),
                "crowd": random.choice(["low", "medium", "high"]),
                "auto_availability": random.randint(20, 90),
                "explanation": ""
            })

        return routes

    except Exception as e:
        print("Fetch error:", e)
        return None

# ---------------- LOGIC ---------------- #

def calculate_stress(route):
    stress = 0

    if route["crowd"] == "high":
        stress += 2
    elif route["crowd"] == "medium":
        stress += 1

    if route["transfers"] > 1:
        stress += 2

    if route["auto_availability"] < 50:
        stress += 1

    return "low" if stress <= 1 else "medium" if stress <= 3 else "high"


def score_route(route):
    score = 0

    score += (100 - route["time"])
    score += (100 - route["cost"])
    score += route["reliability"]

    if route["stress"] == "high":
        score -= 20
    elif route["stress"] == "medium":
        score -= 10

    return score

# ---------------- API ---------------- #

@app.get("/")
def home():
    return {"message": "CommuteAI Backend Running"}


@app.get("/routes")
def get_routes(origin: str, destination: str, break_type: str = "none"):

    routes = get_real_routes(origin, destination)

    if not routes:
        print("Using fallback routes")
        routes = generate_fallback_routes()
        api_used = False
    else:
        print("Using REAL routes")
        api_used = True

    # Break logic
    for route in routes:
        if break_type == "coffee":
            route["break_stop"] = "Coffee stop (~10 min)"
            route["time"] += 10
            route["cost"] += 20
        elif break_type == "washroom":
            route["break_stop"] = "Washroom stop (~5 min)"
            route["time"] += 5
        else:
            route["break_stop"] = None

    # Stress + Score
    for route in routes:
        route["stress"] = calculate_stress(route)
        route["score"] = score_route(route)

    # Sort
    routes.sort(key=lambda x: x["score"], reverse=True)

    # Tags + explanation + availability + tradeoff
    for i, route in enumerate(routes):
        is_cheapest = route["cost"] == min(r["cost"] for r in routes)
        is_fastest = route["time"] == min(r["time"] for r in routes)

        if i == 0:
            route["tag"] = "best"
            route["explanation"] = "Optimized for time, cost, and comfort"
            route["auto_availability"] = random.randint(80, 90)
        elif is_cheapest:
            route["tag"] = "cheapest"
            route["explanation"] = "Lowest cost option"
            route["auto_availability"] = random.randint(20, 50)
        elif is_fastest:
            route["tag"] = "fastest"
            route["explanation"] = "Quickest route available"
            route["auto_availability"] = random.randint(60, 80)
        else:
            route["tag"] = "alternative"
            route["explanation"] = "Balanced route"

        # Availability warning
        if route["auto_availability"] < 40:
            route["availability_warning"] = "Low chance of getting auto"
        elif route["auto_availability"] < 70:
            route["availability_warning"] = "Moderate availability"
        else:
            route["availability_warning"] = "High availability"

        # Tradeoff
        if i > 0:
            best = routes[0]
            time_diff = route["time"] - best["time"]
            cost_diff = route["cost"] - best["cost"]

            if cost_diff < 0:
                route["tradeoff"] = f"₹{abs(cost_diff)} cheaper but +{time_diff} min"
            elif time_diff < 0:
                route["tradeoff"] = f"{abs(time_diff)} min faster but ₹{cost_diff} more"
            else:
                route["tradeoff"] = ""
        else:
            route["tradeoff"] = ""

    return {
        "api_used": api_used,
        "routes": routes
    }