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
const DEFAULT_MAX_SPEED = 7; // m/s ~ 4:00 min/km

export const startSampler = (options: SamplerOptions): SamplerHandle => {
  let watchId: string | null = null;
  let lastEmit = 0;
  const maxAccuracy = options.maxAccuracyMeters ?? DEFAULT_MAX_ACCURACY;
  const maxSpeed = options.maxSpeedMps ?? DEFAULT_MAX_SPEED;

  const onPosition = (position: Position | null, err?: any) => {
    if (err || !position) return;

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
    watchId = await Geolocation.watchPosition({
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 2000,
    }, onPosition);
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
