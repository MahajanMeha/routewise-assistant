export type TransportMode = "bus" | "metro" | "auto" | "walk" | "coffee" | "washroom";

export interface RouteMode {
  type: TransportMode;
  label: string;
  color: string;
}

export interface RouteBreak {
  name: string;
  duration: string;
  type: "coffee" | "washroom";
}

export interface AutoAvailability {
  level: "High" | "Medium" | "Low";
  percent: number;
}

export interface Route {
  id: number;
  time: string | number;
  totalTime: string | number;
  cost: string | number;
  modes: RouteMode[];
  reliability: number;
  crowd: "Low" | "Medium" | "High" | "low" | "medium" | "high";
  transfers: number;
  explanation: string;
  tag?: "best" | "cheapest" | "fastest";
  comparison?: string;
  leaveBy: string;
  stressLevel: "Low" | "Medium" | "High" | "low" | "medium" | "high";
  autoAvailability?: AutoAvailability;
  auto_availability?: number;
  availability_warning?: string;
  delayAlert?: string;
  breakStop?: RouteBreak;
  break_stop?: string | null;
  tradeoff?: string;
}

export interface Stop {
  name: string;
  time: string;
  type: TransportMode;
  icon?: any;
  color?: string;
  description?: string;
  isCurrent?: boolean;
}

export interface Insight {
  title: string;
  value: string;
  icon: any;
  color: string;
  trend?: string;
  trendUp?: boolean;
}

export type AppScreen = "home" | "results" | "detail";
