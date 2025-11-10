export const DEFAULT_WEIGHT_KG = 70;
export const MIN_DISTANCE_FOR_PACE_METERS = 50;

const MET_TABLE: Array<{ maxPace: number; met: number }> = [
  { maxPace: 10.0, met: 6.0 },   // very easy jog / brisk walk
  { maxPace: 8.5, met: 7.5 },
  { maxPace: 7.5, met: 9.0 },
  { maxPace: 6.5, met: 10.5 },
  { maxPace: 5.5, met: 12.5 },
  { maxPace: 4.5, met: 15.0 },    // <4:30 min/km is fast
];

const DEFAULT_MET = 7.0;

export const paceToMet = (paceMinPerKm: number | null | undefined): number => {
  if (!paceMinPerKm || !isFinite(paceMinPerKm) || paceMinPerKm <= 0) return DEFAULT_MET;
  const found = MET_TABLE.find(entry => paceMinPerKm >= entry.maxPace);
  return (found?.met ?? MET_TABLE[MET_TABLE.length - 1].met);
};

export const caloriesFromPace = (
  elapsedMs: number,
  paceMinPerKm: number,
  weightKg: number = DEFAULT_WEIGHT_KG,
): number => {
  if (elapsedMs <= 0 || !paceMinPerKm || paceMinPerKm <= 0) return 0;
  const safeWeight = Number.isFinite(weightKg) && weightKg > 0 ? weightKg : DEFAULT_WEIGHT_KG;
  const hours = elapsedMs / 3_600_000;
  if (hours <= 0) return 0;
  const met = paceToMet(paceMinPerKm);
  return +(met * safeWeight * hours).toFixed(1);
};

export const derivePace = (distanceMeters: number, elapsedMs: number): number => {
  if (!isFinite(distanceMeters) || distanceMeters < MIN_DISTANCE_FOR_PACE_METERS) return 0;
  if (!isFinite(elapsedMs) || elapsedMs <= 0) return 0;
  const distanceKm = distanceMeters / 1000;
  const minutes = elapsedMs / 60_000;
  return minutes / distanceKm;
};
