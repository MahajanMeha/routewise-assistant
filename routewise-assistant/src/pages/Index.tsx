import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Header from "@/components/common/Header";
import HomeScreen from "@/components/search/HomeScreen";
import ResultsScreen from "@/components/route/ResultsScreen";
import RouteDetailScreen from "@/components/route/RouteDetailScreen";
import { AppScreen } from "@/types";

const Index = () => {
  const [screen, setScreen] = useState<AppScreen>("home");
  const [selectedRoute, setSelectedRoute] = useState<number | null>(null);
  const [darkMode, setDarkMode] = useState(false);
  const [breakType, setBreakType] = useState("none");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const toggleDark = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle("dark");
  };

  return (
    <div className="min-h-screen gradient-bg">
      <Header darkMode={darkMode} onToggleDark={toggleDark} />

      <div className="max-w-md mx-auto min-h-[calc(100vh-56px)] relative overflow-visible">
        <AnimatePresence mode="wait">
          {screen === "home" && (
            <motion.div
              key="home"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.25 }}
              className="overflow-visible"
            >
              <HomeScreen 
                onSearch={() => setScreen("results")} 
                breakPref={breakType}
                setBreakPref={setBreakType}
                from={from}
                setFrom={setFrom}
                to={to}
                setTo={setTo}
              />
            </motion.div>
          )}
          {screen === "results" && (
            <motion.div
              key="results"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.25 }}
            >
              <ResultsScreen
                onBack={() => setScreen("home")}
                breakType={breakType}
                from={from}
                to={to}
                onSelectRoute={(id) => {
                  setSelectedRoute(id);
                  setScreen("detail");
                }}
              />
            </motion.div>
          )}
          {screen === "detail" && selectedRoute !== null && (
            <motion.div
              key="detail"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 40 }}
              transition={{ duration: 0.25 }}
            >
              <RouteDetailScreen
                routeId={selectedRoute}
                onBack={() => setScreen("results")}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Index;
