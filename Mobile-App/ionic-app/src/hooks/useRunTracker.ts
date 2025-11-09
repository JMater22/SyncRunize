import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { App } from '@capacitor/app';
import { RunTrackerContext, type RunSession } from '../state/runTrackerContext';
import { startSampler, type SamplerHandle } from '../services/geo';
import type { GpsSample } from '../state/runTrackerContext';
import { createRoute, withRetry, type CreateRouteRequest, type CreateRouteResponse } from '../services/api';

const STORAGE_KEY = 'syncrunize-run-tracker-v1';

interface UseRunTrackerOptions {
  attachController?: boolean;
}

export interface RecordMeta {
  name: string;
  visibility: 'public' | 'private';
}

export interface RecordedRouteSummary {
  routeId: number;
  routeName: string;
  snapshotUrl: string | null;
  distanceKm: number;
  durationSeconds: number;
  averagePaceMin: number;
  estimatedCalories: number;
  path: Array<{ lat: number; lng: number }>;
  rawRoute: CreateRouteResponse;
}

export const useRunTracker = (options: UseRunTrackerOptions = {}) => {
  const { session, dispatch, hydrateSession, resetSession } = useContext(RunTrackerContext);
  const isController = options.attachController ?? false;

  const samplerRef = useRef<SamplerHandle | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastPersistedSamples = useRef(0);
  const hydratedRef = useRef(false);
  const [isAppActive, setIsAppActive] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const persistSession = useCallback((data?: RunSession) => {
    if (typeof window === 'undefined') return;
    const target = data ?? session;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(target));
      lastPersistedSamples.current = target.samples.length;
    } catch (err) {
      console.warn('Failed to persist run session', err);
    }
  }, [session]);

  const clearStorage = useCallback(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.removeItem(STORAGE_KEY);
  }, []);

  const stopSampler = useCallback(() => {
    if (samplerRef.current) {
      samplerRef.current.stop().catch(() => undefined);
      samplerRef.current = null;
    }
  }, []);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const handleSamples = useCallback((samples: GpsSample[]) => {
    if (!samples.length) return;
    dispatch({ type: 'ADD_SAMPLES', samples });
  }, [dispatch]);

  useEffect(() => {
    if (!isController) return;
    if (typeof window === 'undefined') return;
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        hydrateSession(JSON.parse(raw));
      } catch (err) {
        console.warn('Failed to hydrate run session', err);
        window.localStorage.removeItem(STORAGE_KEY);
      }
    }
    hydratedRef.current = true;
  }, [isController, hydrateSession]);

  useEffect(() => {
    if (!isController) return;
    if (!hydratedRef.current) return;
    const delta = session.samples.length - lastPersistedSamples.current;
    const shouldPersist = delta >= 5 || session.status === 'FINISHED';
    if (shouldPersist) {
      persistSession();
    }
  }, [session, isController, persistSession]);

  useEffect(() => {
    if (!isController) return;
    if (session.status === 'IDLE' && session.samples.length === 0) {
      lastPersistedSamples.current = 0;
    }
  }, [isController, session.status, session.samples.length]);

  useEffect(() => {
    if (!isController) return;
    let removeListener: (() => void | Promise<void>) | null = null;
    let cancelled = false;

    const setupListener = async () => {
      try {
        const handle = await App.addListener('appStateChange', ({ isActive }) => {
          setIsAppActive(isActive);
          if (!isActive) {
            persistSession();
          }
        });

        if (cancelled) {
          if (handle && typeof handle.remove === 'function') {
            handle.remove().catch(() => undefined);
          }
          return;
        }

        if (handle && typeof handle.remove === 'function') {
          removeListener = () => {
            handle.remove().catch(() => undefined);
          };
        }
      } catch (err) {
        console.warn('Failed to attach appStateChange listener', err);
      }
    };

    setupListener();

    return () => {
      cancelled = true;
      if (removeListener) {
        removeListener();
        removeListener = null;
      }
    };
  }, [isController, persistSession]);

  useEffect(() => {
    if (!isController) return;
    clearTimer();
    if (session.status !== 'RUNNING') return;
    timerRef.current = setInterval(() => {
      dispatch({ type: 'TICK', deltaMs: 1000 });
    }, 1000);
    return clearTimer;
  }, [session.status, isController, dispatch, clearTimer]);

  useEffect(() => {
    if (!isController) return;
    const status = session.status;
    if (status === 'IDLE' || status === 'FINISHED') {
      stopSampler();
      return;
    }

    const intervalMs = status === 'RUNNING'
      ? (isAppActive ? 1000 : 2000)
      : (isAppActive ? 3500 : 4500);

    stopSampler();
    samplerRef.current = startSampler({
      intervalMs,
      onSamples: handleSamples,
      maxAccuracyMeters: status === 'RUNNING' ? 40 : 60,
    });

    return () => {
      stopSampler();
    };
  }, [session.status, isAppActive, isController, handleSamples, stopSampler]);

  useEffect(() => {
    if (!isController) return;
    return () => {
      stopSampler();
      clearTimer();
    };
  }, [isController, stopSampler, clearTimer]);

  const startRun = useCallback(() => {
    setError(null);
    dispatch({ type: 'START' });
  }, [dispatch]);

  const pauseRun = useCallback(() => {
    if (session.status !== 'RUNNING') return;
    dispatch({ type: 'PAUSE', at: Date.now() });
  }, [dispatch, session.status]);

  const resumeRun = useCallback(() => {
    if (session.status !== 'PAUSED') return;
    dispatch({ type: 'RESUME', at: Date.now() });
  }, [dispatch, session.status]);

  const finishRun = useCallback(() => {
    if (session.status === 'RUNNING' || session.status === 'PAUSED') {
      dispatch({ type: 'FINISH', at: Date.now() });
    }
  }, [dispatch, session.status]);

  const discardRun = useCallback(() => {
    stopSampler();
    clearTimer();
    resetSession();
    clearStorage();
    lastPersistedSamples.current = 0;
  }, [resetSession, stopSampler, clearTimer, clearStorage]);

  const recordRun = useCallback(async (
    meta: RecordMeta,
  ): Promise<RecordedRouteSummary> => {
    if (session.status !== 'FINISHED') {
      throw new Error('Finish the run before recording.');
    }
    if (!session.samples.length) {
      throw new Error('No location samples captured.');
    }
    setError(null);
    setIsRecording(true);
    dispatch({ type: 'SET_META', name: meta.name, visibility: meta.visibility });

    try {
      const payload = buildRoutePayload(session, meta);
      const route = await withRetry(() => createRoute(payload));
      const parsedPath = normalizeRoutePath(route?.chosen_path, payload.chosen_path);
      clearStorage();
      resetSession();
      return {
        routeId: route.route_id,
        routeName: route.route_name ?? meta.name,
        snapshotUrl: route.snapshot_url ?? null,
        distanceKm: route.distance_km ?? payload.distance_km,
        durationSeconds: route.duration_seconds ?? payload.duration_seconds,
        averagePaceMin: route.average_pace ?? payload.average_pace,
        estimatedCalories: route.estimated_calories ?? payload.estimated_calories,
        path: parsedPath,
        rawRoute: route,
      };
    } catch (err: any) {
      console.error('Failed to record run', err);
      const message = err?.response?.data?.error || err?.message || 'Failed to record run';
      setError(message);
      throw err;
    } finally {
      setIsRecording(false);
    }
  }, [session, dispatch, clearStorage, resetSession]);

  return useMemo(() => ({
    session,
    startRun,
    pauseRun,
    resumeRun,
    finishRun,
    discardRun,
    recordRun,
    isRecording,
    error,
  }), [session, startRun, pauseRun, resumeRun, finishRun, discardRun, recordRun, isRecording, error]);
};

export const RunTrackerController = () => {
  useRunTracker({ attachController: true });
  return null;
};

const buildRoutePayload = (session: RunSession, meta: RecordMeta): CreateRouteRequest => {
  const chosen_path = session.samples.map((sample) => ({ lat: sample.lat, lng: sample.lng, t: sample.t }));
  const first = chosen_path[0];
  const last = chosen_path[chosen_path.length - 1] ?? first;

  if (!first || !last) {
    throw new Error('Not enough GPS samples to build route.');
  }

  const distanceKm = session.movingDistanceMeters / 1000;
  const durationSeconds = Math.max(1, Math.round(session.elapsedMs / 1000));

  return {
    route_name: meta.name,
    visibility: meta.visibility,
    duration_seconds: durationSeconds,
    average_pace: Number(session.avgPaceMinPerKm || 0),
    distance_km: Number(distanceKm.toFixed(3)),
    estimated_calories: Number(session.caloriesKcal.toFixed(1)),
    chosen_path,
    start_lat: first.lat,
    start_lng: first.lng,
    end_lat: last.lat,
    end_lng: last.lng,
  };
};

const normalizeRoutePath = (
  routePath: CreateRouteResponse['chosen_path'],
  fallback: Array<{ lat: number; lng: number; t?: number }>,
) => {
  if (Array.isArray(routePath)) {
    return routePath.map((point) => ({ lat: Number(point.lat), lng: Number(point.lng) }));
  }
  if (typeof routePath === 'string') {
    try {
      const parsed = JSON.parse(routePath);
      if (Array.isArray(parsed)) {
        return parsed.map((point: any) => ({ lat: Number(point.lat), lng: Number(point.lng) }));
      }
    } catch (err) {
      console.warn('Failed to parse route path', err);
    }
  }
  return fallback.map((point) => ({ lat: point.lat, lng: point.lng }));
};
