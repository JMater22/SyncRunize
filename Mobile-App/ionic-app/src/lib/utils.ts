// ========================================
// DISTANCE CONVERSION UTILITIES
// ========================================

export const KM_TO_MILES = 0.621371;
export const MILES_TO_KM = 1.60934;

export const kmToMiles = (km: number): number => km * KM_TO_MILES;
export const milesToKm = (miles: number): number => miles * MILES_TO_KM;

export const formatDistance = (
  distanceKm: number,
  unit: 'km' | 'mi' = 'km',
  decimals: number = 2
): string => {
  const distance = unit === 'mi' ? kmToMiles(distanceKm) : distanceKm;
  return `${distance.toFixed(decimals)} ${unit}`;
};

export const getDistanceValue = (
  distanceKm: number,
  unit: 'km' | 'mi' = 'km'
): number => {
  return unit === 'mi' ? kmToMiles(distanceKm) : distanceKm;
};

export const formatPace = (
  paceMinPerKm: string | number,
  unit: 'km' | 'mi' = 'km'
): string => {
  if (typeof paceMinPerKm === 'string') {
    // Parse "5:30" format
    const [mins, secs] = paceMinPerKm.split(':').map(Number);
    const totalMinutes = mins + (secs || 0) / 60;

    if (unit === 'mi') {
      const paceMinPerMi = totalMinutes * MILES_TO_KM;
      const mins = Math.floor(paceMinPerMi);
      const secs = Math.round((paceMinPerMi - mins) * 60);
      return `${mins}:${String(secs).padStart(2, '0')} /mi`;
    }
    return `${paceMinPerKm} /km`;
  }

  const mins = Math.floor(paceMinPerKm);
  const secs = Math.round((paceMinPerKm - mins) * 60);
  const unitLabel = unit === 'mi' ? '/mi' : '/km';
  return `${mins}:${String(secs).padStart(2, '0')} ${unitLabel}`;
};

// ========================================
// TIME FORMATTING UTILITIES
// ========================================

export const formatDuration = (duration?: number | string): string => {
  if (!duration) return '00:00:00';

  // If duration is already a string in HH:MM:SS format, return as-is
  if (typeof duration === 'string' && duration.includes(':')) {
    return duration;
  }

  // Convert to number if string
  const totalSeconds = typeof duration === 'number' ? duration : parseInt(duration);
  if (isNaN(totalSeconds)) return '00:00:00';

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

export const formatDurationShort = (duration?: number | string): string => {
  if (!duration) return '0m';

  // Convert to number if string
  const totalSeconds = typeof duration === 'number' ? duration : parseInt(duration);
  if (isNaN(totalSeconds)) return '0m';

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  // If more than 1 hour, show hours and minutes
  if (hours > 0) {
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  }

  // If more than 1 minute, show minutes (and seconds if significant)
  if (minutes > 0) {
    return seconds > 0 && minutes < 5 ? `${minutes}m ${seconds}s` : `${minutes}m`;
  }

  // Less than a minute, show seconds
  return `${seconds}s`;
};

export const formatRelativeTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;

  const diffWeeks = Math.floor(diffDays / 7);
  if (diffWeeks < 4) return `${diffWeeks}w ago`;

  return date.toLocaleDateString();
};

export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';

  const daysAgo = Math.floor((today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (daysAgo < 7) return `${daysAgo} days ago`;

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

// ========================================
// NUMBER FORMATTING UTILITIES
// ========================================

export const formatNumber = (num: number, decimals: number = 0): string => {
  return num.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

export const formatCalories = (calories: number): string => {
  return `${Math.round(calories)} cal`;
};

// ========================================
// VALIDATION UTILITIES
// ========================================

export const isValidEmail = (email: string): boolean => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

export const isValidPassword = (password: string): boolean => {
  return password.length >= 6;
};

export const isValidUsername = (username: string): boolean => {
  const re = /^[a-zA-Z0-9_]{3,20}$/;
  return re.test(username);
};

// ========================================
// ERROR HANDLING UTILITIES
// ========================================

export const getErrorMessage = (error: any): string => {
  if (typeof error === 'string') return error;
  if (error?.message) return error.message;
  if (error?.error?.message) return error.error.message;
  if (error?.response?.data?.message) return error.response.data.message;
  return 'An unexpected error occurred';
};

// ========================================
// IMAGE UTILITIES
// ========================================

export const DEFAULT_AVATAR = 'https://ionicframework.com/docs/img/demos/avatar.svg';

export const getAvatarUrl = (url?: string | null): string => {
  return url || DEFAULT_AVATAR;
};

// ========================================
// ARRAY UTILITIES
// ========================================

export const groupBy = <T>(array: T[], key: keyof T): Record<string, T[]> => {
  return array.reduce((result, item) => {
    const group = String(item[key]);
    if (!result[group]) {
      result[group] = [];
    }
    result[group].push(item);
    return result;
  }, {} as Record<string, T[]>);
};

export const sortBy = <T>(array: T[], key: keyof T, order: 'asc' | 'desc' = 'asc'): T[] => {
  return [...array].sort((a, b) => {
    const aVal = a[key];
    const bVal = b[key];

    if (aVal < bVal) return order === 'asc' ? -1 : 1;
    if (aVal > bVal) return order === 'asc' ? 1 : -1;
    return 0;
  });
};
