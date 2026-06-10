import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { getLeaveLaterCurve } from "@/services/aiInsightService";

interface LeaveLaterSimulatorProps {
  baseMin: number;
}

const TOOLTIP_STYLE = {
  backgroundColor: "hsl(var(--card))",
  border: "1px solid hsl(var(--border))",
  borderRadius: "0.75rem",
  padding: "8px 12px",
  fontSize: 11,
  color: "hsl(var(--foreground))",
  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
};

export default function LeaveLaterSimulator({ baseMin }: LeaveLaterSimulatorProps) {
  const [sliderIndex, setSliderIndex] = useState(0);  // 0–6 (every 15 min up to 90)
  const curve = useMemo(() => getLeaveLaterCurve(baseMin), [baseMin]);
  const current = curve[sliderIndex];

  const travelDelta = current.travelMin - curve[0].travelMin;
  const confDelta   = current.confidence - curve[0].confidence;

  // Chart data
  const chartData = curve.map((p, i) => ({
    name:  p.label,
    time:  p.travelMin,
    conf:  p.confidence,
    active: i === sliderIndex,
  }));

  const minTime = Math.min(...curve.map(p => p.travelMin));
  const maxTime = Math.max(...curve.map(p => p.travelMin));

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-2xl overflow-hidden"
    >
      {/* Header */}
      <div className="px-4 pt-4 pb-2 flex items-center justify-between">
        <div>
          <p className="text-sm font-bold text-foreground">What if I leave later?</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">Drag to explore departure times</p>
        </div>
        <div className="text-right">
          <p className="text-xs font-semibold text-muted-foreground">
            {current.label === "Now" ? "Leaving now" : `Leaving in ${current.delayMin} min`}
          </p>
        </div>
      </div>

      {/* Sparkline chart */}
      <div className="px-2 h-[90px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 4, right: 8, left: -24, bottom: 0 }}>
            <defs>
              <linearGradient id="timeGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#8b5cf6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}   />
              </linearGradient>
            </defs>
            <XAxis dataKey="name" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
            <YAxis domain={[minTime - 5, maxTime + 5]} tick={false} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={TOOLTIP_STYLE}
              formatter={(v: number) => [`${v} min`, "Travel time"]}
              cursor={{ stroke: "hsl(var(--border))", strokeWidth: 1, strokeDasharray: "4 2" }}
            />
            <Area
              type="monotone"
              dataKey="time"
              stroke="#8b5cf6"
              strokeWidth={2}
              fill="url(#timeGrad)"
              dot={false}
              activeDot={{ r: 4, fill: "#8b5cf6", strokeWidth: 0 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Slider */}
      <div className="px-4 pb-4 pt-2 space-y-3">
        <input
          type="range"
          min={0}
          max={curve.length - 1}
          value={sliderIndex}
          onChange={(e) => setSliderIndex(Number(e.target.value))}
          className="w-full h-1.5 accent-primary cursor-pointer"
        />

        {/* Live stats */}
        <div className="flex items-center gap-3">
          {/* Travel time */}
          <div className="flex-1 bg-secondary rounded-xl p-2.5">
            <p className="text-[10px] text-muted-foreground font-medium mb-0.5">Travel time</p>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-extrabold text-foreground tabular-nums">{current.travelMin}</span>
              <span className="text-xs text-muted-foreground">min</span>
              {sliderIndex > 0 && (
                <span className={`text-[10px] font-bold ml-1 ${travelDelta > 0 ? "text-red-500" : "text-emerald-500"}`}>
                  {travelDelta > 0 ? `+${travelDelta}` : travelDelta}m
                </span>
              )}
            </div>
          </div>

          {/* Confidence */}
          <div className="flex-1 bg-secondary rounded-xl p-2.5">
            <p className="text-[10px] text-muted-foreground font-medium mb-0.5">On-time chance</p>
            <div className="flex items-baseline gap-1">
              <span className={`text-lg font-extrabold tabular-nums ${current.confidence >= 80 ? "text-emerald-500" : current.confidence >= 65 ? "text-amber-500" : "text-red-500"}`}>
                {current.confidence}%
              </span>
              {sliderIndex > 0 && (
                <span className={`text-[10px] font-bold ml-1 ${confDelta >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                  {confDelta >= 0 ? `+${confDelta}` : confDelta}%
                </span>
              )}
            </div>
          </div>

          {/* Stress */}
          <div className="flex-1 bg-secondary rounded-xl p-2.5">
            <p className="text-[10px] text-muted-foreground font-medium mb-0.5">Stress</p>
            <div className="flex items-baseline gap-1">
              <span className={`text-lg font-extrabold tabular-nums ${current.stress <= 3 ? "text-emerald-500" : current.stress <= 6 ? "text-amber-500" : "text-red-500"}`}>
                {current.stress}
              </span>
              <span className="text-xs text-muted-foreground">/10</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
