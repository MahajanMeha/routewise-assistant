import { Zap, Coffee, Droplets, Shuffle } from "lucide-react";
import { Route, Stop } from "../types";

export const FILTERS = [
  { id: "fastest", label: "Fastest", emoji: "⚡" },
  { id: "cheapest", label: "Cheapest", emoji: "💰" },
  { id: "balanced", label: "Balanced", emoji: "⚖️" },
  { id: "comfort", label: "Least Stressful", emoji: "😌" },
];

export const BREAK_OPTIONS = [
  { id: "none", icon: Zap, label: "No breaks", desc: "Fastest route", emoji: "🚀" },
  { id: "coffee", icon: Coffee, label: "Quick coffee", desc: "~10 min stop", emoji: "☕" },
  { id: "washroom", icon: Droplets, label: "Washroom", desc: "~5 min stop", emoji: "🚻" },
  { id: "flexible", icon: Shuffle, label: "Flexible", desc: "AI suggests best", emoji: "✨" },
];

export const MOCK_ROUTES: Route[] = [
  {
    id: 0,
    time: "34 min",
    totalTime: "44 min",
    cost: "₹55",
    modes: [
      { type: "walk", label: "Walk", color: "bg-muted-foreground" },
      { type: "bus", label: "240", color: "bg-route-green" },
      { type: "coffee", label: "Break", color: "bg-route-yellow" },
      { type: "metro", label: "S41", color: "bg-route-blue" },
    ],
    reliability: 92,
    crowd: "Low",
    transfers: 1,
    explanation: "Includes a short break at a convenient stop while avoiding peak traffic",
    tag: "best",
    leaveBy: "12:30 PM",
    stressLevel: "Low",
    breakStop: { name: "Café at Storkower Str.", duration: "10 min", type: "coffee" },
  },
  {
    id: 1,
    time: "28 min",
    totalTime: "28 min",
    cost: "₹85",
    modes: [
      { type: "auto", label: "Auto", color: "bg-route-orange" },
      { type: "metro", label: "RE7", color: "bg-route-red" },
    ],
    reliability: 88,
    crowd: "Medium",
    transfers: 1,
    explanation: "Fastest but costs more due to auto fare — no break included",
    tag: "fastest",
    comparison: "₹30 cheaper but no break included",
    leaveBy: "12:35 PM",
    stressLevel: "Medium",
    autoAvailability: { level: "High", percent: 85 },
    delayAlert: "Possible delay near Silk Board junction",
  },
  {
    id: 2,
    time: "49 min",
    totalTime: "54 min",
    cost: "₹35",
    modes: [
      { type: "bus", label: "240", color: "bg-route-green" },
      { type: "bus", label: "S85", color: "bg-route-blue" },
      { type: "metro", label: "RB14", color: "bg-route-red" },
    ],
    reliability: 78,
    crowd: "High",
    transfers: 2,
    explanation: "Cheapest option with washroom stop near interchange",
    tag: "cheapest",
    comparison: "Adds 10 min but improves comfort with break",
    leaveBy: "12:47 PM",
    stressLevel: "High",
    autoAvailability: { level: "Low", percent: 30 },
    breakStop: { name: "Washroom at Metro Mall", duration: "5 min", type: "washroom" },
  },
];

export const MOCK_STEPS = [
  { type: "start", label: "Wotanstraße, 14", sublabel: "START" },
  { type: "walk", label: "Walk to bus stop", sublabel: "WALK", duration: "3 min", distance: "200 m" },
  { type: "bus", label: "Gotlindestr.", sublabel: "BUS STOP", duration: "12 min", routeNumber: "240", routeColor: "bg-route-green", routeDirection: "Towards S Storkower Str." },
  { type: "break", label: "Café at Storkower Str.", sublabel: "BREAK STOP", duration: "10 min", distance: "50 m from station" },
  { type: "walk", label: "Transfer walk", sublabel: "WALK", duration: "2 min", distance: "100 m", isBreakPoint: true },
  { type: "metro", label: "Storkower Straße", sublabel: "S-BAHN STATION", duration: "15 min", routeNumber: "S85", routeColor: "bg-route-blue", routeDirection: "Towards Schönefeld" },
  { type: "end", label: "Schönefeld Airport", sublabel: "DESTINATION" },
];

export const MOCK_INSIGHTS = [
  "Leave 20 minutes earlier to avoid rush at Storkower Str.",
  "This route has lower crowd levels in the evening",
  "Bus 240 is 92% on-time at this hour",
  "Metro is less crowded after 7PM — consider a later departure",
  "You can save ₹30 by getting down 2 stops earlier",
];

export const MOCK_SMART_STOPS = [
  { icon: Coffee, name: "Blue Tokai Coffee", rating: 4.5, added: "+5 min", cost: "₹150", distance: "200 m", note: "Along your route — no detour" },
  { icon: Droplets, name: "Washroom (Metro Mall)", rating: 4.0, added: "+2 min", cost: "Free", distance: "Inside station", note: "Inside Storkower station" },
  { icon: Coffee, name: "Chai Point", rating: 4.2, added: "+7 min", cost: "₹80", distance: "350 m", note: "Small detour — great reviews" },
];
