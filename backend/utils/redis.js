/**
 * Redis Client Configuration
 *
 * Purpose: Caching layer for frequently accessed data
 * Expected Impact: 80-95% faster for cached requests
 */

import { createClient } from 'redis';
import dotenv from 'dotenv';

dotenv.config();

// Create Redis client
const redis = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
  socket: {
    connectTimeout: 10000, // 10 seconds
    reconnectStrategy: (retries) => {
      if (retries > 10) {
        console.error('❌ Redis: Max reconnection attempts reached');
        return new Error('Redis connection failed');
      }
      // Exponential backoff: 50ms, 100ms, 200ms, ...
      const delay = Math.min(retries * 50, 3000);
      console.log(`⚠️  Redis: Reconnecting in ${delay}ms (attempt ${retries})`);
      return delay;
    }
  }
});

// Connection event handlers
redis.on('connect', () => {
  console.log('🔌 Redis: Connecting...');
});

redis.on('ready', () => {
  console.log('✅ Redis: Connected and ready');
});

redis.on('error', (err) => {
  console.error('❌ Redis error:', err.message);
});

redis.on('reconnecting', () => {
  console.log('🔄 Redis: Reconnecting...');
});

redis.on('end', () => {
  console.log('⛔ Redis: Connection closed');
});

// Connect to Redis
let isConnected = false;
async function connectRedis() {
  if (isConnected) return;

  try {
    await redis.connect();
    isConnected = true;
  } catch (error) {
    console.error('❌ Failed to connect to Redis:', error.message);
    console.log('⚠️  Continuing without caching - Redis is optional');
    // Don't throw - application should work without Redis
  }
}

// Initialize connection
connectRedis();

/**
 * Cache helper functions
 */

/**
 * Get cached value
 * @param {string} key - Cache key
 * @returns {Promise<any|null>} - Parsed JSON value or null
 */
export async function getCache(key) {
  if (!isConnected) return null;

  try {
    const value = await redis.get(key);
    return value ? JSON.parse(value) : null;
  } catch (error) {
    console.warn(`⚠️  Redis GET error for key "${key}":`, error.message);
    return null;
  }
}

/**
 * Set cache value
 * @param {string} key - Cache key
 * @param {any} value - Value to cache (will be JSON stringified)
 * @param {number} ttlSeconds - Time to live in seconds
 */
export async function setCache(key, value, ttlSeconds = 300) {
  if (!isConnected) return;

  try {
    await redis.set(key, JSON.stringify(value), {
      EX: ttlSeconds
    });
  } catch (error) {
    console.warn(`⚠️  Redis SET error for key "${key}":`, error.message);
  }
}

/**
 * Delete cache key(s)
 * @param {string|string[]} keys - Cache key(s) to delete
 */
export async function deleteCache(keys) {
  if (!isConnected) return;

  try {
    if (Array.isArray(keys)) {
      if (keys.length > 0) {
        await redis.del(keys);
      }
    } else {
      await redis.del(keys);
    }
  } catch (error) {
    console.warn(`⚠️  Redis DEL error:`, error.message);
  }
}

/**
 * Delete all keys matching a pattern
 * @param {string} pattern - Pattern to match (e.g., "user:*")
 */
export async function deleteCachePattern(pattern) {
  if (!isConnected) return;

  try {
    const keys = [];
    for await (const key of redis.scanIterator({ MATCH: pattern, COUNT: 100 })) {
      keys.push(key);
    }
    if (keys.length > 0) {
      await redis.del(...keys); // Spread array to pass as individual arguments
      console.log(`🗑️  Deleted ${keys.length} keys matching "${pattern}"`);
    }
  } catch (error) {
    console.warn(`⚠️  Redis pattern delete error:`, error.message);
  }
}

/**
 * Cache key generators
 */
export const CacheKeys = {
  userProfile: (userId) => `user:profile:${userId}`,
  userPublic: (userId) => `user:public:${userId}`,
  userPosts: (userId, limit, offset) => `user:posts:${userId}:${limit}:${offset}`,
  otherUserPosts: (targetId, currentId, limit, offset) => `user:posts:${targetId}:${currentId}:${limit}:${offset}`,
  feed: (userId, limit, offset) => `feed:${userId}:${limit}:${offset}`,
  groupPosts: (groupId, userId, limit, offset) => `group:posts:${groupId}:${userId}:${limit}:${offset}`,
  groupDetails: (groupId) => `group:details:${groupId}`,
  groupMembers: (groupId) => `group:members:${groupId}`,
};

/**
 * Graceful shutdown
 */
process.on('SIGINT', async () => {
  if (isConnected) {
    console.log('📴 Closing Redis connection...');
    await redis.quit();
  }
  process.exit(0);
});

export default redis;
