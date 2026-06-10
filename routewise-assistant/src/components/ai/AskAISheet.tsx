import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, Send, X, Sparkles } from "lucide-react";
import { getDailyInsights, loadHistory } from "@/services/routeHistoryService";

// ── Known café brands for fuzzy matching ─────────────────────────────────────
const KNOWN_CAFES = [
  "blue tokai", "third wave", "starbucks", "ccd", "café coffee day", "costa",
  "barista", "toit", "the brew room", "dyu art", "matteo", "udyan", "filter",
  "aromaa", "instacuppa", "sleepy owl", "subko", "tiger", "mj cafe", "rite cafe",
];

// ── Core AI brain ─────────────────────────────────────────────────────────────

export function getAnswer(
  q: string,
  context: {
    from?: string;
    to?: string;
    routeCafes?: { name: string; rating?: number | null; address?: string | null }[];
    routeTime?: number;
    routeCost?: number;
    routeModes?: string[];
    routeCrowd?: string;
  } = {}
): string {
  const lower = q.toLowerCase();
  const fromShort = context.from?.split(",")[0] || "";
  const toShort = context.to?.split(",")[0] || "";
  const city = context.from?.split(",")[1]?.trim() || fromShort || "your city";
  const hour = new Date().getHours();
  const cafes = context.routeCafes ?? [];
  const modes = context.routeModes ?? [];
  const isTransit = modes.some(m => ["metro", "bus", "tram", "ferry", "transit"].includes(m));

  // ── Café / restaurant name lookup ──────────────────────────────────────────
  const mentionedCafe = KNOWN_CAFES.find(c => lower.includes(c));
  const routeCafeMatch = cafes.find(c => c.name.toLowerCase().split(" ").some(w => lower.includes(w) && w.length > 3));
  if (mentionedCafe || lower.includes("on the way") || lower.includes("on my way") || (lower.includes("cafe") && lower.length < 30)) {
    if (routeCafeMatch) {
      return `☕ Yes! "${routeCafeMatch.name}" is on your route${routeCafeMatch.address ? ` (${routeCafeMatch.address})` : ""}. Rated ${routeCafeMatch.rating ?? "—"}/5 ⭐ — tap it below to search on Zomato.`;
    }
    if (mentionedCafe && cafes.length > 0) {
      return `☕ I didn't find "${mentionedCafe}" specifically on this route, but nearby you have: ${cafes.map(c => c.name).join(", ")}. Worth checking!`;
    }
    if (mentionedCafe) {
      return `☕ I can't confirm if "${mentionedCafe}" is directly on this route — try searching it on Google Maps along your path. Generally, Blue Tokai/Third Wave tend to be in commercial areas.`;
    }
    if (cafes.length > 0) {
      return `☕ Coffee stops on your route: ${cafes.map(c => `${c.name} (⭐${c.rating ?? "—"})`).join(", ")}. Tap them in the route details to order on Zomato!`;
    }
    return "☕ No cafés found immediately on this route. Try Google Maps 'coffee near me' at your midpoint stop.";
  }

  // ── Traffic ────────────────────────────────────────────────────────────────
  if (lower.includes("traffic") || lower.includes("jam") || lower.includes("congestion")) {
    if (hour >= 8 && hour <= 10) return "🚦 Peak morning rush right now. Metro/bus will be 20–40 min faster than cab. If driving, leave now or wait till 10:30 AM.";
    if (hour >= 17 && hour <= 20) return "🚦 Evening peak. Worst traffic of the day. Metro strongly recommended. Cabs can be 2× slower and prices surge.";
    if (hour >= 22 || hour <= 6) return "🌙 Late night/early morning — roads are clear. Quick travel time. Estimated +0 min traffic delay.";
    return "🚦 Off-peak now. Traffic is light. Good time to travel — all modes should be quick.";
  }

  // ── Time / ETA ─────────────────────────────────────────────────────────────
  if (lower.includes("how long") || lower.includes("how much time") || lower.includes("duration") || lower.includes("eta")) {
    if (context.routeTime) return `⏱️ This route takes ~${context.routeTime} min${(hour >= 8 && hour <= 10) || (hour >= 17 && hour <= 20) ? " — but add 15–20 min for current peak traffic" : ""}. Distance: ${context.from ? "your origin" : ""} to ${toShort}.`;
    return "⏱️ Search a route first — I'll give you exact ETA with traffic.";
  }

  // ── Cost ───────────────────────────────────────────────────────────────────
  if (lower.includes("cost") || lower.includes("price") || lower.includes("fare") || lower.includes("how much") || lower.includes("cheap") || lower.includes("expensive")) {
    if (context.routeCost) return `💰 This route costs ₹${context.routeCost}. For cheaper: ${isTransit ? "this is already the budget option!" : "take bus (₹5–20) or metro (₹10–70) instead — much cheaper but slower."}`;
    return "💰 Bus: ₹5–20 · Metro: ₹10–70 · Auto: ₹30–150 · Cab: ₹100–500+ · Rapido bike: ₹20–80.";
  }

  // ── Safety / night ─────────────────────────────────────────────────────────
  if (lower.includes("safe") || lower.includes("alone") || lower.includes("night") || lower.includes("late")) {
    if (hour >= 22 || hour <= 5) return "🔒 It's late night. Use Uber/Ola (share trip status with someone). Avoid autos with unknown drivers. Metro stops by ~11 PM. Stay in well-lit pickup spots.";
    return "✅ Generally safe time. Use app-based cabs for accountability. Share live location with someone if travelling alone.";
  }

  // ── Rain / weather ─────────────────────────────────────────────────────────
  if (lower.includes("rain") || lower.includes("weather") || lower.includes("monsoon") || lower.includes("wet")) {
    return "🌧️ Rain tip: Roads flood fast in Indian cities. Add 30–45 min to cab ETA. Cabs surge 2–3×. Metro is immune to surface traffic — best bet during rain. Check weather widget on home screen.";
  }

  // ── Metro ──────────────────────────────────────────────────────────────────
  if (lower.includes("metro") || lower.includes("subway")) {
    return "🚇 Metro is best for: long distances (>5 km), peak hours, rain. Cost: ₹10–70. Runs ~6 AM – 11 PM. Avoid 8:30–10 AM and 6–8 PM for comfort. Reliable, no traffic delays.";
  }

  // ── Cab / Ola / Uber ───────────────────────────────────────────────────────
  if (lower.includes("cab") || lower.includes("uber") || lower.includes("ola") || lower.includes("taxi")) {
    return `🚕 Cab (Ola/Uber Mini): ₹50–80 base + ₹10–14/km.${(hour >= 8 && hour <= 10) || (hour >= 17 && hour <= 20) ? " Surge active now — expect 1.5–2× fare. Try Ola Share to split cost." : " Rates normal right now — good time to book."}`;
  }

  // ── Auto ───────────────────────────────────────────────────────────────────
  if (lower.includes("auto") || lower.includes("rick")) {
    return "🛺 Auto: ₹25–30 base + ₹12–15/km. Use Ola Auto / Rapido Auto for fixed pricing. Best for 2–8 km. Avoid during heavy rain.";
  }

  // ── Bus ────────────────────────────────────────────────────────────────────
  if (lower.includes("bus") || lower.includes("bmtc") || lower.includes("best ")) {
    return "🚌 Bus is cheapest (₹5–20) but slowest. Good for non-urgent trips. Download your city's transit app for live routes. Crowded during peak hours — try off-peak.";
  }

  // ── Rapido / bike ──────────────────────────────────────────────────────────
  if (lower.includes("rapido") || lower.includes("bike taxi") || lower.includes("bike")) {
    return "🏍️ Rapido/bike taxi: ₹20–80, fastest for 2–8 km. Solo only, no luggage. Not for rain. Best when you're running late.";
  }

  // ── Route suggestion ───────────────────────────────────────────────────────
  if (lower.includes("suggest") || lower.includes("best route") || lower.includes("how to go") || lower.includes("which route")) {
    if (fromShort && toShort) return `🗺️ For ${fromShort} → ${toShort}: Search above and I'll show cab, bus & metro options ranked by best balance. Currently ${(hour >= 8 && hour <= 10) || (hour >= 17 && hour <= 20) ? "peak hours — metro preferred" : "off-peak — all modes good"}.`;
    return "🗺️ Enter your From & To locations above, tap 'Find Best Routes' — I'll rank all options!";
  }

  // ── History-aware ──────────────────────────────────────────────────────────
  if (lower.includes("history") || lower.includes("past") || lower.includes("previous") || lower.includes("usual")) {
    const history = loadHistory();
    if (history.length === 0) return "📊 No commute history yet. Once you search routes, I'll track your patterns and give personalised insights!";
    const totalSpend = history.slice(0, 20).reduce((s, h) => s + h.cost, 0);
    return `📊 You've done ${history.length} commutes tracked. Recent spend: ~₹${totalSpend} (last 20 trips). Check the History tab for full breakdown.`;
  }

  // ── Comparison ────────────────────────────────────────────────────────────
  if (lower.includes("compare") || lower.includes("vs") || lower.includes("difference") || lower.includes("better")) {
    return "⚖️ Quick compare: Metro (slow boarding, no traffic, ₹10–70) vs Cab (door-to-door, fastest, ₹100–500, surge) vs Bus (cheapest ₹5–20, slowest). For most 10–25 km city trips: Metro wins on value.";
  }

  // ── Hello ──────────────────────────────────────────────────────────────────
  if (lower.includes("hello") || lower.match(/^hi\b/) || lower.includes("hey") || lower.includes("hii")) {
    return `Hey! 👋 I'm your AI commute assistant for ${city}. Ask me about traffic, costs, best routes, safety, weather impact, or café stops on your route!`;
  }

  // ── Fallback ───────────────────────────────────────────────────────────────
  const insights = getDailyInsights();
  if (insights.length > 0) return `💡 ${insights[0]} — Ask me about traffic, cost, metro, safety, or café stops on your route!`;
  return `I can help with traffic (currently ${(hour >= 8 && hour <= 10) || (hour >= 17 && hour <= 20) ? "🚦 peak" : "✅ clear"}), cheapest routes, safety tips, rain impact, and café stops. What do you need?`;
}

// ── Component ─────────────────────────────────────────────────────────────────

const QUICK_QUESTIONS = [
  "Traffic right now?",
  "Cheapest option?",
  "Metro or cab?",
  "Is it safe?",
  "Tips for rain?",
];

interface AskAISheetProps {
  from?: string;
  to?: string;
}

export default function AskAISheet({ from, to }: AskAISheetProps) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [chat, setChat] = useState<{ q: string; a: string }[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  }, [chat, open]);

  const ask = (q: string) => {
    const trimmed = q.trim();
    if (!trimmed) return;
    const a = getAnswer(trimmed, { from, to });
    setChat(prev => [...prev, { q: trimmed, a }]);
    setInput("");
  };

  return (
    <>
      <motion.button
        onClick={() => setOpen(true)}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-6 right-4 z-50 flex items-center gap-2 px-4 py-2.5 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white text-sm font-semibold shadow-lg shadow-violet-500/30 hover:shadow-violet-500/50 transition-shadow"
      >
        <Sparkles className="w-3.5 h-3.5" />
        Ask AI
      </motion.button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div key="bd" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setOpen(false)} className="fixed inset-0 bg-black/50 z-50" />

            <motion.div key="sh"
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border rounded-t-3xl max-h-[85vh] flex flex-col max-w-md mx-auto"
            >
              <div className="flex-none px-4 pt-3 pb-3 border-b border-border">
                <div className="w-10 h-1 bg-border rounded-full mx-auto mb-3" />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground">CommuteAI Assistant</p>
                      <p className="text-[10px] text-muted-foreground">{from ? `${from.split(",")[0]}${to ? ` → ${to.split(",")[0]}` : ""}` : "Ask anything about your commute"}</p>
                    </div>
                  </div>
                  <button onClick={() => setOpen(false)}
                    className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center hover:bg-accent">
                    <X className="w-3.5 h-3.5 text-muted-foreground" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4 min-h-0">
                {chat.length === 0 && (
                  <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                    <p className="text-xs text-muted-foreground text-center">Try asking:</p>
                    <div className="flex flex-wrap gap-2 justify-center">
                      {QUICK_QUESTIONS.map(q => (
                        <button key={q} onClick={() => ask(q)}
                          className="px-3 py-1.5 bg-violet-500/10 text-violet-600 dark:text-violet-400 rounded-full text-xs font-medium hover:bg-violet-500/20 transition-colors">
                          {q}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}

                {chat.map((msg, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
                    <div className="flex justify-end">
                      <span className="bg-violet-600 text-white text-sm px-3.5 py-2 rounded-2xl rounded-tr-sm max-w-[80%] leading-relaxed">{msg.q}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Bot className="w-3 h-3 text-white" />
                      </div>
                      <span className="bg-secondary text-foreground text-sm px-3.5 py-2 rounded-2xl rounded-tl-sm max-w-[85%] leading-relaxed">{msg.a}</span>
                    </div>
                  </motion.div>
                ))}
                <div ref={bottomRef} />
              </div>

              <div className="flex-none flex items-center gap-2 px-4 py-3 border-t border-border">
                <input value={input} onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && ask(input)}
                  placeholder="Ask about traffic, cost, safety, cafés…"
                  className="flex-1 bg-secondary border border-border rounded-xl px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-violet-500/30"
                />
                <button onClick={() => ask(input)} disabled={!input.trim()}
                  className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center disabled:opacity-40 hover:opacity-90 transition-opacity flex-shrink-0">
                  <Send className="w-4 h-4 text-white" />
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
