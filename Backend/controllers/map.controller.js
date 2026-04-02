const mapService = require("../services/map.service");
const { validationResult } = require("express-validator");

/**
 * Get coordinates from address
 */
module.exports.getCoordinates = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    const { address } = req.query;

    const coordinates = await mapService.getAddressCoordinate(address);
    
    res.status(200).json({
      success: true,
      data: coordinates,
    });
  } catch (error) {
    console.error("[Map Controller] Error in getCoordinates:", error.message);
    res.status(400).json({
      success: false,
      message: error.message || "Failed to get coordinates",
    });
  }
};

/**
 * Get distance and time between two locations
 */
module.exports.getDistanceTime = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    const { origin, destination } = req.query;

    if (!origin || !destination) {
      return res.status(400).json({
        success: false,
        message: "Origin and destination are required",
      });
    }

    const distanceTime = await mapService.getDistanceTime(origin, destination);

    res.status(200).json({
      success: true,
      data: distanceTime,
    });
  } catch (err) {
    console.error("[Map Controller] Error in getDistanceTime:", err.message);
    res.status(400).json({
      success: false,
      message: err.message || "Failed to calculate distance and time",
    });
  }
};

/**
 * Get location autocomplete suggestions
 */
module.exports.getAutoCompleteSuggestions = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    const { input, lat, lng } = req.query;

    if (!input || input.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: "Input must be at least 2 characters",
        data: [],
      });
    }

    const parsedLat = lat !== undefined ? parseFloat(lat) : undefined;
    const parsedLng = lng !== undefined ? parseFloat(lng) : undefined;

    const suggestions = await mapService.getAutoCompleteSuggestions(
      input,
      parsedLat,
      parsedLng
    );

    res.status(200).json({
      success: true,
      data: suggestions,
    });
  } catch (err) {
    console.error("[Map Controller] Error in getAutoCompleteSuggestions:", err.message);
    // Return empty array on error for autocomplete
    res.status(200).json({
      success: true,
      data: [],
      message: "No suggestions available",
    });
  }
};

/**
 * Get nearby places within 10km radius
 */
module.exports.getNearbyPlaces = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    const { lat, lng, query } = req.query;

    const parsedLat = parseFloat(lat);
    const parsedLng = parseFloat(lng);

    const nearbyPlaces = await mapService.getNearbyPlaces(
      parsedLat,
      parsedLng,
      query || ''
    );

    res.status(200).json({
      success: true,
      data: nearbyPlaces,
    });
  } catch (err) {
    console.error("[Map Controller] Error in getNearbyPlaces:", err.message);
    res.status(400).json({
      success: false,
      message: err.message || "Failed to get nearby places",
      data: [],
    });
  }
};
