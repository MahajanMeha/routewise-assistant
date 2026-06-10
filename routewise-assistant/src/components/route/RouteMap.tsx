import { useEffect, useMemo, useState } from "react";
import { Marker, Map, useMap, useMapsLibrary } from "@vis.gl/react-google-maps";
import { geocodePlaceById } from "@/services/geocodingService";

// ── Types ─────────────────────────────────────────────────────────────────────

type LatLng = { lat: number; lng: number };

type RouteMapProps = {
  origin?: string;
  destination?: string;
  originPlaceId?: string | null;
  destinationPlaceId?: string | null;
  route?: any;              // single route (details screen)
  routes?: any[];           // all routes (results screen)
  selectedRouteIndex?: number;
  heightClassName?: string;
  tight?: boolean;          // zoom in tight to the route
};

// ── Mode colours for segment polylines ───────────────────────────────────────

const MODE_COLORS: Record<string, { dark: string; light: string }> = {
  metro:   { dark: "#60A5FA", light: "#2563EB" }, // blue
  bus:     { dark: "#FB923C", light: "#EA580C" }, // orange
  cab:     { dark: "#FBBF24", light: "#D97706" }, // amber
  auto:    { dark: "#34D399", light: "#059669" }, // emerald
  walk:    { dark: "#9CA3AF", light: "#6B7280" }, // gray
  bike:    { dark: "#A3E635", light: "#65A30D" }, // lime
  tram:    { dark: "#C084FC", light: "#9333EA" }, // purple
  ferry:   { dark: "#22D3EE", light: "#0891B2" }, // cyan
  transit: { dark: "#FB923C", light: "#EA580C" }, // orange fallback
};

function getModeColor(mode: string, isDark: boolean): string {
  const cfg = MODE_COLORS[mode] ?? MODE_COLORS.transit;
  return isDark ? cfg.dark : cfg.light;
}

// ── Map styles ────────────────────────────────────────────────────────────────
// "Ink Night" — deep charcoal + violet accents, nothing like stock Google Maps

const DARK_STYLES = [
  { elementType: "geometry",        stylers: [{ color: "#0e0e18" }] },
  { elementType: "labels.text.fill",  stylers: [{ color: "#6366f1" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#0e0e18" }, { weight: 3 }] },
  { featureType: "administrative.country",  elementType: "geometry.stroke", stylers: [{ color: "#1e1b4b" }] },
  { featureType: "administrative.locality", elementType: "labels.text.fill", stylers: [{ color: "#a5b4fc" }] },
  { featureType: "landscape",        elementType: "geometry.fill", stylers: [{ color: "#0e0e18" }] },
  { featureType: "landscape.natural.terrain", elementType: "geometry.fill", stylers: [{ color: "#12121f" }] },
  { featureType: "poi",              elementType: "all",            stylers: [{ visibility: "off" }] },
  { featureType: "road",             elementType: "geometry.fill",  stylers: [{ color: "#1c1c2e" }] },
  { featureType: "road",             elementType: "geometry.stroke", stylers: [{ color: "#252540" }] },
  { featureType: "road",             elementType: "labels.text.fill", stylers: [{ color: "#4f46e5" }] },
  { featureType: "road.arterial",    elementType: "geometry.fill",  stylers: [{ color: "#1e1b38" }] },
  { featureType: "road.highway",     elementType: "geometry.fill",  stylers: [{ color: "#1e1040" }] },
  { featureType: "road.highway",     elementType: "geometry.stroke", stylers: [{ color: "#3730a3" }] },
  { featureType: "road.local",       elementType: "geometry.fill",  stylers: [{ color: "#141424" }] },
  { featureType: "transit",          elementType: "all",            stylers: [{ visibility: "off" }] },
  { featureType: "water",            elementType: "geometry.fill",  stylers: [{ color: "#060614" }] },
  { featureType: "water",            elementType: "labels.text.fill", stylers: [{ color: "#312e81" }] },
];

// "Pearl" — warm off-white with indigo roads, teal water — nothing like stock Google Maps
const LIGHT_STYLES = [
  { elementType: "geometry",         stylers: [{ color: "#f5f3ff" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#4b5563" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#f5f3ff" }, { weight: 3 }] },
  { featureType: "administrative.country",  elementType: "geometry.stroke", stylers: [{ color: "#c4b5fd" }] },
  { featureType: "administrative.locality", elementType: "labels.text.fill", stylers: [{ color: "#3730a3" }] },
  { featureType: "landscape",        elementType: "geometry.fill",  stylers: [{ color: "#f5f3ff" }] },
  { featureType: "landscape.natural.terrain", elementType: "geometry.fill", stylers: [{ color: "#ede9fe" }] },
  { featureType: "poi.park",         elementType: "geometry.fill",  stylers: [{ color: "#d1fae5" }] },
  { featureType: "poi",              elementType: "labels",         stylers: [{ visibility: "off" }] },
  { featureType: "poi",              elementType: "geometry",       stylers: [{ color: "#ede9fe" }] },
  { featureType: "road",             elementType: "geometry.fill",  stylers: [{ color: "#ffffff" }] },
  { featureType: "road",             elementType: "geometry.stroke", stylers: [{ color: "#ddd6fe" }] },
  { featureType: "road",             elementType: "labels.text.fill", stylers: [{ color: "#6d28d9" }] },
  { featureType: "road.arterial",    elementType: "geometry.fill",  stylers: [{ color: "#fafaff" }] },
  { featureType: "road.highway",     elementType: "geometry.fill",  stylers: [{ color: "#ede9fe" }] },
  { featureType: "road.highway",     elementType: "geometry.stroke", stylers: [{ color: "#8b5cf6" }] },
  { featureType: "road.local",       elementType: "geometry.fill",  stylers: [{ color: "#f9f7ff" }] },
  { featureType: "transit",          elementType: "all",            stylers: [{ visibility: "off" }] },
  { featureType: "water",            elementType: "geometry.fill",  stylers: [{ color: "#bfdbfe" }] },
  { featureType: "water",            elementType: "labels.text.fill", stylers: [{ color: "#3730a3" }] },
];

// ── User location for default map center ──────────────────────────────────────

function useUserLocation(): LatLng {
  const FALLBACK: LatLng = { lat: 20.5937, lng: 78.9629 }; // centre of India
  const [loc, setLoc] = useState<LatLng>(FALLBACK);
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (p) => setLoc({ lat: p.coords.latitude, lng: p.coords.longitude }),
      () => {},
      { timeout: 4000, maximumAge: 10 * 60 * 1000 }
    );
  }, []);
  return loc;
}

// ── Dark mode detection ───────────────────────────────────────────────────────

function useIsDarkTheme(): boolean {
  const [isDark, setIsDark] = useState(() =>
    document.documentElement.classList.contains("dark")
  );
  useEffect(() => {
    const el = document.documentElement;
    const obs = new MutationObserver(() => setIsDark(el.classList.contains("dark")));
    obs.observe(el, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);
  return isDark;
}

// ── Polyline decoder ──────────────────────────────────────────────────────────

function decodePolyline(encoded: string): LatLng[] {
  const points: LatLng[] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    let result = 0;
    let shift = 0;
    let byte = 0;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    lat += result & 1 ? ~(result >> 1) : result >> 1;

    result = 0;
    shift = 0;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    lng += result & 1 ? ~(result >> 1) : result >> 1;

    points.push({ lat: lat / 1e5, lng: lng / 1e5 });
  }
  return points;
}

function extractPolyline(route: any): LatLng[] {
  if (!route) return [];
  const encoded =
    route.overview_polyline?.points ??
    route.polyline ??
    route.geometry ??
    route.route_geometry;
  if (typeof encoded === "string" && encoded.trim()) {
    return decodePolyline(encoded.trim());
  }
  return [];
}

// ── Sub-components ────────────────────────────────────────────────────────────

// Fits map to show all provided points with padding.
function MapBoundsFitter({ points, tight = false }: { points: LatLng[]; tight?: boolean }) {
  const map = useMap();
  const coreLib = useMapsLibrary("core");

  useEffect(() => {
    if (!map) return;
    if (points.length === 0) return; // keep userLocation default center
    if (points.length === 1) {
      map.setCenter(points[0]);
      map.setZoom(15);
      return;
    }
    if (!coreLib) return;
    const bounds = new google.maps.LatLngBounds();
    points.forEach((p) => bounds.extend(p));
    // tight=true gives more padding so the route fills the card better
    map.fitBounds(bounds, tight ? 40 : 80);
  }, [map, coreLib, points, tight]);

  return null;
}

// Renders a single polyline imperatively on the map.
function MapPolyline({
  path,
  strokeColor,
  strokeWeight,
  strokeOpacity,
}: {
  path: LatLng[];
  strokeColor: string;
  strokeWeight: number;
  strokeOpacity: number;
}) {
  const map = useMap();
  const mapsLib = useMapsLibrary("maps");

  useEffect(() => {
    if (!map || !mapsLib || path.length < 2) return;

    const polyline = new google.maps.Polyline({
      path,
      strokeColor,
      strokeWeight,
      strokeOpacity,
      map,
    });

    return () => {
      polyline.setMap(null);
    };
  }, [map, mapsLib, path, strokeColor, strokeWeight, strokeOpacity]);

  return null;
}

// SVG data-URI icons for origin and destination — work with legacy Marker (no mapId needed).
const ORIGIN_ICON_SVG = encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14"><circle cx="7" cy="7" r="5" fill="#8b5cf6" stroke="white" stroke-width="2"/></svg>`
);
const DESTINATION_ICON_SVG = encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18"><circle cx="9" cy="9" r="7" fill="#8b5cf6" stroke="white" stroke-width="2.5"/><circle cx="9" cy="9" r="3" fill="white"/></svg>`
);

// ── Main component ────────────────────────────────────────────────────────────

export default function RouteMap({
  origin,
  destination,
  originPlaceId,
  destinationPlaceId,
  route,
  routes,
  selectedRouteIndex = 0,
  heightClassName = "h-[280px]",
  tight = false,
}: RouteMapProps) {
  const isDark = useIsDarkTheme();
  const userLocation = useUserLocation();

  const [coords, setCoords] = useState<{ from: LatLng | null; to: LatLng | null }>({
    from: null,
    to: null,
  });

  // Geocode using place_id — works with HTTP referrer-restricted frontend key.
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const [fromCoord, toCoord] = await Promise.all([
        originPlaceId ? geocodePlaceById(originPlaceId) : Promise.resolve(null),
        destinationPlaceId ? geocodePlaceById(destinationPlaceId) : Promise.resolve(null),
      ]);
      if (cancelled) return;
      setCoords({
        from: fromCoord ? { lat: fromCoord[0], lng: fromCoord[1] } : null,
        to: toCoord ? { lat: toCoord[0], lng: toCoord[1] } : null,
      });
    };
    load();
    return () => { cancelled = true; };
  }, [originPlaceId, destinationPlaceId]);

  // Extract polylines for all routes. Memoized — only recomputes when route data changes.
  const allPolylines = useMemo(() => {
    if (routes && routes.length > 0) return routes.map(extractPolyline);
    if (route) return [extractPolyline(route)];
    return [];
  }, [route, routes]);

  const primaryPolyline = useMemo(
    () => allPolylines[selectedRouteIndex] ?? allPolylines[0] ?? [],
    [allPolylines, selectedRouteIndex]
  );

  // Collect all coord points for bounds fitting.
  const boundsPoints = useMemo(() => {
    const pts: LatLng[] = [];
    if (coords.from) pts.push(coords.from);
    if (coords.to) pts.push(coords.to);
    primaryPolyline.forEach((p) => pts.push(p));
    return pts;
  }, [coords, primaryPolyline]);

  // Extract per-step segments from selected route (detail view)
  const stepSegments: { mode: string; path: LatLng[] }[] = useMemo(() => {
    const r = route ?? routes?.[selectedRouteIndex];
    if (!r?.step_segments) return [];
    return (r.step_segments as { mode: string; polyline: string }[])
      .map((seg) => ({ mode: seg.mode, path: decodePolyline(seg.polyline) }))
      .filter((seg) => seg.path.length > 1);
  }, [route, routes, selectedRouteIndex]);

  const hasSegments = stepSegments.length > 0;

  return (
    <div className={`w-full ${heightClassName} rounded-2xl overflow-hidden`}>
      <Map
        defaultCenter={userLocation}
        defaultZoom={12}
        styles={isDark ? DARK_STYLES : LIGHT_STYLES}
        disableDefaultUI
        zoomControl
        gestureHandling="cooperative"
        style={{ width: "100%", height: "100%" }}
      >
        <MapBoundsFitter points={boundsPoints} tight={tight} />

        {coords.from && (
          <Marker
            position={coords.from}
            icon={{ url: `data:image/svg+xml,${ORIGIN_ICON_SVG}`, scaledSize: { width: 14, height: 14 } as any }}
          />
        )}
        {coords.to && (
          <Marker
            position={coords.to}
            icon={{ url: `data:image/svg+xml,${DESTINATION_ICON_SVG}`, scaledSize: { width: 18, height: 18 } as any }}
          />
        )}

        {/* Per-segment coloured polylines (detail view) */}
        {hasSegments && stepSegments.map((seg, i) => {
          const color = getModeColor(seg.mode, isDark);
          return (
            <MapPolyline
              key={`seg-${i}`}
              path={seg.path}
              strokeColor={color}
              strokeWeight={5}
              strokeOpacity={0.92}
            />
          );
        })}

        {/* Fallback: single-colour primary route (results view or no segments) */}
        {!hasSegments && primaryPolyline.length > 1 && (
          <>
            <MapPolyline path={primaryPolyline} strokeColor="#6d28d9" strokeWeight={18} strokeOpacity={0.05} />
            <MapPolyline path={primaryPolyline} strokeColor="#8b5cf6" strokeWeight={10} strokeOpacity={0.15} />
            <MapPolyline path={primaryPolyline} strokeColor={isDark ? "#a78bfa" : "#7c3aed"} strokeWeight={4} strokeOpacity={0.95} />
          </>
        )}

        {/* Alternative routes — dimmed */}
        {allPolylines.map((pts, i) =>
          i !== selectedRouteIndex && pts.length > 1 ? (
            <MapPolyline key={`alt-${i}`} path={pts} strokeColor="#4c1d95" strokeWeight={3} strokeOpacity={0.35} />
          ) : null
        )}
      </Map>
    </div>
  );
}
