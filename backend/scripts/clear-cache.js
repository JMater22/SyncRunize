/**
 * Clear Redis Cache Script
 *
 * Clears all cached data from Redis
 */

import redis from '../utils/redis.js';
import { deleteCachePattern } from '../utils/redis.js';

async function clearCache() {
  console.log('🗑️  Clearing Redis cache...');

  try {
    // Clear all group post caches
    await deleteCachePattern('group:posts:*');

    // Clear all user profile caches
    await deleteCachePattern('user:profile:*');

    // Clear all feed caches
    await deleteCachePattern('feed:*');

    console.log('✅ Cache cleared successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to clear cache:', error);
    process.exit(1);
  }
}

clearCache();
