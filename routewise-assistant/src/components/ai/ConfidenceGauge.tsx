import { motion } from "framer-motion";

interface ConfidenceGaugeProps {
  value: number;        // 0–100
  size?: number;
  strokeWidth?: number;
  label?: string;
  sublabel?: string;
  animate?: boolean;
}

export default function ConfidenceGauge({
  value,
  size = 80,
  strokeWidth = 6,
  label,
  sublabel,
  animate = true,
}: ConfidenceGaugeProps) {
  const r = (size - strokeWidth) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * r;
  const clamp = Math.max(0, Math.min(100, value));
  const offset = circumference - (clamp / 100) * circumference;

  const color = clamp >= 85 ? "#10b981"   // emerald
              : clamp >= 70 ? "#f59e0b"   // amber
              : "#ef4444";                // red

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          className="-rotate-90"
          style={{ display: "block" }}
        >
          {/* Track */}
          <circle
            cx={cx} cy={cy} r={r}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-border"
          />
          {/* Progress */}
          <motion.circle
            cx={cx} cy={cy} r={r}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={animate ? { delay: 0.2, duration: 0.8, ease: "easeOut" } : { duration: 0.3, ease: "easeOut" }}
          />
        </svg>

        {/* Centre label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-base font-extrabold tabular-nums text-foreground leading-none">
            {clamp}%
          </span>
        </div>
      </div>

      {label && (
        <p className="text-[11px] font-semibold text-foreground text-center">{label}</p>
      )}
      {sublabel && (
        <p className="text-[10px] text-muted-foreground text-center leading-snug max-w-[100px]">{sublabel}</p>
      )}
    </div>
  );
}
