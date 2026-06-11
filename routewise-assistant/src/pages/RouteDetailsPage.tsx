import React, { useMemo, useEffect, useState } from "react";
import { ArrowLeft, Share2, Navigation, Clock, Zap, MapPin, AlertTriangle, Sparkles, ExternalLink, Coffee, Send, Bot, ChevronRight } from "lucide-react";
import ConfidenceGauge from "@/components/ai/ConfidenceGauge";
import LeaveLaterSimulator from "@/components/ai/LeaveLaterSimulator";
import { computeStressScore, computeArrivalConfidence } from "@/services/aiInsightService";
import { motion, AnimatePresence } from "framer-motion";
import { saveRoute, getRouteInsight } from "@/services/routeHistoryService";
import { getAnswer } from "@/components/ai/AskAISheet";

// ── Mode colour legend ────────────────────────────────────────────────────────
const MODE_LEGEND: Record<string, { label: string; color: string }> = {
  metro:   { label: "Metro",   color: "#3B82F6" },
  bus:     { label: "Bus",     color: "#EA580C" },
  cab:     { label: "Cab",     color: "#D97706" },
  auto:    { label: "Auto",    color: "#059669" },
  walk:    { label: "Walk",    color: "#6B7280" },
  bike:    { label: "Bike",    color: "#65A30D" },
  tram:    { label: "Tram",    color: "#9333EA" },
  ferry:   { label: "Ferry",   color: "#0891B2" },
  transit: { label: "Transit", color: "#EA580C" },
};

// ── Mode config ───────────────────────────────────────────────────────────────
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

const CROWD_CONFIG: Record<string, { dot: string; label: string; bg: string }> = {
  low:    { dot: "bg-emerald-500", label: "Low crowd",    bg: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" },
  medium: { dot: "bg-amber-400",   label: "Medium crowd", bg: "bg-amber-400/10 text-amber-700 dark:text-amber-400" },
  high:   { dot: "bg-red-500",     label: "High crowd",   bg: "bg-red-500/10 text-red-700 dark:text-red-400" },
};

function formatTime(d: Date): string {
  return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
}

// ── Props ─────────────────────────────────────────────────────────────────────
type RouteDetailsPageProps = {
  origin: string;
  destination: string;
  originPlaceId?: string | null;
  destinationPlaceId?: string | null;
  route: any;
  onBack: () => void;
};

const RouteDetailsPage = ({ origin, destination, route, onBack, originPlaceId, destinationPlaceId }: RouteDetailsPageProps) => {
  const fromShort = origin.split(",")[0];
  const toShort = destination.split(",")[0];
  const crowd = CROWD_CONFIG[route?.crowd] ?? { dot: "bg-muted-foreground", label: route?.crowd ?? "", bg: "bg-secondary text-muted-foreground" };

  // Computed times
  const now = useMemo(() => new Date(), []);
  const departureTime = formatTime(now);
  const arrivalDate = useMemo(() => new Date(now.getTime() + (route?.time ?? 0) * 60 * 1000), [now, route?.time]);
  const arrivalTime = formatTime(arrivalDate);

  // Mode display
  const modes: string[] = route?.mode_sequence ?? [];
  const primaryMode = modes[0] ? (MODE_CONFIG[modes[0]] ?? { emoji: "🚕", label: modes[0] }) : { emoji: "🚕", label: "Drive" };

  // Save to history on mount
  useEffect(() => {
    if (origin && destination && route?.time) {
      saveRoute({
        from: origin,
        to: destination,
        fromPlaceId: originPlaceId ?? "",
        toPlaceId: destinationPlaceId ?? "",
        mode: modes[0] ?? "transit",
        cost: route.cost ?? 0,
        time: route.time,
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // AI insight from history
  const aiInsight = useMemo(() => getRouteInsight(origin, destination), [origin, destination]);

  // Unique mode legend for this route's segments
  const segmentModes = useMemo(() => {
    const segs: { mode: string; polyline: string }[] = route?.step_segments ?? [];
    const uniqueModes = [...new Set(segs.map((s) => s.mode))];
    return uniqueModes.map((m) => MODE_LEGEND[m]).filter(Boolean);
  }, [route]);

  // Cafes from route data
  const cafes: { name: string; rating?: number | null; address?: string | null }[] = route?.cafes ?? [];

  // ── Ask AI ────────────────────────────────────────────────────────────────
  const [showAI, setShowAI] = useState(false);
  const [aiQuestion, setAiQuestion] = useState("");
  const [aiChat, setAiChat] = useState<{ q: string; a: string }[]>([]);

  const routeAiContext = {
    from: origin, to: destination,
    routeCafes: cafes,
    routeTime: route?.time,
    routeCost: route?.cost,
    routeModes: modes,
    routeCrowd: route?.crowd,
  };

  const handleAskAI = () => {
    const q = aiQuestion.trim();
    if (!q) return;
    const a = getAnswer(q, routeAiContext);
    setAiChat(prev => [...prev, { q, a }]);
    setAiQuestion("");
  };

  // Google Maps navigation + live nudges
  const startNavigation = async () => {
    // Open Google Maps
    const params = new URLSearchParams({
      api: "1",
      origin: origin,
      destination: destination,
      travelmode: modes.includes("metro") || modes.includes("bus") || modes.includes("tram") ? "transit" : "driving",
    });
    window.open(`https://www.google.com/maps/dir/?${params}`, "_blank");

    // Request notification permission and schedule live nudges
    if ("Notification" in window) {
      const perm = await Notification.requestPermission();
      if (perm === "granted") {
        const steps: any[] = route?.detailed_steps ?? [];
        let elapsed = 0; // ms

        const scheduleNudge = (delayMs: number, title: string, body: string) => {
          setTimeout(() => {
            try { new Notification(title, { body, icon: "/favicon.ico", badge: "/favicon.ico" }); } catch {}
          }, delayMs);
        };

        // Departure nudge immediately
        scheduleNudge(0,
          "🚀 Journey started!",
          `${fromShort} → ${toShort} · ${route?.time} min · Arrive by ${arrivalTime}`
        );

        // Step nudges
        for (const step of steps) {
          const durationMin = parseInt((step.duration ?? "0").replace(/[^0-9]/g, "")) || 2;
          elapsed += durationMin * 60 * 1000;

          if (step.type === "walk") {
            scheduleNudge(Math.max(0, elapsed - 60_000),
              "🚶 Time to walk",
              `Walk ${step.distance ?? ""} to the next stop`
            );
          } else if (step.type !== "walk") {
            const modeLabel = step.type === "metro" ? "🚇 Metro" : step.type === "bus" ? "🚌 Bus" : "🚌 Transit";
            scheduleNudge(Math.max(0, elapsed - 90_000),
              `${modeLabel} arriving soon`,
              step.line
                ? `Board ${step.line} towards ${step.headsign ?? step.to_stop} at ${step.from_stop}`
                : `Board at ${step.from_stop}`
            );
            if (step.num_stops > 0) {
              const alightDelay = elapsed - 30_000;
              scheduleNudge(Math.max(0, alightDelay),
                "🔴 Alight next stop",
                `Get off at ${step.to_stop}`
              );
            }
          }
        }

        // Arrival nudge
        const totalMs = (route?.time ?? 30) * 60 * 1000;
        scheduleNudge(Math.max(0, totalMs - 5 * 60_000),
          "📍 Almost there!",
          `5 min to ${toShort}. Get ready to alight.`
        );
        scheduleNudge(totalMs,
          "✅ You've arrived!",
          `Welcome to ${toShort}. Have a great ${new Date().getHours() < 12 ? "morning" : "day"}!`
        );
      }
    }
  };

  // Share route
  const shareRoute = async () => {
    const text = `${fromShort} → ${toShort} • ${route?.time} min • ₹${route?.cost} • ${primaryMode.emoji} ${primaryMode.label}`;
    if (navigator.share) {
      await navigator.share({ title: "CommuteAI Route", text });
    } else {
      await navigator.clipboard.writeText(text);
    }
  };

  return (
    <div className="pb-8">

      {/* ── Header ── */}
      <div className="flex items-center gap-3 px-4 pt-3 pb-3">
        <button
          onClick={onBack}
          className="w-8 h-8 flex items-center justify-center rounded-xl bg-secondary border border-border hover:bg-accent transition-colors flex-shrink-0"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1 text-xs text-muted-foreground font-medium">
            <MapPin className="w-3 h-3 flex-shrink-0" />
            <span className="truncate">{fromShort}</span>
            <span className="opacity-40">→</span>
            <span className="truncate">{toShort}</span>
          </div>
        </div>
        <button
          onClick={shareRoute}
          className="w-8 h-8 flex items-center justify-center rounded-xl bg-secondary border border-border hover:bg-accent transition-colors flex-shrink-0"
        >
          <Share2 className="w-3.5 h-3.5 text-muted-foreground" />
        </button>
      </div>

      <div className="px-4 space-y-3">

        {/* ── Hero ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="gradient-card-highlight text-primary-foreground rounded-2xl p-5 shadow-elevated"
        >
          {/* Arrival + depart times */}
          <div className="flex items-end justify-between mb-3">
            <div>
              <p className="text-[10px] font-semibold opacity-50 uppercase tracking-wider mb-0.5">Depart</p>
              <p className="text-xl font-bold tabular-nums">{departureTime}</p>
            </div>
            <div className="flex-1 flex items-center gap-1.5 mx-3 mb-1.5">
              <div className="flex-1 h-px bg-primary-foreground/20" />
              <span className="text-[10px] opacity-50 font-medium">{route?.time} min</span>
              <div className="flex-1 h-px bg-primary-foreground/20" />
            </div>
            <div className="text-right">
              <p className="text-[10px] font-semibold opacity-50 uppercase tracking-wider mb-0.5">Arrive</p>
              <p className="text-xl font-bold tabular-nums">{arrivalTime}</p>
            </div>
          </div>

          {/* Cost + crowd + reliability row */}
          <div className="flex items-center gap-3">
            <span className="text-2xl font-extrabold tabular-nums">₹{route?.cost}</span>
            <span className="opacity-30 text-sm">·</span>
            <span className={`flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-primary-foreground/15`}>
              <span className={`w-1.5 h-1.5 rounded-full ${crowd.dot}`} />
              {crowd.label}
            </span>
            <span className="opacity-30 text-sm">·</span>
            <span className="text-xs font-semibold opacity-70">{route?.reliability}% on time</span>
          </div>

          {/* Mode chain */}
          <div className="flex items-center gap-1.5 mt-3 flex-wrap">
            {modes.map((m, i) => {
              const cfg = MODE_CONFIG[m] ?? { emoji: "🚌", label: m };
              return (
                <React.Fragment key={i}>
                  {i > 0 && <span className="opacity-30 text-xs">→</span>}
                  <span className="flex items-center gap-1 text-xs font-semibold bg-primary-foreground/15 px-2 py-0.5 rounded-full">
                    {cfg.emoji} {cfg.label}
                  </span>
                </React.Fragment>
              );
            })}
            {route?.distance && (
              <span className="text-[11px] opacity-50 ml-1">{route.distance}</span>
            )}
          </div>
        </motion.div>

        {/* ── Journey timeline ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card border border-border rounded-2xl p-4"
        >
          <div className="relative">
            <div className="absolute left-[6px] top-3 bottom-3 w-px bg-border" />

            <div className="flex items-center gap-3 mb-3">
              <div className="w-3 h-3 rounded-full bg-primary ring-2 ring-primary/20 flex-shrink-0 z-10" />
              <div className="flex-1 flex items-baseline justify-between min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{fromShort}</p>
                <p className="text-xs text-muted-foreground ml-2 flex-shrink-0">{departureTime}</p>
              </div>
            </div>

            {route?.break_stop && (
              <div className="flex items-center gap-3 mb-3 ml-0">
                <div className="w-3 h-3 rounded-full bg-amber-400 ring-2 ring-amber-400/20 flex-shrink-0 z-10" />
                <p className="text-xs text-muted-foreground">
                  {route.break_stop.toLowerCase().includes("coffee") ? "☕" : "🚻"} {route.break_stop}
                </p>
              </div>
            )}

            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full border-2 border-primary bg-card flex-shrink-0 z-10" />
              <div className="flex-1 flex items-baseline justify-between min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{toShort}</p>
                <p className="text-xs text-muted-foreground ml-2 flex-shrink-0">{arrivalTime}</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── Quick stats strip ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.13 }}
          className="flex items-center gap-2 text-xs text-muted-foreground bg-card border border-border rounded-xl px-4 py-2.5"
        >
          <Zap className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="font-medium">{route?.transfers === 0 ? "Direct" : `${route?.transfers} transfer${route?.transfers > 1 ? "s" : ""}`}</span>
          <span className="opacity-30">·</span>
          <Clock className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="font-medium">{route?.distance ?? "—"}</span>
          {typeof route?.traffic_delay === "number" && route.traffic_delay > 0 && (
            <>
              <span className="opacity-30">·</span>
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
              <span className="text-amber-600 dark:text-amber-400 font-medium">+{route.traffic_delay} min delay</span>
            </>
          )}
        </motion.div>

        {/* ── Cab platform price comparison ── */}
        {route?.cab_platforms && route.cab_platforms.length > 0 && (() => {
          type CabPlatform = { platform: string; label: string; emoji: string; low: number; high: number; deep_link: string };
          const platforms: CabPlatform[] = route.cab_platforms;
          const sorted = [...platforms].sort((a, b) => a.low - b.low);
          const minLow = sorted[0]?.low ?? 0;
          const maxHigh = Math.max(...platforms.map(p => p.high));
          return (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.16 }}
              className="bg-card border border-border rounded-2xl p-4"
            >
              <div className="flex items-center justify-between mb-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Compare cab apps</p>
                <span className="text-[9px] text-muted-foreground/60 italic">estimated · tap to open</span>
              </div>
              <div className="space-y-2.5">
                {sorted.map(p => {
                  const isCheapest = p.low === minLow;
                  const barWidth = maxHigh > 0
                    ? Math.round(30 + (p.high / maxHigh) * 70)
                    : 100;
                  return (
                    <a
                      key={p.platform}
                      href={p.deep_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 group"
                    >
                      <span className="text-sm w-24 font-semibold text-foreground flex-shrink-0 flex items-center gap-1 group-hover:text-primary transition-colors">
                        <span className="text-xs">{p.emoji}</span>
                        {p.label}
                      </span>
                      <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${isCheapest ? "bg-emerald-500" : "bg-primary/40"}`}
                          style={{ width: `${barWidth}%` }}
                        />
                      </div>
                      <span className={`text-sm font-bold tabular-nums flex-shrink-0 w-20 text-right ${isCheapest ? "text-emerald-600 dark:text-emerald-400" : "text-foreground"}`}>
                        ₹{p.low}–{p.high}
                        {isCheapest && <span className="text-[9px] ml-1">✓</span>}
                      </span>
                    </a>
                  );
                })}
              </div>
              <p className="text-[9px] text-muted-foreground/60 mt-3 leading-relaxed">
                ⚠️ Rough estimates only — actual fares depend on your city, surge, and route. Tap any row to check real price in the app.
              </p>
            </motion.div>
          );
        })()}

        {/* ── Coach boarding advice ── */}
        {route?.coach_advice && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.16 }}
            className="bg-blue-500/10 border border-blue-500/20 rounded-2xl px-4 py-3 flex items-start gap-3"
          >
            <span className="text-lg flex-shrink-0">🚃</span>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-0.5">Boarding tip</p>
              <p className="text-sm font-medium text-foreground">{route.coach_advice.replace(/^🚃|^🚌/, "").trim()}</p>
            </div>
          </motion.div>
        )}

        {/* ── Step-by-step directions ── */}
        {route?.detailed_steps?.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18 }}
            className="bg-card border border-border rounded-2xl overflow-hidden"
          >
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-4 pt-3.5 pb-2">Step by step</p>
            <div className="relative px-4 pb-3">
              <div className="absolute left-[26px] top-0 bottom-3 w-px bg-border" />
              {route.detailed_steps.map((step: any, i: number) => {
                const isTransit = step.type !== "walk";
                const modeEmoji = step.type === "metro" ? "🚇" : step.type === "bus" ? "🚌" : step.type === "tram" ? "🚊" : step.type === "ferry" ? "⛴️" : "🚶";
                return (
                  <div key={i} className="flex gap-3 mb-4 last:mb-0">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 z-10 text-xs ${isTransit ? "bg-primary text-primary-foreground" : "bg-secondary border border-border"}`}>
                      {isTransit ? modeEmoji : "🚶"}
                    </div>
                    <div className="flex-1 min-w-0 pt-0.5">
                      {isTransit ? (
                        <>
                          <div className="flex items-center gap-2 flex-wrap mb-0.5">
                            <span className="text-sm font-bold text-foreground">{step.line && `Line ${step.line}`}</span>
                            {step.headsign && <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-semibold">Towards {step.headsign}</span>}
                          </div>
                          <p className="text-xs text-foreground font-medium">📍 Board at <span className="font-bold">{step.from_stop}</span></p>
                          <p className="text-xs text-foreground font-medium mt-0.5">🔴 Alight at <span className="font-bold">{step.to_stop}</span></p>
                          <p className="text-[10px] text-muted-foreground mt-1">
                            {step.num_stops > 0 && `${step.num_stops} stops · `}{step.duration}
                            {step.departure_time && ` · Departs ${step.departure_time}`}
                          </p>
                        </>
                      ) : (
                        <>
                          <p className="text-sm font-semibold text-foreground">Walk</p>
                          <p className="text-[10px] text-muted-foreground">{step.distance} · {step.duration}</p>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* ── Map mode legend ── */}
        {segmentModes.length > 1 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.21 }}
            className="bg-card border border-border rounded-2xl px-4 py-3 flex items-center gap-3 flex-wrap"
          >
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Map key</p>
            {segmentModes.map((m) => (
              <span key={m.label} className="flex items-center gap-1.5">
                <span className="w-3 h-1.5 rounded-full inline-block" style={{ backgroundColor: m.color }} />
                <span className="text-xs text-muted-foreground font-medium">{m.label}</span>
              </span>
            ))}
          </motion.div>
        )}

        {/* ── Arrival Confidence + Stress Score ── */}
        {(() => {
          const stress = computeStressScore(route);
          const conf   = computeArrivalConfidence(route);
          return (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.23 }}
              className="bg-card border border-border rounded-2xl p-4"
            >
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-4">Journey intelligence</p>
              <div className="flex items-start gap-6">
                {/* Confidence gauge */}
                <div className="flex flex-col items-center gap-2">
                  <ConfidenceGauge value={conf.confidence} size={72} strokeWidth={5} />
                  <div className="text-center">
                    <p className="text-[11px] font-bold text-foreground">On-time chance</p>
                    <p className="text-[10px] text-muted-foreground leading-snug max-w-[90px]">{conf.explanation}</p>
                  </div>
                </div>

                {/* Stress score */}
                <div className="flex-1 space-y-2.5">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <p className="text-[11px] font-bold text-foreground">Commute stress</p>
                      <span className={`text-sm font-extrabold ${stress.color}`}>{stress.score}/10</span>
                    </div>
                    <div className="h-2 bg-border rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(stress.score / 10) * 100}%` }}
                        transition={{ delay: 0.4, duration: 0.7, ease: "easeOut" }}
                        className={`h-full rounded-full ${
                          stress.score <= 3 ? "bg-emerald-500" :
                          stress.score <= 6 ? "bg-amber-400" : "bg-red-500"
                        }`}
                      />
                    </div>
                  </div>
                  <div className={`text-[11px] font-medium px-2.5 py-2 rounded-xl ${stress.bgColor}`}>
                    <span className={stress.color}>{stress.label}</span>
                    <span className="text-muted-foreground ml-1">· {stress.reason}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })()}

        {/* ── Leave Later Simulator ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <LeaveLaterSimulator baseMin={route?.time ?? 30} />
        </motion.div>

        {/* ── Why this route ── */}
        {route?.recommendation_reason && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.22 }}
            className="bg-accent border border-primary/10 rounded-2xl p-4"
          >
            <p className="text-[10px] font-bold uppercase tracking-wider text-accent-foreground/60 mb-1">Why this route</p>
            <p className="text-sm font-semibold text-accent-foreground">{route.recommendation_reason}</p>
          </motion.div>
        )}

        {/* ── Coffee stop suggestions ── */}
        {cafes.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.24 }}
            className="bg-card border border-border rounded-2xl p-4"
          >
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
              <Coffee className="w-3.5 h-3.5" /> Coffee stops on route
            </p>
            <div className="space-y-2">
              {cafes.map((cafe, i) => (
                <button
                  key={i}
                  onClick={() => window.open(`https://www.zomato.com/search?q=${encodeURIComponent(cafe.name)}`, "_blank")}
                  className="w-full flex items-center gap-3 text-left hover:bg-accent rounded-xl px-2 py-1.5 transition-colors group"
                >
                  <span className="text-xl flex-shrink-0">☕</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{cafe.name}</p>
                    {cafe.rating && <p className="text-xs text-muted-foreground">⭐ {cafe.rating} · {cafe.address}</p>}
                  </div>
                  <span className="text-[10px] text-orange-500 font-bold opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                    Order →
                  </span>
                </button>
              ))}
            </div>
            <p className="text-[10px] text-muted-foreground/50 mt-2">Tap to search on Zomato</p>
          </motion.div>
        )}

        {/* ── AI insight from past routes ── */}
        {aiInsight && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="bg-gradient-to-r from-violet-500/10 to-fuchsia-500/10 border border-violet-500/20 rounded-2xl p-3.5 flex items-start gap-3"
          >
            <Sparkles className="w-4 h-4 text-violet-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-violet-500/80 mb-0.5">Based on your history</p>
              <p className="text-sm font-medium text-foreground">{aiInsight}</p>
            </div>
          </motion.div>
        )}

        {/* ── Ask AI ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.27 }}
          className="bg-gradient-to-br from-violet-500/10 via-fuchsia-500/5 to-transparent border border-violet-500/20 rounded-2xl overflow-hidden"
        >
          {/* Header — toggle */}
          <button
            onClick={() => setShowAI(v => !v)}
            className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-violet-500/5 transition-colors"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center flex-shrink-0">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-bold text-foreground">Ask AI about this route</p>
              <p className="text-[11px] text-muted-foreground">Traffic, cost, safety, alternatives…</p>
            </div>
            <ChevronRight className={`w-4 h-4 text-muted-foreground/50 transition-transform ${showAI ? "rotate-90" : ""}`} />
          </button>

          <AnimatePresence>
            {showAI && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden border-t border-violet-500/10"
              >
                {/* Quick question chips */}
                {aiChat.length === 0 && (
                  <div className="px-4 pt-3 pb-2 flex flex-wrap gap-1.5">
                    {["Is it safe?", "Any cheaper?", "Traffic?", "Coffee stops?", "How long?"].map(chip => (
                      <button
                        key={chip}
                        onClick={() => {
                          const a = getAnswer(chip, routeAiContext);
                          setAiChat(prev => [...prev, { q: chip, a }]);
                        }}
                        className="px-2.5 py-1 bg-violet-500/10 text-violet-600 dark:text-violet-400 rounded-full text-xs font-medium hover:bg-violet-500/20 transition-colors"
                      >
                        {chip}
                      </button>
                    ))}
                  </div>
                )}

                {/* Chat messages */}
                {aiChat.length > 0 && (
                  <div className="px-4 pt-3 space-y-3 max-h-48 overflow-y-auto">
                    {aiChat.map((msg, i) => (
                      <div key={i} className="space-y-1.5">
                        <div className="flex justify-end">
                          <span className="bg-violet-500 text-white text-xs font-medium px-3 py-1.5 rounded-2xl rounded-tr-sm max-w-[80%]">{msg.q}</span>
                        </div>
                        <div className="flex justify-start">
                          <span className="bg-secondary text-foreground text-xs px-3 py-1.5 rounded-2xl rounded-tl-sm max-w-[85%] leading-relaxed">{msg.a}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Input */}
                <div className="flex items-center gap-2 px-4 py-3">
                  <input
                    value={aiQuestion}
                    onChange={e => setAiQuestion(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleAskAI()}
                    placeholder="Ask anything about this route…"
                    className="flex-1 bg-secondary/60 border border-border rounded-xl px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-violet-500/30"
                  />
                  <button
                    onClick={handleAskAI}
                    disabled={!aiQuestion.trim()}
                    className="w-8 h-8 rounded-xl bg-violet-500 flex items-center justify-center disabled:opacity-40 hover:bg-violet-600 transition-colors flex-shrink-0"
                  >
                    <Send className="w-3.5 h-3.5 text-white" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* ── CTAs ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.26 }}
          className="flex gap-3 pt-1"
        >
          <button
            onClick={startNavigation}
            className="flex-1 py-4 rounded-2xl gradient-primary text-primary-foreground font-semibold text-sm shadow-glow hover:shadow-elevated transition-all active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <Navigation className="w-4 h-4" />
            Navigate via Google Maps
            <ExternalLink className="w-3.5 h-3.5 opacity-70" />
          </button>
          <button
            onClick={shareRoute}
            className="w-14 h-14 rounded-2xl bg-secondary border border-border flex items-center justify-center hover:bg-accent transition-all active:scale-[0.98] flex-shrink-0"
          >
            <Share2 className="w-4 h-4 text-muted-foreground" />
          </button>
        </motion.div>

      </div>
    </div>
  );
};

export default RouteDetailsPage;
