/**
 * Map Utilities for GPS Location Management
 * Includes distance calculation, radius checking, and coordinate formatting
 */

/**
 * Calculate distance between two GPS coordinates using Haversine formula
 * @param lat1 - Latitude of point 1 (decimal degrees)
 * @param lng1 - Longitude of point 1 (decimal degrees)
 * @param lat2 - Latitude of point 2 (decimal degrees)
 * @param lng2 - Longitude of point 2 (decimal degrees)
 * @returns Distance in meters
 */
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lng2 - lng1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  const distance = R * c; // Distance in meters

  return Math.round(distance * 10) / 10; // Round to 1 decimal place
}

/**
 * Check if a point is within a specified radius of another point
 * @param lat1 - Latitude of point 1 (decimal degrees)
 * @param lng1 - Longitude of point 1 (decimal degrees)
 * @param lat2 - Latitude of point 2 (decimal degrees)
 * @param lng2 - Longitude of point 2 (decimal degrees)
 * @param radiusMeters - Radius in meters
 * @returns True if point 2 is within radius of point 1
 */
export function isWithinRadius(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
  radiusMeters: number
): boolean {
  const distance = calculateDistance(lat1, lng1, lat2, lng2);
  return distance <= radiusMeters;
}

/**
 * Format coordinates for display
 * @param lat - Latitude (decimal degrees)
 * @param lng - Longitude (decimal degrees)
 * @param precision - Number of decimal places (default: 6)
 * @returns Formatted string "lat, lng"
 */
export function formatCoordinates(
  lat: number,
  lng: number,
  precision: number = 6
): string {
  return `${lat.toFixed(precision)}, ${lng.toFixed(precision)}`;
}

/**
 * Format distance for display
 * @param distanceMeters - Distance in meters
 * @returns Formatted string with appropriate unit (m or km)
 */
export function formatDistance(distanceMeters: number): string {
  if (distanceMeters < 1000) {
    return `${Math.round(distanceMeters)} เมตร`;
  } else {
    return `${(distanceMeters / 1000).toFixed(1)} กม.`;
  }
}

/**
 * Validate GPS coordinates
 * @param lat - Latitude
 * @param lng - Longitude
 * @returns True if coordinates are valid
 */
export function isValidCoordinates(lat: number, lng: number): boolean {
  return (
    !isNaN(lat) &&
    !isNaN(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}

/**
 * Get center point between two coordinates
 * @param lat1 - Latitude of point 1
 * @param lng1 - Longitude of point 1
 * @param lat2 - Latitude of point 2
 * @param lng2 - Longitude of point 2
 * @returns Center point {lat, lng}
 */
export function getCenterPoint(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): { lat: number; lng: number } {
  return {
    lat: (lat1 + lat2) / 2,
    lng: (lng1 + lng2) / 2,
  };
}

/**
 * Default location (Bangkok, Thailand)
 */
export const DEFAULT_LOCATION = {
  lat: 13.7563,
  lng: 100.5018,
  zoom: 13,
};

/**
 * Thailand bounding box for map constraints
 */
export const THAILAND_BOUNDS = {
  north: 20.5,
  south: 5.5,
  east: 105.5,
  west: 97.5,
};
