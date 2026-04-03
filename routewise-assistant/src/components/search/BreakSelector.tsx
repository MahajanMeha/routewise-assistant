import { motion } from "framer-motion";
import { BREAK_OPTIONS } from "@/lib/constants";

interface BreakSelectorProps {
  breakPref: string;
  setBreakPref: (val: string) => void;
}

const BreakSelector = ({ breakPref, setBreakPref }: BreakSelectorProps) => {
  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.18 }}
      className="space-y-2.5"
    >
      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-1">
        Include a break in your journey?
      </p>
      <div className="grid grid-cols-2 gap-2">
        {BREAK_OPTIONS.map((opt) => (
          <button
            key={opt.id}
            onClick={() => setBreakPref(opt.id)}
            className={`flex items-center gap-2.5 p-3 rounded-xl text-left transition-all active:scale-[0.97] ${
              breakPref === opt.id
                ? "gradient-primary text-primary-foreground shadow-glow"
                : "bg-card border border-border text-foreground hover:bg-accent"
            }`}
          >
            <span className="text-lg">{opt.emoji}</span>
            <div className="min-w-0">
              <p className="text-xs font-semibold leading-tight">{opt.label}</p>
              <p className={`text-[10px] leading-tight ${
                breakPref === opt.id ? "text-primary-foreground/70" : "text-muted-foreground"
              }`}>{opt.desc}</p>
            </div>
          </button>
        ))}
      </div>
    </motion.div>
  );
};

export default BreakSelector;
