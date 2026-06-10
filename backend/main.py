from __future__ import annotations

import os
import random
from datetime import datetime
from concurrent.futures import ThreadPoolExecutor

import requests
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import re

# ---------------- CONFIG ---------------- #

USE_MOCK = False

DIRECTIONS_URL = "https://maps.googleapis.com/maps/api/directions/json"
PLACES_NEARBY_URL = "https://maps.googleapis.com/maps/api/place/nearbysearch/json"
DRIVING_MODE = "driving"
TRANSIT_MODE = "transit"
USE_ALTERNATIVES = "true"

DEFAULT_COSTS = [70, 50, 30]
DEFAULT_TAGS = ["best", "fastest", "cheapest"]
DEFAULT_CROWD_LEVELS = ["low", "medium", "high"]
DEFAULT_RELIABILITY = [90, 85, 80]
AUTO_AVAILABILITY_MIN = 40
AUTO_AVAILABILITY_MAX = 90

load_dotenv()
API_KEY = os.getenv("GOOGLE_MAPS_API_KEY")

# CORS: allow all in dev; lock to your domain in prod by setting ALLOWED_ORIGINS env var
# e.g.  ALLOWED_ORIGINS=https://commuteai.vercel.app,https://www.commuteai.app
_raw_origins = os.getenv("ALLOWED_ORIGINS", "*")
ALLOWED_ORIGINS = [o.strip() for o in _raw_origins.split(",")] if _raw_origins != "*" else ["*"]

app = FastAPI()


@app.on_event("startup")
def on_startup() -> None:
    print("Backend running — CORS origins:", ALLOWED_ORIGINS)


@app.exception_handler(Exception)
async def unhandled_exception_handler(request, exc: Exception):
    print("Unhandled exception:", repr(exc))
    return JSONResponse(status_code=500, content={"error": "Internal server error"})


app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def generate_fallback_routes():
    return [
        {
            "time": 44,
            "distance": "12.4 km",
            "summary": "Fastest via Metro",
            "mode_sequence": ["walk", "metro", "bus"],
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
            "mode_sequence": ["cab"],
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
            "mode_sequence": ["walk", "bus", "bus"],
            "transfers": 2,
            "cost": 35,
            "reliability": 78,
            "crowd": "high",
            "auto_availability": 30,
            "explanation": ""
        }
    ]

def _strip_html(text: str) -> str:
    return re.sub(r"<[^>]*>", "", text or "").strip()


def _extract_road_names(steps: list[dict]) -> list[str]:
    names: list[str] = []
    for step in steps[:3]:
        instr = _strip_html(step.get("html_instructions") or "")
        if not instr:
            continue

        m = re.search(r"\bonto\s+([^,]+)", instr, flags=re.IGNORECASE)
        if not m:
            m = re.search(r"\bon\s+([^,]+)", instr, flags=re.IGNORECASE)
        if not m:
            continue

        name = m.group(1).strip()
        name = re.sub(r"\s+\(.*?\)\s*", " ", name).strip()
        if name and name.lower() not in {n.lower() for n in names}:
            names.append(name)
        if len(names) >= 2:
            break
    return names


def _build_summary(route_obj: dict, leg: dict) -> str:
    summary = (route_obj.get("summary") or "").strip()
    if summary:
        return summary if summary.lower().startswith("via ") else f"via {summary}"

    roads = _extract_road_names(leg.get("steps") or [])
    if roads:
        return "via " + " / ".join(roads)

    steps = leg.get("steps") or []
    fallback_bits: list[str] = []
    for step in steps[:2]:
        instr = _strip_html(step.get("html_instructions") or "")
        if instr:
            instr = instr.rstrip(".")
            fallback_bits.append(instr)
    if fallback_bits:
        fallback = " / ".join(fallback_bits)
        fallback = re.sub(r"\s+", " ", fallback).strip()
        if len(fallback) > 90:
            fallback = fallback[:90].rstrip()
        return "via " + fallback

    return "via suggested route"


_VEHICLE_TYPE_MAP: dict[str, str] = {
    "SUBWAY": "metro",
    "METRO_RAIL": "metro",
    "HEAVY_RAIL": "metro",
    "COMMUTER_TRAIN": "metro",
    "BUS": "bus",
    "INTERCITY_BUS": "bus",
    "TROLLEYBUS": "bus",
    "TRAM": "tram",
    "LIGHT_RAIL": "tram",
    "FERRY": "ferry",
    "CABLE_CAR": "tram",
    "OTHER": "transit",
}


def _extract_mode_sequence(steps: list[dict], primary_mode: str) -> list[str]:
    """Return ordered, deduplicated list of transport mode slugs for a route."""
    if primary_mode == DRIVING_MODE:
        return ["cab"]

    modes: list[str] = []
    for step in steps:
        travel_mode = step.get("travel_mode", "")
        if travel_mode == "WALKING":
            dist_m = (step.get("distance") or {}).get("value", 0)
            if dist_m > 150:
                modes.append("walk")
        elif travel_mode == "TRANSIT":
            transit = step.get("transit_details") or {}
            vtype = ((transit.get("line") or {}).get("vehicle") or {}).get("type", "OTHER").upper()
            modes.append(_VEHICLE_TYPE_MAP.get(vtype, "transit"))
        elif travel_mode == "BICYCLING":
            modes.append("bike")

    deduped: list[str] = []
    for m in modes:
        if not deduped or deduped[-1] != m:
            deduped.append(m)

    return deduped if deduped else ["transit"]


def get_nearby_cafes(lat: float, lng: float) -> list[dict]:
    if not API_KEY:
        return []

    params = {
        "location": f"{lat},{lng}",
        "radius": 1000,
        "type": "cafe",
        "key": API_KEY,
    }
    try:
        res = requests.get(PLACES_NEARBY_URL, params=params, timeout=15).json()
        status = res.get("status")
        if status != "OK":
            return []

        cafes: list[dict] = []
        for place in (res.get("results") or [])[:3]:
            name = place.get("name")
            if not name:
                continue
            cafes.append(
                {
                    "name": name,
                    "rating": place.get("rating"),
                    "address": place.get("vicinity"),
                }
            )
        return cafes
    except Exception:
        return []


def _estimate_crowd(now: datetime) -> str:
    h = now.hour
    if (8 <= h <= 11) or (17 <= h <= 20):
        return "high"
    if (12 <= h <= 14) or (21 <= h <= 22):
        return "medium"
    return "low"


def _calculate_realistic_cost(distance_m: int, mode_sequence: list[str]) -> int:
    km = max(distance_m / 1000.0, 0.5)

    has_metro = "metro" in mode_sequence
    has_bus = "bus" in mode_sequence
    has_tram = "tram" in mode_sequence
    has_ferry = "ferry" in mode_sequence
    is_cab = "cab" in mode_sequence

    if is_cab:
        # Ola/Uber Mini: ₹50 base + ₹11/km, surge possible
        return max(80, int(50 + km * 11))

    if has_metro and not has_bus:
        # Standard metro slab pricing (Mumbai/Delhi/Bangalore)
        if km <= 2:   return 10
        elif km <= 5:  return 20
        elif km <= 8:  return 30
        elif km <= 12: return 40
        elif km <= 18: return 50
        elif km <= 25: return 60
        else:          return 70

    if has_metro and has_bus:
        metro_slab = 30 if km > 8 else 20
        return metro_slab + 10  # metro + one bus hop

    if has_bus and not has_metro:
        return max(5, min(20, int(5 + km * 1.2)))

    if has_ferry:
        return max(20, int(km * 6))

    if has_tram:
        return max(10, int(km * 3))

    # auto-rickshaw fallback
    return max(30, int(30 + km * 9))


def _extract_detailed_steps(steps: list[dict], primary_mode: str) -> list[dict]:
    """Return human-readable step-by-step directions with stop names and line numbers."""
    detailed: list[dict] = []

    if primary_mode == DRIVING_MODE:
        return []  # driving steps are not useful for commuters

    for step in steps:
        travel_mode = step.get("travel_mode", "")
        duration_text = (step.get("duration") or {}).get("text", "")
        distance_text = (step.get("distance") or {}).get("text", "")
        dist_m = (step.get("distance") or {}).get("value", 0)

        if travel_mode == "WALKING":
            if dist_m < 60:
                continue  # skip trivial walks
            detailed.append({
                "type": "walk",
                "instruction": "Walk",
                "duration": duration_text,
                "distance": distance_text,
            })

        elif travel_mode == "TRANSIT":
            transit = step.get("transit_details") or {}
            line = transit.get("line") or {}
            vehicle = line.get("vehicle") or {}
            dep_stop = (transit.get("departure_stop") or {}).get("name", "")
            arr_stop = (transit.get("arrival_stop") or {}).get("name", "")
            line_short = line.get("short_name") or ""
            line_name = line.get("name") or ""
            num_stops = transit.get("num_stops", 0)
            dep_time = (transit.get("departure_time") or {}).get("text", "")
            arr_time = (transit.get("arrival_time") or {}).get("text", "")
            headsign = transit.get("headsign", "")
            vtype = vehicle.get("type", "BUS").upper()
            mode_slug = _VEHICLE_TYPE_MAP.get(vtype, "bus")

            detailed.append({
                "type": mode_slug,
                "line": line_short or line_name,
                "headsign": headsign,
                "from_stop": dep_stop,
                "to_stop": arr_stop,
                "num_stops": num_stops,
                "departure_time": dep_time,
                "arrival_time": arr_time,
                "duration": duration_text,
                "distance": distance_text,
            })

    return detailed


def _get_coach_advice(mode_seq: list[str], origin: str, destination: str) -> str | None:
    """Bangalore-specific coach/boarding advice based on time and direction."""
    now = datetime.now()
    hour = now.hour
    has_metro = "metro" in mode_seq
    has_bus = "bus" in mode_seq
    if not has_metro and not has_bus:
        return None

    is_morning_peak = 7 <= hour <= 10
    is_evening_peak = 17 <= hour <= 20
    is_peak = is_morning_peak or is_evening_peak

    origin_l = origin.lower()
    dest_l = destination.lower()

    # Towards city centre in morning = more crowded at front
    towards_city = any(w in dest_l for w in ["majestic", "mg road", "cubbon", "vidhana", "central", "city", "silk board"])
    away_from_city = any(w in origin_l for w in ["majestic", "mg road", "cubbon", "vidhana", "central", "city"])

    if has_metro:
        if is_morning_peak and towards_city:
            return "🚃 Board coaches 4–6 — front coaches fill up first at CBD stations"
        if is_evening_peak and (away_from_city or towards_city):
            return "🚃 Last 2 coaches are less crowded during evening peak. Step back on the platform"
        if is_peak:
            return "🚃 Middle coaches (3–5) tend to be balanced. Avoid coach 1 near the main exit"
        return "🚃 Off-peak — any coach works. Coach 1 is closest to most station exits"

    if has_bus:
        if is_peak:
            return "🚌 Board near the front door for easier exit at your stop. Expect standing room only"
        return "🚌 Low crowd expected — any door works. Window seats available"

    return None


def _extract_step_segments(steps: list[dict], primary_mode: str) -> list[dict]:
    """Return [{mode, polyline}] per step for coloured map rendering."""
    segments: list[dict] = []
    if primary_mode == DRIVING_MODE:
        for step in steps:
            poly = (step.get("polyline") or {}).get("points")
            if poly:
                segments.append({"mode": "cab", "polyline": poly})
        return segments

    for step in steps:
        poly = (step.get("polyline") or {}).get("points")
        if not poly:
            continue
        travel_mode = step.get("travel_mode", "")
        if travel_mode == "WALKING":
            dist_m = (step.get("distance") or {}).get("value", 0)
            seg_mode = "walk" if dist_m > 100 else None
        elif travel_mode == "TRANSIT":
            transit = step.get("transit_details") or {}
            vtype = ((transit.get("line") or {}).get("vehicle") or {}).get("type", "OTHER").upper()
            seg_mode = _VEHICLE_TYPE_MAP.get(vtype, "transit")
        elif travel_mode == "BICYCLING":
            seg_mode = "bike"
        else:
            seg_mode = "transit"

        if seg_mode:
            segments.append({"mode": seg_mode, "polyline": poly})

    return segments


def _fetch_directions(origin: str, destination: str, mode: str, departure_time: str = "now") -> list[dict]:
    params = {
        "origin": origin,
        "destination": destination,
        "mode": mode,
        "alternatives": USE_ALTERNATIVES,
        "key": API_KEY,
    }
    if mode == DRIVING_MODE:
        params["departure_time"] = departure_time
        params["traffic_model"] = "best_guess"
    elif mode == TRANSIT_MODE:
        # departure_time helps Google return real scheduled transit options
        params["departure_time"] = departure_time if departure_time != "now" else "now"

    response = requests.get(DIRECTIONS_URL, params=params, timeout=15)
    data = response.json()

    print("Google API Status:", data.get("status"))
    print("Routes returned:", len(data.get("routes", [])))

    status = data.get("status")
    if status != "OK":
        print("Error:", data.get("error_message"))
        return []

    routes: list[dict] = []
    for route_obj in data.get("routes", [])[:3]:
        legs = route_obj.get("legs") or []
        if not legs:
            continue
        leg = legs[0]

        duration_seconds = (leg.get("duration") or {}).get("value")
        duration_in_traffic_seconds = (leg.get("duration_in_traffic") or {}).get("value")
        distance_text = (leg.get("distance") or {}).get("text")
        distance_m = (leg.get("distance") or {}).get("value", 0)
        if duration_seconds is None or not distance_text:
            continue
        effective_duration_seconds = duration_in_traffic_seconds or duration_seconds

        duration_minutes = int(effective_duration_seconds // 60)
        traffic_delay_minutes = None
        if duration_in_traffic_seconds is not None:
            traffic_delay_minutes = int(max(0, (duration_in_traffic_seconds - duration_seconds)) // 60)

        steps = leg.get("steps") or []
        transfers = sum(1 for step in steps if step.get("transit_details"))
        transfers = max(0, transfers - 1)

        mode_seq = _extract_mode_sequence(steps, mode)
        cost = _calculate_realistic_cost(distance_m, mode_seq)
        step_segments = _extract_step_segments(steps, mode)
        detailed_steps = _extract_detailed_steps(steps, mode)
        coach_advice = _get_coach_advice(mode_seq, origin, destination)

        start_loc = (leg.get("start_location") or {})
        end_loc = (leg.get("end_location") or {})
        try:
            mid_lat = (float(start_loc.get("lat")) + float(end_loc.get("lat"))) / 2.0
            mid_lng = (float(start_loc.get("lng")) + float(end_loc.get("lng"))) / 2.0
            cafes = get_nearby_cafes(mid_lat, mid_lng)
        except Exception:
            cafes = []

        routes.append(
            {
                "time": duration_minutes,
                "distance": distance_text,
                "distance_m": distance_m,
                "summary": _build_summary(route_obj, leg),
                "mode_sequence": mode_seq,
                "transfers": transfers,
                "traffic_delay": traffic_delay_minutes,
                "cafes": cafes,
                "overview_polyline": route_obj.get("overview_polyline"),
                "step_segments": step_segments,
                "detailed_steps": detailed_steps,
                "coach_advice": coach_advice,
                "cost": cost,
            }
        )

    return routes


def get_real_routes(origin: str, destination: str, departure_time: str = "now", arrival_time: str | None = None):
    try:
        if not origin or not destination:
            return []
        if not API_KEY:
            print("Error: Missing GOOGLE_MAPS_API_KEY")
            return []

        # Fetch driving + transit IN PARALLEL — ~2x faster
        with ThreadPoolExecutor(max_workers=2) as pool:
            driving_fut = pool.submit(_fetch_directions, origin, destination, DRIVING_MODE, departure_time)
            transit_fut = pool.submit(_fetch_directions, origin, destination, TRANSIT_MODE, departure_time)
            driving_routes = driving_fut.result(timeout=12)
            transit_routes = transit_fut.result(timeout=12)

        print(f"Driving routes: {len(driving_routes)}, Transit routes: {len(transit_routes)}")

        # Prefer 1 cab + rest transit if transit available; else all driving
        combined: list[dict] = []
        if transit_routes and driving_routes:
            # Pick the fastest cab route + up to 2 transit routes
            combined = driving_routes[:1] + transit_routes[:2]
        elif transit_routes:
            combined = transit_routes[:3]
        else:
            combined = driving_routes[:3]

        return combined
    except Exception as e:
        print("Fetch error:", e)
        return []

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

def availability_warning(auto_availability: int) -> str:
    if auto_availability < 40:
        return "Low chance of getting auto"
    if auto_availability < 70:
        return "Moderate availability"
    return "High availability"

def compute_score(time_minutes: int, cost: int, reliability: int, transfers: int, crowd: str, stress: str) -> float:
    crowd_impact = 0 if crowd == "low" else 4 if crowd == "medium" else 8
    stress_impact = 0 if stress == "low" else 6 if stress == "medium" else 12
    transfers_penalty = transfers * 3
    # Time is primary (60%), cost secondary (8%) — a 136-min bus should never beat a 50-min cab as "best"
    return (time_minutes * 0.60) + (cost * 0.08) - (reliability * 0.15) + transfers_penalty + crowd_impact + stress_impact

def build_explanation(summary: str, transfers: int, crowd: str) -> str:
    crowd_text = "low crowd" if crowd == "low" else ("moderate crowd" if crowd == "medium" else "heavy crowd")
    transfers_text = "no transfers" if transfers == 0 else ("just 1 transfer" if transfers == 1 else f"{transfers} transfers")
    summary_text = summary or "Route"
    return f"{summary_text}. Takes {{time}} minutes with {transfers_text} and usually {crowd_text}."

def assign_tags(routes: list[dict], scores: list[float]) -> list[str]:
    n = len(routes)
    if n == 0:
        return []

    best_idx = min(range(n), key=lambda i: scores[i])
    remaining = [i for i in range(n) if i != best_idx]

    # "fastest" only makes sense if it's genuinely faster than "best"
    fastest_idx = None
    if remaining:
        candidate = min(remaining, key=lambda i: routes[i]["time"])
        if routes[candidate]["time"] < routes[best_idx]["time"]:
            fastest_idx = candidate
            remaining = [i for i in remaining if i != fastest_idx]

    # "cheapest" only if it genuinely costs less than "best"
    cheapest_idx = None
    for i in remaining:
        if routes[i]["cost"] < routes[best_idx]["cost"]:
            if cheapest_idx is None or routes[i]["cost"] < routes[cheapest_idx]["cost"]:
                cheapest_idx = i

    tags = ["alternative"] * n
    tags[best_idx] = "best"
    if fastest_idx is not None:
        tags[fastest_idx] = "fastest"
    if cheapest_idx is not None:
        tags[cheapest_idx] = "cheapest"
    return tags

def build_tradeoff(best: dict, other: dict) -> str:
    time_delta = other["time"] - best["time"]
    cost_delta = other["cost"] - best["cost"]

    stress_rank = {"low": 0, "medium": 1, "high": 2}
    crowd_rank = {"low": 0, "medium": 1, "high": 2}
    comfort_better = (stress_rank.get(other["stress"], 1) < stress_rank.get(best["stress"], 1)) or (
        crowd_rank.get(other["crowd"], 1) < crowd_rank.get(best["crowd"], 1)
    )

    if time_delta < 0 and cost_delta > 0:
        if abs(time_delta) >= 10:
            return "Costs more but saves significant time"
        return "Costs a bit more but gets you there faster"

    if time_delta > 0 and cost_delta < 0:
        if abs(cost_delta) >= 20:
            return "Cheaper but takes longer"
        return "Saves some money but adds a bit of time"

    if time_delta > 0 and comfort_better:
        return "Slightly slower but more comfortable"

    if time_delta < 0 and not comfort_better:
        return "Faster but likely more crowded"

    parts: list[str] = []
    if time_delta != 0:
        parts.append(f"{abs(time_delta)} min {'slower' if time_delta > 0 else 'faster'}")
    if cost_delta != 0:
        parts.append(f"₹{abs(cost_delta)} {'more' if cost_delta > 0 else 'cheaper'}")
    return " but ".join(parts[:2])

def recommendation_reason(tag: str, route: dict) -> str:
    time_minutes = route["time"]
    cost = route["cost"]
    stress = route["stress"]
    crowd = route["crowd"]
    transfers = route["transfers"]

    if tag == "best":
        if time_minutes < 35:
            return "Best balance overall and also one of the fastest choices"
        if cost < 40:
            return "Best balance overall and great value for money"
        if stress == "low":
            return "Best balance of time, cost, and comfort"
        return "Best balance of time, cost, and reliability"

    if tag == "fastest":
        if transfers == 0:
            return "Fastest option if you're in a hurry (no transfers)"
        return "Fastest option if you're in a hurry"

    if tag == "cheapest":
        if crowd == "high" or stress == "high":
            return "Cheapest option but can feel crowded"
        return "Cheapest option without major compromises"

    if stress == "low":
        return "Comfortable alternative with low stress"
    if cost < 40:
        return "Affordable alternative worth considering"
    return "Solid alternative depending on your priorities"

def enrich_routes(routes: list[dict], break_type: str, source: str) -> list[dict]:
    for route in routes:
        route["source"] = source

        if break_type == "coffee":
            route["break_stop"] = "Coffee stop (~10 min)"
            route["time"] += 10
            route["cost"] += 20
        elif break_type == "washroom":
            route["break_stop"] = "Washroom stop (~5 min)"
            route["time"] += 5
        else:
            route["break_stop"] = None

        route["stress"] = calculate_stress(route)
        route["availability_warning"] = availability_warning(route["auto_availability"])
        route["explanation"] = build_explanation(route.get("summary") or "Route", route["transfers"], route["crowd"]).format(
            time=route["time"]
        )

    scores = [
        compute_score(r["time"], r["cost"], r["reliability"], r["transfers"], r["crowd"], r["stress"])
        for r in routes
    ]
    ordering = sorted(range(len(routes)), key=lambda i: scores[i])
    routes = [routes[i] for i in ordering]
    scores = [scores[i] for i in ordering]

    tags = assign_tags(routes, scores)
    for i, route in enumerate(routes):
        route["tag"] = tags[i]
        route["recommendation_reason"] = recommendation_reason(tags[i], route)

        if route["time"] < 35:
            route["explanation"] = f"{route['explanation']} Great when you're in a hurry."
        elif route["cost"] < 40:
            route["explanation"] = f"{route['explanation']} Good if you're trying to save money."
        elif route["stress"] == "low":
            route["explanation"] = f"{route['explanation']} Usually the most comfortable ride."

    best_idx = None
    for i, tag in enumerate(tags):
        if tag == "best":
            best_idx = i
            break

    if best_idx is None:
        for route in routes:
            route["tradeoff"] = ""
        return routes

    best = routes[best_idx]
    for i, route in enumerate(routes):
        route["tradeoff"] = "" if i == best_idx else build_tradeoff(best, route)

    return routes

@app.get("/")
def home():
    return {"message": "CommuteAI Backend Running"}

@app.get("/test")
def test():
    return {"status": "ok"}

@app.get("/routes")
def get_routes(origin: str, destination: str, break_type: str = "none", departure_time: str = "now", arrival_time: str | None = None):
    if USE_MOCK:
        routes = generate_fallback_routes()[:3]
        return enrich_routes(routes, break_type, source="mock")

    routes = get_real_routes(origin, destination, departure_time, arrival_time)[:3]
    if not routes:
        return []

    # Strip cafe data for non-coffee break selections
    if break_type not in ("coffee", "flexible"):
        for route in routes:
            route.pop("cafes", None)

    crowd = _estimate_crowd(datetime.now())
    for i, route in enumerate(routes):
        # cost is already set per-route from _calculate_realistic_cost
        route["reliability"] = DEFAULT_RELIABILITY[i] if i < len(DEFAULT_RELIABILITY) else 78
        route["crowd"] = crowd
        route["auto_availability"] = random.randint(AUTO_AVAILABILITY_MIN, AUTO_AVAILABILITY_MAX)
        route["explanation"] = ""

    return enrich_routes(routes, break_type, source="real")
