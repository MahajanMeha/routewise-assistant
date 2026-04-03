import { Navigation, ArrowDownUp, MapPin } from "lucide-react";
import { motion } from "framer-motion";
import { useJsApiLoader } from "@react-google-maps/api";
import SearchAutocomplete from "./SearchAutocomplete";

const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
const LIBRARIES: ("places" | "drawing" | "geometry" | "localContext" | "visualization")[] = ["places"];

interface SearchFormProps {
  from: string;
  to: string;
  setFrom: (val: string) => void;
  setTo: (val: string) => void;
}

const SearchForm = ({ from, to, setFrom, setTo }: SearchFormProps) => {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: GOOGLE_API_KEY,
    libraries: LIBRARIES,
  });

  const handleUseCurrentLocation = () => {
    if (navigator.geolocation) {
      setFrom("Locating...");
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          if (window.google) {
            const geocoder = new google.maps.Geocoder();
            geocoder.geocode({ location: { lat: latitude, lng: longitude } }, (results, status) => {
              if (status === "OK" && results?.[0]) {
                setFrom(results[0].formatted_address);
              } else {
                setFrom("Current Location");
              }
            });
          } else {
            setFrom("Current Location");
          }
        },
        () => {
          setFrom("My Location");
        }
      );
    }
  };

  const handleSwap = () => {
    const temp = from;
    setFrom(to);
    setTo(temp);
  };

  if (!isLoaded) return (
    <div className="bg-card rounded-2xl border border-border p-5 flex items-center justify-center min-h-[200px]">
      <div className="text-xs text-muted-foreground animate-pulse">Initializing Maps...</div>
    </div>
  );

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.15 }}
      className="bg-card rounded-2xl shadow-card border border-border p-5 space-y-4 overflow-visible"
    >
      <div className="flex items-center gap-3 relative overflow-visible">
        <div className="w-3 h-3 rounded-full bg-primary flex-shrink-0 shadow-glow" />
        <div className="flex-1 min-w-0 overflow-visible">
          <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block mb-0.5">From</label>
          <div className="flex items-center justify-between gap-2 overflow-visible">
            <div className="flex-1 overflow-visible">
              <SearchAutocomplete
                value={from}
                onChange={setFrom}
                placeholder="Start point"
              />
            </div>
            <button 
              onClick={handleUseCurrentLocation}
              className="text-primary hover:text-primary/80 transition-colors p-1.5 rounded-lg hover:bg-primary/10 flex-shrink-0" 
              title="Use current location"
            >
              <Navigation className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="border-t border-border relative my-1">
        <button 
          onClick={handleSwap}
          className="absolute -top-3.5 right-0 w-7 h-7 rounded-full bg-secondary border border-border flex items-center justify-center hover:bg-accent transition-colors active:scale-95 shadow-sm z-10"
        >
          <ArrowDownUp className="w-3.5 h-3.5 text-muted-foreground" />
        </button>
      </div>

      <div className="flex items-center gap-3 overflow-visible">
        <MapPin className="w-3 h-3 text-route-blue flex-shrink-0" />
        <div className="flex-1 min-w-0 overflow-visible">
          <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block mb-0.5">To</label>
          <div className="flex-1 overflow-visible">
            <SearchAutocomplete
              value={to}
              onChange={setTo}
              placeholder="End point"
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default SearchForm;
