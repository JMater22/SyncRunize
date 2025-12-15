// services/geocoding_service.js
import axios from 'axios';

const MAPBOX_ACCESS_TOKEN = process.env.MAPBOX_ACCESS_TOKEN;
const MAPBOX_GEOCODING_BASE_URL = 'https://api.mapbox.com/geocoding/v5/mapbox.places';

/**
 * Reverse geocode coordinates to get human-readable address
 * @param {number} lng - Longitude
 * @param {number} lat - Latitude
 * @returns {Promise<string|null>} - Address string or null if failed
 */
export const reverseGeocode = async (lng, lat) => {
  if (!MAPBOX_ACCESS_TOKEN) {
    console.warn('[Geocoding] MAPBOX_ACCESS_TOKEN not configured - skipping reverse geocoding');
    return null;
  }

  try {
    const url = `${MAPBOX_GEOCODING_BASE_URL}/${lng},${lat}.json`;
    const response = await axios.get(url, {
      params: {
        access_token: MAPBOX_ACCESS_TOKEN,
        types: 'address,place,locality', // Focus on street addresses and places
        limit: 1
      },
      timeout: 3000 // 3 second timeout to avoid blocking hazard creation
    });

    if (response.data?.features?.length > 0) {
      const feature = response.data.features[0];
      const placeName = feature.place_name;

      console.log(`[Geocoding] ✅ Geocoded (${lat}, ${lng}) → "${placeName}"`);
      return placeName;
    }

    console.warn(`[Geocoding] No address found for coordinates (${lat}, ${lng})`);
    return null;
  } catch (error) {
    console.error('[Geocoding] Failed to reverse geocode:', {
      lat,
      lng,
      error: error.message,
      code: error.code
    });
    return null;
  }
};

/**
 * Batch reverse geocode multiple coordinates
 * @param {Array<{lat: number, lng: number}>} coordinates - Array of coordinate objects
 * @returns {Promise<Array<string|null>>} - Array of address strings or nulls
 */
export const batchReverseGeocode = async (coordinates) => {
  if (!coordinates || coordinates.length === 0) {
    return [];
  }

  console.log(`[Geocoding] Batch geocoding ${coordinates.length} locations...`);

  // Process in parallel but with a limit to avoid rate limiting
  const BATCH_SIZE = 5; // Process 5 at a time
  const results = [];

  for (let i = 0; i < coordinates.length; i += BATCH_SIZE) {
    const batch = coordinates.slice(i, i + BATCH_SIZE);
    const batchResults = await Promise.allSettled(
      batch.map(coord => reverseGeocode(coord.lng, coord.lat))
    );

    results.push(
      ...batchResults.map(result =>
        result.status === 'fulfilled' ? result.value : null
      )
    );
  }

  const successCount = results.filter(r => r !== null).length;
  console.log(`[Geocoding] ✅ Batch complete: ${successCount}/${coordinates.length} addresses geocoded`);

  return results;
};
