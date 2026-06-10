import { Star, Zap, BadgeDollarSign, ChevronRight, Heart } from "lucide-react";
import { motion } from "framer-motion";
import { useState, useMemo } from "react";
import { isFavorite, toggleFavorite } from "@/services/routeHistoryService";
import { computeStressScore, computeArrivalConfidence } from "@/services/aiInsightService";

// ── Tag config ────────────────────────────────────────────────────────────────

const TAG_CONFIG: Record<string, { icon: any; label: string; accent: string; accentText: string }> = {
  best:     { icon: Star,            label: "Best",     accent: "bg-emerald-500/15", accentText: "text-emerald-600 dark:text-emerald-400" },
  fastest:  { icon: Zap,             label: "Fastest",  accent: "bg-orange-500/15",  accentText: "text-orange-600 dark:text-orange-400" },
  cheapest: { icon: BadgeDollarSign, label: "Cheapest", accent: "bg-blue-500/15",    accentText: "text-blue-600 dark:text-blue-400" },
};

// ── Transport mode display ────────────────────────────────────────────────────

const MODE_CONFIG: Record<string, { emoji: string; label: string }> = {
  metro:   { emoji: "🚇", label: "Metro" },
  bus:     { emoji: "🚌", label: "Bus" },
  cab:     { emoji: "🚕", label: "Cab" },
  auto:    { emoji: "🛺", label: "Auto" },
  walk:    { emoji: "🚶", label: "Walk" },
  bike:    { emoji: "🚲", label: "Bike" },
  tram:    { emoji: "🚊", label: "Tram" },
  ferry:   { emoji: "⛴️", label: "Ferry" },
  transit: { emoji: "🚌", label: "Transit" },
};

function formatModes(modes: string[]): string {
  if (!modes || modes.length === 0) return "";
  // Deduplicate to unique modes in order (walk→bus→walk→bus → walk→bus)
  const unique: string[] = [];
  for (const m of modes) {
    if (!unique.includes(m)) unique.push(m);
  }
  return unique
    .map((m) => {
      const cfg = MODE_CONFIG[m] ?? { emoji: "🚌", label: m };
      return `${cfg.emoji} ${cfg.label}`;
    })
    .join("  →  ");
}

// Fallback: infer rough mode from summary text when mode_sequence is absent
function inferModesFromSummary(summary: string): string {
  const s = summary.toLowerCase();
  if (s.includes("metro") || s.includes("subway")) return "🚇 Metro";
  if (s.includes("bus") || s.includes("bmtc")) return "🚌 Bus";
  if (s.includes("cab") || s.includes("auto")) return "🚕 Cab";
  if (s.includes("bike") || s.includes("cycle")) return "🚲 Bike";
  return "🚕 Drive";
}

// ── Crowd dot ─────────────────────────────────────────────────────────────────

const CROWD_DOT: Record<string, string> = {
  low:    "bg-emerald-500",
  medium: "bg-amber-400",
  high:   "bg-red-500",
};

// ── Component ─────────────────────────────────────────────────────────────────

interface RouteCardProps {
  route: {
    time: number;
    distance: string;
    summary: string;
    mode_sequence?: string[];
    transfers: number;
    cost: number;
    tag: "best" | "fastest" | "cheapest" | "alternative";
    recommendation_reason: string;
    tradeoff?: string;
    crowd: string;
    reliability: number;
    break_stop: string | null;
    traffic_delay?: number | null;
    cafes?: { name: string; rating?: number | null; address?: string | null }[];
  };
  index: number;
  onClick: () => void;
  from?: string;
  to?: string;
  fromPlaceId?: string;
  toPlaceId?: string;
}

const RouteCard = ({ route, index, onClick, from = "", to = "", fromPlaceId = "", toPlaceId = "" }: RouteCardProps) => {
  const isBest = route.tag === "best";
  const tag = TAG_CONFIG[route.tag];
  const [fav, setFav] = useState(() => isFavorite(from, to));
  const stress = useMemo(() => computeStressScore(route), [route]);
  const confidence = useMemo(() => computeArrivalConfidence(route), [route]);

  const modeText = route.mode_sequence?.length
    ? formatModes(route.mode_sequence)
    : inferModesFromSummary(route.summary);

  // Secondary pills: transfers + crowd + break stop
  const pills: string[] = [];
  if (route.transfers === 0) pills.push("Direct");
  else pills.push(`${route.transfers} stop${route.transfers > 1 ? "s" : ""}`);
  if (route.break_stop) {
    pills.push(route.break_stop.toLowerCase().includes("coffee") ? "☕ Coffee" : "🚻 Washroom");
  }

  return (
    <motion.button
      type="button"
      initial={{ y: 12, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: index * 0.06 }}
      onClick={onClick}
      className={`w-full text-left rounded-2xl px-4 py-3.5 transition-all active:scale-[0.985] ${
        isBest
          ? "gradient-card-highlight text-primary-foreground shadow-elevated"
          : "bg-card border border-border shadow-card hover:shadow-elevated hover:border-primary/20"
      }`}
    >
      {/* Row 1: Time · Cost · Tag badge · Arrow */}
      <div className="flex items-center gap-2.5 mb-2">
        <div className="flex items-baseline gap-0.5">
          <span className="text-2xl font-extrabold leading-none tabular-nums">{route.time}</span>
          <span className={`text-xs font-medium ml-0.5 ${isBest ? "text-primary-foreground/60" : "text-muted-foreground"}`}>min</span>
        </div>

        <span className={`font-bold ${isBest ? "text-primary-foreground/40" : "text-muted-foreground/30"}`}>·</span>

        <span className="text-base font-bold tabular-nums">₹{route.cost}</span>

        {tag && (
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${
            isBest
              ? "bg-primary-foreground/20 text-primary-foreground"
              : `${tag.accent} ${tag.accentText}`
          }`}>
            <tag.icon className="w-2.5 h-2.5" />
            {tag.label}
          </span>
        )}

        {/* Favourite heart */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            const added = toggleFavorite({ from, to, fromPlaceId, toPlaceId });
            setFav(added);
          }}
          className="ml-auto mr-1 flex-shrink-0 p-1"
          aria-label="Favourite"
        >
          <Heart className={`w-4 h-4 transition-all ${fav ? "fill-red-500 text-red-500 scale-110" : isBest ? "text-primary-foreground/40" : "text-muted-foreground/30"}`} />
        </button>

        <ChevronRight className={`w-4 h-4 flex-shrink-0 ${isBest ? "text-primary-foreground/40" : "text-muted-foreground/40"}`} />
      </div>

      {/* Row 2: Transport modes */}
      <div className={`text-sm font-semibold mb-1.5 ${isBest ? "text-primary-foreground/95" : "text-foreground"}`}>
        {modeText}
      </div>

      {/* Row 3: Crowd + pills + traffic */}
      <div className={`flex items-center gap-2 text-xs flex-wrap ${isBest ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
        <span className="flex items-center gap-1">
          <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${CROWD_DOT[route.crowd] ?? "bg-muted-foreground"}`} />
          <span className="capitalize">{route.crowd} crowd</span>
        </span>
        {pills.map((p) => (
          <span key={p} className="flex items-center gap-1"><span>·</span><span>{p}</span></span>
        ))}
        {typeof route.traffic_delay === "number" && route.traffic_delay > 0 && (
          <span className="flex items-center gap-1 text-amber-500 font-semibold">
            <span>·</span>
            <span>🚦 +{route.traffic_delay}m delay</span>
          </span>
        )}
      </div>

      {/* Row 4: Recommendation reason */}
      {route.recommendation_reason && (
        <div className={`mt-1 text-[11px] font-medium leading-snug ${isBest ? "text-primary-foreground/60" : "text-muted-foreground/70"}`}>
          {route.recommendation_reason}
        </div>
      )}

      {/* Row 5: Stress + confidence — subtle */}
      <div className={`flex items-center gap-3 mt-2 pt-2 border-t ${isBest ? "border-primary-foreground/15" : "border-border"}`}>
        <span className={`text-[10px] font-semibold ${isBest ? "text-primary-foreground/60" : "text-muted-foreground/70"}`}>
          Stress&nbsp;
          <span className={isBest ? "text-primary-foreground/90" : stress.color}>{stress.score}/10</span>
        </span>
        <span className={isBest ? "text-primary-foreground/30" : "text-muted-foreground/30"}>·</span>
        <span className={`text-[10px] font-semibold ${isBest ? "text-primary-foreground/60" : "text-muted-foreground/70"}`}>
          <span className={isBest ? "text-primary-foreground/90" : confidence.confidence >= 80 ? "text-emerald-500" : confidence.confidence >= 65 ? "text-amber-500" : "text-red-500"}>
            {confidence.confidence}%
          </span>
          &nbsp;on-time
        </span>
      </div>
    </motion.button>
  );
};

export default RouteCard;
