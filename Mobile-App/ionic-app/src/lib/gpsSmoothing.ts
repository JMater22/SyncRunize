import type { GpsSample } from '../state/runTrackerContext';
import { haversineDistanceMeters } from '../services/haversine';

const MAX_STEP_METERS = 35;
const MIN_STEP_METERS = 0.75;
const FAST_ALPHA = 0.7;
const BASE_ALPHA = 0.45;
const SLOW_ALPHA = 0.22;

/**
 * Applies a light-weight low-pass filter similar to Mapbox's LocationEngine
 * smoothing so we can rely less on manual jitter filtering inside reducers.
 */
export const mapboxSmoothSample = (previous: GpsSample | null, sample: GpsSample): GpsSample => {
  if (!previous) {
    return sample;
  }

  const deltaMeters = haversineDistanceMeters(previous, sample);
  if (!Number.isFinite(deltaMeters)) {
    return sample;
  }

  const clampRatio = deltaMeters > MAX_STEP_METERS && deltaMeters > 0
    ? MAX_STEP_METERS / deltaMeters
    : 1;

  const projectedLat = previous.lat + (sample.lat - previous.lat) * clampRatio;
  const projectedLng = previous.lng + (sample.lng - previous.lng) * clampRatio;

  let alpha = BASE_ALPHA;
  if (deltaMeters < MIN_STEP_METERS) {
    alpha = SLOW_ALPHA;
  } else if (deltaMeters > 10) {
    alpha = FAST_ALPHA;
  }

  return {
    ...sample,
    lat: previous.lat + (projectedLat - previous.lat) * alpha,
    lng: previous.lng + (projectedLng - previous.lng) * alpha,
    speedMs: typeof sample.speedMs === 'number' ? sample.speedMs : previous.speedMs ?? null,
  };
};
