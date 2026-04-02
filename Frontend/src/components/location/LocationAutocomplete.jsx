import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { LoaderCircle, MapPin } from "lucide-react";

function normalizeSuggestion(item) {
  const title = item.name || item.display_name?.split(",")[0] || item.display_name;
  const address = item.display_name || "";

  return {
    name: title,
    address,
    lat: Number(item.lat),
    lon: Number(item.lon ?? item.lng),
    display_name: address,
  };
}

function LocationAutocomplete({
  label,
  placeholder,
  value,
  onChange,
  onSelect,
  minLength = 2,
  limit = 5,
}) {
  const [suggestions, setSuggestions] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const rootRef = useRef(null);
  const debounceRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (rootRef.current && !rootRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (!value || value.trim().length < minLength) {
      setSuggestions([]);
      setIsOpen(false);
      setLoading(false);
      setError("");
      return undefined;
    }

    debounceRef.current = setTimeout(async () => {
      try {
        setLoading(true);
        setError("");

        const response = await axios.get("https://nominatim.openstreetmap.org/search", {
          params: {
            q: value.trim(),
            format: "json",
            addressdetails: 1,
            limit,
          },
          headers: {
            Accept: "application/json",
          },
        });

        const nextSuggestions = response.data.map(normalizeSuggestion);
        setSuggestions(nextSuggestions);
        setIsOpen(true);
      } catch {
        setSuggestions([]);
        setIsOpen(true);
        setError("No locations found");
      } finally {
        setLoading(false);
      }
    }, 350);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [value, minLength, limit]);

  const handleSelect = (suggestion) => {
    onChange(suggestion.display_name);
    onSelect?.(suggestion);
    setSuggestions([]);
    setIsOpen(false);
  };

  const showEmptyState =
    isOpen && !loading && (error || (value.trim().length >= minLength && suggestions.length === 0));

  return (
    <div className="relative" ref={rootRef}>
      {label ? (
        <label className="mb-2 block text-sm font-medium text-slate-600">{label}</label>
      ) : null}

      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={(event) => {
            onChange(event.target.value);
            setIsOpen(true);
          }}
          onFocus={() => {
            if (suggestions.length > 0 || value.trim().length >= minLength) {
              setIsOpen(true);
            }
          }}
          placeholder={placeholder}
          autoComplete="off"
          className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 pr-11 text-sm font-medium text-slate-900 outline-none transition focus:border-slate-900 focus:bg-white"
        />

        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400">
          {loading ? <LoaderCircle size={18} className="animate-spin" /> : <MapPin size={18} />}
        </div>
      </div>

      {isOpen ? (
        <div className="absolute left-0 right-0 top-[calc(100%+0.6rem)] z-30 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/10">
          {loading ? (
            <div className="flex items-center gap-3 px-4 py-4 text-sm text-slate-500">
              <LoaderCircle size={16} className="animate-spin" />
              Searching locations...
            </div>
          ) : null}

          {!loading && suggestions.length > 0 ? (
            <div className="max-h-80 overflow-y-auto py-2">
              {suggestions.map((suggestion) => (
                <button
                  type="button"
                  key={`${suggestion.display_name}-${suggestion.lat}-${suggestion.lon}`}
                  onClick={() => handleSelect(suggestion)}
                  className="flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-slate-50"
                >
                  <div className="mt-0.5 rounded-2xl bg-slate-100 p-2 text-slate-600">
                    <MapPin size={16} />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900">
                      {suggestion.name}
                    </p>
                    <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">
                      {suggestion.address}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          ) : null}

          {showEmptyState ? (
            <div className="px-4 py-4 text-sm text-slate-500">
              {error || "No locations found"}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export default LocationAutocomplete;
