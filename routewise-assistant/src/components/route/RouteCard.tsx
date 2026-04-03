import { Bus, TrainFront, Car, Users, ArrowRightLeft, Star, TrendingDown, Zap, BadgeDollarSign, AlertTriangle, ShieldCheck, Brain, Footprints, Signal, Coffee } from "lucide-react";
import { motion } from "framer-motion";
import { Route } from "@/types";

const modeIcon = (type: string) => {
  switch (type) {
    case "bus": return <Bus className="w-3.5 h-3.5" />;
    case "metro": return <TrainFront className="w-3.5 h-3.5" />;
    case "auto": return <Car className="w-3.5 h-3.5" />;
    case "walk": return <Footprints className="w-3.5 h-3.5" />;
    case "coffee": return <Coffee className="w-3.5 h-3.5" />;
    default: return <Bus className="w-3.5 h-3.5" />;
  }
};

const crowdColor = (level: string) => {
  switch (level) {
    case "Low": return "text-route-green";
    case "Medium": return "text-route-yellow";
    case "High": return "text-route-red";
    default: return "text-muted-foreground";
  }
};

const reliabilityLabel = (score: number) => {
  if (score >= 90) return { label: "Highly Reliable", color: "text-route-green" };
  if (score >= 75) return { label: "Moderate", color: "text-route-yellow" };
  return { label: "Risky", color: "text-route-red" };
};

const stressConfig = {
  Low: { color: "text-route-green" },
  Medium: { color: "text-route-yellow" },
  High: { color: "text-route-red" },
};

const tagConfig: Record<string, { icon: any, label: string, className: string }> = {
  best: { icon: Star, label: "Best Option", className: "bg-route-green/20 text-route-green" },
  cheapest: { icon: BadgeDollarSign, label: "Cheapest", className: "bg-route-blue/20 text-route-blue" },
  fastest: { icon: Zap, label: "Fastest", className: "bg-route-orange/20 text-route-orange" },
  alternative: { icon: ArrowRightLeft, label: "Alternative", className: "bg-secondary text-muted-foreground" },
};

interface RouteCardProps {
  route: Route;
  index: number;
  onClick: () => void;
}

const RouteCard = ({ route, index, onClick }: RouteCardProps) => {
  const isBest = route.tag === "best";
  const tag = route.tag ? tagConfig[route.tag] : null;
  const rel = reliabilityLabel(route.reliability);
  const stress = stressConfig[route.stressLevel];

  return (
    <motion.button
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: index * 0.08 }}
      onClick={onClick}
      className={`w-full text-left rounded-2xl p-4 transition-all active:scale-[0.98] ${
        isBest
          ? "gradient-card-highlight text-primary-foreground shadow-elevated"
          : "bg-card border border-border shadow-card hover:shadow-elevated hover:border-primary/20"
      }`}
    >
      {/* Tag */}
      {tag && (
        <div className="flex items-center gap-1.5 mb-2">
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
            isBest ? "bg-primary-foreground/20 text-primary-foreground" : tag.className
          }`}>
            <tag.icon className="w-3 h-3" />
            {tag.label}
          </span>
        </div>
      )}

      {/* Delay Alert */}
      {route.delayAlert && (
        <div className={`flex items-center gap-1.5 mb-2 text-[10px] font-semibold rounded-lg px-2.5 py-1.5 ${
          isBest ? "bg-route-yellow/20 text-route-yellow" : "bg-route-yellow/10 text-route-yellow"
        }`}>
          <AlertTriangle className="w-3 h-3 flex-shrink-0" />
          {route.delayAlert}
        </div>
      )}

      {/* Time + modes */}
      <div className="flex items-start justify-between mb-2">
        <div>
          <p className={`text-[10px] uppercase tracking-wider font-medium ${isBest ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
            Travel time {route.breakStop ? "(incl. break)" : ""}
          </p>
          <p className="text-3xl font-extrabold leading-tight">{route.totalTime}</p>
          {route.breakStop && (
            <p className={`text-[10px] mt-0.5 ${isBest ? "text-primary-foreground/50" : "text-muted-foreground"}`}>
              Route: {route.time} + {route.breakStop.duration} break
            </p>
          )}
        </div>
        <div className="flex gap-1.5 flex-wrap justify-end max-w-[50%]">
          {route.modes.map((mode, j) => (
            <span
              key={j}
              className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold ${
                isBest
                  ? "bg-primary-foreground/20 text-primary-foreground"
                  : `${mode.color} text-primary-foreground`
              }`}
            >
              {modeIcon(mode.type)}
              {mode.label}
            </span>
          ))}
        </div>
      </div>

      {/* Break badge from backend */}
      {route.break_stop && (
        <div className={`flex items-center gap-1.5 mb-2 text-[10px] font-semibold rounded-lg px-2.5 py-1.5 ${
          isBest ? "bg-primary-foreground/10 text-primary-foreground/80" : "bg-accent text-accent-foreground"
        }`}>
          {route.break_stop.toLowerCase().includes("coffee") ? "☕" : "🚻"} {route.break_stop}
        </div>
      )}

      {/* Break badge (old static) */}
      {route.breakStop && !route.break_stop && (
        <div className={`flex items-center gap-1.5 mb-2 text-[10px] font-semibold rounded-lg px-2.5 py-1.5 ${
          isBest ? "bg-primary-foreground/10 text-primary-foreground/80" : "bg-accent text-accent-foreground"
        }`}>
          <Coffee className="w-3 h-3 flex-shrink-0" />
          {route.breakStop.name} · {route.breakStop.duration}
        </div>
      )}

      <p className={`text-xs mb-3 ${isBest ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
        Leave by: <span className="font-bold">{route.leaveBy}</span>
      </p>

      {/* Stats */}
      <div className={`flex items-center gap-3 text-xs flex-wrap ${isBest ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
        <span className={`flex items-center gap-1 ${isBest ? "" : rel.color}`}>
          <ShieldCheck className="w-3 h-3" /> {route.reliability}%
        </span>
        <span className={`flex items-center gap-1 ${isBest ? "" : crowdColor(route.crowd)}`}>
          <Users className="w-3 h-3" /> {route.crowd}
        </span>
        <span className="flex items-center gap-1">
          <ArrowRightLeft className="w-3 h-3" /> {route.transfers}
        </span>
        <span className={`flex items-center gap-1 ${isBest ? "" : stress.color}`}>
          <Brain className="w-3 h-3" /> {route.stressLevel}
        </span>
      </div>

      {/* Auto availability intelligence */}
      {(route.auto_availability !== undefined || route.autoAvailability) && (
        <div className={`mt-2.5 space-y-1 ${isBest ? "text-primary-foreground/80" : ""}`}>
          <div className={`flex items-center gap-1.5 text-xs font-medium ${
            isBest ? "" : (
              (route.auto_availability ?? route.autoAvailability?.percent ?? 0) >= 70 ? "text-route-green" :
              (route.auto_availability ?? route.autoAvailability?.percent ?? 0) >= 40 ? "text-route-yellow" : "text-route-red"
            )
          }`}>
            <Signal className="w-3 h-3" />
            Auto availability: {route.auto_availability ?? route.autoAvailability?.percent}%
          </div>
          {(route.availability_warning || route.autoAvailability?.level) && (
            <div className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-tight ${
              isBest ? "text-primary-foreground/60" : (
                (route.auto_availability ?? route.autoAvailability?.percent ?? 0) >= 70 ? "text-route-green/80" :
                (route.auto_availability ?? route.autoAvailability?.percent ?? 0) >= 40 ? "text-route-yellow/80" : "text-route-red/80"
              )
            }`}>
              <AlertTriangle className="w-2.5 h-2.5" />
              {route.availability_warning ?? (route.autoAvailability?.level === "High" ? "High availability" : route.autoAvailability?.level === "Medium" ? "Moderate availability" : "Low chance of getting auto")}
            </div>
          )}
        </div>
      )}

      {/* Explainable AI */}
      <div className={`border-t mt-3 pt-3 ${isBest ? "border-primary-foreground/20" : "border-border"}`}>
        <div className="flex items-center justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className={`text-[10px] uppercase tracking-wider font-semibold mb-0.5 ${isBest ? "text-primary-foreground/50" : "text-muted-foreground/70"}`}>
              Why this route?
            </p>
            <p className={`text-xs ${isBest ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
              {route.explanation}
            </p>
          </div>
          <span className="text-lg font-extrabold flex-shrink-0">{route.cost}</span>
        </div>
      </div>

      {/* Tradeoff info from backend */}
      {route.tradeoff && (
        <div className={`mt-2 flex items-center gap-1.5 text-xs rounded-lg px-2.5 py-1.5 ${
          isBest ? "bg-primary-foreground/10 text-primary-foreground/80" : "bg-secondary text-muted-foreground"
        }`}>
          <TrendingDown className="w-3 h-3 flex-shrink-0" />
          {route.tradeoff}
        </div>
      )}
    </motion.button>
  );
};

export default RouteCard;
