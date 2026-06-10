import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Sparkles } from "lucide-react";
import { getDailyBriefing, type TrafficCondition } from "@/services/aiInsightService";

// ── Config ────────────────────────────────────────────────────────────────────

const CONDITION_CONFIG: Record<TrafficCondition, {
  dot: string; badge: string; badgeText: string; gradient: string; icon: string;
}> = {
  clear: {
    dot:        "bg-emerald-500",
    badge:      "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
    badgeText:  "Clear",
    gradient:   "from-emerald-500/8 to-transparent",
    icon:       "🟢",
  },
  moderate: {
    dot:        "bg-amber-400",
    badge:      "bg-amber-400/15 text-amber-600 dark:text-amber-400",
    badgeText:  "Moderate",
    gradient:   "from-amber-400/8 to-transparent",
    icon:       "🟡",
  },
  heavy: {
    dot:        "bg-red-500",
    badge:      "bg-red-500/15 text-red-600 dark:text-red-400",
    badgeText:  "Heavy traffic",
    gradient:   "from-red-500/8 to-transparent",
    icon:       "🔴",
  },
};

// ── Stress bar ────────────────────────────────────────────────────────────────

function StressBar({ score }: { score: number }) {
  const color = score <= 3 ? "bg-emerald-500" : score <= 6 ? "bg-amber-400" : "bg-red-500";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-border rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${(score / 10) * 100}%` }}
          transition={{ delay: 0.3, duration: 0.6, ease: "easeOut" }}
          className={`h-full rounded-full ${color}`}
        />
      </div>
      <span className="text-[10px] font-bold text-muted-foreground tabular-nums w-6 text-right">{score}/10</span>
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

interface DailyBriefingProps {
  weatherNote?: string | null;
}

export default function DailyBriefing({ weatherNote }: DailyBriefingProps) {
  const [expanded, setExpanded] = useState(false);
  const briefing = useMemo(() => getDailyBriefing(weatherNote), [weatherNote]);
  const cfg = CONDITION_CONFIG[briefing.condition];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl border border-border bg-gradient-to-br ${cfg.gradient} bg-card overflow-hidden`}
    >
      {/* ── Collapsed / always visible ── */}
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left"
      >
        {/* Traffic dot */}
        <div className="relative flex-shrink-0">
          <div className={`w-2.5 h-2.5 rounded-full ${cfg.dot}`} />
          <div className={`absolute inset-0 rounded-full ${cfg.dot} animate-ping opacity-40`} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${cfg.badge}`}>
              {cfg.badgeText}
            </span>
            <span className="text-[10px] text-muted-foreground">{briefing.recommendedDeparture}</span>
          </div>
          <p className="text-sm font-semibold text-foreground leading-tight">{briefing.headline}</p>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-[10px] text-muted-foreground font-medium hidden sm:block">{briefing.arrivalConfidence}% reliable</span>
          <ChevronDown className={`w-4 h-4 text-muted-foreground/50 transition-transform ${expanded ? "rotate-180" : ""}`} />
        </div>
      </button>

      {/* ── Expanded detail ── */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            key="expanded"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-t border-border/60"
          >
            <div className="px-4 py-3 space-y-3">
              {/* Subline */}
              <p className="text-xs text-muted-foreground leading-relaxed">{briefing.subline}</p>

              {/* Stats grid */}
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-background/60 rounded-xl p-2.5">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-1">Arrival confidence</p>
                  <p className="text-lg font-extrabold text-foreground tabular-nums">{briefing.arrivalConfidence}%</p>
                </div>
                <div className="bg-background/60 rounded-xl p-2.5">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-1">Stress forecast</p>
                  <p className="text-lg font-extrabold text-foreground">{briefing.stressScore}/10</p>
                </div>
              </div>

              {/* Stress bar */}
              <div>
                <p className="text-[10px] font-semibold text-muted-foreground mb-1.5">Commute stress</p>
                <StressBar score={briefing.stressScore} />
              </div>

              {/* Weather note */}
              {briefing.weatherNote && (
                <div className="flex items-start gap-2 text-xs text-muted-foreground">
                  <span className="text-base flex-shrink-0">🌤</span>
                  <span>{briefing.weatherNote}</span>
                </div>
              )}

              {/* AI tag */}
              <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground/60">
                <Sparkles className="w-3 h-3" />
                <span>AI briefing · updates in real time</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
