import { ArrowLeft, MapPin } from "lucide-react";
import { motion } from "framer-motion";
import RouteCard from "@/components/route/RouteCard";
import LoadingState from "@/components/common/LoadingState";
import LeaveLaterSimulator from "@/components/ai/LeaveLaterSimulator";
import RouteComparisonCard from "@/components/route/RouteComparisonCard";

interface ResultsPageProps {
  onBack: () => void;
  from: string;
  to: string;
  fromPlaceId?: string | null;
  toPlaceId?: string | null;
  departureTime?: string;
  routes: any[] | null;
  loading: boolean;
  onSelectRoute: (route: any) => void;
}

const ResultsPage = ({ onBack, from, to, fromPlaceId, toPlaceId, departureTime, routes, loading, onSelectRoute }: ResultsPageProps) => {
  const fromShort = from.split(",")[0];
  const toShort = to.split(",")[0];

  return (
    <div className="p-4 pb-8">
      <div className="flex items-center gap-3 mb-5">
        <button onClick={onBack} aria-label="back"
          className="w-9 h-9 flex items-center justify-center rounded-xl bg-card border border-border hover:bg-accent transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <MapPin className="w-3 h-3 flex-shrink-0" />
            <span className="truncate font-medium">{fromShort}</span>
            <span className="flex-shrink-0">→</span>
            <span className="truncate font-medium">{toShort}</span>
          </div>
          <p className="text-[10px] text-muted-foreground/70 mt-0.5">
            {loading ? "Searching…" : `${routes?.length ?? 0} routes found`}
            {!loading && (departureTime ? " · Scheduled" : " · Leaving now")}
          </p>
        </div>
      </div>

      {loading && <LoadingState />}

      {!loading && routes?.length === 0 && (
        <div className="text-center py-14 px-6">
          <div className="text-4xl mb-3">🛰️</div>
          <p className="text-sm font-semibold text-foreground mb-1">No routes found</p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            The server may be waking up — this takes ~30 seconds on first load.
            Try searching again in a moment.
          </p>
        </div>
      )}

      {/* Leave Later Simulator — shown once routes are loaded */}
      {!loading && routes && routes.length > 0 && (
        <div className="mb-4">
          <LeaveLaterSimulator baseMin={routes[0].time} />
        </div>
      )}

      {/* Route Comparison Card — shown when 2+ routes available */}
      {!loading && routes && routes.length >= 2 && (
        <div className="mb-4">
          <RouteComparisonCard routes={routes} onSelectRoute={onSelectRoute} />
        </div>
      )}

      <div className="space-y-3">
        {routes?.map((r, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <RouteCard
              route={r}
              index={i}
              onClick={() => onSelectRoute(r)}
              from={from}
              to={to}
              fromPlaceId={fromPlaceId ?? ""}
              toPlaceId={toPlaceId ?? ""}
            />
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default ResultsPage;
