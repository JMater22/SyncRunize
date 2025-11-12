export const DEFAULT_WEIGHT_KG = 70;
export const MIN_DISTANCE_FOR_PACE_METERS = 50;

// Enhanced MET table based on American College of Sports Medicine (ACSM) standards
// Used by Strava, Nike Run Club, and professional fitness apps
const MET_TABLE: Array<{ maxPace: number; met: number; description?: string }> = [
  { maxPace: 12.0, met: 5.0, description: 'Recovery walk' },        // >12:00 min/km
  { maxPace: 10.0, met: 6.5, description: 'Easy jog / brisk walk' }, // 10:00-12:00
  { maxPace: 8.5, met: 8.0, description: 'Light jog' },             // 8:30-10:00
  { maxPace: 7.5, met: 9.5, description: 'Moderate run' },          // 7:30-8:30
  { maxPace: 6.5, met: 11.0, description: 'Steady run' },           // 6:30-7:30
  { maxPace: 5.5, met: 12.5, description: 'Tempo pace' },           // 5:30-6:30
  { maxPace: 4.8, met: 14.5, description: 'Fast run' },             // 4:48-5:30
  { maxPace: 4.2, met: 16.0, description: 'Race pace' },            // 4:12-4:48
  { maxPace: 3.5, met: 18.0, description: 'Sprint pace' },          // 3:30-4:12
  { maxPace: 0, met: 23.0, description: 'Elite sprint' },           // <3:30 min/km
];

const DEFAULT_MET = 8.0; // Default for moderate running

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

// Distance-based calorie estimate for running: ~1.036 kcal per kg per km
export const caloriesFromDistance = (
  distanceMeters: number,
  weightKg: number = DEFAULT_WEIGHT_KG,
): number => {
  if (!isFinite(distanceMeters) || distanceMeters <= 0) return 0;
  const km = distanceMeters / 1000;
  const safeWeight = Number.isFinite(weightKg) && weightKg > 0 ? weightKg : DEFAULT_WEIGHT_KG;
  const KCAL_PER_KG_PER_KM = 1.036;
  return +(safeWeight * km * KCAL_PER_KG_PER_KM).toFixed(1);
};

export const derivePace = (distanceMeters: number, elapsedMs: number): number => {
  if (!isFinite(distanceMeters) || distanceMeters < MIN_DISTANCE_FOR_PACE_METERS) return 0;
  if (!isFinite(elapsedMs) || elapsedMs <= 0) return 0;
  const distanceKm = distanceMeters / 1000;
  const minutes = elapsedMs / 60_000;
  return minutes / distanceKm;
};
