import { Geolocation, Position } from '@capacitor/geolocation';
import type { GpsSample } from '../state/runTrackerContext';

export interface SamplerOptions {
  intervalMs: number;
  maxAccuracyMeters?: number;
  maxSpeedMps?: number;
  onSamples: (samples: GpsSample[]) => void;
}

export interface SamplerHandle {
  stop: () => Promise<void>;
}

const DEFAULT_MAX_ACCURACY = 50;
// ✅ FIX: Increased from 7 m/s to support elite runners + GPS noise margin
// 12 m/s = 2:46 min/km (elite marathon pace ~2:52 min/km + 15% margin for GPS spikes)
const DEFAULT_MAX_SPEED = 12; // m/s ~ 2:46 min/km

export const startSampler = (options: SamplerOptions): SamplerHandle => {
  let watchId: string | null = null;
  let lastEmit = 0;
  const maxAccuracy = options.maxAccuracyMeters ?? DEFAULT_MAX_ACCURACY;
  const maxSpeed = options.maxSpeedMps ?? DEFAULT_MAX_SPEED;

  const onPosition = (position: Position | null, err?: any) => {
    if (err) {
      console.error('[GPS] Position error:', err);
      return;
    }
    if (!position) return;

    const sample = positionToSample(position);
    if (!sample) return;

    if (sample.accuracy && sample.accuracy > maxAccuracy) {
      return;
    }

    if (typeof sample.speedMs === 'number' && sample.speedMs > maxSpeed && (sample.accuracy ?? 999) > maxAccuracy / 2) {
      return; // spike with poor accuracy
    }

    const now = Date.now();
    if (now - lastEmit < options.intervalMs) {
      return;
    }
    lastEmit = now;
    options.onSamples([sample]);
  };

  const startWatch = async () => {
    try {
      // Check and request GPS permissions before starting watch
      const permission = await Geolocation.checkPermissions();

      if (permission.location === 'denied') {
        throw new Error('GPS_PERMISSION_DENIED');
      }

      if (permission.location === 'prompt' || permission.location === 'prompt-with-rationale') {
        const requested = await Geolocation.requestPermissions();
        if (requested.location === 'denied') {
          throw new Error('GPS_PERMISSION_DENIED');
        }
      }

      watchId = await Geolocation.watchPosition({
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 2000,
      }, onPosition);
    } catch (error) {
      console.error('[GPS] Failed to start watch:', error);
      // Re-throw with clear error message for UI handling
      if (error instanceof Error && error.message === 'GPS_PERMISSION_DENIED') {
        throw error;
      }
      throw new Error('GPS_UNAVAILABLE');
    }
  };

  startWatch();

  return {
    stop: async () => {
      if (watchId) {
        await Geolocation.clearWatch({ id: watchId });
        watchId = null;
      }
    },
  };
};

export const positionToSample = (position: Position): GpsSample | null => {
  const { coords, timestamp } = position;
  if (!coords) return null;
  if (typeof coords.latitude !== 'number' || typeof coords.longitude !== 'number') {
    return null;
  }

  return {
    lat: coords.latitude,
    lng: coords.longitude,
    t: timestamp ?? Date.now(),
    accuracy: coords.accuracy ?? undefined,
    speedMs: typeof coords.speed === 'number' ? coords.speed : null,
  };
};
