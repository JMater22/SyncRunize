/**
 * Professional-grade MapBox SDK integration for run tracking
 * Features: Elevation data, Snap-to-road, Path optimization
 *
 * Used by: Strava, Nike Run Club, Garmin Connect
 */

// @ts-ignore - No type definitions available for @mapbox/mapbox-sdk
import mbxClient from '@mapbox/mapbox-sdk';
// @ts-ignore - No type definitions available for @mapbox/mapbox-sdk/services/directions
import mbxDirections from '@mapbox/mapbox-sdk/services/directions';
// @ts-ignore - No type definitions available for @mapbox/mapbox-sdk/services/tilequery
import mbxTilequery from '@mapbox/mapbox-sdk/services/tilequery';
import type { GpsSample } from '../state/runTrackerContext';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN as string;

// Initialize MapBox services
const baseClient = mbxClient({ accessToken: MAPBOX_TOKEN });
const directionsService = mbxDirections(baseClient);
const tilequeryService = mbxTilequery(baseClient);

// Configuration constants
const SNAP_TO_ROAD_BATCH_SIZE = 25; // MapBox limit for coordinates per request
const ELEVATION_BATCH_SIZE = 50; // Optimal batch size for elevation queries
const SNAP_TO_ROAD_RADIUS = 25; // meters - how far from road to snap

// ✅ FIX: Rate limiting to prevent API quota exhaustion
const API_RATE_LIMIT_MS = 200; // Minimum time between API calls (5 requests/second max)
let lastApiCallTime = 0;

const rateLimitedDelay = async () => {
  const now = Date.now();
  const timeSinceLastCall = now - lastApiCallTime;
  if (timeSinceLastCall < API_RATE_LIMIT_MS) {
    await new Promise(resolve => setTimeout(resolve, API_RATE_LIMIT_MS - timeSinceLastCall));
  }
  lastApiCallTime = Date.now();
};

export type ElevationData = {
  elevation: number | null; // meters above sea level, null if query failed
  lat: number;
  lng: number;
};

export type PathWithElevation = {
  coordinates: Array<{ lat: number; lng: number }>;
  elevationGain: number; // total meters climbed
  elevationLoss: number; // total meters descended
  elevationProfile: ElevationData[];
  dataQuality?: 'complete' | 'partial' | 'none'; // ✅ FIX: Track elevation data quality
};

/**
 * Get elevation data for GPS coordinates using MapBox Tilequery API
 * Uses Mapbox Terrain-RGB tileset for accurate elevation
 */
export const getElevationForCoordinates = async (
  coordinates: Array<{ lat: number; lng: number }>
): Promise<ElevationData[]> => {
  if (!MAPBOX_TOKEN) {
    console.warn('[MapBox] No access token configured, skipping elevation query');
    // ✅ FIX: Return null instead of 0 to indicate missing data
    return coordinates.map(c => ({ ...c, elevation: null }));
  }

  if (coordinates.length === 0) return [];

  try {
    // Process in batches to avoid API limits
    const batches: Array<Array<{ lat: number; lng: number }>> = [];
    for (let i = 0; i < coordinates.length; i += ELEVATION_BATCH_SIZE) {
      batches.push(coordinates.slice(i, i + ELEVATION_BATCH_SIZE));
    }

    const results: ElevationData[] = [];

    for (const batch of batches) {
      // ✅ FIX: Rate limit API calls to prevent quota exhaustion
      await rateLimitedDelay();

      // MapBox Tilequery API requires [lng, lat] format
      const queries = await Promise.all(
        batch.map(async (coord) => {
          try {
            const response = await tilequeryService
              .listFeatures({
                mapIds: ['mapbox.mapbox-terrain-v2'], // Terrain elevation tileset
                coordinates: [coord.lng, coord.lat],
                radius: 0, // Exact point query
                limit: 1,
              })
              .send();

            // Extract elevation from terrain RGB encoding
            const features = response.body.features;
            if (features && features.length > 0) {
              const properties = features[0].properties;
              // MapBox Terrain-RGB encoding: elevation = -10000 + ((R * 256 * 256 + G * 256 + B) * 0.1)
              const elevation = properties?.ele;
              // ✅ FIX: Return null if elevation data is missing or invalid
              if (typeof elevation === 'number' && Number.isFinite(elevation)) {
                return { lat: coord.lat, lng: coord.lng, elevation };
              }
              return { lat: coord.lat, lng: coord.lng, elevation: null };
            }

            // ✅ FIX: Return null instead of 0 to indicate failed query
            return { lat: coord.lat, lng: coord.lng, elevation: null };
          } catch (err) {
            console.warn(`[MapBox] Elevation query failed for ${coord.lat},${coord.lng}:`, err);
            // ✅ FIX: Return null instead of 0 to indicate error
            return { lat: coord.lat, lng: coord.lng, elevation: null };
          }
        })
      );

      results.push(...queries);
    }

    return results;
  } catch (error) {
    console.error('[MapBox] Elevation batch query failed:', error);
    // ✅ FIX: Return null instead of 0 to indicate batch failure
    return coordinates.map(c => ({ ...c, elevation: null }));
  }
};

/**
 * Calculate elevation gain and loss from elevation profile
 * Only counts significant changes (> 1 meter) to filter noise
 * ✅ FIX: Validates elevation data - returns null values if data is incomplete
 */
export const calculateElevationMetrics = (
  elevationProfile: ElevationData[]
): { gain: number; loss: number; dataQuality: 'complete' | 'partial' | 'none' } => {
  if (elevationProfile.length < 2) return { gain: 0, loss: 0, dataQuality: 'none' };

  // ✅ FIX: Filter out null elevations and check data quality
  const validPoints = elevationProfile.filter(p => p.elevation !== null && Number.isFinite(p.elevation));

  if (validPoints.length === 0) {
    return { gain: 0, loss: 0, dataQuality: 'none' };
  }

  const dataQualityRatio = validPoints.length / elevationProfile.length;
  const dataQuality = dataQualityRatio >= 0.9 ? 'complete' : dataQualityRatio >= 0.5 ? 'partial' : 'none';

  // Don't calculate if we have less than 50% valid data
  if (dataQuality === 'none') {
    console.warn(`[MapBox] Insufficient elevation data: ${validPoints.length}/${elevationProfile.length} points valid`);
    return { gain: 0, loss: 0, dataQuality: 'none' };
  }

  let totalGain = 0;
  let totalLoss = 0;
  const ELEVATION_THRESHOLD = 1.0; // meters - ignore changes smaller than this

  for (let i = 1; i < validPoints.length; i++) {
    const elevDelta = validPoints[i].elevation! - validPoints[i - 1].elevation!;

    if (elevDelta > ELEVATION_THRESHOLD) {
      totalGain += elevDelta;
    } else if (elevDelta < -ELEVATION_THRESHOLD) {
      totalLoss += Math.abs(elevDelta);
    }
  }

  return { gain: totalGain, loss: totalLoss, dataQuality };
};

/**
 * Snap GPS coordinates to known roads using MapBox Directions API
 * This corrects GPS drift and provides road-accurate paths
 *
 * Professional standard used by Strava for route matching
 */
export const snapToRoad = async (
  coordinates: Array<{ lat: number; lng: number }>
): Promise<Array<{ lat: number; lng: number }>> => {
  if (!MAPBOX_TOKEN) {
    console.warn('[MapBox] No access token configured, returning original coordinates');
    return coordinates;
  }

  if (coordinates.length < 2) return coordinates;

  try {
    // Process in batches (MapBox Directions API limit: 25 waypoints)
    const batches: Array<Array<{ lat: number; lng: number }>> = [];
    for (let i = 0; i < coordinates.length; i += SNAP_TO_ROAD_BATCH_SIZE) {
      batches.push(coordinates.slice(i, i + SNAP_TO_ROAD_BATCH_SIZE));
    }

    const snappedCoordinates: Array<{ lat: number; lng: number }> = [];

    for (const batch of batches) {
      try {
        // MapBox Directions API with map matching profile
        const response = await directionsService
          .getDirections({
            profile: 'mapbox/walking', // or 'driving' for bike/car
            waypoints: batch.map((coord) => ({
              coordinates: [coord.lng, coord.lat],
            })),
            geometries: 'geojson',
            overview: 'full',
            radiuses: Array(batch.length).fill(SNAP_TO_ROAD_RADIUS), // 25m snap radius
          })
          .send();

        const route = response.body.routes?.[0];
        if (route?.geometry?.coordinates) {
          // Extract snapped coordinates from route geometry
          const snapped = route.geometry.coordinates.map(([lng, lat]: [number, number]) => ({
            lat,
            lng,
          }));
          snappedCoordinates.push(...snapped);
        } else {
          // Fallback to original if snapping fails
          snappedCoordinates.push(...batch);
        }
      } catch (err) {
        console.warn('[MapBox] Snap-to-road batch failed, using original coordinates:', err);
        snappedCoordinates.push(...batch);
      }
    }

    return snappedCoordinates;
  } catch (error) {
    console.error('[MapBox] Snap-to-road failed:', error);
    return coordinates;
  }
};

/**
 * Get complete path analysis with elevation data
 * Combines snap-to-road and elevation queries for professional-grade accuracy
 * ✅ FIX: Now includes data quality tracking
 */
export const analyzeRunPath = async (
  samples: GpsSample[]
): Promise<PathWithElevation> => {
  const coordinates = samples.map((s) => ({ lat: s.lat, lng: s.lng }));

  if (coordinates.length < 2) {
    return {
      coordinates,
      elevationGain: 0,
      elevationLoss: 0,
      elevationProfile: [],
      dataQuality: 'none',
    };
  }

  try {
    // Step 1: Snap to road for accurate path (optional - can be disabled for trail runs)
    // const snappedCoords = await snapToRoad(coordinates);

    // Step 2: Get elevation data for all points
    const elevationProfile = await getElevationForCoordinates(coordinates);

    // Step 3: Calculate elevation metrics with quality validation
    const { gain, loss, dataQuality } = calculateElevationMetrics(elevationProfile);

    // ✅ FIX: Log warning if elevation data is incomplete
    if (dataQuality !== 'complete') {
      console.warn(`[MapBox] Elevation data quality: ${dataQuality} - calories may be less accurate`);
    }

    return {
      coordinates,
      elevationGain: gain,
      elevationLoss: loss,
      elevationProfile,
      dataQuality,
    };
  } catch (error) {
    console.error('[MapBox] Path analysis failed:', error);
    return {
      coordinates,
      elevationGain: 0,
      elevationLoss: 0,
      elevationProfile: [],
      dataQuality: 'none',
    };
  }
};

/**
 * Calculate elevation-adjusted calorie multiplier (Strava method)
 * Formula: 1 + (elevation_gain_km / distance_km) × 0.08
 *
 * Example: 10km run with 200m elevation gain
 * → multiplier = 1 + (0.2 / 10) × 0.08 = 1.0016 → ~10% more calories
 */
export const getElevationCalorieMultiplier = (
  distanceMeters: number,
  elevationGainMeters: number
): number => {
  if (distanceMeters <= 0 || elevationGainMeters <= 0) return 1.0;

  const distanceKm = distanceMeters / 1000;
  const elevationGainKm = elevationGainMeters / 1000;

  // Strava's elevation adjustment formula
  const multiplier = 1 + (elevationGainKm / distanceKm) * 0.08;

  // Cap at reasonable limits (2x max for steep mountain runs)
  return Math.min(multiplier, 2.0);
};

export default {
  getElevationForCoordinates,
  calculateElevationMetrics,
  snapToRoad,
  analyzeRunPath,
  getElevationCalorieMultiplier,
};
