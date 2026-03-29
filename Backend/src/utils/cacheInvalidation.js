import { invalidateFeedCache } from "./redis.js";

/**
 * Invalidates feed cache after a post is created
 * @param {Array} tags - Tags of the newly created post
 */
export const invalidateCacheOnPostCreate = async (tags = []) => {
  try {
    // Invalidate all feed caches if no tags
    if (!tags || tags.length === 0) {
      await invalidateFeedCache();
    } else {
      // Invalidate cache for each tag
      for (const tag of tags) {
        await invalidateFeedCache(tag);
      }
    }
  } catch (error) {
    console.error("Error invalidating cache on post create:", error);
  }
};

/**
 * Invalidates feed cache after a post is updated
 * @param {Array} tags - Tags of the updated post
 */
export const invalidateCacheOnPostUpdate = async (tags = []) => {
  try {
    // Invalidate all feed caches if no tags
    if (!tags || tags.length === 0) {
      await invalidateFeedCache();
    } else {
      // Invalidate cache for each tag
      for (const tag of tags) {
        await invalidateFeedCache(tag);
      }
    }
  } catch (error) {
    console.error("Error invalidating cache on post update:", error);
  }
};

/**
 * Invalidates feed cache after a post is deleted
 * @param {Array} tags - Tags of the deleted post
 */
export const invalidateCacheOnPostDelete = async (tags = []) => {
  try {
    // Invalidate all feed caches
    await invalidateFeedCache();
  } catch (error) {
    console.error("Error invalidating cache on post delete:", error);
  }
};
