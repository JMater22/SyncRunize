// utils/keep_warm.js
/**
 * Keep-Warm Service for Render Free Tier
 *
 * Problem: Render free tier spins down services after 15 minutes of inactivity
 * Impact: First request after sleep takes 30-60 seconds (cold start)
 * Solution: Ping the backend every 10 minutes to keep it awake
 *
 * Note: This only works if the service stays awake for at least 10 minutes
 * Render's spin-down happens after 15 min, so 10 min interval keeps it alive
 */

const BACKEND_URL = process.env.BACKEND_URL || 'https://syncrunize-backend.onrender.com';
const PING_INTERVAL = 10 * 60 * 1000; // 10 minutes in milliseconds
const PING_TIMEOUT = 5000; // 5 second timeout for health check

let pingCount = 0;
let failureCount = 0;

/**
 * Pings the backend health endpoint to prevent sleep
 */
const pingBackend = async () => {
  try {
    const start = Date.now();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), PING_TIMEOUT);

    const response = await fetch(`${BACKEND_URL}/api/health`, {
      signal: controller.signal,
      headers: { 'User-Agent': 'SyncRunize-KeepWarm/1.0' }
    });

    clearTimeout(timeoutId);
    const elapsed = Date.now() - start;

    if (response.ok) {
      pingCount++;
      failureCount = 0; // Reset failure count on success
      console.log(`[KeepWarm] ✅ Ping #${pingCount} successful (${elapsed}ms)`);
    } else {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
  } catch (err) {
    failureCount++;
    console.error(`[KeepWarm] ❌ Ping failed (${failureCount} consecutive failures):`, err.message);

    // If we have 3 consecutive failures, the service might be down
    if (failureCount >= 3) {
      console.warn(`[KeepWarm] ⚠️  ${failureCount} consecutive failures - service may be down`);
    }
  }
};

/**
 * Starts the keep-warm service
 * Should only run in production environment
 */
export const startKeepWarm = () => {
  if (process.env.NODE_ENV !== 'production') {
    console.log('[KeepWarm] Skipping keep-warm service (not in production)');
    return;
  }

  if (!BACKEND_URL.includes('render.com')) {
    console.log('[KeepWarm] Skipping keep-warm service (not on Render)');
    return;
  }

  console.log(`[KeepWarm] 🔥 Starting keep-warm service...`);
  console.log(`[KeepWarm] 📍 Target: ${BACKEND_URL}/api/health`);
  console.log(`[KeepWarm] ⏰ Interval: ${PING_INTERVAL / 1000 / 60} minutes`);

  // Do initial ping immediately
  pingBackend();

  // Then ping every 10 minutes
  setInterval(pingBackend, PING_INTERVAL);

  console.log('[KeepWarm] ✅ Keep-warm service started');
};

/**
 * Gets keep-warm statistics
 */
export const getKeepWarmStats = () => {
  return {
    totalPings: pingCount,
    consecutiveFailures: failureCount,
    intervalMinutes: PING_INTERVAL / 1000 / 60,
    backendUrl: BACKEND_URL,
  };
};
