/**
 * Caching Middleware
 *
 * Purpose: Express middleware to cache API responses
 * Expected Impact: 80-95% faster for cached requests (1000ms → 50-200ms)
 */

import { getCache, setCache } from '../utils/redis.js';

/**
 * Generic caching middleware
 * @param {number} ttlSeconds - Time to live in seconds
 * @param {function} keyGenerator - Function to generate cache key from req
 */
export function cacheMiddleware(ttlSeconds = 300, keyGenerator = null) {
  return async (req, res, next) => {
    // Skip caching for non-GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Generate cache key
    const cacheKey = keyGenerator
      ? keyGenerator(req)
      : `route:${req.originalUrl}`;

    try {
      // Try to get from cache
      const cachedData = await getCache(cacheKey);

      if (cachedData) {
        console.log(`💾 Cache HIT: ${cacheKey}`);
        return res.json(cachedData);
      }

      console.log(`🔍 Cache MISS: ${cacheKey}`);

      // Intercept res.json to cache the response
      const originalJson = res.json.bind(res);
      res.json = function (data) {
        // Cache successful responses only (status 2xx)
        if (res.statusCode >= 200 && res.statusCode < 300) {
          setCache(cacheKey, data, ttlSeconds).catch(err => {
            console.warn('⚠️  Failed to cache response:', err.message);
          });
        }
        return originalJson(data);
      };

      next();
    } catch (error) {
      console.warn('⚠️  Cache middleware error:', error.message);
      // Continue without caching on error
      next();
    }
  };
}

/**
 * Specific cache middleware for common routes
 */

// User profile cache (5 minutes)
export const cacheUserProfile = cacheMiddleware(300, (req) => {
  const userId = req.user?.user_id || req.params.id || req.params.userId;
  return `user:profile:${userId}`;
});

// Public user profile cache (10 minutes)
export const cachePublicProfile = cacheMiddleware(600, (req) => {
  const userId = req.params.id || req.params.userId;
  return `user:public:${userId}`;
});

// User posts cache (1 minute)
export const cacheUserPosts = cacheMiddleware(60, (req) => {
  const userId = req.params.id || req.params.userId;
  const currentUserId = req.user?.user_id || 'anon';
  const limit = req.query.limit || 20;
  const offset = req.query.offset || 0;
  return `user:posts:${userId}:${currentUserId}:${limit}:${offset}`;
});

// Feed cache (1 minute)
export const cacheFeed = cacheMiddleware(60, (req) => {
  const userId = req.user?.user_id;
  const limit = req.query.limit || 20;
  const offset = req.query.offset || 0;
  return `feed:${userId}:${limit}:${offset}`;
});

// Group posts cache (3 minutes)
export const cacheGroupPosts = cacheMiddleware(180, (req) => {
  const groupId = req.params.id || req.params.groupId;
  // Check query param first, then auth user, then default to 'anon'
  const userId = req.query.userId || req.user?.user_id || 'anon';
  const limit = req.query.limit || 20;
  const offset = req.query.offset || 0;
  return `group:posts:${groupId}:${userId}:${limit}:${offset}`;
});

// Group details cache (5 minutes)
export const cacheGroupDetails = cacheMiddleware(300, (req) => {
  const groupId = req.params.id || req.params.groupId;
  return `group:details:${groupId}`;
});

// Group members cache (5 minutes)
export const cacheGroupMembers = cacheMiddleware(300, (req) => {
  const groupId = req.params.id || req.params.groupId;
  return `group:members:${groupId}`;
});

export default cacheMiddleware;
