/**
 * Utility functions for GPS and geolocation calculations
 */

/**
 * Calculate distance between two GPS coordinates using Haversine formula
 * Returns distance in kilometers
 *
 * @param lat1 - Latitude of point 1
 * @param lng1 - Longitude of point 1
 * @param lat2 - Latitude of point 2
 * @param lng2 - Longitude of point 2
 * @returns Distance in kilometers
 */
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Earth's radius in kilometers

  // Convert degrees to radians
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance in kilometers

  return distance;
}

/**
 * Convert degrees to radians
 */
function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Format distance for display
 * Shows in meters if less than 1 km, otherwise in kilometers
 *
 * @param distanceKm - Distance in kilometers
 * @returns Formatted string (e.g., "250 เมตร" or "2.5 กม.")
 */
export function formatDistance(distanceKm: number): string {
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)} เมตร`;
  }
  return `${distanceKm.toFixed(2)} กม.`;
}

/**
 * Check if a location is within allowed radius of target location
 * Used for check-in validation
 *
 * @param currentLat - Current latitude
 * @param currentLng - Current longitude
 * @param targetLat - Target latitude
 * @param targetLng - Target longitude
 * @param radiusKm - Allowed radius in kilometers
 * @returns true if within radius, false otherwise
 */
export function isWithinRadius(
  currentLat: number,
  currentLng: number,
  targetLat: number,
  targetLng: number,
  radiusKm: number
): boolean {
  const distance = calculateDistance(currentLat, currentLng, targetLat, targetLng);
  return distance <= radiusKm;
}

/**
 * Get check-in radius based on customer type
 * VIP customers (type A) require closer proximity
 *
 * @param customerType - Customer type (A, B, or C)
 * @returns Allowed radius in kilometers
 */
export function getCheckInRadius(customerType: 'A' | 'B' | 'C'): number {
  switch (customerType) {
    case 'A': // VIP - stricter validation
      return 0.1; // 100 meters
    case 'B': // Important
      return 0.2; // 200 meters
    case 'C': // Standard
      return 0.5; // 500 meters
    default:
      return 0.5;
  }
}

/**
 * Open location in Google Maps
 *
 * @param lat - Latitude
 * @param lng - Longitude
 * @param label - Optional label for the location
 */
export function openInGoogleMaps(lat: number, lng: number, label?: string): void {
  const url = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}${
    label ? `&query_place_id=${encodeURIComponent(label)}` : ''
  }`;
  window.open(url, '_blank');
}

/**
 * Get directions to a location using Google Maps
 *
 * @param toLat - Destination latitude
 * @param toLng - Destination longitude
 * @param fromLat - Optional starting latitude
 * @param fromLng - Optional starting longitude
 */
export function getDirections(
  toLat: number,
  toLng: number,
  fromLat?: number,
  fromLng?: number
): void {
  let url = 'https://www.google.com/maps/dir/?api=1';

  if (fromLat && fromLng) {
    url += `&origin=${fromLat},${fromLng}`;
  }

  url += `&destination=${toLat},${toLng}`;

  window.open(url, '_blank');
}
