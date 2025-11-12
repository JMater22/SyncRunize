import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { App } from '@capacitor/app';
import { RunTrackerContext, type RunSession } from '../state/runTrackerContext';
import { startSampler, type SamplerHandle } from '../services/geo';
import type { GpsSample } from '../state/runTrackerContext';
import { createRoute, withRetry, type CreateRouteRequest, type CreateRouteResponse } from '../services/api';
import { normalizeRoutePath } from '../lib/routeGuides';
import { HazardsApi, type HazardReport } from '../services/hazards';
import AlertsApi from '../services/alerts';
import { speakText } from '../services/tts';
import { TrafficApi, type TrafficIncident } from '../services/traffic';
import { useUser } from '../contexts/UserContext';
import { DEFAULT_WEIGHT_KG } from '../services/met';
import { kalmanLikeFilter, createSmoothingState, type SmoothingState } from '../lib/advancedGpsSmoothing';
import { analyzeRunPath, getElevationCalorieMultiplier, type PathWithElevation } from '../services/mapbox';

const STORAGE_KEY = 'syncrunize-run-tracker-v1';
const HAZARD_POLL_INTERVAL_MS = 45_000;
const TRAFFIC_POLL_INTERVAL_MS = 60_000;
const ALERT_COOLDOWN_MS = 15 * 60_000;
const HAZARD_ALERT_RADIUS_KM = 0.35;
const TRAFFIC_ALERT_RADIUS_KM = 1.2;
const TRAFFIC_LOOKBACK_HOURS = 3;
const MAX_ALERTS_PER_POLL = 2;

type AlertCache = Map<string, number>;

const buildAlertCacheKey = (
  id?: number | null,
  lat?: number,
  lng?: number,
): string => {
  if (typeof id === 'number') {
    return `id:${id}`;
  }
  if (typeof lat === 'number' && typeof lng === 'number') {
    return `${lat.toFixed(4)}:${lng.toFixed(4)}`;
  }
  return `anon:${Date.now()}`;
};

const pruneExpiredEntries = (cache: AlertCache, now: number) => {
  cache.forEach((timestamp, key) => {
    if (now - timestamp > ALERT_COOLDOWN_MS) {
      cache.delete(key);
    }
  });
};

const extractAlertSummary = (payload: any): string | null =>
  payload?.summary ??
  payload?.notification?.message ??
  payload?.message ??
  null;

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
  const { currentUser } = useUser();
  const isController = options.attachController ?? false;

  const samplerRef = useRef<SamplerHandle | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastPersistedSamples = useRef(0);
  const hydratedRef = useRef(false);
  const smoothingStateRef = useRef<SmoothingState>(createSmoothingState());
  const [isAppActive, setIsAppActive] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hazardAlertState = useRef<{ lastPoll: number; pending: boolean; cache: AlertCache }>({
    lastPoll: 0,
    pending: false,
    cache: new Map(),
  });
  const trafficAlertState = useRef<{ lastPoll: number; pending: boolean; cache: AlertCache }>({
    lastPoll: 0,
    pending: false,
    cache: new Map(),
  });

  useEffect(() => {
    const parsedWeight = Number(currentUser?.weight_kg);
    dispatch({
      type: 'SET_WEIGHT',
      weightKg: Number.isFinite(parsedWeight) && parsedWeight > 0 ? parsedWeight : DEFAULT_WEIGHT_KG,
    });
  }, [currentUser?.weight_kg, dispatch]);

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
    // Professional Kalman-like filtering with outlier rejection
    const smoothed = samples.map((sample) => {
      const result = kalmanLikeFilter(smoothingStateRef.current, sample);
      smoothingStateRef.current = result.state;
      return result.smoothed;
    });
    dispatch({ type: 'ADD_SAMPLES', samples: smoothed });
  }, [dispatch]);

  const handleHazardAlerts = useCallback(async (hazards: HazardReport[]) => {
    if (!hazards?.length) return;
    const now = Date.now();
    const state = hazardAlertState.current;
    pruneExpiredEntries(state.cache, now);

    const candidates = hazards
      .filter((hazard) => {
        if (typeof hazard.distance_km === 'number') {
          return hazard.distance_km <= HAZARD_ALERT_RADIUS_KM;
        }
        return true;
      })
      .map((hazard) => ({
        hazard,
        key: buildAlertCacheKey(hazard.report_id, hazard.lat, hazard.lng),
      }))
      .filter(({ key }) => {
        const last = state.cache.get(key);
        return !last || now - last > ALERT_COOLDOWN_MS;
      })
      .slice(0, MAX_ALERTS_PER_POLL);

    for (const { hazard, key } of candidates) {
      state.cache.set(key, now);
      try {
        const resp = await AlertsApi.sendHazardAlert(
          hazard,
          typeof hazard.distance_km === 'number' ? hazard.distance_km * 1000 : undefined,
        );
        const summary = extractAlertSummary(resp);
        if (summary) {
          await speakText(summary);
        }
      } catch (err) {
        console.warn('[RunTracker] Failed to dispatch hazard alert', err);
      }
    }
  }, []);

  const handleTrafficAlerts = useCallback(async (incidents: TrafficIncident[]) => {
    if (!incidents?.length) return;
    const now = Date.now();
    const state = trafficAlertState.current;
    pruneExpiredEntries(state.cache, now);

    const candidates = incidents
      .filter((incident) => {
        if (typeof incident.distance_km === 'number') {
          return incident.distance_km <= TRAFFIC_ALERT_RADIUS_KM;
        }
        return true;
      })
      .map((incident) => ({
        incident,
        key: buildAlertCacheKey(incident.incident_id, incident.lat, incident.lng),
      }))
      .filter(({ key }) => {
        const last = state.cache.get(key);
        return !last || now - last > ALERT_COOLDOWN_MS;
      })
      .slice(0, MAX_ALERTS_PER_POLL);

    for (const { incident, key } of candidates) {
      state.cache.set(key, now);
      try {
        const resp = await AlertsApi.sendTrafficAlert({
          traffic: {
            lat: incident.lat,
            lng: incident.lng,
            condition: incident.incident_type,
            description: incident.description ?? null,
            severity: incident.severity_weight ?? null,
            report_id: incident.incident_id ?? null,
          },
          distance_m: typeof incident.distance_km === 'number' ? incident.distance_km * 1000 : undefined,
        });
        const summary = extractAlertSummary(resp);
        if (summary) {
          await speakText(summary);
        }
      } catch (err) {
        console.warn('[RunTracker] Failed to dispatch traffic alert', err);
      }
    }
  }, []);

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
      ? (isAppActive ? 5000 : 8000) // Optimized: 5s active, 8s background
      : (isAppActive ? 10000 : 15000); // Idle: 10s active, 15s background

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

  useEffect(() => {
    if (!isController) return;
    if (session.status !== 'RUNNING') return;
    const lastSample = session.samples[session.samples.length - 1];
    if (!lastSample) return;

    const state = hazardAlertState.current;
    const now = Date.now();
    if (state.pending || now - state.lastPoll < HAZARD_POLL_INTERVAL_MS) {
      return;
    }

    state.pending = true;
    state.lastPoll = now;

    HazardsApi.getHazardsNear(
      lastSample.lat,
      lastSample.lng,
      HAZARD_ALERT_RADIUS_KM + 0.2,
    )
      .then((hazards) => handleHazardAlerts(hazards))
      .catch((err) => {
        console.warn('[RunTracker] Hazard polling failed', err);
      })
      .finally(() => {
        state.pending = false;
      });
  }, [session.samples, session.status, isController, handleHazardAlerts]);

  useEffect(() => {
    if (!isController) return;
    if (session.status !== 'RUNNING') return;
    const lastSample = session.samples[session.samples.length - 1];
    if (!lastSample) return;

    const state = trafficAlertState.current;
    const now = Date.now();
    if (state.pending || now - state.lastPoll < TRAFFIC_POLL_INTERVAL_MS) {
      return;
    }

    state.pending = true;
    state.lastPoll = now;

    TrafficApi.getIncidentsNear(
      lastSample.lat,
      lastSample.lng,
      TRAFFIC_ALERT_RADIUS_KM + 0.3,
      TRAFFIC_LOOKBACK_HOURS,
    )
      .then((incidents) => handleTrafficAlerts(incidents))
      .catch((err) => {
        console.warn('[RunTracker] Traffic polling failed', err);
      })
      .finally(() => {
        state.pending = false;
      });
  }, [session.samples, session.status, isController, handleTrafficAlerts]);

  const startRun = useCallback(() => {
    setError(null);
    smoothingStateRef.current = createSmoothingState(); // Reset Kalman filter state
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
    smoothingStateRef.current = createSmoothingState();
    // ✅ FIX: Clear alert caches to prevent memory leak
    hazardAlertState.current.cache.clear();
    trafficAlertState.current.cache.clear();
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

    // ✅ FIX: Prevent duplicate routes - set recording flag BEFORE async work
    if (isRecording) {
      throw new Error('Recording already in progress');
    }

    setError(null);
    setIsRecording(true);
    dispatch({ type: 'SET_META', name: meta.name, visibility: meta.visibility });

    try {
      // Professional-grade: Analyze path for elevation data (Strava standard)
      console.log('[RunTracker] Analyzing route elevation...');

      // ✅ FIX: Add 10-second timeout to elevation analysis to prevent indefinite hangs
      // If MapBox API is slow or unresponsive, gracefully fall back to no elevation data
      const ELEVATION_TIMEOUT_MS = 10000; // 10 seconds
      const pathAnalysis = await Promise.race([
        analyzeRunPath(session.samples),
        new Promise<PathWithElevation>((resolve) =>
          setTimeout(() => {
            console.warn('[RunTracker] Elevation analysis timed out after 10s - proceeding without elevation data');
            resolve({
              coordinates: session.samples.map(s => ({ lat: s.lat, lng: s.lng })),
              elevationGain: 0,
              elevationLoss: 0,
              elevationProfile: [],
              dataQuality: 'none'
            });
          }, ELEVATION_TIMEOUT_MS)
        )
      ]);

      // ✅ FIX: Validate elevation data quality before applying calorie multiplier
      const hasValidElevation = pathAnalysis.dataQuality === 'complete' || pathAnalysis.dataQuality === 'partial';

      if (!hasValidElevation) {
        console.warn('[RunTracker] Elevation data quality insufficient - skipping elevation adjustment');
      }

      // Calculate elevation-adjusted calories only if data is valid
      const elevationMultiplier = hasValidElevation
        ? getElevationCalorieMultiplier(session.movingDistanceMeters, pathAnalysis.elevationGain)
        : 1.0; // No adjustment if elevation data is invalid

      const payload = buildRoutePayload(session, meta, hasValidElevation ? {
        elevationGain: pathAnalysis.elevationGain,
        elevationLoss: pathAnalysis.elevationLoss,
        elevationMultiplier,
      } : undefined);

      const route = await withRetry(() => createRoute(payload));
      const parsedPath = normalizeRoutePath(route?.chosen_path, payload.chosen_path);

      // ✅ FIX: Only clear storage AFTER successful save - prevents data loss on network failure
      clearStorage();
      resetSession();
      setIsRecording(false);
      // ✅ FIX: Clear alert caches after successful recording to prevent memory leak
      hazardAlertState.current.cache.clear();
      trafficAlertState.current.cache.clear();

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
      setIsRecording(false);
      // ✅ FIX: Reset Kalman filter to prevent corrupted state in next run
      smoothingStateRef.current = createSmoothingState();
      // ✅ FIX: Don't clear storage on failure - user can retry later
      // Session remains in localStorage for recovery
      throw err;
    }
  }, [session, dispatch, clearStorage, resetSession, isRecording]);

  useEffect(() => {
    if (session.status === 'IDLE') {
      smoothingStateRef.current = createSmoothingState();
    }
  }, [session.status]);

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

const buildRoutePayload = (
  session: RunSession,
  meta: RecordMeta,
  elevation?: { elevationGain: number; elevationLoss: number; elevationMultiplier: number }
): CreateRouteRequest => {
  const chosen_path = session.samples.map((sample) => ({ lat: sample.lat, lng: sample.lng, t: sample.t }));
  const first = chosen_path[0];
  const last = chosen_path[chosen_path.length - 1] ?? first;

  if (!first || !last) {
    throw new Error('Not enough GPS samples to build route.');
  }

  const distanceKm = session.movingDistanceMeters / 1000;
  const durationSeconds = Math.max(1, Math.round(session.elapsedMs / 1000));

  // Apply elevation adjustment to calories if available (Strava method)
  const baseCalories = Number(session.caloriesKcal.toFixed(1));
  const adjustedCalories = elevation
    ? Number((baseCalories * elevation.elevationMultiplier).toFixed(1))
    : baseCalories;

  return {
    route_name: meta.name,
    visibility: meta.visibility,
    duration_seconds: durationSeconds,
    average_pace: Number(session.avgPaceMinPerKm || 0),
    distance_km: Number(distanceKm.toFixed(3)),
    estimated_calories: adjustedCalories,
    chosen_path,
    start_lat: first.lat,
    start_lng: first.lng,
    end_lat: last.lat,
    end_lng: last.lng,
    weight_kg: session.userWeightKg ?? DEFAULT_WEIGHT_KG,
    // Professional-grade elevation data (Strava/Nike standard)
    elevation_gain: elevation ? Number(elevation.elevationGain.toFixed(1)) : undefined,
    elevation_loss: elevation ? Number(elevation.elevationLoss.toFixed(1)) : undefined,
    elevation_multiplier: elevation ? Number(elevation.elevationMultiplier.toFixed(3)) : undefined,
  };
};
