import { motion } from "framer-motion";
import { Coffee, X, MapPin } from "lucide-react";
import { useState } from "react";

const nearbyOptions = [
  { name: "Blue Tokai Coffee", type: "Café", time: "+8 min", cost: "₹180", distance: "120 m" },
  { name: "Station Washroom", type: "Washroom", time: "+3 min", cost: "Free", distance: "Inside station" },
];

const MidJourneyBreak = () => {
  const [dismissed, setDismissed] = useState(false);
  const [showOptions, setShowOptions] = useState(false);

  if (dismissed) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className="space-y-2"
    >
      <div className="bg-card rounded-2xl shadow-card border border-primary/20 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Coffee className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Want a quick break here?</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Storkower Straße is a natural stop — great options nearby
              </p>
            </div>
          </div>
          <button onClick={() => setDismissed(true)} className="p-1 rounded-lg hover:bg-secondary transition-colors">
            <X className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
        </div>

        <div className="flex gap-2 mt-3">
          <button
            onClick={() => setDismissed(true)}
            className="flex-1 py-2 rounded-xl text-xs font-medium bg-secondary text-foreground hover:bg-accent transition-colors"
          >
            Skip
          </button>
          <button
            onClick={() => setShowOptions(!showOptions)}
            className="flex-1 py-2 rounded-xl text-xs font-medium gradient-primary text-primary-foreground shadow-glow"
          >
            Show Options
          </button>
        </div>
      </div>

      {showOptions && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="space-y-2"
        >
          {nearbyOptions.map((opt, i) => (
            <div key={i} className="bg-card rounded-xl shadow-card border border-border p-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center flex-shrink-0">
                <MapPin className="w-3.5 h-3.5 text-accent-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">{opt.name}</p>
                <p className="text-[10px] text-muted-foreground">{opt.type} · {opt.distance}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-xs font-bold text-route-green">{opt.time}</p>
                <p className="text-[10px] text-muted-foreground">{opt.cost}</p>
              </div>
            </div>
          ))}
        </motion.div>
      )}
    </motion.div>
  );
};

export default MidJourneyBreak;
