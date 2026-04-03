import { ArrowLeft, BarChart3 } from "lucide-react";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import axios from "axios";
import RouteCard from "./RouteCard";
import ComparisonView from "./ComparisonView";
import LoadingState from "../common/LoadingState";
import { Route } from "@/types";

interface ResultsScreenProps {
  onBack: () => void;
  breakType: string;
  from: string;
  to: string;
  onSelectRoute: (id: number) => void;
}

const ResultsScreen = ({ onBack, breakType, from, to, onSelectRoute }: ResultsScreenProps) => {
  const [loading, setLoading] = useState(true);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [showComparison, setShowComparison] = useState(false);

  useEffect(() => {
    const fetchRoutes = async () => {
      try {
        console.log("Fetching routes for:", from, to, "with break:", breakType);
        const response = await axios.get(`http://localhost:8000/routes?origin=${from}&destination=${to}&break_type=${breakType}`);
        console.log("API Response:", response.data);
        // Map backend data to match the expected Route interface
        const formattedRoutes: Route[] = response.data.map((r: any, index: number) => ({
          id: index,
          time: `${r.time} min`,
          totalTime: `${r.time} min`,
          cost: `₹${r.cost}`,
          modes: [
            { type: "bus", label: "240", color: "bg-route-green" },
            { type: "metro", label: "S41", color: "bg-route-blue" },
          ],
          reliability: r.reliability,
          crowd: r.crowd.charAt(0).toUpperCase() + r.crowd.slice(1),
          transfers: r.transfers,
          explanation: r.explanation,
          tag: r.tag,
          tradeoff: r.tradeoff,
          break_stop: r.break_stop,
          auto_availability: r.auto_availability,
          availability_warning: r.availability_warning,
          leaveBy: "12:30 PM",
          stressLevel: r.stress.charAt(0).toUpperCase() + r.stress.slice(1),
        }));
        setRoutes(formattedRoutes);
      } catch (error) {
        console.error("Error fetching routes:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRoutes();
  }, [breakType, from, to]);

  if (loading) return <LoadingState />;

  return (
    <div className="px-4 pt-4 pb-8 space-y-4">
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="p-2 -ml-2 rounded-xl hover:bg-secondary transition-colors active:scale-95">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <span className="text-sm font-semibold text-foreground">{routes.length} Routes Found</span>
        <button
          onClick={() => setShowComparison(!showComparison)}
          className={`p-2 -mr-2 rounded-xl transition-colors active:scale-95 ${
            showComparison ? "bg-primary/10 text-primary" : "hover:bg-secondary text-foreground"
          }`}
        >
          <BarChart3 className="w-5 h-5" />
        </button>
      </div>

      {/* Route Summary */}
      <div className="bg-card rounded-2xl shadow-card border border-border p-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-primary shadow-glow" />
              <span className="font-semibold text-foreground text-sm">{from}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-route-blue" />
              <span className="font-semibold text-foreground text-sm">{to}</span>
            </div>
          </div>
          <button onClick={onBack} className="text-[10px] font-bold text-primary uppercase tracking-wider hover:text-primary/80 transition-colors">
            Edit
          </button>
        </div>
      </div>

      {/* Personalization */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-accent border border-primary/10"
      >
        <span className="text-[10px] text-accent-foreground">🧠 Routes include your break preference · Based on city-wide data at this time</span>
      </motion.div>

      {showComparison && <ComparisonView routes={routes} />}

      <div className="space-y-3">
        {routes.map((route, i) => (
          <RouteCard
            key={route.id}
            route={route}
            index={i}
            onClick={() => onSelectRoute(route.id)}
          />
        ))}
      </div>
    </div>
  );
};


export default ResultsScreen;
