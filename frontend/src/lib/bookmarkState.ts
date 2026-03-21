const BOOKMARKED_POST_IDS_KEY = "airly-bookmarked-post-ids";
const BOOKMARKS_UPDATED_EVENT = "airly:bookmarks-updated";

const readBookmarkedPostIds = (): Set<string> => {
  try {
    const raw = localStorage.getItem(BOOKMARKED_POST_IDS_KEY);
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

const writeBookmarkedPostIds = (ids: Set<string>) => {
  localStorage.setItem(
    BOOKMARKED_POST_IDS_KEY,
    JSON.stringify(Array.from(ids)),
  );
};

export const isPostBookmarkedLocally = (postId?: string): boolean => {
  if (!postId) return false;
  return readBookmarkedPostIds().has(postId);
};

export const setPostBookmarkedLocally = (
  postId: string,
  bookmarked: boolean,
) => {
  if (!postId) return;

  const bookmarkedIds = readBookmarkedPostIds();

  if (bookmarked) {
    bookmarkedIds.add(postId);
  } else {
    bookmarkedIds.delete(postId);
  }

  writeBookmarkedPostIds(bookmarkedIds);
  window.dispatchEvent(new Event(BOOKMARKS_UPDATED_EVENT));
};

export const seedBookmarkedPosts = (postIds: string[]) => {
  const bookmarkedIds = readBookmarkedPostIds();

  postIds.forEach((id) => {
    if (id) {
      bookmarkedIds.add(id);
    }
  });

  writeBookmarkedPostIds(bookmarkedIds);
  window.dispatchEvent(new Event(BOOKMARKS_UPDATED_EVENT));
};

export const subscribeToBookmarkState = (
  callback: () => void,
): (() => void) => {
  window.addEventListener(BOOKMARKS_UPDATED_EVENT, callback);

  return () => {
    window.removeEventListener(BOOKMARKS_UPDATED_EVENT, callback);
  };
};
