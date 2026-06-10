export interface WeatherData {
  temp: number;        // °C
  code: number;        // WMO weather code
  description: string;
  emoji: string;
  rainChance: number;  // 0–100 %
  commuteImpact: string | null;
}

// WMO Weather interpretation codes → emoji + description
function interpretCode(code: number): { emoji: string; description: string } {
  if (code === 0) return { emoji: "☀️", description: "Clear sky" };
  if (code <= 2) return { emoji: "⛅", description: "Partly cloudy" };
  if (code === 3) return { emoji: "☁️", description: "Overcast" };
  if (code <= 49) return { emoji: "🌫️", description: "Fog" };
  if (code <= 59) return { emoji: "🌦️", description: "Drizzle" };
  if (code <= 69) return { emoji: "🌧️", description: "Rain" };
  if (code <= 79) return { emoji: "🌨️", description: "Snow" };
  if (code <= 82) return { emoji: "🌧️", description: "Heavy rain showers" };
  if (code <= 86) return { emoji: "🌨️", description: "Snow showers" };
  if (code <= 99) return { emoji: "⛈️", description: "Thunderstorm" };
  return { emoji: "🌤️", description: "Unknown" };
}

function getCommuteImpact(code: number, rainChance: number): string | null {
  if (code >= 95) return "⛈️ Thunderstorms — avoid travel if possible. Roads will flood.";
  if (code >= 80 || (code >= 60 && code <= 69)) return "🌧️ Rain expected — add 20–30 min, cabs will surge. Metro is safest.";
  if (code >= 51 && code <= 59) return "🌦️ Light drizzle — minor impact. Carry an umbrella.";
  if (rainChance >= 60) return "☔ High rain chance — metro/bus recommended over open vehicles.";
  if (code <= 2) return null; // clear, no impact
  return null;
}

let _cache: { data: WeatherData; ts: number; lat: number; lng: number } | null = null;

export async function getWeather(lat: number, lng: number): Promise<WeatherData | null> {
  if (_cache && Date.now() - _cache.ts < 15 * 60 * 1000 &&
      Math.abs(_cache.lat - lat) < 0.01 && Math.abs(_cache.lng - lng) < 0.01) {
    return _cache.data;
  }

  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat.toFixed(4)}&longitude=${lng.toFixed(4)}&current_weather=true&hourly=precipitation_probability&timezone=auto&forecast_days=1`;
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return null;
    const json = await res.json();

    const cw = json.current_weather;
    const hourlyTimes: string[] = json.hourly?.time ?? [];
    const hourlyRain: number[] = json.hourly?.precipitation_probability ?? [];

    // Find current hour's rain probability
    const nowHour = new Date().toISOString().slice(0, 13);
    const idx = hourlyTimes.findIndex(t => t.startsWith(nowHour));
    const rainChance = idx >= 0 ? (hourlyRain[idx] ?? 0) : 0;

    const { emoji, description } = interpretCode(cw.weathercode);
    const data: WeatherData = {
      temp: Math.round(cw.temperature),
      code: cw.weathercode,
      description,
      emoji,
      rainChance,
      commuteImpact: getCommuteImpact(cw.weathercode, rainChance),
    };

    _cache = { data, ts: Date.now(), lat, lng };
    return data;
  } catch {
    return null;
  }
}

export async function getWeatherForCurrentLocation(): Promise<WeatherData | null> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) return resolve(null);
    navigator.geolocation.getCurrentPosition(
      (p) => getWeather(p.coords.latitude, p.coords.longitude).then(resolve),
      () => resolve(null),
      { timeout: 4000, maximumAge: 5 * 60 * 1000 }
    );
  });
}
