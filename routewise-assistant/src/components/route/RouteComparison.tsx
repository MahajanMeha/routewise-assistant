import { motion } from "framer-motion";
import { useState } from "react";
import { Route } from "@/types";
import RouteMap from "@/components/route/RouteMap";
import { Sparkles, Coffee, X, MapPin, Lightbulb, Star } from "lucide-react";
import { MOCK_INSIGHTS, MOCK_SMART_STOPS } from "@/lib/constants";

interface RouteComparisonProps {
  routes: Route[];
}

const RouteComparison = ({ routes }: RouteComparisonProps) => {
  if (routes.length < 2) return null;

  const colorFor = (val: string) => {
    if (val === "Low") return "text-route-green";
    if (val === "Medium") return "text-route-yellow";
    return "text-route-red";
  };

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.3 }}
      className="space-y-4"
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 space-y-2.5">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">Quick Compare</h3>
          <RouteMap />
          <div className="bg-card rounded-2xl shadow-card border border-border overflow-hidden overflow-x-auto">
            <div className="min-w-[420px]">
              <div className="grid grid-cols-7 gap-0 text-[9px] font-semibold text-muted-foreground uppercase tracking-wider border-b border-border px-3 py-2.5">
                <span>Route</span>
                <span className="text-center">Time</span>
                <span className="text-center">Cost</span>
                <span className="text-center">Crowd</span>
                <span className="text-center">Stress</span>
                <span className="text-center">Rely</span>
                <span className="text-center">Break</span>
              </div>

              {routes.map((route, i) => (
                <div
                  key={route.id}
                  className={`grid grid-cols-7 gap-0 items-center px-3 py-3 text-sm ${
                    i < routes.length - 1 ? "border-b border-border" : ""
                  } ${route.tag === "best" ? "bg-primary/5" : ""}`}
                >
                  <div className="flex items-center gap-1">
                    {route.tag === "best" && <div className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />}
                    <span className="font-medium text-[10px] text-foreground truncate">
                      {route.tag ? route.tag.charAt(0).toUpperCase() + route.tag.slice(1) : "Alt"}
                    </span>
                  </div>
                  <span className="text-center font-bold text-foreground text-xs">{route.totalTime}</span>
                  <span className="text-center font-bold text-foreground text-xs">{route.cost}</span>
                  <span className={`text-center font-semibold text-xs ${colorFor(route.crowd)}`}>{route.crowd}</span>
                  <span className={`text-center font-semibold text-xs ${colorFor(route.stressLevel)}`}>{route.stressLevel}</span>
                  <span className={`text-center font-semibold text-xs ${
                    route.reliability >= 90 ? "text-route-green" : route.reliability >= 75 ? "text-route-yellow" : "text-route-red"
                  }`}>{route.reliability}%</span>
                  <span className="text-center text-xs">{route.breakStop ? "☕" : "—"}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <aside className="space-y-2.5">
          {/* Mid-journey break widget migrated from MidJourneyBreak.tsx */}
          <MidJourneyBreakInline />

          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1 flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            AI Insights
          </h3>
          <div className="space-y-2">
            {MOCK_INSIGHTS.map((insight, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.35 + i * 0.05 }}
                className="bg-accent rounded-xl px-4 py-3 flex items-start gap-2.5 border border-primary/5"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                <p className="text-sm text-foreground">{insight}</p>
              </motion.div>
            ))}
          </div>
          {/* Micro-optimizer (presentation) migrated from MicroOptimizer.tsx */}
          <MicroOptimizerInline />

          {/* Smart stops (presentation) migrated from SmartStops.tsx */}
          <SmartStopsInline />
        </aside>
      </div>
    </motion.div>
  );
};

const MidJourneyBreakInline = () => {
  const [dismissed, setDismissed] = useState(false);
  const [showOptions, setShowOptions] = useState(false);

  const nearbyOptions = [
    { name: "Blue Tokai Coffee", type: "Café", time: "+8 min", cost: "₹180", distance: "120 m" },
    { name: "Station Washroom", type: "Washroom", time: "+3 min", cost: "Free", distance: "Inside station" },
  ];

  if (dismissed) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className="space-y-2"
    >
      <div className="bg-card rounded-2xl shadow-card border border-primary/20 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Coffee className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Want a quick break here?</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Storkower Straße is a natural stop — great options nearby</p>
            </div>
          </div>
          <button onClick={() => setDismissed(true)} className="p-1 rounded-lg hover:bg-secondary transition-colors">
            <X className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
        </div>

        <div className="flex gap-2 mt-3">
          <button
            onClick={() => setDismissed(true)}
            className="flex-1 py-2 rounded-xl text-xs font-medium bg-secondary text-foreground hover:bg-accent transition-colors"
          >
            Skip
          </button>
          <button
            onClick={() => setShowOptions(!showOptions)}
            className="flex-1 py-2 rounded-xl text-xs font-medium gradient-primary text-primary-foreground shadow-glow"
          >
            Show Options
          </button>
        </div>
      </div>

      {showOptions && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="space-y-2">
          {nearbyOptions.map((opt, i) => (
            <div key={i} className="bg-card rounded-xl shadow-card border border-border p-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center flex-shrink-0">
                <MapPin className="w-3.5 h-3.5 text-accent-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">{opt.name}</p>
                <p className="text-[10px] text-muted-foreground">{opt.type} · {opt.distance}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-xs font-bold text-route-green">{opt.time}</p>
                <p className="text-[10px] text-muted-foreground">{opt.cost}</p>
              </div>
            </div>
          ))}
        </motion.div>
      )}
    </motion.div>
  );
};

const MicroOptimizerInline = () => {
  const tips = [
    { text: "Take your break at Storkower instead of later to avoid rush", saving: "Comfort" },
    { text: "Get down 2 stops earlier to save ₹30", saving: "₹30" },
    { text: "Walk 5 min from station to skip auto fare", saving: "₹55" },
    { text: "Bus 240 is less crowded than 340 at this hour", saving: "Comfort" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.25 }}
      className="space-y-2.5"
    >
      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1 flex items-center gap-2">
        <Lightbulb className="w-3.5 h-3.5 text-route-yellow" />
        Micro-Decision Optimizer
      </h3>
      <div className="space-y-2">
        {tips.map((tip, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 + i * 0.05 }}
            className="bg-card rounded-xl px-4 py-3 flex items-center justify-between gap-3 border border-border shadow-card"
          >
            <p className="text-xs text-foreground">{tip.text}</p>
            <span className="text-[10px] font-bold text-route-green whitespace-nowrap px-2 py-0.5 rounded-md bg-route-green/10">
              {tip.saving}
            </span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

const SmartStopsInline = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="space-y-2.5"
    >
      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1 flex items-center gap-2">
        <MapPin className="w-3.5 h-3.5 text-primary" />
        Recommended Stops
      </h3>
      {MOCK_SMART_STOPS.map((stop, i) => (
        <div key={i} className="bg-card rounded-2xl shadow-card border border-border p-3.5 flex items-center gap-3 hover:shadow-elevated transition-shadow">
          <div className="w-9 h-9 rounded-xl bg-accent flex items-center justify-center flex-shrink-0">
            <stop.icon className="w-4 h-4 text-accent-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="font-semibold text-foreground text-sm">{stop.name}</p>
              <span className="flex items-center gap-0.5 text-[10px] text-route-yellow font-semibold">
                <Star className="w-2.5 h-2.5 fill-route-yellow" /> {stop.rating}
              </span>
            </div>
            <p className="text-[10px] text-muted-foreground">{stop.distance} · {stop.note}</p>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-xs font-bold text-route-green">{stop.added}</p>
            <p className="text-[10px] text-muted-foreground">{stop.cost}</p>
          </div>
        </div>
      ))}
      <p className="text-[10px] text-muted-foreground text-center italic">Along your route — minimal detour</p>
    </motion.div>
  );
};
export default RouteComparison;
