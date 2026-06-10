import { Sun, Moon } from "lucide-react";

interface HeaderProps {
  darkMode: boolean;
  onToggleDark: () => void;
}

const CommuteAILogo = ({ size = 36 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 42 42" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="42" height="42" rx="11" fill="url(#logoGrad)" />
    <path
      d="M30 12 C26 8 16 8 12 14 C8 20 8 28 14 33 C18 37 26 37 30 33"
      stroke="white"
      strokeWidth="3"
      strokeLinecap="round"
      fill="none"
    />
    <circle cx="30" cy="22" r="3" fill="white" opacity="0.95" />
    <path
      d="M30 17 L30.7 19.8 L33.5 20.5 L30.7 21.2 L30 24 L29.3 21.2 L26.5 20.5 L29.3 19.8 Z"
      fill="white"
      opacity="0.3"
    />
    <defs>
      <linearGradient id="logoGrad" x1="0" y1="0" x2="42" y2="42" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#7c3aed" />
        <stop offset="100%" stopColor="#4f46e5" />
      </linearGradient>
    </defs>
  </svg>
);

const Header = ({ darkMode, onToggleDark }: HeaderProps) => {
  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-background/80 border-b border-border">
      <div className="max-w-md mx-auto flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2.5">
          <CommuteAILogo size={36} />
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
