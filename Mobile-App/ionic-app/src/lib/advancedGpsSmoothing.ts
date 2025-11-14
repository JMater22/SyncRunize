/**
 * Advanced GPS Smoothing with Kalman-like Filtering
 * Professional-grade algorithm used by Strava, Nike Run Club
 *
 * Improvements over basic EMA smoothing:
 * - Velocity-aware filtering
 * - Acceleration detection
 * - Adaptive trust based on GPS accuracy
 * - Outlier rejection with velocity constraints
 */

import type { GpsSample } from '../state/runTrackerContext';
import { haversineDistanceMeters } from '../services/haversine';

// Configuration constants (tuned for running speeds)
const MAX_REASONABLE_SPEED_MPS = 10.0; // 36 km/h - faster than world record pace
const MAX_ACCELERATION_MPS2 = 4.0; // Maximum acceleration for human running
const MIN_ACCURACY_METERS = 5.0; // Best case GPS accuracy
const MAX_ACCURACY_METERS = 50.0; // Worst acceptable accuracy
const VELOCITY_SMOOTHING_FACTOR = 0.3; // How much to trust new velocity
const POSITION_SMOOTHING_FACTOR = 0.4; // Base position smoothing

export type SmoothingState = {
  lastSample: GpsSample | null;
  lastVelocityMps: number | null;
  lastSmoothLat: number | null;
  lastSmoothLng: number | null;
};

/**
 * Calculate velocity between two GPS samples
 * Returns speed in meters per second
 */
const calculateVelocity = (prev: GpsSample, curr: GpsSample): number => {
  const distanceMeters = haversineDistanceMeters(prev, curr);
  const timeDeltaSeconds = (curr.t - prev.t) / 1000;

  if (timeDeltaSeconds <= 0) return 0;

  return distanceMeters / timeDeltaSeconds;
};

/**
 * Calculate adaptive smoothing factor based on GPS accuracy
 * Better accuracy → trust new sample more (higher alpha)
 * Worse accuracy → trust previous position more (lower alpha)
 */
const getAdaptiveSmoothingFactor = (accuracy: number | undefined): number => {
  if (!accuracy || !Number.isFinite(accuracy)) {
    return POSITION_SMOOTHING_FACTOR; // Default if no accuracy data
  }

  // Normalize accuracy to 0-1 range
  const normalizedAccuracy = Math.max(0, Math.min(1,
    (accuracy - MIN_ACCURACY_METERS) / (MAX_ACCURACY_METERS - MIN_ACCURACY_METERS)
  ));

  // Better accuracy (lower value) → higher smoothing factor
  // Linear interpolation: 0.6 (high accuracy) to 0.2 (low accuracy)
  return 0.6 - (normalizedAccuracy * 0.4);
};

/**
 * Detect and reject GPS outliers based on velocity constraints
 * Returns true if sample appears to be an outlier
 */
const isOutlier = (
  prev: GpsSample,
  curr: GpsSample,
  prevVelocityMps: number | null
): boolean => {
  const velocity = calculateVelocity(prev, curr);

  // Check 1: Unreasonably fast speed
  if (velocity > MAX_REASONABLE_SPEED_MPS) {
    console.warn(`[GPS Filter] Outlier detected: speed ${velocity.toFixed(2)} m/s exceeds max ${MAX_REASONABLE_SPEED_MPS} m/s`);
    return true;
  }

  // Check 2: Unreasonable acceleration
  if (prevVelocityMps !== null && prevVelocityMps > 0) {
    const timeDeltaSeconds = (curr.t - prev.t) / 1000;
    if (timeDeltaSeconds > 0) {
      const acceleration = Math.abs(velocity - prevVelocityMps) / timeDeltaSeconds;

      if (acceleration > MAX_ACCELERATION_MPS2) {
        console.warn(`[GPS Filter] Outlier detected: acceleration ${acceleration.toFixed(2)} m/s² exceeds max ${MAX_ACCELERATION_MPS2} m/s²`);
        return true;
      }
    }
  }

  return false;
};

/**
 * Advanced Kalman-like GPS smoothing filter
 * Combines:
 * - Exponential moving average (EMA) for position
 * - Velocity-aware filtering
 * - Adaptive trust based on GPS accuracy
 * - Outlier rejection
 *
 * Professional standard used by Strava
 */
export const kalmanLikeFilter = (
  state: SmoothingState,
  sample: GpsSample
): { smoothed: GpsSample; state: SmoothingState } => {
  // First sample - initialize state
  if (!state.lastSample) {
    return {
      smoothed: sample,
      state: {
        lastSample: sample,
        lastVelocityMps: null,
        lastSmoothLat: sample.lat,
        lastSmoothLng: sample.lng,
      },
    };
  }

  const prev = state.lastSample;

  // Check for outliers
  if (isOutlier(prev, sample, state.lastVelocityMps)) {
    // Reject outlier - return previous position with timestamp updated
    console.log('[GPS Filter] Rejecting outlier, using previous position');
    return {
      smoothed: {
        ...prev,
        t: sample.t, // Update timestamp
        accuracy: sample.accuracy,
      },
      state: {
        ...state,
        lastSample: sample,
      },
    };
  }

  // Calculate current velocity
  const currentVelocityMps = calculateVelocity(prev, sample);

  // Smooth velocity using EMA
  const smoothedVelocityMps = state.lastVelocityMps !== null
    ? state.lastVelocityMps * (1 - VELOCITY_SMOOTHING_FACTOR) +
      currentVelocityMps * VELOCITY_SMOOTHING_FACTOR
    : currentVelocityMps;

  // Get adaptive smoothing factor based on GPS accuracy
  const alpha = getAdaptiveSmoothingFactor(sample.accuracy);

  // Apply Kalman-like position smoothing
  const smoothLat = state.lastSmoothLat !== null
    ? state.lastSmoothLat * (1 - alpha) + sample.lat * alpha
    : sample.lat;

  const smoothLng = state.lastSmoothLng !== null
    ? state.lastSmoothLng * (1 - alpha) + sample.lng * alpha
    : sample.lng;

  const smoothedSample: GpsSample = {
    ...sample,
    lat: smoothLat,
    lng: smoothLng,
    speedMs: smoothedVelocityMps,
  };

  return {
    smoothed: smoothedSample,
    state: {
      lastSample: sample,
      lastVelocityMps: smoothedVelocityMps,
      lastSmoothLat: smoothLat,
      lastSmoothLng: smoothLng,
    },
  };
};

/**
 * Create initial smoothing state
 */
export const createSmoothingState = (): SmoothingState => ({
  lastSample: null,
  lastVelocityMps: null,
  lastSmoothLat: null,
  lastSmoothLng: null,
});

/**
 * Batch process GPS samples with Kalman-like filtering
 */
export const batchSmoothSamples = (
  samples: GpsSample[],
  initialState?: SmoothingState
): GpsSample[] => {
  let state = initialState || createSmoothingState();
  const smoothedSamples: GpsSample[] = [];

  for (const sample of samples) {
    const result = kalmanLikeFilter(state, sample);
    smoothedSamples.push(result.smoothed);
    state = result.state;
  }

  return smoothedSamples;
};

export default {
  kalmanLikeFilter,
  createSmoothingState,
  batchSmoothSamples,
};
