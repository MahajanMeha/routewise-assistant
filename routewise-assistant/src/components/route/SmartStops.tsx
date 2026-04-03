import { motion } from "framer-motion";
import { MapPin, Star } from "lucide-react";
import { MOCK_SMART_STOPS } from "@/lib/constants";

const SmartStops = () => {
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

export default SmartStops;
