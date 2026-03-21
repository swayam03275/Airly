const LIKED_POST_IDS_KEY = "airly-liked-post-ids";
const LIKES_UPDATED_EVENT = "airly:likes-updated";

const readLikedPostIds = (): Set<string> => {
  try {
    const raw = localStorage.getItem(LIKED_POST_IDS_KEY);
    if (!raw) return new Set();

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return new Set();

    return new Set(
      parsed.filter((id) => typeof id === "string" && id.trim().length > 0),
    );
  } catch {
    return new Set();
  }
};

const writeLikedPostIds = (ids: Set<string>) => {
  localStorage.setItem(LIKED_POST_IDS_KEY, JSON.stringify(Array.from(ids)));
};

export const isPostLikedLocally = (postId?: string): boolean => {
  if (!postId) return false;
  return readLikedPostIds().has(postId);
};

export const setPostLikedLocally = (postId: string, liked: boolean) => {
  if (!postId) return;

  const likedIds = readLikedPostIds();
  if (liked) {
    likedIds.add(postId);
  } else {
    likedIds.delete(postId);
  }

  writeLikedPostIds(likedIds);
  window.dispatchEvent(new Event(LIKES_UPDATED_EVENT));
};

export const seedLikedPosts = (postIds: string[]) => {
  const likedIds = readLikedPostIds();

  postIds.forEach((id) => {
    if (id) {
      likedIds.add(id);
    }
  });

  writeLikedPostIds(likedIds);
  window.dispatchEvent(new Event(LIKES_UPDATED_EVENT));
};

export const applyLocalLikedState = <
  T extends { id?: string; _id?: string; isLiked?: boolean },
>(
  posts: T[],
): T[] => {
  const likedIds = readLikedPostIds();

  return posts.map((post) => {
    const postId = post._id || post.id;
    if (!postId) return post;

    return {
      ...post,
      isLiked: likedIds.has(postId) || Boolean(post.isLiked),
    };
  });
};

export const subscribeToLikeState = (callback: () => void): (() => void) => {
  window.addEventListener(LIKES_UPDATED_EVENT, callback);

  return () => {
    window.removeEventListener(LIKES_UPDATED_EVENT, callback);
  };
};
