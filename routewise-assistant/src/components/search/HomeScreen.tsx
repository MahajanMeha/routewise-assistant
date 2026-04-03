import { Search, Sparkles, Clock, ChevronDown, MessageSquare, History } from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";
import MapPreview from "../route/MapPreview";
import SearchForm from "./SearchForm";
import BreakSelector from "./BreakSelector";
import { FILTERS } from "@/lib/constants";

interface HomeScreenProps {
  onSearch: () => void;
  breakPref: string;
  setBreakPref: (val: string) => void;
  from: string;
  setFrom: (val: string) => void;
  to: string;
  setTo: (val: string) => void;
}

const HomeScreen = ({ onSearch, breakPref, setBreakPref, from, setFrom, to, setTo }: HomeScreenProps) => {
  const [activeFilter, setActiveFilter] = useState("balanced");
  const [timeMode, setTimeMode] = useState<"now" | "later">("now");
  const [nlQuery, setNlQuery] = useState("");

  return (
    <div className="px-4 pt-4 pb-8 space-y-5 overflow-visible">
      {/* Natural Language Planner */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.05 }}
        className="bg-card rounded-2xl shadow-card border border-border p-3 overflow-visible"
      >
        <div className="flex items-center gap-2.5">
          <MessageSquare className="w-4 h-4 text-primary flex-shrink-0" />
          <input
            value={nlQuery}
            onChange={(e) => setNlQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && nlQuery && onSearch()}
            className="flex-1 text-sm text-foreground bg-transparent border-none outline-none placeholder:text-muted-foreground"
            placeholder={`Try: "Cheapest way to Whitefield before 9AM"`}
          />
        </div>
      </motion.div>

      {/* Map Preview */}
      <MapPreview />

      {/* Input Card */}
      <SearchForm from={from} to={to} setFrom={setFrom} setTo={setTo} />

      {/* Break Preference — Pre-Journey Intent */}
      <BreakSelector breakPref={breakPref} setBreakPref={setBreakPref} />

      {/* Time Selector */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.22 }}
        className="flex gap-2"
      >
        <button
          onClick={() => setTimeMode("now")}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-all ${
            timeMode === "now"
              ? "gradient-primary text-primary-foreground shadow-glow"
              : "bg-card border border-border text-foreground hover:bg-accent"
          }`}
        >
          <Clock className="w-4 h-4" />
          Leave Now
        </button>
        <button
          onClick={() => setTimeMode("later")}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-all ${
            timeMode === "later"
              ? "gradient-primary text-primary-foreground shadow-glow"
              : "bg-card border border-border text-foreground hover:bg-accent"
          }`}
        >
          <ChevronDown className="w-4 h-4" />
          Schedule Later
        </button>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.25 }}
        className="space-y-2.5"
      >
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-1">Route preference</p>
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setActiveFilter(f.id)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all active:scale-95 ${
                activeFilter === f.id
                  ? "gradient-primary text-primary-foreground shadow-glow"
                  : "bg-card border border-border text-foreground hover:bg-accent"
              }`}
            >
              <span>{f.emoji}</span>
              <span>{f.label}</span>
            </button>
          ))}
        </div>
      </motion.div>

      {/* Daily Learning */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.28 }}
        className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-secondary border border-border"
      >
        <History className="w-3.5 h-3.5 text-primary flex-shrink-0" />
        <p className="text-[11px] text-muted-foreground">
          <span className="font-semibold text-foreground">Based on your past routes:</span> You usually prefer metro+bus combos
        </p>
      </motion.div>

      {/* AI Insight */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="bg-accent rounded-2xl p-4 flex items-start gap-3 border border-primary/10"
      >
        <Sparkles className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-foreground">Smart Insight</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Leave 20 minutes earlier to avoid rush hour. Evening routes are less crowded today.
          </p>
        </div>
      </motion.div>

      {/* Search Button */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.35 }}
      >
        <button
          onClick={onSearch}
          className="w-full py-4 rounded-2xl gradient-primary text-primary-foreground font-semibold text-base shadow-glow hover:shadow-elevated transition-all active:scale-[0.98] flex items-center justify-center gap-2"
        >
          <Search className="w-5 h-5" />
          Find Best Routes
        </button>
      </motion.div>
    </div>
  );
};

export default HomeScreen;
