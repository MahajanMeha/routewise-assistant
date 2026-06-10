import { useState } from "react";

type Props = {
  onSearch: (origin: string, destination: string) => void;
};

export default function SearchAutocomplete({ onSearch }: Props) {
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSearch = () => {
    if (!origin || !destination) {
      alert("Please enter both origin and destination");
      return;
    }

    setLoading(true);
    onSearch(origin, destination);
    setLoading(false);
  };

  return (
    <div className="w-full max-w-xl mx-auto p-4 bg-white shadow-md rounded-xl space-y-4">
      <h2 className="text-xl font-semibold text-center">
        CommuteAI – Smart Travel Planner
      </h2>

      {/* Origin Input */}
      <input
        type="text"
        placeholder="Enter Origin (e.g. Whitefield)"
        value={origin}
        onChange={(e) => setOrigin(e.target.value)}
        className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
      />

      {/* Destination Input */}
      <input
        type="text"
        placeholder="Enter Destination (e.g. Indiranagar)"
        value={destination}
        onChange={(e) => setDestination(e.target.value)}
        className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
      />

      {/* Search Button */}
      <button
        onClick={handleSearch}
        disabled={loading}
        className="w-full bg-blue-500 text-white p-3 rounded-lg hover:bg-blue-600 transition"
      >
        {loading ? "Searching..." : "Find Routes"}
      </button>
    </div>
  );
}