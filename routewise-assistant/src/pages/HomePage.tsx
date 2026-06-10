import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sun, Moon } from "lucide-react";
import HomeScreen from "@/components/search/HomeScreen";
import ResultsPage from "@/pages/ResultsPage";
import RouteDetailsPage from "@/pages/RouteDetailsPage";
import RouteMap from "@/components/route/RouteMap";
import AskAISheet from "@/components/ai/AskAISheet";
import { fetchRoutes } from "@/services/routeService";
import { AppScreen } from "@/types";
import { useRef } from "react";

const HomePage = () => {
  const [screen, setScreen] = useState<AppScreen>("home");
  const [selectedRoute, setSelectedRoute] = useState<any | null>(null);
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem("commuteai-dark");
    const isDark = saved === "true";
    if (isDark) document.documentElement.classList.add("dark");
    return isDark;
  });
  const [breakType, setBreakType] = useState("none");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [fromPlaceId, setFromPlaceId] = useState<string | null>(null);
  const [toPlaceId, setToPlaceId] = useState<string | null>(null);
  const [timeMode, setTimeMode] = useState<"now" | "later">("now");
  const [scheduledTime, setScheduledTime] = useState<string>("");
  const [routes, setRoutes] = useState<any[] | null>(null);
  const [routesLoading, setRoutesLoading] = useState(false);
  const [meetingTime, setMeetingTime] = useState<string>("");   // "arrive by" time
  const lastFetchRef = useRef<string>("");

  const toggleDark = () => {
    const next = !darkMode;
    setDarkMode(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("commuteai-dark", String(next));
  };

  const departureTime =
    timeMode === "later" && scheduledTime
      ? String(Math.floor(new Date(scheduledTime).getTime() / 1000))
      : undefined;

  const arrivalTime =
    meetingTime
      ? String(Math.floor(new Date(meetingTime).getTime() / 1000))
      : undefined;

  const handleSearch = () => {
    const key = `${from}|${to}|${breakType}|${departureTime ?? "now"}|${arrivalTime ?? ""}`;
    if (key === lastFetchRef.current && routes !== null) {
      setScreen("results");
      return;
    }
    lastFetchRef.current = key;
    setRoutes(null);
    setRoutesLoading(true);
    setScreen("results");
    fetchRoutes(from, to, breakType, departureTime, arrivalTime)
      .then((res) => setRoutes(res || []))
      .catch(() => setRoutes([]))
      .finally(() => setRoutesLoading(false));
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-background">

      {/* ── Header ── */}
      <header className="flex-none px-4 py-3 flex items-center justify-between max-w-md mx-auto w-full">
        <div className="flex items-center gap-2.5">
          <svg width="36" height="36" viewBox="0 0 42 42" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <rect width="42" height="42" rx="11" fill="url(#hLogoGrad)" />
            <path d="M30 12 C26 8 16 8 12 14 C8 20 8 28 14 33 C18 37 26 37 30 33" stroke="white" strokeWidth="3" strokeLinecap="round" fill="none" />
            <circle cx="30" cy="22" r="3" fill="white" opacity="0.95" />
            <defs>
              <linearGradient id="hLogoGrad" x1="0" y1="0" x2="42" y2="42" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#7c3aed" />
                <stop offset="100%" stopColor="#4f46e5" />
              </linearGradient>
            </defs>
          </svg>
          <div>
            <h1 className="text-base font-bold text-foreground tracking-tight leading-tight">CommuteAI</h1>
            <p className="text-[10px] text-muted-foreground leading-tight">Smarter routes. Better decisions.</p>
          </div>
        </div>
        <button
          onClick={toggleDark}
          className="p-2.5 rounded-full bg-card shadow-card border border-border hover:shadow-elevated transition-all"
          aria-label="Toggle theme"
        >
          {darkMode ? <Sun className="w-4 h-4 text-yellow-400" /> : <Moon className="w-4 h-4 text-muted-foreground" />}
        </button>
      </header>

      {/* ── Ask AI — floats over everything ── */}
      {screen !== "detail" && <AskAISheet from={from} to={to} />}

      {/* ── Scrollable content ── */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-md mx-auto">
          <AnimatePresence mode="wait">

            {screen === "home" && (
              <motion.div
                key="home"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.2 }}
              >
                {/* Map as a card inside the scroll area */}
                <div className="px-4 pt-1 pb-3">
                  <RouteMap
                    origin={from}
                    destination={to}
                    originPlaceId={undefined}
                    destinationPlaceId={undefined}
                    heightClassName="h-52"
                  />
                </div>
                <HomeScreen
                  onSearch={handleSearch}
                  breakPref={breakType}
                  setBreakPref={setBreakType}
                  from={from}
                  setFrom={setFrom}
                  fromPlaceId={fromPlaceId}
                  setFromPlaceId={setFromPlaceId}
                  to={to}
                  setTo={setTo}
                  toPlaceId={toPlaceId}
                  setToPlaceId={setToPlaceId}
                  timeMode={timeMode}
                  setTimeMode={setTimeMode}
                  scheduledTime={scheduledTime}
                  setScheduledTime={setScheduledTime}
                  meetingTime={meetingTime}
                  setMeetingTime={setMeetingTime}
                />
              </motion.div>
            )}

            {screen === "results" && (
              <motion.div
                key="results"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.2 }}
              >
                {/* Map card on results — shows route pins */}
                <div className="px-4 pt-1 pb-3">
                  <RouteMap
                    origin={from}
                    destination={to}
                    originPlaceId={fromPlaceId}
                    destinationPlaceId={toPlaceId}
                    heightClassName="h-44"
                  />
                </div>
                <ResultsPage
                  onBack={() => setScreen("home")}
                  from={from}
                  to={to}
                  fromPlaceId={fromPlaceId}
                  toPlaceId={toPlaceId}
                  departureTime={departureTime}
                  routes={routes}
                  loading={routesLoading}
                  onSelectRoute={(route) => {
                    setSelectedRoute(route);
                    setScreen("detail");
                  }}
                />
              </motion.div>
            )}

            {screen === "detail" && selectedRoute !== null && (
              <motion.div
                key="detail"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 30 }}
                transition={{ duration: 0.2 }}
              >
                {/* Map card on detail — shows route polyline */}
                <div className="px-4 pt-1 pb-3">
                  <RouteMap
                    origin={from}
                    destination={to}
                    originPlaceId={fromPlaceId}
                    destinationPlaceId={toPlaceId}
                    route={selectedRoute}
                    heightClassName="h-48"
                    tight
                  />
                </div>
                <RouteDetailsPage
                  origin={from}
                  destination={to}
                  originPlaceId={fromPlaceId}
                  destinationPlaceId={toPlaceId}
                  route={selectedRoute}
                  onBack={() => setScreen("results")}
                />
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
