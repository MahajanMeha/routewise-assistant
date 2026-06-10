// ── Types ─────────────────────────────────────────────────────────────────────

export type TrafficCondition = "clear" | "moderate" | "heavy";

export interface DailyBriefing {
  condition: TrafficCondition;
  headline: string;
  subline: string;
  recommendedDeparture: string;
  leaveInMinutes: number;
  stressScore: number;
  arrivalConfidence: number;
  weatherNote: string | null;
}

export interface LeaveLaterPoint {
  delayMin: number;
  travelMin: number;
  confidence: number;
  stress: number;
  label: string;
}

export interface StressResult {
  score: number;           // 1–10
  label: "Low" | "Moderate" | "High" | "Very high";
  color: string;           // Tailwind colour class
  bgColor: string;
  reason: string;
}

export interface ConfidenceResult {
  confidence: number;      // 0–100
  label: string;
  explanation: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function trafficCondition(hour: number): TrafficCondition {
  if ((hour >= 8 && hour <= 10) || (hour >= 17 && hour <= 20)) return "heavy";
  if ((hour >= 7 && hour < 8) || (hour > 10 && hour <= 12) || (hour > 16 && hour < 17)) return "moderate";
  return "clear";
}

// ── Daily Briefing ────────────────────────────────────────────────────────────

export function getDailyBriefing(weatherNote?: string | null): DailyBriefing {
  const hour = new Date().getHours();
  const condition = trafficCondition(hour);

  const stressBase = { heavy: 7, moderate: 4, clear: 2 }[condition];
  const confBase   = { heavy: 66, moderate: 79, clear: 90 }[condition];

  const stressScore       = Math.min(10, stressBase + Math.round(Math.random() * 1.5));
  const arrivalConfidence = Math.min(98, Math.max(50, confBase + Math.round((Math.random() - 0.5) * 10)));

  const headlines: Record<TrafficCondition, string> = {
    heavy:    "Heavy traffic ahead",
    moderate: "Light congestion",
    clear:    "Roads are clear",
  };

  const sublines: Record<TrafficCondition, string> = {
    heavy:    "Leave now, or wait until after 10:30 AM",
    moderate: "Minor delays on main corridors",
    clear:    "All modes running smoothly right now",
  };

  const departures: Record<TrafficCondition, string> = {
    heavy:    "Leave now",
    moderate: "Leave in ~15 min",
    clear:    "No rush — leave when ready",
  };

  return {
    condition,
    headline: headlines[condition],
    subline:  sublines[condition],
    recommendedDeparture: departures[condition],
    leaveInMinutes: { heavy: 0, moderate: 15, clear: 25 }[condition],
    stressScore,
    arrivalConfidence,
    weatherNote: weatherNote ?? null,
  };
}

// ── Leave Later Simulator ─────────────────────────────────────────────────────

export function getLeaveLaterCurve(baseMin: number): LeaveLaterPoint[] {
  const hour = new Date().getHours();

  return [0, 15, 30, 45, 60, 75, 90].map((delay) => {
    const effectiveHour = hour + delay / 60;
    const cond = trafficCondition(effectiveHour);
    const factor = { heavy: 1.40, moderate: 1.15, clear: 1.0 }[cond];
    const travelMin = Math.round(baseMin * factor);

    let confidence = { heavy: 65, moderate: 80, clear: 91 }[cond];
    confidence = Math.min(97, Math.max(48, confidence + Math.round((Math.random() - 0.5) * 8)));

    let stress = { heavy: 7, moderate: 4, clear: 2 }[cond];
    stress = Math.min(10, Math.max(1, stress + Math.round((Math.random() - 0.5) * 1)));

    return {
      delayMin:   delay,
      travelMin,
      confidence,
      stress,
      label: delay === 0 ? "Now" : `+${delay}m`,
    };
  });
}

// ── Stress Score ──────────────────────────────────────────────────────────────

export function computeStressScore(route: any): StressResult {
  const crowd       = route?.crowd ?? "low";
  const transfers   = route?.transfers ?? 0;
  const trafficDel  = route?.traffic_delay ?? 0;
  const time        = route?.time ?? 30;
  const modes       = route?.mode_sequence ?? [];

  let score = 2;
  if (crowd === "high") score += 3;
  else if (crowd === "medium") score += 1.5;

  score += Math.min(3, transfers * 1.5);
  if (trafficDel > 15) score += 2.5;
  else if (trafficDel > 5) score += 1;

  if (time > 75) score += 1.5;
  if (time > 50) score += 0.5;

  // Multi-modal walking = more stress
  if (modes.includes("walk") && modes.length > 2) score += 1;

  score = Math.max(1, Math.min(10, Math.round(score)));

  const levels = [
    { max: 3,  label: "Low" as const,       color: "text-emerald-600 dark:text-emerald-400", bgColor: "bg-emerald-500/10" },
    { max: 6,  label: "Moderate" as const,   color: "text-amber-600 dark:text-amber-400",    bgColor: "bg-amber-500/10"   },
    { max: 8,  label: "High" as const,       color: "text-orange-600 dark:text-orange-400",  bgColor: "bg-orange-500/10"  },
    { max: 10, label: "Very high" as const,  color: "text-red-600 dark:text-red-400",        bgColor: "bg-red-500/10"     },
  ];
  const level = levels.find((l) => score <= l.max) ?? levels[3];

  const reasons: string[] = [];
  if (crowd === "high") reasons.push("crowded transport");
  if (transfers > 1)    reasons.push(`${transfers} transfers`);
  if (trafficDel > 10)  reasons.push("heavy traffic");
  if (time > 60)        reasons.push("long journey");

  return {
    score,
    label:   level.label,
    color:   level.color,
    bgColor: level.bgColor,
    reason:  reasons.length > 0 ? `Due to ${reasons.join(", ")}` : "Smooth ride expected",
  };
}

// ── Arrival Confidence ────────────────────────────────────────────────────────

export function computeArrivalConfidence(route: any): ConfidenceResult {
  const reliability  = route?.reliability ?? 80;
  const crowd        = route?.crowd ?? "low";
  const trafficDelay = route?.traffic_delay ?? 0;

  const hour    = new Date().getHours();
  const isPeak  = (hour >= 8 && hour <= 10) || (hour >= 17 && hour <= 20);

  let conf = reliability;
  if (isPeak)             conf -= 10;
  if (crowd === "high")   conf -= 8;
  if (crowd === "low")    conf += 4;
  if (trafficDelay > 15)  conf -= 12;
  else if (trafficDelay > 5) conf -= 5;

  conf = Math.max(42, Math.min(98, Math.round(conf)));

  const label = conf >= 85 ? "High confidence"
              : conf >= 70 ? "Moderate"
              : "Low — check before leaving";

  const factors: string[] = [];
  if (isPeak)             factors.push("peak hours");
  if (crowd === "high")   factors.push("crowded");
  if (trafficDelay > 10)  factors.push(`+${trafficDelay}m traffic`);

  return {
    confidence:  conf,
    label,
    explanation: factors.length > 0
      ? `Affected by ${factors.join(", ")}`
      : "Route is reliable at this hour",
  };
}
