const STORAGE_KEY = "commuteai_route_history";
const FAV_KEY = "commuteai_favorites";
const MAX_ENTRIES = 100;

export interface HistoryEntry {
  from: string;
  to: string;
  fromPlaceId: string;
  toPlaceId: string;
  mode: string;
  cost: number;
  time: number;
  timestamp: number;
}

export interface FavoriteRoute {
  from: string;
  to: string;
  fromPlaceId: string;
  toPlaceId: string;
  label?: string;
  savedAt: number;
}

// ── History ───────────────────────────────────────────────────────────────────

export function saveRoute(entry: Omit<HistoryEntry, "timestamp">): void {
  const history = loadHistory();
  const newEntry: HistoryEntry = { ...entry, timestamp: Date.now() };
  const deduped = history.filter(
    (h) => !(h.from === entry.from && h.to === entry.to && Date.now() - h.timestamp < 5 * 60 * 1000)
  );
  const updated = [newEntry, ...deduped].slice(0, MAX_ENTRIES);
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(updated)); } catch {}
}

export function loadHistory(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as HistoryEntry[]) : [];
  } catch { return []; }
}

export function getRecentRoutes(limit = 10): HistoryEntry[] {
  return loadHistory().slice(0, limit);
}

export function getRecentPairs(limit = 3): { from: string; to: string; fromPlaceId: string; toPlaceId: string }[] {
  const seen = new Set<string>();
  const result: { from: string; to: string; fromPlaceId: string; toPlaceId: string }[] = [];
  for (const h of loadHistory()) {
    const key = `${h.from}|${h.to}`;
    if (!seen.has(key)) {
      seen.add(key);
      result.push({ from: h.from, to: h.to, fromPlaceId: h.fromPlaceId, toPlaceId: h.toPlaceId });
    }
    if (result.length >= limit) break;
  }
  return result;
}

// ── Favorites ─────────────────────────────────────────────────────────────────

export function getFavorites(): FavoriteRoute[] {
  try {
    const raw = localStorage.getItem(FAV_KEY);
    return raw ? (JSON.parse(raw) as FavoriteRoute[]) : [];
  } catch { return []; }
}

export function isFavorite(from: string, to: string): boolean {
  return getFavorites().some(f => f.from === from && f.to === to);
}

export function toggleFavorite(route: Omit<FavoriteRoute, "savedAt">): boolean {
  const favs = getFavorites();
  const idx = favs.findIndex(f => f.from === route.from && f.to === route.to);
  if (idx >= 0) {
    favs.splice(idx, 1);
    localStorage.setItem(FAV_KEY, JSON.stringify(favs));
    return false; // removed
  } else {
    favs.unshift({ ...route, savedAt: Date.now() });
    localStorage.setItem(FAV_KEY, JSON.stringify(favs.slice(0, 20)));
    return true; // added
  }
}

// ── AI Insights ───────────────────────────────────────────────────────────────

export function getRouteInsight(from: string, to: string): string | null {
  const history = loadHistory().filter((h) => h.from === from && h.to === to);
  if (history.length < 2) return null;

  const avgTime = Math.round(history.reduce((s, h) => s + h.time, 0) / history.length);
  const avgCost = Math.round(history.reduce((s, h) => s + h.cost, 0) / history.length);
  const modeFreq: Record<string, number> = {};
  history.forEach((h) => { modeFreq[h.mode] = (modeFreq[h.mode] ?? 0) + 1; });
  const topMode = Object.entries(modeFreq).sort((a, b) => b[1] - a[1])[0]?.[0];
  const morningTrips = history.filter((h) => { const hr = new Date(h.timestamp).getHours(); return hr >= 7 && hr <= 10; }).length;

  if (morningTrips > history.length * 0.6) return `You usually take this route in the morning. Avg: ${avgTime} min · ₹${avgCost}`;
  if (topMode) return `You prefer ${topMode} on this route. Avg: ${avgTime} min · ₹${avgCost}`;
  return `You've taken this route ${history.length} times. Avg ${avgTime} min · ₹${avgCost}`;
}

export function getDailyInsights(): string[] {
  const history = loadHistory();
  if (history.length === 0) return [];

  const insights: string[] = [];
  const now = new Date();
  const hour = now.getHours();

  // Most common route this time of day
  const window = history.filter(h => {
    const hr = new Date(h.timestamp).getHours();
    return Math.abs(hr - hour) <= 1;
  });

  if (window.length >= 2) {
    const pairCount: Record<string, { from: string; to: string; count: number; avgTime: number }> = {};
    window.forEach(h => {
      const key = `${h.from}|${h.to}`;
      if (!pairCount[key]) pairCount[key] = { from: h.from, to: h.to, count: 0, avgTime: 0 };
      pairCount[key].count++;
      pairCount[key].avgTime = Math.round((pairCount[key].avgTime + h.time) / 2);
    });
    const top = Object.values(pairCount).sort((a, b) => b.count - a.count)[0];
    if (top) {
      insights.push(`🕐 Around this time you usually go ${top.from.split(",")[0]} → ${top.to.split(",")[0]} (~${top.avgTime} min)`);
    }
  }

  // Average spend this week
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const weekHistory = history.filter(h => h.timestamp > weekAgo);
  if (weekHistory.length >= 3) {
    const totalSpend = weekHistory.reduce((s, h) => s + h.cost, 0);
    insights.push(`💰 You've spent ~₹${totalSpend} on commutes this week (${weekHistory.length} trips)`);
  }

  // Peak hour warning
  if ((hour >= 8 && hour <= 10) || (hour >= 17 && hour <= 20)) {
    insights.push("🚦 Peak hours now — add 20–40 min to any estimate");
  }

  return insights.slice(0, 3);
}

export function getSmartDepartureSuggestion(from: string, to: string): string | null {
  const history = loadHistory().filter(h => h.from === from && h.to === to);
  if (history.length < 3) return null;

  const hour = new Date().getHours();
  const relevant = history.filter(h => {
    const hr = new Date(h.timestamp).getHours();
    return Math.abs(hr - hour) <= 2;
  });

  if (relevant.length < 2) return null;

  const avgTime = Math.round(relevant.reduce((s, h) => s + h.time, 0) / relevant.length);
  const minTime = Math.min(...relevant.map(h => h.time));

  if (avgTime - minTime >= 10) {
    return `⚡ Leaving 30 min earlier could save you ~${avgTime - minTime} min based on your history`;
  }
  return `✅ This is usually a good time to travel — avg ${avgTime} min for this route`;
}
