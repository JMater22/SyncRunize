// utils/storageQuota.ts
// ✅ FIX: Monitor storage quota and auto-cleanup when approaching limits
// Prevents QuotaExceededError and improves storage management

interface StorageEstimate {
  usage?: number;
  quota?: number;
  usagePercentage: number;
}

const QUOTA_WARNING_THRESHOLD = 0.8; // Warn at 80%
const QUOTA_CLEANUP_THRESHOLD = 0.9; // Auto-cleanup at 90%

/**
 * Get current storage usage estimate
 */
export const getStorageEstimate = async (): Promise<StorageEstimate> => {
  if ('storage' in navigator && 'estimate' in navigator.storage) {
    try {
      const estimate = await navigator.storage.estimate();
      const usage = estimate.usage || 0;
      const quota = estimate.quota || 0;
      const usagePercentage = quota > 0 ? usage / quota : 0;

      console.log(`[Storage] Usage: ${(usage / 1024 / 1024).toFixed(2)} MB / ${(quota / 1024 / 1024).toFixed(2)} MB (${(usagePercentage * 100).toFixed(1)}%)`);

      return {
        usage,
        quota,
        usagePercentage
      };
    } catch (error) {
      console.error('[Storage] Failed to estimate storage:', error);
      return { usagePercentage: 0 };
    }
  }

  // navigator.storage.estimate() not supported
  return { usagePercentage: 0 };
};

/**
 * Check if storage is approaching quota limits
 */
export const checkStorageQuota = async (): Promise<{
  needsWarning: boolean;
  needsCleanup: boolean;
  estimate: StorageEstimate;
}> => {
  const estimate = await getStorageEstimate();

  return {
    needsWarning: estimate.usagePercentage >= QUOTA_WARNING_THRESHOLD,
    needsCleanup: estimate.usagePercentage >= QUOTA_CLEANUP_THRESHOLD,
    estimate
  };
};

/**
 * Clear old/stale caches to free up storage space
 * Targets caches that are most likely to be stale or large
 */
export const performStorageCleanup = async (): Promise<number> => {
  let itemsCleared = 0;

  try {
    const keysToRemove: string[] = [];

    // 1. Find all sessionStorage keys
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (!key) continue;

      // Clear old feed caches (prefix: feed_posts_)
      if (key.startsWith('feed_posts_')) {
        keysToRemove.push(key);
      }

      // Clear old route caches (prefix: routes_data_)
      if (key.startsWith('routes_data_') || key.startsWith('saved_routes_')) {
        keysToRemove.push(key);
      }

      // Clear old profile caches (prefix: profile_data_)
      if (key.startsWith('profile_data_')) {
        keysToRemove.push(key);
      }
    }

    // 2. Remove identified keys
    keysToRemove.forEach(key => {
      try {
        sessionStorage.removeItem(key);
        itemsCleared++;
      } catch (err) {
        console.warn(`[Storage Cleanup] Failed to remove ${key}:`, err);
      }
    });

    // 3. Clear old notification caches (check TTL)
    const NOTIFICATION_CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (!key || !key.startsWith('notifications_')) continue;

      try {
        const cached = sessionStorage.getItem(key);
        if (!cached) continue;

        const parsed = JSON.parse(cached);
        if (parsed && typeof parsed === 'object' && 'timestamp' in parsed) {
          const age = Date.now() - parsed.timestamp;
          if (age > NOTIFICATION_CACHE_TTL_MS) {
            sessionStorage.removeItem(key);
            itemsCleared++;
          }
        }
      } catch (err) {
        // Invalid JSON, remove it
        sessionStorage.removeItem(key);
        itemsCleared++;
      }
    }

    console.log(`[Storage Cleanup] Cleared ${itemsCleared} cache items`);
    return itemsCleared;
  } catch (error) {
    console.error('[Storage Cleanup] Error during cleanup:', error);
    return itemsCleared;
  }
};

/**
 * Monitor storage and auto-cleanup if needed
 * Call this periodically or on app startup
 */
export const monitorAndCleanupStorage = async (): Promise<{
  cleaned: boolean;
  itemsCleared: number;
  estimate: StorageEstimate;
}> => {
  const { needsCleanup, estimate } = await checkStorageQuota();

  if (needsCleanup) {
    console.warn(`[Storage] Storage quota at ${(estimate.usagePercentage * 100).toFixed(1)}% - performing auto-cleanup`);
    const itemsCleared = await performStorageCleanup();

    // Get new estimate after cleanup
    const newEstimate = await getStorageEstimate();

    return {
      cleaned: true,
      itemsCleared,
      estimate: newEstimate
    };
  }

  return {
    cleaned: false,
    itemsCleared: 0,
    estimate
  };
};

/**
 * Get user-friendly storage warning message
 */
export const getStorageWarningMessage = (estimate: StorageEstimate): string | null => {
  if (estimate.usagePercentage >= QUOTA_CLEANUP_THRESHOLD) {
    return `Storage almost full (${(estimate.usagePercentage * 100).toFixed(0)}%). Old caches will be cleared automatically.`;
  }

  if (estimate.usagePercentage >= QUOTA_WARNING_THRESHOLD) {
    return `Storage usage is high (${(estimate.usagePercentage * 100).toFixed(0)}%). Consider clearing app data if issues occur.`;
  }

  return null;
};
