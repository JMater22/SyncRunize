/**
 * Cache Invalidation Utilities
 *
 * Purpose: Invalidate cached data when updates occur
 * Usage: Call these functions after creating/updating/deleting data
 */

import { deleteCache, deleteCachePattern } from './redis.js';

/**
 * Invalidate user-related caches
 */
export async function invalidateUserCache(userId) {
  await Promise.all([
    deleteCache(`user:profile:${userId}`),
    deleteCache(`user:public:${userId}`),
    deleteCachePattern(`user:posts:${userId}:*`),
    deleteCachePattern(`feed:*`) // User's actions affect all feeds
  ]);
  console.log(`🗑️  Invalidated cache for user ${userId}`);
}

/**
 * Invalidate post-related caches
 */
export async function invalidatePostCache(post) {
  const userId = post.user_id || post.userId;

  await Promise.all([
    deleteCachePattern(`user:posts:${userId}:*`),
    deleteCachePattern(`feed:*`), // Post affects all feeds
    deleteCachePattern(`user:posts:*:${userId}:*`) // Other users viewing this user's posts
  ]);
  console.log(`🗑️  Invalidated cache for post by user ${userId}`);
}

/**
 * Invalidate group-related caches
 */
export async function invalidateGroupCache(groupId) {
  await Promise.all([
    deleteCache(`group:details:${groupId}`),
    deleteCache(`group:members:${groupId}`),
    deleteCachePattern(`group:posts:${groupId}:*`)
  ]);
  console.log(`🗑️  Invalidated cache for group ${groupId}`);
}

/**
 * Invalidate group post caches
 */
export async function invalidateGroupPostCache(groupId) {
  await deleteCachePattern(`group:posts:${groupId}:*`);
  console.log(`🗑️  Invalidated cache for group ${groupId} posts`);
}

/**
 * Invalidate feed caches (when following/unfollowing)
 */
export async function invalidateFeedCache(userId) {
  await deleteCachePattern(`feed:${userId}:*`);
  console.log(`🗑️  Invalidated feed cache for user ${userId}`);
}

/**
 * Invalidate like/comment caches (affects counts)
 */
export async function invalidateLikeCommentCache(postData) {
  const { post_id, user_id } = postData;

  // Find the post owner to invalidate their posts cache
  await Promise.all([
    deleteCachePattern(`user:posts:*`), // All user posts (contains counts)
    deleteCachePattern(`feed:*`), // All feeds (contains counts)
    deleteCachePattern(`group:posts:*`) // All group posts (contains counts)
  ]);
  console.log(`🗑️  Invalidated like/comment cache`);
}

/**
 * Invalidate all caches (use sparingly)
 */
export async function invalidateAllCache() {
  await deleteCachePattern('*');
  console.log(`🗑️  Invalidated ALL caches`);
}

export default {
  invalidateUserCache,
  invalidatePostCache,
  invalidateGroupCache,
  invalidateGroupPostCache,
  invalidateFeedCache,
  invalidateLikeCommentCache,
  invalidateAllCache
};
