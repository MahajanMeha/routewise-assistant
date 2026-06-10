import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, BarChart2 } from "lucide-react";
import { computeStressScore, computeArrivalConfidence } from "@/services/aiInsightService";

// ── Mode emoji map ─────────────────────────────────────────────────────────────

const MODE_EMOJI: Record<string, string> = {
  metro: "🚇", bus: "🚌", cab: "🚕", auto: "🛺",
  walk: "🚶", bike: "🚲", tram: "🚊", ferry: "⛴️", transit: "🚌",
};

function modeEmoji(mode: string) {
  return MODE_EMOJI[mode] ?? "🚌";
}

// ── Crowd colours ──────────────────────────────────────────────────────────────

const CROWD_COLOR: Record<string, string> = {
  low:    "text-emerald-500",
  medium: "text-amber-500",
  high:   "text-red-500",
};

// ── Winner cell highlight ──────────────────────────────────────────────────────

function Cell({
  value,
  winner,
  className = "",
}: {
  value: React.ReactNode;
  winner?: boolean;
  className?: string;
}) {
  return (
    <td
      className={`text-center px-1 py-2 text-xs font-semibold transition-colors ${
        winner
          ? "text-emerald-600 dark:text-emerald-400"
          : "text-foreground"
      } ${className}`}
    >
      {value}
    </td>
  );
}

// ── Row label ─────────────────────────────────────────────────────────────────

function RowLabel({ label, sub }: { label: string; sub?: string }) {
  return (
    <td className="pr-2 py-2 w-20 flex-shrink-0">
      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground leading-tight">{label}</p>
      {sub && <p className="text-[9px] text-muted-foreground/60 leading-tight">{sub}</p>}
    </td>
  );
}

// ── Column header ─────────────────────────────────────────────────────────────

const TAG_STYLE: Record<string, string> = {
  best:        "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  fastest:     "bg-orange-500/15 text-orange-600 dark:text-orange-400",
  cheapest:    "bg-blue-500/15 text-blue-600 dark:text-blue-400",
  alternative: "bg-secondary text-muted-foreground",
};

// ── Main component ─────────────────────────────────────────────────────────────

interface RouteComparisonCardProps {
  routes: any[];
  onSelectRoute: (route: any) => void;
}

export default function RouteComparisonCard({ routes, onSelectRoute }: RouteComparisonCardProps) {
  const [open, setOpen] = useState(false);

  if (!routes || routes.length < 2) return null;

  // Limit to 3 routes max
  const compared = routes.slice(0, 3);

  // Pre-compute derived values
  const stresses  = compared.map(r => computeStressScore(r).score);
  const confs     = compared.map(r => computeArrivalConfidence(r).confidence);

  // Which column wins per row
  const minTime    = Math.min(...compared.map(r => r.time));
  const minCost    = Math.min(...compared.map(r => r.cost));
  const maxConf    = Math.max(...confs);
  const minStress  = Math.min(...stresses);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-2xl overflow-hidden"
    >
      {/* Header toggle */}
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left"
      >
        <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
          <BarChart2 className="w-3.5 h-3.5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-foreground">Compare Routes</p>
          <p className="text-[10px] text-muted-foreground">Side-by-side breakdown of {compared.length} options</p>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-muted-foreground/50 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {/* Comparison table */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="table"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="overflow-hidden border-t border-border/60"
          >
            <div className="px-4 py-3 overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    {/* Empty label column */}
                    <th className="w-20 pr-2" />
                    {compared.map((r, i) => {
                      const modes = r.mode_sequence?.slice(0, 2) ?? [];
                      return (
                        <th key={i} className="px-1 pb-2 text-center">
                          {/* Mode emoji pill */}
                          <div className="flex justify-center mb-1">
                            <span className="text-base leading-none">
                              {modes.length > 0
                                ? modes.map((m: string) => modeEmoji(m)).join("")
                                : "🚕"}
                            </span>
                          </div>
                          {/* Tag badge */}
                          <span className={`inline-block text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full ${TAG_STYLE[r.tag] ?? TAG_STYLE.alternative}`}>
                            {r.tag === "alternative" ? `Option ${i + 1}` : r.tag}
                          </span>
                        </th>
                      );
                    })}
                  </tr>
                </thead>

                <tbody className="divide-y divide-border/40">
                  {/* TIME */}
                  <tr>
                    <RowLabel label="Time" sub="minutes" />
                    {compared.map((r, i) => (
                      <Cell key={i} value={`${r.time}m`} winner={r.time === minTime} />
                    ))}
                  </tr>

                  {/* COST */}
                  <tr>
                    <RowLabel label="Cost" sub="₹ estimate" />
                    {compared.map((r, i) => (
                      <Cell key={i} value={`₹${r.cost}`} winner={r.cost === minCost} />
                    ))}
                  </tr>

                  {/* ON-TIME */}
                  <tr>
                    <RowLabel label="On-time" sub="confidence" />
                    {compared.map((r, i) => (
                      <Cell key={i} value={`${confs[i]}%`} winner={confs[i] === maxConf} />
                    ))}
                  </tr>

                  {/* CROWD */}
                  <tr>
                    <RowLabel label="Crowd" />
                    {compared.map((r, i) => (
                      <td key={i} className="text-center px-1 py-2">
                        <span className={`text-xs font-semibold capitalize ${CROWD_COLOR[r.crowd] ?? "text-foreground"}`}>
                          {r.crowd}
                        </span>
                      </td>
                    ))}
                  </tr>

                  {/* STRESS */}
                  <tr>
                    <RowLabel label="Stress" sub="out of 10" />
                    {compared.map((r, i) => (
                      <Cell key={i} value={`${stresses[i]}/10`} winner={stresses[i] === minStress} />
                    ))}
                  </tr>

                  {/* TRANSFERS */}
                  <tr>
                    <RowLabel label="Transfers" />
                    {compared.map((r, i) => (
                      <Cell
                        key={i}
                        value={r.transfers === 0 ? "Direct" : `${r.transfers}x`}
                        winner={r.transfers === 0}
                      />
                    ))}
                  </tr>
                </tbody>
              </table>

              {/* Winner summary */}
              <div className="mt-3 pt-3 border-t border-border/40 flex flex-wrap gap-2">
                <span className="text-[10px] font-semibold text-muted-foreground">Best for:</span>
                <span className="text-[10px] bg-orange-500/15 text-orange-600 dark:text-orange-400 font-semibold px-2 py-0.5 rounded-full">
                  ⚡ Speed → {compared.find(r => r.time === minTime)?.tag === "alternative"
                    ? `Option ${compared.findIndex(r => r.time === minTime) + 1}`
                    : compared.find(r => r.time === minTime)?.tag}
                </span>
                <span className="text-[10px] bg-blue-500/15 text-blue-600 dark:text-blue-400 font-semibold px-2 py-0.5 rounded-full">
                  💰 Budget → {compared.find(r => r.cost === minCost)?.tag === "alternative"
                    ? `Option ${compared.findIndex(r => r.cost === minCost) + 1}`
                    : compared.find(r => r.cost === minCost)?.tag}
                </span>
                <span className="text-[10px] bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-semibold px-2 py-0.5 rounded-full">
                  😌 Comfort → {compared.find((_, i) => stresses[i] === minStress)?.tag === "alternative"
                    ? `Option ${stresses.indexOf(minStress) + 1}`
                    : compared.find((_, i) => stresses[i] === minStress)?.tag}
                </span>
              </div>

              {/* Select buttons */}
              <div className="mt-3 grid gap-2" style={{ gridTemplateColumns: `repeat(${compared.length}, 1fr)` }}>
                {compared.map((r, i) => (
                  <button
                    key={i}
                    onClick={() => onSelectRoute(r)}
                    className="py-2 rounded-xl bg-primary/10 text-primary text-xs font-bold hover:bg-primary/20 transition-colors active:scale-95"
                  >
                    Pick {r.tag === "alternative" ? `#${i + 1}` : r.tag}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
