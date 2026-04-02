import { MapPin } from "lucide-react";
import Console from "../utils/console";

function LocationSuggestions({
  suggestions = [],
  setSuggestions,
  setPickupLocation,
  setDestinationLocation,
  input,
}) {
  const handleSuggestionClick = (suggestion) => {
    Console.log(suggestion);
    
    const locationText = suggestion.display_name || suggestion;
    
    if (input === "pickup") {
      setPickupLocation(locationText);
      setSuggestions([]);
    }
    if (input === "destination") {
      setDestinationLocation(locationText);
      setSuggestions([]);
    }
  };

  return (
    <div className="space-y-1">
      {suggestions.map((suggestion, index) => (
        <div
          onClick={() => handleSuggestionClick(suggestion)}
          key={index}
          className="cursor-pointer flex items-center gap-4 px-3 py-3 rounded-lg hover:bg-gray-100 transition-colors border border-transparent hover:border-gray-200"
        >
          <div className="bg-gray-200 p-2 rounded-full shrink-0">
            <MapPin size={18} className="text-gray-700" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-medium text-gray-900 truncate">
              {suggestion.display_name}
            </h2>
          </div>
        </div>
      ))}
    </div>
  );
}

export default LocationSuggestions;
