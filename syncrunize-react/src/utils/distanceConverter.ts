/**
 * Utility functions for converting distances between km and miles
 */

export const KM_TO_MILES = 0.621371;
export const MILES_TO_KM = 1.60934;

/**
 * Convert kilometers to miles
 */
export const kmToMiles = (km: number): number => {
  return km * KM_TO_MILES;
};

/**
 * Convert miles to kilometers
 */
export const milesToKm = (miles: number): number => {
  return miles * MILES_TO_KM;
};

/**
 * Format distance based on user's preferred unit
 * @param distanceKm - Distance in kilometers
 * @param unit - User's preferred unit ('km' or 'mi')
 * @param decimals - Number of decimal places (default: 2)
 */
export const formatDistance = (
  distanceKm: number,
  unit: 'km' | 'mi' = 'km',
  decimals: number = 2
): string => {
  if (!distanceKm || isNaN(distanceKm)) return `0.0 ${unit}`;

  const distance = unit === 'mi' ? kmToMiles(distanceKm) : distanceKm;
  return `${distance.toFixed(decimals)} ${unit}`;
};

/**
 * Format pace based on user's preferred unit
 * Converts min/km to min/mi if needed
 * @param paceString - Pace in format "5:30 /km"
 * @param unit - User's preferred unit ('km' or 'mi')
 */
export const formatPace = (
  pace: string | number,
  unit: 'km' | 'mi' = 'km'
): string => {
  if (pace === null || pace === undefined || (typeof pace === 'number' && isNaN(pace))) {
    return `0:00 /${unit}`;
  }

  let totalMinutes: number | null = null;

  if (typeof pace === 'number') {
    // pace provided as minutes per km (e.g., 5.5 means 5:30 per km)
    totalMinutes = pace;
  } else {
    // Try to extract minutes and seconds from a string (e.g., "5:30", "5:30 /km")
    const match = pace.match(/(\d+):(\d+)/);
    if (match) {
      const minutes = parseInt(match[1], 10);
      const seconds = parseInt(match[2], 10);
      totalMinutes = minutes + seconds / 60;
    } else {
      // Fallback: if string is not parseable, return it unchanged with unit if missing
      return pace.includes('/') ? pace : `${pace} /${unit}`;
    }
  }

  if (totalMinutes === null) {
    return `0:00 /${unit}`;
  }

  // Convert to minutes per mile if requested
  const minutesPerUnit = unit === 'mi' ? totalMinutes * MILES_TO_KM : totalMinutes;
  const outMinutes = Math.floor(minutesPerUnit);
  const outSeconds = Math.round((minutesPerUnit - outMinutes) * 60);
  const padded = outSeconds.toString().padStart(2, '0');
  return `${outMinutes}:${padded} /${unit}`;
};

/**
 * Get the distance value only (without unit)
 * @param distanceKm - Distance in kilometers
 * @param unit - User's preferred unit ('km' or 'mi')
 * @param decimals - Number of decimal places (default: 2)
 */
export const getDistanceValue = (
  distanceKm: number,
  unit: 'km' | 'mi' = 'km',
  decimals: number = 2
): number => {
  if (!distanceKm || isNaN(distanceKm)) return 0;

  const distance = unit === 'mi' ? kmToMiles(distanceKm) : distanceKm;
  return parseFloat(distance.toFixed(decimals));
};
