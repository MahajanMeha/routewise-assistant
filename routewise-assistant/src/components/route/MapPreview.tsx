import { Maximize2 } from "lucide-react";
import { motion } from "framer-motion";

const MapPreview = () => {
  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.1 }}
      className="rounded-2xl overflow-hidden shadow-card border border-border h-52 relative"
    >
      {/* Dark map background */}
      <div className="w-full h-full relative overflow-hidden" style={{ background: "linear-gradient(145deg, hsl(240 20% 8%), hsl(250 15% 12%))" }}>
        {/* Road grid */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 220">
          {/* Major roads */}
          <path d="M0 110 Q100 90 200 100 Q300 110 400 95" fill="none" stroke="hsl(240 10% 22%)" strokeWidth="2" />
          <path d="M0 160 Q150 140 250 155 Q350 165 400 150" fill="none" stroke="hsl(240 10% 22%)" strokeWidth="2" />
          <path d="M0 60 Q100 70 200 55 Q300 45 400 60" fill="none" stroke="hsl(240 10% 20%)" strokeWidth="1.5" />
          {/* Verticals */}
          <path d="M80 0 Q85 110 90 220" fill="none" stroke="hsl(240 10% 20%)" strokeWidth="1.5" />
          <path d="M200 0 Q195 100 205 220" fill="none" stroke="hsl(240 10% 22%)" strokeWidth="2" />
          <path d="M320 0 Q315 110 325 220" fill="none" stroke="hsl(240 10% 20%)" strokeWidth="1.5" />
          {/* Minor roads */}
          {Array.from({ length: 6 }).map((_, i) => (
            <line key={`mg${i}`} x1={i * 80} y1={30 + i * 5} x2={i * 80 + 60} y2={200 - i * 10} stroke="hsl(240 10% 16%)" strokeWidth="0.5" opacity="0.6" />
          ))}

          {/* Heatmap glow zones */}
          <defs>
            <radialGradient id="heatA" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="hsl(280 80% 60%)" stopOpacity="0.25" />
              <stop offset="100%" stopColor="hsl(280 80% 60%)" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="heatB" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="hsl(262 83% 65%)" stopOpacity="0.2" />
              <stop offset="100%" stopColor="hsl(262 83% 65%)" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="routeGradDark" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="hsl(262 83% 65%)" />
              <stop offset="100%" stopColor="hsl(217 91% 60%)" />
            </linearGradient>
          </defs>
          <circle cx="150" cy="120" r="70" fill="url(#heatA)" />
          <circle cx="300" cy="80" r="55" fill="url(#heatB)" />
          <circle cx="80" cy="170" r="40" fill="url(#heatA)" />

          {/* Route path - animated */}
          <path d="M60 160 Q120 120 180 100 Q240 80 300 60 Q340 45 360 50" fill="none" stroke="url(#routeGradDark)" strokeWidth="3" strokeLinecap="round">
            <animate attributeName="stroke-dasharray" from="0 600" to="600 0" dur="2s" fill="freeze" />
          </path>
          {/* Alt route */}
          <path d="M60 160 Q140 150 200 130 Q280 100 360 50" fill="none" stroke="hsl(240 10% 30%)" strokeWidth="1.5" strokeDasharray="6 4" opacity="0.4" />

          {/* Activity dots */}
          <circle cx="130" cy="130" r="1.5" fill="hsl(280 80% 70%)" opacity="0.7">
            <animate attributeName="opacity" values="0.4;0.8;0.4" dur="3s" repeatCount="indefinite" />
          </circle>
          <circle cx="250" cy="95" r="1.5" fill="hsl(280 80% 70%)" opacity="0.5">
            <animate attributeName="opacity" values="0.3;0.7;0.3" dur="2.5s" repeatCount="indefinite" />
          </circle>
          <circle cx="170" cy="145" r="1" fill="hsl(262 83% 75%)" opacity="0.6" />
          <circle cx="290" cy="70" r="1" fill="hsl(262 83% 75%)" opacity="0.5" />
        </svg>

        {/* Origin */}
        <div className="absolute bottom-10 left-12 flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-primary shadow-glow border-2 border-primary-foreground" />
          <span className="text-[10px] font-semibold text-primary bg-background/70 backdrop-blur-sm px-1.5 py-0.5 rounded">Start</span>
        </div>

        {/* Destination */}
        <div className="absolute top-8 right-8 flex items-center gap-2">
          <span className="text-[10px] font-semibold text-route-blue bg-background/70 backdrop-blur-sm px-1.5 py-0.5 rounded">End</span>
          <div className="w-4 h-4 rounded-full bg-route-blue shadow-glow border-2 border-primary-foreground" />
        </div>

        {/* Mode stops */}
        <div className="absolute top-[45%] left-[42%] w-2.5 h-2.5 rounded-full bg-route-green border border-primary-foreground" />
        <div className="absolute top-[35%] left-[62%] w-2.5 h-2.5 rounded-full bg-route-yellow border border-primary-foreground" />
      </div>

      <button className="absolute bottom-3 right-3 px-3 py-1.5 text-xs font-semibold rounded-lg bg-background/80 backdrop-blur-sm text-foreground border border-border shadow-elevated flex items-center gap-1.5 hover:bg-background transition-colors">
        <Maximize2 className="w-3 h-3" />
        Expand Map
      </button>
    </motion.div>
  );
};

export default MapPreview;
