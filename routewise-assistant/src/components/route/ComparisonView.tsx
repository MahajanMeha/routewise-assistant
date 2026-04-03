import { motion } from "framer-motion";
import { Route } from "@/types";

interface ComparisonViewProps {
  routes: Route[];
}

const ComparisonView = ({ routes }: ComparisonViewProps) => {
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
      className="space-y-2.5"
    >
      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">Quick Compare</h3>
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
    </motion.div>
  );
};

export default ComparisonView;
