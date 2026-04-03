import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { MOCK_INSIGHTS } from "@/lib/constants";

const InsightsPanel = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="space-y-2.5"
    >
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
    </motion.div>
  );
};

export default InsightsPanel;
