import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Clock, Heart, History, Zap, TrendingUp } from "lucide-react";
import { getWeatherForCurrentLocation, WeatherData } from "@/services/weatherService";
import { getDailyInsights, getFavorites, getRecentRoutes, FavoriteRoute, HistoryEntry } from "@/services/routeHistoryService";

interface HomeInsightsProps {
  onSelectPair: (from: string, to: string, fromPlaceId: string, toPlaceId: string) => void;
  showHistory: boolean;
  onToggleHistory: () => void;
}

export default function HomeInsights({ onSelectPair, showHistory, onToggleHistory }: HomeInsightsProps) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [insights] = useState<string[]>(() => getDailyInsights());
  const [favorites] = useState<FavoriteRoute[]>(() => getFavorites());
  const [history] = useState<HistoryEntry[]>(() => getRecentRoutes(8));
  const hour = new Date().getHours();

  useEffect(() => {
    getWeatherForCurrentLocation().then(setWeather);
  }, []);

  const isPeak = (hour >= 8 && hour <= 10) || (hour >= 17 && hour <= 20);

  return (
    <div className="space-y-3">

      {/* ── Weather card ── */}
      {weather && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          className={`rounded-2xl p-3.5 border ${weather.commuteImpact ? "bg-amber-500/10 border-amber-500/20" : "bg-card border-border"}`}>
          <div className="flex items-center gap-3">
            <span className="text-2xl">{weather.emoji}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-foreground">{weather.temp}°C · {weather.description}</span>
                {weather.rainChance > 30 && (
                  <span className="text-[10px] font-semibold text-blue-500 bg-blue-500/10 px-1.5 py-0.5 rounded-full">
                    {weather.rainChance}% rain
                  </span>
                )}
              </div>
              {weather.commuteImpact && (
                <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5 leading-snug">{weather.commuteImpact}</p>
              )}
              {!weather.commuteImpact && (
                <p className="text-xs text-muted-foreground">Good conditions for travel</p>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* ── Smart departure / traffic status ── */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        className={`rounded-2xl p-3.5 border flex items-center gap-3 ${isPeak ? "bg-red-500/10 border-red-500/20" : "bg-emerald-500/10 border-emerald-500/20"}`}>
        <Zap className={`w-5 h-5 flex-shrink-0 ${isPeak ? "text-red-500" : "text-emerald-500"}`} />
        <div>
          <p className={`text-sm font-bold ${isPeak ? "text-red-700 dark:text-red-400" : "text-emerald-700 dark:text-emerald-400"}`}>
            {isPeak ? "🚦 Peak hours now" : "✅ Good time to travel"}
          </p>
          <p className="text-xs text-muted-foreground">
            {isPeak
              ? `Add 20–40 min to cab estimates · Metro recommended`
              : `Off-peak · All modes running smoothly`}
          </p>
        </div>
      </motion.div>

      {/* ── Daily insights ── */}
      {insights.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
          className="space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-0.5 flex items-center gap-1.5">
            <TrendingUp className="w-3 h-3" /> Your Insights
          </p>
          {insights.map((ins, i) => (
            <div key={i} className="bg-card border border-border rounded-xl px-3.5 py-2.5 text-xs text-foreground font-medium">
              {ins}
            </div>
          ))}
        </motion.div>
      )}

      {/* ── Favorites ── */}
      {favorites.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="space-y-1.5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-0.5 flex items-center gap-1.5">
            <Heart className="w-3 h-3 fill-red-500 text-red-500" /> Favorites
          </p>
          {favorites.slice(0, 3).map((fav, i) => (
            <button key={i} onClick={() => onSelectPair(fav.from, fav.to, fav.fromPlaceId, fav.toPlaceId)}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-card border border-border hover:bg-accent transition-colors text-left">
              <Heart className="w-3.5 h-3.5 fill-red-500 text-red-500 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <span className="text-xs font-semibold text-foreground">{fav.from.split(",")[0]}</span>
                <span className="text-xs text-muted-foreground mx-1.5">→</span>
                <span className="text-xs font-semibold text-foreground">{fav.to.split(",")[0]}</span>
              </div>
              <span className="text-[10px] text-muted-foreground/50 flex-shrink-0">Saved</span>
            </button>
          ))}
        </motion.div>
      )}

      {/* ── Commute History toggle ── */}
      {history.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}>
          <button onClick={onToggleHistory}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-secondary border border-border hover:bg-accent transition-colors text-left">
            <History className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
            <span className="text-xs font-semibold text-foreground flex-1">Commute History</span>
            <span className="text-[10px] text-muted-foreground">{history.length} trips</span>
          </button>

          {showHistory && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }} className="mt-2 overflow-hidden space-y-1.5">
              {history.map((h, i) => {
                const d = new Date(h.timestamp);
                const label = `${d.toLocaleDateString("en-IN", { day: "numeric", month: "short" })} ${d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })}`;
                return (
                  <button key={i} onClick={() => onSelectPair(h.from, h.to, h.fromPlaceId, h.toPlaceId)}
                    className="w-full flex items-center gap-3 px-3.5 py-2 rounded-xl bg-card border border-border hover:bg-accent transition-colors text-left">
                    <Clock className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold text-foreground truncate">
                        {h.from.split(",")[0]} → {h.to.split(",")[0]}
                      </div>
                      <div className="text-[10px] text-muted-foreground">{label} · {h.time} min · ₹{h.cost}</div>
                    </div>
                  </button>
                );
              })}
            </motion.div>
          )}
        </motion.div>
      )}
    </div>
  );
}
