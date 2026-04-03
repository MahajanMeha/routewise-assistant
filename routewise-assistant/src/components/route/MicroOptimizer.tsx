import { motion } from "framer-motion";
import { Lightbulb } from "lucide-react";

const tips = [
  { text: "Take your break at Storkower instead of later to avoid rush", saving: "Comfort" },
  { text: "Get down 2 stops earlier to save ₹30", saving: "₹30" },
  { text: "Walk 5 min from station to skip auto fare", saving: "₹55" },
  { text: "Bus 240 is less crowded than 340 at this hour", saving: "Comfort" },
];

const MicroOptimizer = () => {
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

export default MicroOptimizer;
