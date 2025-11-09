import React, { createContext, useCallback, useMemo, useState, type ReactNode } from 'react';
import { haversineDistanceMeters } from '../services/haversine';
import { caloriesFromPace, derivePace } from '../services/met';

export type GpsSample = {
  lat: number;
  lng: number;
  t: number;
  accuracy?: number;
  speedMs?: number | null;
};

export type PauseInterval = { start: number; end?: number };

export type RunState = 'IDLE' | 'RUNNING' | 'PAUSED' | 'FINISHED';

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
  routeGuideId?: string | null;
  visibility: 'public' | 'private';
  name?: string;
  recordedRouteId?: number | null;
  weightKg?: number;
};

export type Action =
  | { type: 'START' }
  | { type: 'PAUSE'; at: number }
  | { type: 'RESUME'; at: number }
  | { type: 'FINISH'; at: number }
  | { type: 'TICK'; deltaMs: number }
  | { type: 'ADD_SAMPLES'; samples: GpsSample[] }
  | { type: 'SET_META'; name?: string; visibility?: 'public' | 'private' };

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
    visibility: 'private',
    routeGuideId: null,
    recordedRouteId: null,
  };
}

function createRunningSession(): RunSession {
  return {
    ...createEmptySession(),
    id: createSessionId(),
    status: 'RUNNING',
    startedAt: Date.now(),
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
    default:
      return state;
  }
};

const applySamples = (state: RunSession, samples: GpsSample[]): RunSession => {
  const nextSamples = state.samples.slice();
  let breadcrumb = state.breadcrumbDistanceMeters;
  let moving = state.movingDistanceMeters;

  let previous = nextSamples[nextSamples.length - 1];

  samples.forEach((sample) => {
    if (previous) {
      const delta = haversineDistanceMeters(previous, sample);
      breadcrumb += delta;
      if (state.status === 'RUNNING') {
        moving += delta;
      }
    }
    nextSamples.push(sample);
    previous = sample;
  });

  return {
    ...state,
    samples: nextSamples,
    breadcrumbDistanceMeters: breadcrumb,
    movingDistanceMeters: moving,
  };
};

const recalc = (session: RunSession): RunSession => {
  const pace = derivePace(session.movingDistanceMeters, session.elapsedMs);
  const calories = caloriesFromPace(session.elapsedMs, pace, session.weightKg ?? 70);
  return {
    ...session,
    avgPaceMinPerKm: Number(isFinite(pace) ? pace.toFixed(2) : 0),
    caloriesKcal: isFinite(calories) ? Number(calories.toFixed(1)) : 0,
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
  });
};

export const useRunTrackerContext = () => React.useContext(RunTrackerContext);
