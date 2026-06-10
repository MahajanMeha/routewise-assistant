import { useEffect, useRef, useState } from "react";
import { MapPin } from "lucide-react";
import { searchPlaces } from "@/services/geocodingService";
import type { PlacePrediction } from "@/services/geocodingService";

interface SearchAutocompleteProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  onPlaceId?: (id: string) => void;
}

export default function SearchAutocomplete({ value, onChange, placeholder = "Enter location", onPlaceId }: SearchAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<PlacePrediction[]>([]);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const requestSeqRef = useRef(0);
  const cacheRef = useRef(new Map<string, { ts: number; data: PlacePrediction[] }>());
  const justSelectedRef = useRef(false);

  const rawQuery = value.trim();

  useEffect(() => {
    // Skip re-opening dropdown right after the user picked a suggestion
    if (justSelectedRef.current) {
      justSelectedRef.current = false;
      return;
    }

    if (rawQuery.length < 2) {
      setSuggestions([]);
      setOpen(false);
      setActiveIndex(-1);
      setIsLoading(false);
      return;
    }

    setOpen(true);
    setActiveIndex(-1);

    if (rawQuery.length < 3) {
      setSuggestions([]);
      setIsLoading(false);
      return;
    }

    const controller = new AbortController();
    const seq = ++requestSeqRef.current;

    const timer = window.setTimeout(async () => {
      const cacheKey = rawQuery.toLowerCase();
      const cached = cacheRef.current.get(cacheKey);
      if (cached && Date.now() - cached.ts < 5 * 60 * 1000) {
        setSuggestions(cached.data);
        setActiveIndex(-1);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const results = await searchPlaces(rawQuery, { limit: 8, signal: controller.signal });
        if (seq !== requestSeqRef.current) return;
        setSuggestions(results);
        setActiveIndex(-1);
        setIsLoading(false);
        cacheRef.current.set(cacheKey, { ts: Date.now(), data: results });
      } catch {
        if (seq !== requestSeqRef.current) return;
        setSuggestions([]);
        setIsLoading(false);
      }
    }, 120);

    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [rawQuery]);

  useEffect(() => {
    const onDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(target) &&
        inputRef.current &&
        !inputRef.current.contains(target)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const selectSuggestion = (description: string, placeId: string) => {
    justSelectedRef.current = true;   // prevent effect from re-opening dropdown
    onChange(description);
    onPlaceId?.(placeId);
    setOpen(false);
    setSuggestions([]);
    setActiveIndex(-1);
    inputRef.current?.blur();         // dismiss keyboard on mobile
  };

  const highlight = (text: string) => {
    const needle = rawQuery.trim();
    if (!needle) return text;
    const idx = text.toLowerCase().indexOf(needle.toLowerCase());
    if (idx < 0) return text;
    const before = text.slice(0, idx);
    const match = text.slice(idx, idx + needle.length);
    const after = text.slice(idx + needle.length);
    return (
      <>
        {before}
        <span className="text-primary font-semibold">{match}</span>
        {after}
      </>
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open || suggestions.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : prev));
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => (prev > 0 ? prev - 1 : 0));
      return;
    }
    if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      selectSuggestion(suggestions[activeIndex].description, suggestions[activeIndex].id);
      return;
    }
    if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div className="relative w-full">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => {
          if (suggestions.length > 0) setOpen(true);
        }}
        className="w-full bg-transparent border-none outline-none text-sm font-semibold text-foreground placeholder:text-muted-foreground placeholder:font-normal py-1"
        placeholder={placeholder}
        autoComplete="off"
      />
      {open && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-xl shadow-elevated z-[9999] overflow-hidden animate-in fade-in slide-in-from-top-1"
        >
          <div className="max-h-[240px] overflow-y-auto py-1">
            {isLoading && (
              <div className="px-4 py-3 text-sm text-muted-foreground">
                Searching…
              </div>
            )}
            {!isLoading && suggestions.length === 0 && (
              <div className="px-4 py-3 text-sm text-muted-foreground">
                No results found
              </div>
            )}
            {!isLoading &&
              suggestions.map((s, index) => (
                <button
                  key={s.id}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => selectSuggestion(s.description, s.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors border-b border-border last:border-0 hover:bg-accent group ${
                    index === activeIndex ? "bg-accent" : ""
                  }`}
                >
                  <MapPin className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  <span className="text-sm font-medium text-foreground truncate">{highlight(s.description)}</span>
                </button>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
