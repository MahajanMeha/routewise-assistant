export const fetchRoutes = async (
  from: string,
  to: string,
  breakType: string,
  departureTime?: string,
  arrivalTime?: string,   // for meeting mode — "arrive by X"
) => {
  const params = new URLSearchParams({
    origin: from,
    destination: to,
    break_type: breakType,
  });
  if (departureTime) params.set("departure_time", departureTime);
  if (arrivalTime)   params.set("arrival_time", arrivalTime);

  const API_URL = import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000";
  const res = await fetch(`${API_URL}/routes?${params.toString()}`);
  if (!res.ok) throw new Error("Failed to fetch routes");
  return res.json();
};

export default { fetchRoutes };
