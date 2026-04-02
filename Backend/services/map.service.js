const axios = require("axios");
const captainModel = require("../models/captain.model");

// ==========================================
// NOMINATIM API - Geocoding & Autocomplete
// ==========================================

/**
 * Get coordinates from address using Nominatim (OpenStreetMap)
 * @param {string} address - Address to geocode
 * @returns {Promise<{ltd: number, lng: number}>}
 */
module.exports.getAddressCoordinate = async (address) => {
  if (!address || typeof address !== "string") {
    throw new Error("Address must be a valid string");
  }

  const userAgent = "QuickRide App"; // Required by Nominatim ToS
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`;

  try {
    console.log(`[Geocoding] Fetching coordinates for address: ${address}`);
    
    const response = await axios.get(url, {
      headers: { "User-Agent": userAgent },
      timeout: 10000,
    });

    if (!response.data || response.data.length === 0) {
      throw new Error(`No results found for address: ${address}`);
    }

    const location = response.data[0];
    
    const result = {
      ltd: parseFloat(location.lat),
      lng: parseFloat(location.lon),
      display_name: location.display_name,
    };

    console.log(`[Geocoding] ✓ Got coordinates:`, result);
    return result;
  } catch (error) {
    console.error("[Geocoding] ✗ Error:", error.message);
    throw new Error(`Geocoding failed for "${address}": ${error.message}`);
  }
};

// ==========================================
// OSRM API - Distance & Duration
// ==========================================

/**
 * Attempt to parse a "lat,lng" string into numeric coordinates.
 * Returns null if the string is not in a valid numeric coordinate format.
 * This prevents treating regular addresses like "Place, City" as coordinates.
 * @param {string} value
 * @returns {{ltd: number, lng: number} | null}
 */
function parseCoordinateString(value) {
  if (!value || typeof value !== "string") return null;

  if (!value.includes(",")) return null;

  const parts = value.split(",");
  if (parts.length !== 2) return null;

  const lat = parseFloat(parts[0].trim());
  const lng = parseFloat(parts[1].trim());

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;

  return { ltd: lat, lng: lng };
}

/**
 * Get distance and time between two locations using OSRM
 * OSRM expects: longitude,latitude (reversed from standard)
 * @param {string} origin - Address or "lat,lng"
 * @param {string} destination - Address or "lat,lng"
 * @returns {Promise<{distance: {value: number}, duration: {value: number}}>}
 */
module.exports.getDistanceTime = async (origin, destination) => {
  if (!origin || !destination) {
    throw new Error("Origin and destination addresses are required");
  }

  try {
    console.log(`[Routing] Calculating route from ${origin} to ${destination}`);

    // Get coordinates for origin
    let originCoords = parseCoordinateString(origin);
    if (!originCoords) {
      // Treat as free‑form address (e.g. "Place, City")
      originCoords = await module.exports.getAddressCoordinate(origin);
    }

    // Get coordinates for destination
    let destinationCoords = parseCoordinateString(destination);
    if (!destinationCoords) {
      // Treat as free‑form address (e.g. "Place, City")
      destinationCoords = await module.exports.getAddressCoordinate(destination);
    }

    // OSRM uses longitude,latitude format (reversed!)
    const osrmResponse = await getOSRMRoute(
      originCoords.lng,
      originCoords.ltd,
      destinationCoords.lng,
      destinationCoords.ltd
    );

    // Convert OSRM response to Google Maps format for compatibility
    const distance = Math.round(osrmResponse.distance); // meters
    const duration = Math.round(osrmResponse.duration); // seconds

    // convert geojson coordinates (lng,lat) → [lat,lng]
    let routeCoords = [];
    if (osrmResponse.routes && osrmResponse.routes[0] && osrmResponse.routes[0].geometry) {
      const coords = osrmResponse.routes[0].geometry.coordinates || [];
      routeCoords = coords.map((c) => [c[1], c[0]]);
    }

    const result = {
      distance: {
        text: `${(distance / 1000).toFixed(2)} km`,
        value: distance, // in meters
      },
      duration: {
        text: `${Math.ceil(duration / 60)} mins`,
        value: duration, // in seconds
      },
      // raw OSRM routes (for advanced use if needed)
      routes: osrmResponse.routes || [],
      // simplified lat/lng array for frontend
      routeCoords,
    };

    console.log(`[Routing] ✓ Route calculated:`, {
      distance_km: (distance / 1000).toFixed(2),
      duration_mins: Math.ceil(duration / 60),
    });

    return result;
  } catch (error) {
    console.error("[Routing] ✗ Error:", error.message);
    throw new Error(`Route calculation failed: ${error.message}`);
  }
};

/**
 * OSRM routing engine
 * @param {number} lng1 - Origin longitude
 * @param {number} lat1 - Origin latitude
 * @param {number} lng2 - Destination longitude
 * @param {number} lat2 - Destination latitude
 * @returns {Promise<{distance: number, duration: number}>}
 */
async function getOSRMRoute(lng1, lat1, lng2, lat2) {
  // request geojson output so we get an array of coordinates directly
  const url = `https://router.project-osrm.org/route/v1/driving/${lng1},${lat1};${lng2},${lat2}?overview=full&geometries=geojson&continue_straight=default`;

  try {
    const response = await axios.get(url, {
      timeout: 10000,
    });

    if (response.data.code !== "Ok") {
      throw new Error(`OSRM error: ${response.data.code}`);
    }

    if (!response.data.routes || response.data.routes.length === 0) {
      throw new Error("No route found between these locations");
    }

    const route = response.data.routes[0];

    return {
      distance: route.distance, // meters
      duration: route.duration, // seconds
      routes: response.data.routes,
    };
  } catch (error) {
    console.error("[OSRM] ✗ Error:", error.message);
    throw new Error(`OSRM routing failed: ${error.message}`);
  }
}

// ==========================================
// NOMINATIM AUTOCOMPLETE - Address Suggestions
// ==========================================

/**
 * Get address suggestions from partial input using Nominatim
 * Optionally biased and restricted around a given latitude/longitude (user's current location)
 * @param {string} input - Partial address input
 * @param {number} [lat] - Optional latitude for location bias
 * @param {number} [lng] - Optional longitude for location bias
 * @returns {Promise<string[]>} Array of suggested addresses
 */
module.exports.getAutoCompleteSuggestions = async (input, lat, lng) => {
  if (!input || typeof input !== "string" || input.trim().length < 2) {
    throw new Error("Input must be at least 2 characters");
  }

  const userAgent = "QuickRide App";

  // Base Nominatim URL
  let url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
    input
  )}&limit=10&addressdetails=1`;

  const hasValidCenter =
    typeof lat === "number" &&
    typeof lng === "number" &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180;

  // If we have a valid current location, bias and bound results around it
  if (hasValidCenter) {
    // Small bounding box (~0.5° lat/lng ≈ 50–60 km)
    const delta = 0.5;
    const left = lng - delta;
    const right = lng + delta;
    const top = lat + delta;
    const bottom = lat - delta;

    // Bias + restrict to this box
    url += `&lat=${lat}&lon=${lng}&viewbox=${left},${top},${right},${bottom}&bounded=1`;
  }

  try {
    console.log(
      `[Autocomplete] Searching for: ${input} ${
        typeof lat === "number" && typeof lng === "number"
          ? `near (${lat}, ${lng})`
          : ""
      }`
    );

    const response = await axios.get(url, {
      headers: { "User-Agent": userAgent },
      timeout: 10000,
    });

    if (!response.data || response.data.length === 0) {
      console.log(`[Autocomplete] No suggestions found for: ${input}`);
      return [];
    }

    let results = response.data;

    // Additional distance filtering on server side to keep only nearby places
    if (hasValidCenter) {
      try {
        results = results.filter((r) => {
          const rLat = parseFloat(r.lat);
          const rLng = parseFloat(r.lon);
          if (!Number.isFinite(rLat) || !Number.isFinite(rLng)) return false;

          const distKm = module.exports.calculateDistance(lat, lng, rLat, rLng);
          // Keep only results within 10 km radius for better nearby suggestions
          return distKm <= 10;
        });
        
        // Sort by distance (closest first)
        results.sort((a, b) => {
          const distA = module.exports.calculateDistance(lat, lng, parseFloat(a.lat), parseFloat(a.lon));
          const distB = module.exports.calculateDistance(lat, lng, parseFloat(b.lat), parseFloat(b.lon));
          return distA - distB;
        });
      } catch (e) {
        console.error("[Autocomplete] Distance filter error:", e.message);
      }
    }

    // Extract formatted addresses with distance information
    const suggestions = results
      .slice(0, 5) // Limit to 5 results
      .map((result) => {
        const distance = hasValidCenter 
          ? module.exports.calculateDistance(lat, lng, parseFloat(result.lat), parseFloat(result.lon))
          : null;
        
        return {
          display_name: result.display_name,
          lat: parseFloat(result.lat),
          lng: parseFloat(result.lon),
          distance: distance ? `${distance.toFixed(1)} km` : null,
          place_type: result.type || 'place'
        };
      })
      .filter((value) => value && value.display_name && value.display_name.length > 0);

    console.log(`[Autocomplete] ✓ Found ${suggestions.length} suggestions within 10km`);
    return suggestions;
  } catch (error) {
    console.error("[Autocomplete] ✗ Error:", error.message);

    // Return empty array instead of throwing for non-critical feature
    return [];
  }
};

/**
 * Get nearby places within 10km radius
 * @param {number} lat - Latitude for center point
 * @param {number} lng - Longitude for center point
 * @param {string} [query] - Optional search query to filter places
 * @returns {Promise<Array>} Array of nearby places with distance info
 */
module.exports.getNearbyPlaces = async (lat, lng, query = '') => {
  if (!lat || !lng || typeof lat !== 'number' || typeof lng !== 'number') {
    throw new Error("Valid latitude and longitude are required");
  }

  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    throw new Error("Coordinates out of valid range");
  }

  const userAgent = "QuickRide App";
  
  // Search for common place types that people look for in ride booking
  const searchTerms = query ? [query] : [
    'restaurant', 'hospital', 'school', 'mall', 'market', 'station', 
    'airport', 'hotel', 'park', 'office', 'bank', 'atm'
  ];
  
  const allResults = [];
  
  for (const term of searchTerms) {
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(term)}&limit=5&addressdetails=1`;
      
      // Add location bias with smaller bounding box (~0.2° lat/lng ≈ 20-22 km)
      const delta = 0.2;
      const left = lng - delta;
      const right = lng + delta;
      const top = lat + delta;
      const bottom = lat - delta;
      
      const biasedUrl = `${url}&lat=${lat}&lon=${lng}&viewbox=${left},${top},${right},${bottom}&bounded=1`;
      
      const response = await axios.get(biasedUrl, {
        headers: { "User-Agent": userAgent },
        timeout: 8000,
      });
      
      if (response.data && response.data.length > 0) {
        allResults.push(...response.data);
      }
    } catch (error) {
      console.error(`[Nearby Places] Error searching for ${term}:`, error.message);
    }
  }
  
  // Remove duplicates based on coordinates and distance filter
  const uniqueResults = [];
  const seenCoords = new Set();
  
  for (const result of allResults) {
    const rLat = parseFloat(result.lat);
    const rLng = parseFloat(result.lon);
    
    if (!Number.isFinite(rLat) || !Number.isFinite(rLng)) continue;
    
    const distKm = module.exports.calculateDistance(lat, lng, rLat, rLng);
    
    // Only include places within 10km
    if (distKm > 10) continue;
    
    // Create coordinate key for deduplication (rounded to 5 decimal places)
    const coordKey = `${rLat.toFixed(5)},${rLng.toFixed(5)}`;
    
    if (!seenCoords.has(coordKey)) {
      seenCoords.add(coordKey);
      uniqueResults.push({
        ...result,
        distance: distKm
      });
    }
  }
  
  // Sort by distance and format results
  const nearbyPlaces = uniqueResults
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 10) // Limit to 10 results
    .map((result) => ({
      display_name: result.display_name,
      lat: parseFloat(result.lat),
      lng: parseFloat(result.lon),
      distance: `${result.distance.toFixed(1)} km`,
      place_type: result.type || 'place',
      importance: result.importance || 0
    }));
  
  console.log(`[Nearby Places] ✓ Found ${nearbyPlaces.length} places within 10km of (${lat}, ${lng})`);
  return nearbyPlaces;
};

// ==========================================
// CAPTAIN PROXIMITY SEARCH
// ==========================================

/**
 * Get captains within a radius of given coordinates
 * CRITICAL: Only returns captains who are:
 * - Online (isOnline: true)
 * - Active (status: "active")
 * - Have valid socketId
 * - Have valid location coordinates
 * - Match the requested vehicle type
 * 
 * @param {number} ltd - Latitude
 * @param {number} lng - Longitude
 * @param {number} radius - Radius in kilometers
 * @param {string} vehicleType - Type of vehicle (car, bike, auto)
 * @returns {Promise<Array>} Array of captain documents
 */
module.exports.getCaptainsInTheRadius = async (
  ltd,
  lng,
  radius,
  vehicleType
) => {
  if (!ltd || !lng || !radius || !vehicleType) {
    throw new Error("Latitude, longitude, radius, and vehicle type are required");
  }

  if (typeof ltd !== "number" || typeof lng !== "number") {
    throw new Error("Latitude and longitude must be numbers");
  }

  if (radius <= 0 || radius > 100) {
    throw new Error("Radius must be between 1 and 100 km");
  }

  try {
    console.log(
      `[Captain Search] Finding ONLINE ${vehicleType} captains within ${radius}km of (${ltd}, ${lng})`
    );

    // Convert radius from km to radians (radius / earth's radius)
    // Earth's radius = 6371 km
    const radiusInRadians = radius / 6371;

    // Query for captains that are:
    // 1. Within the geographic radius
    // 2. Have the correct vehicle type
    // 3. Are ONLINE (connected via socket)
    // 4. Are ACTIVE (available for rides)
    // 5. Have a valid socketId
    // 6. Have valid location coordinates (not [0,0])
    const captains = await captainModel.find({
      location: {
        $geoWithin: {
          $centerSphere: [[lng, ltd], radiusInRadians],
        },
      },
      "vehicle.type": vehicleType,
      isOnline: true,           // CRITICAL: Only online captains
      status: "active",          // CRITICAL: Only active captains
      socketId: { $ne: null },   // CRITICAL: Must have valid socketId
      "location.coordinates": { 
        $not: { $all: [0, 0] }   // Exclude default [0,0] coordinates
      }
    }).select("_id fullname socketId vehicle location status isOnline");

    console.log(`[Captain Search] ✓ Found ${captains.length} online captains`);
    
    // Log captain details for debugging
    captains.forEach(captain => {
      console.log(`[Captain Search]   - ${captain.fullname.firstname} ${captain.fullname.lastname || ''}: socket=${captain.socketId}, loc=[${captain.location.coordinates}]`);
    });

    return captains;
  } catch (error) {
    console.error("[Captain Search] ✗ Error:", error.message);
    
    // If geospatial query fails, fall back to non-geo query
    // This handles cases where index isn't ready yet
    if (error.message.includes("$geoWithin") || error.message.includes("2dsphere")) {
      console.log("[Captain Search] Falling back to non-geo query...");
      
      const captains = await captainModel.find({
        "vehicle.type": vehicleType,
        isOnline: true,
        status: "active",
        socketId: { $ne: null }
      }).select("_id fullname socketId vehicle location status isOnline");
      
      console.log(`[Captain Search] ✓ Fallback found ${captains.length} online captains (no geo filter)`);
      return captains;
    }
    
    throw new Error(`Captain search failed: ${error.message}`);
  }
};

// ==========================================
// UTILITY FUNCTIONS
// ==========================================

/**
 * Validate coordinates
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {boolean}
 */
function isValidCoordinates(lat, lng) {
  return (
    typeof lat === "number" &&
    typeof lng === "number" &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}

/**
 * Calculate distance between two coordinates using Haversine formula
 * Useful for local calculations without API calls
 * @param {number} lat1 - Origin latitude
 * @param {number} lng1 - Origin longitude
 * @param {number} lat2 - Destination latitude
 * @param {number} lng2 - Destination longitude
 * @returns {number} Distance in kilometers
 */
module.exports.calculateDistance = (lat1, lng1, lat2, lng2) => {
  if (!isValidCoordinates(lat1, lng1) || !isValidCoordinates(lat2, lng2)) {
    throw new Error("Invalid coordinates");
  }

  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return distance;
};

/**
 * Get reverse geocoding (coordinates to address)
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {Promise<string>} Address
 */
module.exports.getReverseGeocode = async (lat, lng) => {
  if (!isValidCoordinates(lat, lng)) {
    throw new Error("Invalid coordinates");
  }

  const userAgent = "QuickRide App";
  const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`;

  try {
    console.log(`[Reverse Geocode] Looking up address for (${lat}, ${lng})`);

    const response = await axios.get(url, {
      headers: { "User-Agent": userAgent },
      timeout: 10000,
    });

    const address = response.data.address?.road || response.data.display_name;
    console.log(`[Reverse Geocode] ✓ Found address: ${address}`);

    return address;
  } catch (error) {
    console.error("[Reverse Geocode] ✗ Error:", error.message);
    throw new Error(`Reverse geocoding failed: ${error.message}`);
  }
};
