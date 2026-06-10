const GOOGLE_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;

export interface PlacePrediction {
  id: string;
  description: string;
}

type SearchOptions = {
  limit?: number;
  signal?: AbortSignal | null;
};

// Cache user location for bias — refreshed every 10 min
let _userLocCache: { lat: number; lng: number; ts: number } | null = null;

async function getUserLocation(): Promise<{ lat: number; lng: number } | null> {
  if (_userLocCache && Date.now() - _userLocCache.ts < 10 * 60 * 1000) {
    return _userLocCache;
  }
  return new Promise((resolve) => {
    if (!navigator.geolocation) return resolve(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        _userLocCache = { lat: pos.coords.latitude, lng: pos.coords.longitude, ts: Date.now() };
        resolve(_userLocCache);
      },
      () => resolve(null),
      { timeout: 3000, maximumAge: 5 * 60 * 1000 }
    );
  });
}

// Uses New Places API (v1) — CORS supported, works with HTTP referrer-restricted keys.
export async function searchPlaces(query: string, opts: SearchOptions = {}): Promise<PlacePrediction[]> {
  if (!GOOGLE_KEY) {
    console.warn("VITE_GOOGLE_MAPS_API_KEY is not set");
    return [];
  }

  const userLoc = await getUserLocation();

  const body: Record<string, unknown> = { input: query, languageCode: "en" };
  if (userLoc) {
    // Bias results heavily toward user's current city / region (50 km radius)
    body.locationBias = {
      circle: {
        center: { latitude: userLoc.lat, longitude: userLoc.lng },
        radius: 50000,
      },
    };
  }

  const res = await fetch("https://places.googleapis.com/v1/places:autocomplete", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": GOOGLE_KEY,
    },
    body: JSON.stringify(body),
    ...(opts.signal ? { signal: opts.signal } : {}),
  });

  if (!res.ok) throw new Error("Places autocomplete failed");
  const data = await res.json();

  type Suggestion = {
    placePrediction?: { placeId: string; text: { text: string } };
  };

  return ((data.suggestions ?? []) as Suggestion[])
    .filter((s): s is Required<Suggestion> => Boolean(s.placePrediction))
    .map((s) => ({
      id: s.placePrediction.placeId,
      description: s.placePrediction.text.text,
    }))
    .slice(0, opts.limit ?? 8);
}

// Uses Places Details (New) — CORS supported, works with HTTP referrer-restricted keys.
// Returns [latitude, longitude] for a given place_id.
export async function geocodePlaceById(placeId: string): Promise<[number, number] | null> {
  if (!placeId || !GOOGLE_KEY) return null;

  const res = await fetch(
    `https://places.googleapis.com/v1/places/${placeId}?fields=location`,
    { headers: { "X-Goog-Api-Key": GOOGLE_KEY } }
  );
  if (!res.ok) return null;

  const data = await res.json();
  const loc = data.location;
  if (!loc?.latitude || !loc?.longitude) return null;
  return [loc.latitude as number, loc.longitude as number];
}

/**
 * @deprecated REST Geocoding API rejects HTTP referrer-restricted keys.
 * Use geocodePlaceById() instead.
 */
export async function geocodePlace(query: string): Promise<[number, number] | null> {
  const trimmed = query.trim();
  if (!trimmed || !GOOGLE_KEY) return null;

  const params = new URLSearchParams({ address: trimmed, key: GOOGLE_KEY });
  const res = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?${params}`);
  if (!res.ok) return null;

  const data = await res.json();
  const loc = data.results?.[0]?.geometry?.location;
  if (!loc?.lat || !loc?.lng) return null;
  return [loc.lat as number, loc.lng as number];
}

export default { searchPlaces, geocodePlaceById, geocodePlace };
