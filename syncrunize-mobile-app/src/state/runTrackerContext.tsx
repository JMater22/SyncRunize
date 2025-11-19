import React, { createContext, useCallback, useMemo, useState, type ReactNode } from 'react';
import { haversineDistanceMeters } from '../services/haversine';
import { caloriesFromDistance, caloriesFromPace, DEFAULT_WEIGHT_KG, derivePace, MIN_DISTANCE_FOR_PACE_METERS } from '../services/met';

export type GpsSample = {
  lat: number;
  lng: number;
  t: number;
  accuracy?: number;
  speedMs?: number | null;
};

export type PauseInterval = { start: number; end?: number };

export type RunState = 'IDLE' | 'RUNNING' | 'PAUSED' | 'FINISHED';

// Professional-grade constants (Strava/Nike Run Club standards)
const INSTANT_PACE_WINDOW_MS = 30000; // 30 seconds (was 10s - too noisy)
const INSTANT_PACE_ALPHA = 0.35;
const MIN_MOVEMENT_THRESHOLD_METERS = 5.0; // ✅ FIX: Increased from 2.5m to 5m to prevent GPS drift when stationary
const MAX_GPS_ACCURACY_METERS = 20; // ✅ FIX: Reject GPS samples with accuracy > 20m
const MIN_WALKING_SPEED_MPS = 0.5; // ✅ FIX: 0.5 m/s (~1.8 km/h) - slower than slow walk, likely stationary
// ✅ FIX: GPS signal loss detection - pause timer if no movement for 30 seconds
const GPS_STALL_THRESHOLD_MS = 30000; // 30 seconds without movement = consider stalled

export type RunSession = {
  id: string;
  startedAt?: number;
  finishedAt?: number;
  status: RunState;
  samples: GpsSample[];
  pauses: PauseInterval[];
  breadcrumbDistanceMeters: number;
  movingDistanceMeters: number;
  elapsedMs: number;
  avgPaceMinPerKm: number;
  caloriesKcal: number;
  instantPaceMinPerKm: number;
  routeGuideId?: string | null;
  visibility: 'public' | 'private';
  name?: string;
  recordedRouteId?: number | null;
  weightKg?: number;
  userWeightKg?: number;
  // Professional-grade tracking features (Strava/Nike standard)
  elevationGainMeters?: number; // Total climbing
  elevationLossMeters?: number; // Total descending
  elevationCalorieMultiplier?: number; // Elevation-adjusted calorie factor
  // ✅ FIX: GPS signal loss detection
  lastMovementTimestamp?: number; // Last time significant movement was detected
  isGpsStalled?: boolean; // True when GPS samples arriving but no movement
};

export type Action =
  | { type: 'START' }
  | { type: 'PAUSE'; at: number }
  | { type: 'RESUME'; at: number }
  | { type: 'FINISH'; at: number }
  | { type: 'TICK'; deltaMs: number }
  | { type: 'ADD_SAMPLES'; samples: GpsSample[] }
  | { type: 'SET_META'; name?: string; visibility?: 'public' | 'private' }
  | { type: 'SET_WEIGHT'; weightKg?: number };

type RunTrackerContextValue = {
  session: RunSession;
  dispatch: (action: Action) => void;
  hydrateSession: (session: RunSession) => void;
  resetSession: () => void;
};

const createSessionId = () =>
  (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}`);

function createEmptySession(): RunSession {
  return {
    id: createSessionId(),
    status: 'IDLE',
    samples: [],
    pauses: [],
    breadcrumbDistanceMeters: 0,
    movingDistanceMeters: 0,
    elapsedMs: 0,
    avgPaceMinPerKm: 0,
    caloriesKcal: 0,
    instantPaceMinPerKm: 0,
    visibility: 'private',
    routeGuideId: null,
    recordedRouteId: null,
    userWeightKg: DEFAULT_WEIGHT_KG,
  };
}

function createRunningSession(): RunSession {
  const now = Date.now();
  return {
    ...createEmptySession(),
    id: createSessionId(),
    status: 'RUNNING',
    startedAt: now,
    // ✅ FIX: Initialize movement tracking
    lastMovementTimestamp: now,
    isGpsStalled: false,
  };
}

const defaultSession = createEmptySession();

export const RunTrackerContext = createContext<RunTrackerContextValue>({
  session: defaultSession,
  dispatch: () => undefined,
  hydrateSession: () => undefined,
  resetSession: () => undefined,
});

export const RunTrackerProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<RunSession>(defaultSession);

  const dispatch = useCallback((action: Action) => {
    setSession((prev) => runTrackerReducer(prev, action));
  }, []);

  const hydrateSession = useCallback((incoming: RunSession) => {
    if (!incoming) return;
    setSession(normalizeSession(incoming));
  }, []);

  const resetSession = useCallback(() => {
    setSession(createEmptySession());
  }, []);

  const value = useMemo(() => ({ session, dispatch, hydrateSession, resetSession }), [session, dispatch, hydrateSession, resetSession]);

  return <RunTrackerContext.Provider value={value}>{children}</RunTrackerContext.Provider>;
};

const runTrackerReducer = (state: RunSession, action: Action): RunSession => {
  switch (action.type) {
    case 'START':
      return createRunningSession();
    case 'PAUSE':
      if (state.status !== 'RUNNING') return state;
      return {
        ...state,
        status: 'PAUSED',
        pauses: [...state.pauses, { start: action.at }],
      };
    case 'RESUME':
      if (state.status !== 'PAUSED') return state;
      return {
        ...state,
        status: 'RUNNING',
        pauses: closeLastPause(state.pauses, action.at),
      };
    case 'FINISH': {
      if (state.status === 'IDLE' || state.status === 'FINISHED') return state;
      const pauses = state.status === 'PAUSED' ? closeLastPause(state.pauses, action.at) : state.pauses;
      return recalc({
        ...state,
        status: 'FINISHED',
        finishedAt: action.at,
        pauses,
      });
    }
    case 'TICK':
      if (state.status !== 'RUNNING') return state;
      // ✅ FIX: Timer always counts when RUNNING (removed GPS stall check that caused timer to freeze)
      // Timer should track elapsed time during run, regardless of GPS movement
      // Distance/pace calculations already handle stationary periods correctly
      return recalc({
        ...state,
        elapsedMs: state.elapsedMs + action.deltaMs,
      });
    case 'ADD_SAMPLES':
      if (!action.samples.length) return state;
      return recalc(applySamples(state, action.samples));
    case 'SET_META':
      return {
        ...state,
        name: action.name ?? state.name,
        visibility: action.visibility ?? state.visibility,
      };
    case 'SET_WEIGHT':
      return {
        ...state,
        userWeightKg: action.weightKg && action.weightKg > 0 ? action.weightKg : DEFAULT_WEIGHT_KG,
      };
    default:
      return state;
  }
};

const applySamples = (state: RunSession, samples: GpsSample[]): RunSession => {
  const nextSamples = state.samples.slice();
  let breadcrumb = state.breadcrumbDistanceMeters;
  let moving = state.movingDistanceMeters;
  // ✅ FIX: Track last movement time for GPS stall detection
  let lastMovementTimestamp = state.lastMovementTimestamp;
  let hadSignificantMovement = false;

  let previous = nextSamples[nextSamples.length - 1];

  samples.forEach((sample) => {
    if (!isFinite(sample.lat) || !isFinite(sample.lng)) {
      return;
    }

    // ✅ FIX: Reject GPS samples with poor accuracy to prevent stationary drift
    // Poor GPS accuracy (>20m) causes apparent movement when standing still
    if (sample.accuracy && sample.accuracy > MAX_GPS_ACCURACY_METERS) {
      console.warn(`[RunTracker] Rejecting GPS sample with poor accuracy: ${sample.accuracy.toFixed(1)}m`);
      return; // Skip this sample
    }

    if (previous) {
      const delta = haversineDistanceMeters(previous, sample);

      // ✅ FIX: Additional speed check to prevent GPS drift accumulation when stationary
      // If speed is below minimum walking speed AND delta is small, skip distance accumulation
      const isLikelyStationary = sample.speedMs !== undefined && sample.speedMs !== null
        && sample.speedMs < MIN_WALKING_SPEED_MPS
        && delta < MIN_MOVEMENT_THRESHOLD_METERS * 2; // Allow slightly larger threshold when speed confirms stationary

      // Professional standard: Ignore GPS jitter below threshold (Strava/Nike method)
      if (isFinite(delta) && delta >= MIN_MOVEMENT_THRESHOLD_METERS && !isLikelyStationary) {
        breadcrumb += delta;
        if (state.status === 'RUNNING') {
          moving += delta;
        }
        // ✅ FIX: Update last movement time when significant movement detected
        lastMovementTimestamp = sample.t;
        hadSignificantMovement = true;
      }
    }

    nextSamples.push(sample);
    previous = sample;
  });

  // ✅ FIX: Detect GPS stall - samples arriving but no movement
  const now = Date.now();
  const timeSinceLastMovement = lastMovementTimestamp ? now - lastMovementTimestamp : 0;
  const isGpsStalled = state.status === 'RUNNING'
    && lastMovementTimestamp !== undefined
    && timeSinceLastMovement > GPS_STALL_THRESHOLD_MS;

  return {
    ...state,
    samples: nextSamples,
    breadcrumbDistanceMeters: breadcrumb,
    movingDistanceMeters: moving,
    lastMovementTimestamp: hadSignificantMovement ? lastMovementTimestamp : state.lastMovementTimestamp,
    isGpsStalled,
  };
};

const recalc = (session: RunSession): RunSession => {
  // Calculate moving time (elapsed time minus paused time)
  let pausedMs = 0;
  session.pauses.forEach((pause) => {
    const end = pause.end ?? Date.now();
    pausedMs += (end - pause.start);
  });
  const movingMs = session.elapsedMs - pausedMs;

  const canCompute = session.movingDistanceMeters >= MIN_DISTANCE_FOR_PACE_METERS && movingMs > 0;
  const pace = canCompute ? derivePace(session.movingDistanceMeters, movingMs) : 0;
  const weight = session.userWeightKg ?? session.weightKg ?? DEFAULT_WEIGHT_KG;

  // Professional calorie calculation: Use MET-based method (Strava/Nike standard)
  // This accounts for running intensity (pace) not just distance
  const calories = canCompute && pace > 0
    ? caloriesFromPace(movingMs, pace, weight)  // MET-based (intensity-aware)
    : caloriesFromDistance(session.movingDistanceMeters, weight); // Fallback to distance-based
  const instantWindowPace = calculateInstantPace(session.samples);
  const prevInstant = session.instantPaceMinPerKm ?? 0;
  const smoothedInstant = instantWindowPace > 0
    ? (prevInstant > 0
      ? prevInstant * (1 - INSTANT_PACE_ALPHA) + instantWindowPace * INSTANT_PACE_ALPHA
      : instantWindowPace)
    : (prevInstant > 0 ? prevInstant * (1 - INSTANT_PACE_ALPHA) : 0);
  return {
    ...session,
    avgPaceMinPerKm: Number.isFinite(pace) ? Number(pace.toFixed(2)) : 0,
    caloriesKcal: isFinite(calories) ? Number(calories.toFixed(1)) : 0,
    instantPaceMinPerKm: isFinite(smoothedInstant) ? Number(smoothedInstant.toFixed(2)) : 0,
  };
};

const closeLastPause = (pauses: PauseInterval[], end: number): PauseInterval[] => {
  if (!pauses.length) return pauses;
  const updated = pauses.slice();
  const last = updated[updated.length - 1];
  if (!last.end) {
    updated[updated.length - 1] = { ...last, end };
  }
  return updated;
};

const calculateInstantPace = (samples: GpsSample[]): number => {
  if (samples.length < 2) return 0;
  const last = samples[samples.length - 1];
  if (!isFinite(last.t)) return 0;
  const windowStart = last.t - INSTANT_PACE_WINDOW_MS;
  let startIndex = samples.findIndex((sample) => sample.t >= windowStart);
  if (startIndex === -1) startIndex = 0;
  if (startIndex >= samples.length - 1) {
    if (samples.length < 2) return 0;
    startIndex = samples.length - 2;
  }

  let distance = 0;
  let previous = samples[startIndex];
  for (let i = startIndex + 1; i < samples.length; i += 1) {
    const current = samples[i];
    if (!isFinite(current.lat) || !isFinite(current.lng) || !isFinite(previous.lat) || !isFinite(previous.lng)) {
      continue;
    }
    distance += haversineDistanceMeters(previous, current);
    previous = current;
  }

  const elapsedMs = last.t - samples[startIndex].t;
  if (!isFinite(distance) || distance <= 0 || !isFinite(elapsedMs) || elapsedMs <= 0) {
    return 0;
  }

  return (elapsedMs / distance) / 60;
};

const normalizeSession = (session: RunSession): RunSession => {
  return recalc({
    ...createEmptySession(),
    ...session,
    samples: session.samples ?? [],
    pauses: session.pauses ?? [],
    breadcrumbDistanceMeters: session.breadcrumbDistanceMeters ?? 0,
    movingDistanceMeters: session.movingDistanceMeters ?? 0,
    elapsedMs: session.elapsedMs ?? 0,
    status: session.status ?? 'IDLE',
    userWeightKg: session.userWeightKg ?? DEFAULT_WEIGHT_KG,
    instantPaceMinPerKm: session.instantPaceMinPerKm ?? 0,
  });
};

export const useRunTrackerContext = () => React.useContext(RunTrackerContext);
