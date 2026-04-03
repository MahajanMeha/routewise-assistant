import { ArrowLeft, Bus, TrainFront, Car, Coffee } from "lucide-react";
import { motion } from "framer-motion";
import SmartStops from "./SmartStops";
import InsightsPanel from "./InsightsPanel";
import MicroOptimizer from "./MicroOptimizer";
import MidJourneyBreak from "./MidJourneyBreak";
import { MOCK_STEPS } from "@/lib/constants";

const stepIcon = (type: string) => {
  switch (type) {
    case "bus": return <Bus className="w-3 h-3" />;
    case "metro": return <TrainFront className="w-3 h-3" />;
    case "auto": return <Car className="w-3 h-3" />;
    case "break": return <Coffee className="w-3 h-3" />;
    default: return null;
  }
};

const stepDotColor = (type: string) => {
  switch (type) {
    case "start": return "bg-primary";
    case "end": return "bg-route-blue";
    case "bus": return "bg-route-green";
    case "metro": return "bg-route-blue";
    case "auto": return "bg-route-orange";
    case "break": return "bg-route-yellow";
    default: return "bg-muted-foreground";
  }
};

interface RouteDetailScreenProps {
  routeId: number;
  onBack: () => void;
}

const RouteDetailScreen = ({ onBack }: RouteDetailScreenProps) => {
  return (
    <div className="px-4 pt-4 pb-8 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="p-2 -ml-2 rounded-xl hover:bg-secondary transition-colors active:scale-95">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <span className="text-sm font-semibold text-foreground">Route Details</span>
        <div className="w-9" />
      </div>

      {/* Route summary */}
      <div className="bg-card rounded-2xl shadow-card border border-border p-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-primary shadow-glow" />
              <span className="font-semibold text-foreground text-sm">Wotanstraße, 14</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-route-blue" />
              <span className="font-semibold text-foreground text-sm">Schönefeld Airport</span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-extrabold text-foreground">44 min</p>
            <p className="text-[10px] text-muted-foreground">34 min route + 10 min break</p>
            <p className="text-xs text-muted-foreground mt-0.5">Depart <span className="font-bold text-primary">12:30</span></p>
          </div>
        </div>
      </div>

      {/* City Learning */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.05 }}
        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-secondary border border-border"
      >
        <span className="text-[10px] text-muted-foreground">🌆 Based on city-wide data: This route is usually faster at this time</span>
      </motion.div>

      {/* Timeline */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-card rounded-2xl shadow-card border border-border p-5"
      >
        <div className="relative">
          {MOCK_STEPS.map((step, i) => (
            <div key={i} className="flex gap-4 relative">
              {/* Timeline dot + line */}
              <div className="flex flex-col items-center">
                <div className={`w-3 h-3 rounded-full ${stepDotColor(step.type)} z-10 flex-shrink-0 mt-1 ${
                  step.type === "start" || step.type === "end" ? "ring-2 ring-offset-2 ring-offset-card" : ""
                } ${step.type === "start" ? "ring-primary/30" : step.type === "end" ? "ring-route-blue/30" : ""} ${
                  step.type === "break" ? "ring-2 ring-route-yellow/30 ring-offset-2 ring-offset-card" : ""
                }`} />
                {i < MOCK_STEPS.length - 1 && (
                  <div className={`w-0.5 flex-1 min-h-[36px] ${
                    step.type === "break" ? "bg-route-yellow" :
                    step.routeColor ? step.routeColor : "bg-border"
                  } ${step.routeColor || step.type === "break" ? "opacity-60" : "opacity-40"}`} />
                )}
              </div>

              {/* Content */}
              <div className="pb-5 flex-1">
                <p className={`text-[10px] font-semibold uppercase tracking-wider ${
                  step.type === "break" ? "text-route-yellow" : "text-muted-foreground"
                }`}>{step.sublabel}</p>
                <p className="font-semibold text-foreground text-sm">{step.label}</p>
                {(step.duration || step.distance) && (
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {step.duration}{step.distance && ` · ${step.distance}`}
                  </p>
                )}

                {/* Break highlight */}
                {step.type === "break" && (
                  <div className="mt-1.5 px-2.5 py-1.5 rounded-lg bg-route-yellow/10 border border-route-yellow/20 inline-flex items-center gap-1.5">
                    <Coffee className="w-3 h-3 text-route-yellow" />
                    <span className="text-[10px] font-semibold text-route-yellow">Scheduled break</span>
                  </div>
                )}

                {/* Route badge */}
                {step.routeNumber && (
                  <div className="mt-2 flex items-center gap-2">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold text-primary-foreground ${step.routeColor}`}>
                      {stepIcon(step.type)}
                      {step.routeNumber}
                    </span>
                    <span className="text-[10px] text-primary font-medium">{step.routeDirection}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Mid-Journey Break Prompt */}
      <MidJourneyBreak />

      {/* Smart Stops */}
      <SmartStops />

      {/* Micro-Decision Optimizer */}
      <MicroOptimizer />

      {/* AI Insights */}
      <InsightsPanel />
    </div>
  );
};

export default RouteDetailScreen;
