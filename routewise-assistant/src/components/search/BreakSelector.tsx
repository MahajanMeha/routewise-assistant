import { BREAK_OPTIONS } from "@/lib/constants";

interface BreakSelectorProps {
  breakPref: string;
  setBreakPref: (val: string) => void;
}

const BreakSelector = ({ breakPref, setBreakPref }: BreakSelectorProps) => {
  return (
    <div className="space-y-1.5">
      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-0.5">Break</p>
      <div className="flex gap-2 overflow-x-auto pb-0.5 scrollbar-hide">
        {BREAK_OPTIONS.map((opt) => (
          <button
            key={opt.id}
            onClick={() => setBreakPref(opt.id)}
            className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all active:scale-95 ${
              breakPref === opt.id
                ? "gradient-primary text-primary-foreground shadow-glow"
                : "bg-secondary border border-border text-foreground hover:bg-accent"
            }`}
          >
            <span className="text-sm leading-none">{opt.emoji}</span>
            <span>{opt.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default BreakSelector;
