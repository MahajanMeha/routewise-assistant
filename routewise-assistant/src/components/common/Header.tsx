import { Navigation, Sun, Moon } from "lucide-react";

interface HeaderProps {
  darkMode: boolean;
  onToggleDark: () => void;
}

const Header = ({ darkMode, onToggleDark }: HeaderProps) => {
  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-background/80 border-b border-border">
      <div className="max-w-md mx-auto flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center shadow-glow">
            <Navigation className="w-4.5 h-4.5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground tracking-tight leading-tight">CommuteAI</h1>
            <p className="text-[10px] text-muted-foreground leading-tight">Smarter routes. Better decisions.</p>
          </div>
        </div>
        <button
          onClick={onToggleDark}
          className="p-2.5 rounded-full bg-card shadow-card border border-border hover:shadow-elevated transition-all"
          aria-label="Toggle theme"
        >
          {darkMode ? <Sun className="w-4 h-4 text-route-yellow" /> : <Moon className="w-4 h-4 text-muted-foreground" />}
        </button>
      </div>
    </header>
  );
};

export default Header;
