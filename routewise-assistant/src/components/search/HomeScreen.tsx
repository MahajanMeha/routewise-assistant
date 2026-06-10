import { useState, useMemo } from "react";
import { Search, Clock, CalendarClock, ChevronRight, History, Bell } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import SearchAutocomplete from "./SearchAutocomplete";
import BreakSelector from "./BreakSelector";
import { FILTERS } from "@/lib/constants";
import { getRecentPairs } from "@/services/routeHistoryService";
import HomeInsights from "@/components/home/HomeInsights";
import DailyBriefing from "@/components/ai/DailyBriefing";

// ── Helpers ───────────────────────────────────────────────────────────────────

function toDatetimeLocal(d: Date): string {
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function formatHour(d: Date): string {
  const h = d.getHours();
  const m = d.getMinutes();
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return m === 0 ? `${h12} ${ampm}` : `${h12}:${m.toString().padStart(2, "0")} ${ampm}`;
}

// ── Time slot grid ────────────────────────────────────────────────────────────

const TIME_PERIODS = [
  {
    label: "Morning",
    emoji: "🌅",
    hours: [6, 7, 8, 9, 10, 11],
  },
  {
    label: "Afternoon",
    emoji: "☀️",
    hours: [12, 13, 14, 15, 16],
  },
  {
    label: "Evening",
    emoji: "🌆",
    hours: [17, 18, 19, 20],
  },
  {
    label: "Night",
    emoji: "🌙",
    hours: [21, 22, 23],
  },
];

function formatSlotLabel(date: Date): string {
  const h = date.getHours();
  const m = date.getMinutes();
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return m === 0 ? `${h12} ${ampm}` : `${h12}:${m.toString().padStart(2, "0")} ${ampm}`;
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface HomeScreenProps {
  onSearch: () => void;
  breakPref: string;
  setBreakPref: (val: string) => void;
  from: string;
  setFrom: (val: string) => void;
  fromPlaceId: string | null;
  setFromPlaceId: (id: string) => void;
  to: string;
  setTo: (val: string) => void;
  toPlaceId: string | null;
  setToPlaceId: (id: string) => void;
  timeMode: "now" | "later";
  setTimeMode: (val: "now" | "later") => void;
  scheduledTime: string;
  setScheduledTime: (val: string) => void;
  meetingTime: string;
  setMeetingTime: (val: string) => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

const HomeScreen = ({
  onSearch,
  breakPref, setBreakPref,
  from, setFrom, setFromPlaceId,
  to, setTo, setToPlaceId,
  timeMode, setTimeMode,
  scheduledTime, setScheduledTime,
  meetingTime, setMeetingTime,
}: HomeScreenProps) => {
  const [activeFilter, setActiveFilter] = useState("balanced");
  const [showScheduler, setShowScheduler] = useState(false);
  const [scheduleDate, setScheduleDate] = useState<"today" | "tomorrow">("today");
  const [showHistory, setShowHistory] = useState(false);
  const hasLocations = from.trim().length > 0 && to.trim().length > 0;

  const recentPairs = useMemo(() => getRecentPairs(3), []);

  // Notification permission request
  const requestNotifications = async () => {
    if (!("Notification" in window)) return;
    if (Notification.permission === "default") {
      await Notification.requestPermission();
    }
    if (Notification.permission === "granted") {
      new Notification("CommuteAI", {
        body: "🔔 Notifications enabled! I'll remind you when to leave.",
        icon: "/favicon.ico",
      });
    }
  };

  const now = new Date();
  const nowHour = now.getHours();
  const nowMin = now.getMinutes();

  // Build time slots for selected date, filtering past times for today
  const timeSlots = useMemo(() => {
    const base = new Date();
    if (scheduleDate === "tomorrow") base.setDate(base.getDate() + 1);

    const slots: { label: string; value: string; period: string; periodEmoji: string }[] = [];
    for (const period of TIME_PERIODS) {
      for (const hour of period.hours) {
        for (const min of [0, 30]) {
          if (scheduleDate === "today") {
            if (hour < nowHour || (hour === nowHour && min <= nowMin)) continue;
          }
          const t = new Date(base);
          t.setHours(hour, min, 0, 0);
          slots.push({
            label: formatSlotLabel(t),
            value: toDatetimeLocal(t),
            period: period.label,
            periodEmoji: period.emoji,
          });
        }
      }
    }
    return slots;
  }, [scheduleDate, nowHour, nowMin]);

  // Display label for current scheduled time
  const scheduledLabel = useMemo(() => {
    if (!scheduledTime) return null;
    const d = new Date(scheduledTime);
    if (isNaN(d.getTime())) return null;
    return formatSlotLabel(d);
  }, [scheduledTime]);

  const selectSlot = (value: string) => {
    setScheduledTime(value);
    setTimeMode("later");
    setShowScheduler(false);
  };

  const clearSchedule = () => {
    setTimeMode("now");
    setScheduledTime("");
    setShowScheduler(false);
  };

  // Group slots by period for rendering
  const slotsByPeriod = useMemo(() => {
    const groups: Record<string, typeof timeSlots> = {};
    for (const slot of timeSlots) {
      if (!groups[slot.period]) groups[slot.period] = [];
      groups[slot.period].push(slot);
    }
    return groups;
  }, [timeSlots]);

  return (
    <div className="px-4 pt-3 pb-8 space-y-3 overflow-visible">

      {/* ── AI Daily Briefing ── */}
      <DailyBriefing />

      {/* ── Search inputs — dot connector ── */}
      <div className="relative bg-card rounded-2xl shadow-card border border-border overflow-visible">
        <div className="absolute left-[22px] top-[44px] h-[22px] w-px bg-border z-0" />

        <div className="flex items-center gap-3 px-4 pt-3.5 pb-2.5">
          <div className="w-2.5 h-2.5 rounded-full bg-primary flex-shrink-0 z-10 ring-2 ring-primary/20" />
          <SearchAutocomplete
            value={from}
            onChange={setFrom}
            onPlaceId={setFromPlaceId}
            placeholder="Current location"
          />
        </div>

        <div className="border-t border-border mx-4 ml-10" />

        <div className="flex items-center gap-3 px-4 pt-2.5 pb-3.5">
          <div className="w-2.5 h-2.5 rounded-full border-2 border-primary flex-shrink-0 z-10 bg-card" />
          <SearchAutocomplete
            value={to}
            onChange={setTo}
            onPlaceId={setToPlaceId}
            placeholder="Where to?"
          />
        </div>
      </div>

      {/* ── Recent routes ── */}
      {recentPairs.length > 0 && !from && !to && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-1.5"
        >
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-0.5 flex items-center gap-1.5">
            <History className="w-3 h-3" />
            Recent
          </p>
          {recentPairs.map((pair, i) => (
            <button
              key={i}
              onClick={() => {
                setFrom(pair.from);
                setFromPlaceId(pair.fromPlaceId);
                setTo(pair.to);
                setToPlaceId(pair.toPlaceId);
              }}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-secondary border border-border hover:bg-accent transition-colors text-left"
            >
              <Clock className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <span className="text-xs font-semibold text-foreground truncate">
                  {pair.from.split(",")[0]}
                </span>
                <span className="text-xs text-muted-foreground mx-1.5">→</span>
                <span className="text-xs font-semibold text-foreground truncate">
                  {pair.to.split(",")[0]}
                </span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/50 flex-shrink-0" />
            </button>
          ))}
        </motion.div>
      )}

      {/* ── Departure — 3 clean chips in one row ── */}
      <div className="space-y-2">
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-0.5">Departure</p>
        <div className="flex gap-2">
          {/* Leave Now */}
          <button
            onClick={clearSchedule}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all active:scale-95 flex-1 justify-center ${
              timeMode === "now" && !meetingTime
                ? "gradient-primary text-primary-foreground shadow-glow"
                : "bg-secondary border border-border text-foreground hover:bg-accent"
            }`}
          >
            <Clock className="w-3 h-3" />
            Now
          </button>

          {/* Schedule Later */}
          <button
            onClick={() => { setShowScheduler(v => !v); if (meetingTime) setMeetingTime(""); }}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all active:scale-95 flex-1 justify-center ${
              timeMode === "later" && !meetingTime
                ? "gradient-primary text-primary-foreground shadow-glow"
                : "bg-secondary border border-border text-foreground hover:bg-accent"
            }`}
          >
            <CalendarClock className="w-3 h-3" />
            {timeMode === "later" && scheduledLabel && !meetingTime ? scheduledLabel : "Later"}
          </button>

          {/* Meeting */}
          <button
            onClick={() => {
              if (meetingTime) {
                setMeetingTime("");
              } else {
                const t = new Date();
                t.setHours(t.getHours() + 1, 0, 0, 0);
                const pad = (n: number) => n.toString().padStart(2, "0");
                setMeetingTime(`${t.getFullYear()}-${pad(t.getMonth()+1)}-${pad(t.getDate())}T${pad(t.getHours())}:${pad(t.getMinutes())}`);
                setShowScheduler(false);
                setTimeMode("now");
              }
            }}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all active:scale-95 flex-1 justify-center ${
              meetingTime
                ? "bg-amber-500 text-white shadow-md"
                : "bg-secondary border border-border text-foreground hover:bg-accent"
            }`}
          >
            <span className="text-sm leading-none">🗓</span>
            Meeting
          </button>
        </div>

        {/* Schedule Later — time slot grid */}
        <AnimatePresence>
          {showScheduler && !meetingTime && (
            <motion.div
              key="scheduler"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="overflow-hidden"
            >
              <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-elevated">
                <div className="flex border-b border-border">
                  {(["today", "tomorrow"] as const).map((d) => (
                    <button key={d} onClick={() => setScheduleDate(d)}
                      className={`flex-1 py-2.5 text-xs font-semibold capitalize transition-colors ${
                        scheduleDate === d ? "bg-primary/10 text-primary border-b-2 border-primary" : "text-muted-foreground hover:bg-accent"
                      }`}
                    >{d}</button>
                  ))}
                </div>
                <div className="p-3 space-y-3 max-h-[240px] overflow-y-auto">
                  {Object.entries(slotsByPeriod).length === 0 && (
                    <p className="text-xs text-muted-foreground text-center py-4">No more slots today — try tomorrow</p>
                  )}
                  {Object.entries(slotsByPeriod).map(([period, slots]) => {
                    const periodData = TIME_PERIODS.find((p) => p.label === period);
                    return (
                      <div key={period}>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-1">
                          <span>{periodData?.emoji}</span><span>{period}</span>
                        </p>
                        <div className="grid grid-cols-4 gap-1.5">
                          {slots.map((slot) => (
                            <button key={slot.value} onClick={() => selectSlot(slot.value)}
                              className={`py-2 rounded-xl text-xs font-semibold transition-all active:scale-95 ${
                                scheduledTime === slot.value
                                  ? "gradient-primary text-primary-foreground shadow-glow"
                                  : "bg-secondary hover:bg-accent text-foreground border border-border"
                              }`}
                            >{slot.label}</button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Meeting time picker — minimal and clean */}
        <AnimatePresence>
          {meetingTime && (
            <motion.div
              key="meeting"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.16 }}
              className="overflow-hidden"
            >
              <div className="flex items-center gap-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl px-3.5 py-2.5">
                <span className="text-base flex-shrink-0">🗓</span>
                <span className="text-xs font-semibold text-amber-700 dark:text-amber-400 flex-shrink-0">Arrive by</span>
                <input
                  type="datetime-local"
                  value={meetingTime}
                  onChange={(e) => setMeetingTime(e.target.value)}
                  className="flex-1 bg-transparent text-xs font-semibold text-amber-800 dark:text-amber-300 outline-none min-w-0"
                />
              </div>
              <p className="text-[10px] text-muted-foreground px-0.5 mt-1">Routes will show when you need to leave</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Break preference ── */}
      <BreakSelector breakPref={breakPref} setBreakPref={setBreakPref} />

      {/* ── Route preference ── */}
      <div className="space-y-1.5">
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-0.5">Preference</p>
        <div className="flex gap-2 overflow-x-auto pb-0.5 scrollbar-hide">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setActiveFilter(f.id)}
              className={`flex-shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all active:scale-95 ${
                activeFilter === f.id
                  ? "gradient-primary text-primary-foreground shadow-glow"
                  : "bg-secondary border border-border text-foreground hover:bg-accent"
              }`}
            >
              <span>{f.emoji}</span>
              <span>{f.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── CTA row ── */}
      <div className="flex gap-2">
        <motion.button
          onClick={onSearch}
          disabled={!hasLocations}
          whileTap={{ scale: 0.98 }}
          className="flex-1 py-3.5 rounded-2xl gradient-primary text-primary-foreground font-semibold text-sm shadow-glow hover:shadow-elevated transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Search className="w-4 h-4" />
          Find Best Routes
        </motion.button>
        <button
          onClick={requestNotifications}
          title="Enable departure reminders"
          className="w-12 h-12 rounded-2xl bg-secondary border border-border flex items-center justify-center hover:bg-accent transition-colors flex-shrink-0"
        >
          <Bell className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      {/* ── Home Insights: weather, traffic, favorites, history ── */}
      <HomeInsights
        onSelectPair={(f, t, fId, tId) => {
          setFrom(f);
          setFromPlaceId(fId);
          setTo(t);
          setToPlaceId(tId);
        }}
        showHistory={showHistory}
        onToggleHistory={() => setShowHistory(v => !v)}
      />
    </div>
  );
};

export default HomeScreen;
