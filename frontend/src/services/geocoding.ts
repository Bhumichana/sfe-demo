/**
 * Geocoding Service using Nominatim API (OpenStreetMap)
 * Free, no API key required
 * Rate limit: 1 request per second
 */

export interface GeocodeResult {
  lat: number;
  lng: number;
  display_name: string;
  address: {
    country?: string;
    province?: string;
    state?: string;
    city?: string;
    district?: string;
    subdistrict?: string;
    road?: string;
    postcode?: string;
  };
  type?: string;
  importance?: number;
}

const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org';

// Debounce helper
let debounceTimer: NodeJS.Timeout | null = null;

/**
 * Search for addresses using Nominatim Geocoding API
 */
export async function geocodeAddress(
  query: string,
  countryCode: string = 'th'
): Promise<GeocodeResult[]> {
  if (!query || query.trim().length < 3) {
    return [];
  }

  try {
    const params = new URLSearchParams({
      q: query.trim(),
      format: 'json',
      addressdetails: '1',
      countrycodes: countryCode,
      limit: '5',
      'accept-language': 'th,en',
    });

    const url = NOMINATIM_BASE_URL + '/search?' + params.toString();
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'SFE-Mobile-App/1.0',
      },
    });

    if (!response.ok) {
      throw new Error('Geocoding failed: ' + response.statusText);
    }

    const data = await response.json();

    return data.map((item: any) => ({
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
      display_name: item.display_name,
      address: {
        country: item.address?.country,
        province: item.address?.province || item.address?.state,
        state: item.address?.state,
        city: item.address?.city || item.address?.town || item.address?.village,
        district: item.address?.county || item.address?.district,
        subdistrict: item.address?.suburb || item.address?.subdistrict,
        road: item.address?.road,
        postcode: item.address?.postcode,
      },
      type: item.type,
      importance: item.importance,
    }));
  } catch (error) {
    console.error('Geocoding error:', error);
    throw error;
  }
}

/**
 * Reverse geocoding: Convert coordinates to address
 */
export async function reverseGeocode(lat: number, lng: number): Promise<GeocodeResult | null> {
  try {
    const params = new URLSearchParams({
      lat: lat.toString(),
      lon: lng.toString(),
      format: 'json',
      addressdetails: '1',
      'accept-language': 'th,en',
    });

    const url = NOMINATIM_BASE_URL + '/reverse?' + params.toString();
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'SFE-Mobile-App/1.0',
      },
    });

    if (!response.ok) {
      throw new Error('Reverse geocoding failed: ' + response.statusText);
    }

    const data = await response.json();

    if (!data || data.error) {
      return null;
    }

    return {
      lat: parseFloat(data.lat),
      lng: parseFloat(data.lon),
      display_name: data.display_name,
      address: {
        country: data.address?.country,
        province: data.address?.province || data.address?.state,
        state: data.address?.state,
        city: data.address?.city || data.address?.town || data.address?.village,
        district: data.address?.county || data.address?.district,
        subdistrict: data.address?.suburb || data.address?.subdistrict,
        road: data.address?.road,
        postcode: data.address?.postcode,
      },
      type: data.type,
      importance: data.importance,
    };
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    return null;
  }
}

/**
 * Debounced version of geocodeAddress
 * Use this in search inputs to avoid hitting the API too frequently
 */
export function debouncedGeocodeAddress(
  query: string,
  countryCode: string = 'th',
  delay: number = 1000
): Promise<GeocodeResult[]> {
  return new Promise((resolve) => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    debounceTimer = setTimeout(async () => {
      try {
        const results = await geocodeAddress(query, countryCode);
        resolve(results);
      } catch (error) {
        resolve([]);
      }
    }, delay);
  });
}
