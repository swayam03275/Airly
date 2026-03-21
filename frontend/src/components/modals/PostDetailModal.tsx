import {
  ArrowLeft,
  ArrowRight,
  Bookmark,
  Eye,
  Heart,
  Link,
  MessageCircle,
  MoreHorizontal,
  Pencil,
  Share,
  Trash2,
  X,
} from "lucide-react";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  isPostBookmarkedLocally,
  setPostBookmarkedLocally,
  subscribeToBookmarkState,
} from "../../lib/bookmarkState";
import {
  isPostLikedLocally,
  setPostLikedLocally,
  subscribeToLikeState,
} from "../../lib/likeState";
import { tweetService } from "../../services/tweetService";
import { RootState } from "../../store";
import { Post } from "../../types";

interface PostDetailModalProps {
  post: Post;
  onClose: () => void;
  onPrevious?: () => void;
  onNext?: () => void;
  hasPrevious?: boolean;
  hasNext?: boolean;
  onPostUpdate?: (updatedPost: Partial<Post>) => void;
  onEdit?: (post: Post) => void;
  onDelete?: (post: Post) => void;
}

interface Comment {
  _id: string;
  content: string;
  user: {
    _id: string;
    username: string;
    fullName: string;
    pfp: string;
  };
  likes: number;
  likedBy: unknown[];
  replyCount: number;
  createdAt: string;
  edited?: boolean;
  editedAt?: string;
}

export const PostDetailModal: React.FC<PostDetailModalProps> = ({
  post,
  onClose,
  onPrevious,
  onNext,
  hasPrevious,
  hasNext,
  onPostUpdate,
  onEdit,
  onDelete,
}) => {
  const navigate = useNavigate();
  const postWithMetrics = post as Post & {
    likesCount?: number;
    likeCount?: number;
    commentsCount?: number;
    commentCount?: number;
  };

  const resolvedLikeCount = Number(
    postWithMetrics.likes ??
      postWithMetrics.likesCount ??
      postWithMetrics.likeCount ??
      0,
  );

  const resolvedCommentCount = Number(
    postWithMetrics.comments ??
      postWithMetrics.commentsCount ??
      postWithMetrics.commentCount ??
      0,
  );

  const [isLiked, setIsLiked] = useState(post.isLiked || false);
  const [likeCount, setLikeCount] = useState(resolvedLikeCount);
  const [isBookmarked, setIsBookmarked] = useState(post.isBookmarked || false);
  const [isTogglingLike, setIsTogglingLike] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [isLoadingMoreComments, setIsLoadingMoreComments] = useState(false);
  const [commentsCursor, setCommentsCursor] = useState<string | undefined>(
    undefined,
  );
  const [hasMoreComments, setHasMoreComments] = useState(false);
  const [commentCount, setCommentCount] = useState(resolvedCommentCount);
  const commentsContainerRef = useRef<HTMLDivElement | null>(null);
  const commentsSentinelRef = useRef<HTMLDivElement | null>(null);

  const COMMENTS_BATCH = 3;

  const currentUser = useSelector((state: RootState) => state.auth.user);
  const isOwner = currentUser && post.user && currentUser._id === post.user._id;

  const userHandle =
    post.user?.username ||
    post.author?.name?.toLowerCase().replace(/\s+/g, "") ||
    "user";
  const postId = post._id || post.id;

  useEffect(() => {
    const localLiked = isPostLikedLocally(postId);
    const localBookmarked = isPostBookmarkedLocally(postId);
    setIsLiked(localLiked || post.isLiked || false);
    setLikeCount(resolvedLikeCount);
    setIsBookmarked(localBookmarked || post.isBookmarked || false);
    setCommentCount(resolvedCommentCount);
  }, [
    postId,
    post._id,
    post.id,
    post.isLiked,
    post.likes,
    postWithMetrics.likesCount,
    postWithMetrics.likeCount,
    post.isBookmarked,
    post.comments,
    postWithMetrics.commentsCount,
    postWithMetrics.commentCount,
    resolvedLikeCount,
    resolvedCommentCount,
  ]);

  useEffect(() => {
    if (!postId) return;

    return subscribeToLikeState(() => {
      setIsLiked(isPostLikedLocally(postId));
    });
  }, [postId]);

  useEffect(() => {
    if (!postId) return;

    return subscribeToBookmarkState(() => {
      setIsBookmarked(isPostBookmarkedLocally(postId));
    });
  }, [postId]);

  useEffect(() => {
    const syncPostReactions = async () => {
      if (!postId) return;

      try {
        const [likedResponse, likeCountResponse, bookmarkedResponse] =
          await Promise.all([
            tweetService.checkUserLiked(postId),
            tweetService.getLikeCount(postId),
            tweetService.checkUserBookmarked(postId),
          ]);

        setIsLiked(Boolean(likedResponse.data?.liked));
        setLikeCount(Number(likeCountResponse.data?.likeCount ?? 0));
        setPostLikedLocally(postId, Boolean(likedResponse.data?.liked));
        setIsBookmarked(Boolean(bookmarkedResponse.data?.bookmarked));
        setPostBookmarkedLocally(
          postId,
          Boolean(bookmarkedResponse.data?.bookmarked),
        );
      } catch (error) {
        console.error("Failed to sync post reactions:", error);
      }
    };

    syncPostReactions();
  }, [postId]);

  const fetchInitialComments = useCallback(async () => {
    if (!postId) return;

    try {
      setIsLoadingComments(true);

      const [commentsResponse, countResponse] = await Promise.all([
        tweetService.getComments(postId, undefined, COMMENTS_BATCH),
        tweetService.getCommentCount(postId),
      ]);

      const fetchedComments = commentsResponse.data.comments || [];
      setComments(fetchedComments);
      setHasMoreComments(Boolean(commentsResponse.data.hasMore));
      setCommentsCursor(commentsResponse.data.nextCursor);

      const actualCommentCount = countResponse.data.count;
      setCommentCount(actualCommentCount);

      if (onPostUpdate && actualCommentCount !== post.comments) {
        onPostUpdate({
          ...post,
          comments: actualCommentCount,
        });
      }
    } catch (error) {
      console.error("Failed to fetch comments:", error);
      setComments([]);
    } finally {
      setIsLoadingComments(false);
    }
  }, [COMMENTS_BATCH, onPostUpdate, post, postId]);

  const fetchMoreComments = useCallback(async () => {
    if (!postId || !hasMoreComments || isLoadingMoreComments) return;

    try {
      setIsLoadingMoreComments(true);

      const commentsResponse = await tweetService.getComments(
        postId,
        commentsCursor,
        COMMENTS_BATCH,
      );

      const fetchedComments = commentsResponse.data.comments || [];
      setComments((prev) => [...prev, ...fetchedComments]);
      setHasMoreComments(Boolean(commentsResponse.data.hasMore));
      setCommentsCursor(commentsResponse.data.nextCursor);
    } catch (error) {
      console.error("Failed to load more comments:", error);
    } finally {
      setIsLoadingMoreComments(false);
    }
  }, [
    COMMENTS_BATCH,
    commentsCursor,
    hasMoreComments,
    isLoadingMoreComments,
    postId,
  ]);

  useEffect(() => {
    if (postId) {
      fetchInitialComments();
    }
  }, [fetchInitialComments, postId]);

  const handleLoadMoreComments = useCallback(() => {
    if (!hasMoreComments || isLoadingMoreComments) return;
    fetchMoreComments();
  }, [fetchMoreComments, hasMoreComments, isLoadingMoreComments]);

  useEffect(() => {
    const root = commentsContainerRef.current;
    const target = commentsSentinelRef.current;

    if (!root || !target) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          handleLoadMoreComments();
        }
      },
      {
        root,
        threshold: 0.1,
      },
    );

    observer.observe(target);

    return () => {
      observer.disconnect();
    };
  }, [comments.length, handleLoadMoreComments]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      } else if (event.key === "ArrowLeft" && hasPrevious && onPrevious) {
        onPrevious();
      } else if (event.key === "ArrowRight" && hasNext && onNext) {
        onNext();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose, onPrevious, onNext, hasPrevious, hasNext]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleUserClick = () => {
    onClose();
    if (userHandle) {
      navigate(`/profile/${userHandle}`);
    }
  };

  const handleLike = async () => {
    const postId = post._id || post.id;
    if (isTogglingLike) return;
    if (!postId) {
      console.error("Post ID is missing");
      return;
    }

    const nextLiked = !isLiked;
    const nextLikeCount = Math.max(0, likeCount + (nextLiked ? 1 : -1));

    setIsLiked(nextLiked);
    setLikeCount(nextLikeCount);
    setIsTogglingLike(true);
    try {
      const response = await tweetService.toggleLike(postId);
      setIsLiked(response.data.liked);
      setLikeCount(response.data.likeCount);
      setPostLikedLocally(postId, response.data.liked);

      if (onPostUpdate) {
        onPostUpdate({
          ...post,
          likes: response.data.likeCount,
          isLiked: response.data.liked,
        });
      }
    } catch (error) {
      console.error("Failed to toggle like:", error);
      setIsLiked(!nextLiked);
      setLikeCount(likeCount);
    } finally {
      setIsTogglingLike(false);
    }
  };

  const handleBookmark = async () => {
    const postId = post._id || post.id;
    if (!postId) {
      console.error("Post ID is missing");
      return;
    }
    try {
      const response = await tweetService.toggleBookmark(postId);
      setIsBookmarked(response.data.bookmarked);
      setPostBookmarkedLocally(postId, response.data.bookmarked);

      if (onPostUpdate) {
        onPostUpdate({
          ...post,
          isBookmarked: response.data.bookmarked,
        });
      }
    } catch (error) {
      console.error("Failed to toggle bookmark:", error);
    }
  };

  const handleCopyLink = async () => {
    try {
      const url = `${window.location.origin}/dashboard/post/${post._id || post.id}`;
      await navigator.clipboard.writeText(url);
      setShowMenu(false);
    } catch (error) {
      console.error("Error copying link:", error);
    }
  };

  const handleShare = async () => {
    try {
      const url = `${window.location.origin}/dashboard/post/${post._id || post.id}`;
      if (navigator.share) {
        await navigator.share({
          title: post.title,
          text: post.content || post.description,
          url: url,
        });
      } else {
        await navigator.clipboard.writeText(url);
      }
    } catch (error) {
      console.error("Error sharing:", error);
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newComment.trim()) {
      const postId = post._id || post.id;
      if (!postId) {
        console.error("Post ID not found");
        return;
      }

      try {
        const response = await tweetService.createComment(
          postId,
          newComment.trim(),
        );
        setNewComment("");

        if (response.data) {
          setComments((prev) => [response.data, ...prev]);
          setCommentCount((prev) => prev + 1);
          try {
            const countResponse = await tweetService.getCommentCount(postId);
            const actualCommentCount = countResponse.data.count;
            setCommentCount(actualCommentCount);

            if (onPostUpdate) {
              onPostUpdate({
                ...post,
                comments: actualCommentCount,
              });
            }
          } catch (countError) {
            console.error("Failed to fetch updated comment count:", countError);
            const newCommentCount = commentCount + 1;
            setCommentCount(newCommentCount);

            if (onPostUpdate) {
              onPostUpdate({
                ...post,
                comments: newCommentCount,
              });
            }
          }
        }
      } catch (error: unknown) {
        console.error("Failed to post comment:", error);
      }
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
    >
      <div className="relative max-w-6xl w-full max-h-[92vh] bg-white rounded-3xl shadow-2xl overflow-hidden flex border border-white/40">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-10 h-10 bg-black/20 hover:bg-black/40 text-white rounded-full flex items-center justify-center transition-all duration-200 backdrop-blur-sm"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Media Section */}
        <div className="flex-1 bg-black relative min-h-0 group">
          {/* Navigation Arrows */}
          <div className="absolute inset-0 flex items-center justify-between px-4 z-10">
            {hasPrevious && onPrevious && (
              <button
                onClick={onPrevious}
                className="w-10 h-10 bg-black/30 hover:bg-black/50 text-white rounded-full flex items-center justify-center transition-all duration-200 backdrop-blur-sm opacity-0 group-hover:opacity-100"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            {/* Empty div for spacing */}
            {!hasPrevious && <div />}

            {hasNext && onNext && (
              <button
                onClick={onNext}
                className="w-10 h-10 bg-black/30 hover:bg-black/50 text-white rounded-full flex items-center justify-center transition-all duration-200 backdrop-blur-sm opacity-0 group-hover:opacity-100"
              >
                <ArrowRight className="w-5 h-5" />
              </button>
            )}
          </div>

          <div className="absolute inset-0 flex items-center justify-center">
            {post.mediaType === "video" ? (
              <video
                src={post.mediaUrl || post.media || post.imageUrl}
                controls
                className="max-w-full max-h-full object-contain"
                autoPlay
                loop
              />
            ) : (
              <img
                src={post.mediaUrl || post.media || post.imageUrl}
                alt={post.title}
                className="max-w-full max-h-full object-contain"
              />
            )}
          </div>

          {/* Views Counter Overlay */}
          {post.views && post.views > 0 && (
            <div className="absolute top-4 left-4 bg-black/50 text-white px-3 py-1 rounded-lg text-sm flex items-center space-x-2 backdrop-blur-sm">
              <Eye className="w-4 h-4" />
              <span>{post.views.toLocaleString()} views</span>
            </div>
          )}
        </div>

        {/* Details Section */}
        <div className="w-[440px] max-w-[45vw] flex flex-col border-l border-gray-100 bg-white">
          {/* Header */}
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-3 flex-1 relative">
                <button
                  onClick={handleUserClick}
                  className="flex items-center space-x-3 hover:bg-gray-50 rounded-lg p-2 -m-2 transition-colors duration-200"
                >
                  <img
                    src={post.user?.pfp || post.author?.avatar}
                    alt={post.user?.fullName || post.author?.name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div className="text-left">
                    <p className="font-semibold text-gray-900">
                      {post.user?.fullName || post.author?.name}
                    </p>
                    <p className="text-sm text-gray-500">@{userHandle}</p>
                  </div>
                </button>
              </div>

              {/* Three Dot Menu */}
              <div className="relative">
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
                >
                  <MoreHorizontal className="w-5 h-5 text-gray-600" />
                </button>

                {/* Dropdown Menu */}
                {showMenu && (
                  <div className="absolute top-full right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-20 min-w-48 py-1">
                    <button
                      onClick={handleCopyLink}
                      className="w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors flex items-center space-x-2 text-gray-700"
                    >
                      <Link className="w-4 h-4" />
                      <span>Copy link</span>
                    </button>
                    <button
                      onClick={handleBookmark}
                      className="w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors flex items-center space-x-2 text-gray-700"
                    >
                      <Bookmark
                        className={`w-4 h-4 ${isBookmarked ? "fill-current text-amber-600" : ""}`}
                      />
                      <span>
                        {isBookmarked ? "Remove bookmark" : "Bookmark"}
                      </span>
                    </button>
                    {isOwner && (
                      <>
                        <div className="border-t border-gray-100 my-1"></div>
                        <button
                          onClick={() => {
                            onEdit?.(post);
                            setShowMenu(false);
                          }}
                          className="w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors flex items-center space-x-2 text-gray-700"
                        >
                          <Pencil className="w-4 h-4" />
                          <span>Edit post</span>
                        </button>
                        <button
                          onClick={() => {
                            onDelete?.(post);
                            setShowMenu(false);
                          }}
                          className="w-full text-left px-4 py-2 hover:bg-red-50 transition-colors flex items-center space-x-2 text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span>Delete post</span>
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto bg-gray-50/40">
            <div className="p-4">
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                {post.title}
              </h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                {post.content || post.description}
              </p>

              {/* Tags */}
              {post.tags && post.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {post.tags.map((tag: string, index: number) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-blue-50 text-blue-600 rounded-full text-sm font-medium cursor-pointer hover:bg-blue-100 transition-colors"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Stats */}
              <div className="flex items-center text-sm text-gray-500 mb-4 space-x-4">
                <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                {post.views && post.views > 0 && (
                  <>
                    <span>•</span>
                    <div className="flex items-center space-x-1">
                      <Eye className="w-4 h-4" />
                      <span>{post.views.toLocaleString()} views</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Comments Section */}
            <div className="border-t border-gray-100 p-4 bg-white">
              <h3 className="font-semibold text-gray-900 mb-3">
                Comments ({commentCount})
              </h3>

              {isLoadingComments && comments.length === 0 ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-amber-500"></div>
                </div>
              ) : comments.length > 0 ? (
                <div
                  ref={commentsContainerRef}
                  className="space-y-3 max-h-72 overflow-y-auto pr-1"
                >
                  {comments.map((comment) => (
                    <div key={comment._id} className="flex space-x-3">
                      <img
                        src={comment.user.pfp}
                        alt={comment.user.fullName}
                        className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="bg-gray-50 rounded-lg px-3 py-2">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="font-medium text-sm text-gray-900">
                              {comment.user.fullName}
                            </span>
                            <span className="text-xs text-gray-500">
                              @{comment.user.username}
                            </span>
                            <span className="text-xs text-gray-500">•</span>
                            <span className="text-xs text-gray-500">
                              {new Date(comment.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700 leading-relaxed">
                            {comment.content}
                          </p>
                        </div>

                        {comment.edited && (
                          <div className="mt-1 text-xs text-gray-400 italic">
                            edited
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  {isLoadingMoreComments && (
                    <div className="py-2 text-center text-xs text-gray-500">
                      Loading more comments...
                    </div>
                  )}

                  <div ref={commentsSentinelRef} className="h-1" />
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No comments yet. Be the first to comment!</p>
                </div>
              )}
            </div>
          </div>

          {/* Actions Footer */}
          <div className="border-t border-gray-100 p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-1">
                <button
                  onClick={handleLike}
                  disabled={isTogglingLike}
                  className={`flex items-center space-x-1 px-3 py-2 hover:bg-gray-100 rounded-lg transition-colors duration-200 ${isLiked ? "text-red-500" : ""}`}
                >
                  <Heart
                    className={`w-5 h-5 ${isLiked ? "fill-current text-red-500" : "text-gray-600"}`}
                  />
                  <span className="text-sm font-medium text-gray-700">
                    {likeCount.toLocaleString()}
                  </span>
                </button>
                <button className="flex items-center space-x-1 px-3 py-2 hover:bg-gray-100 rounded-lg transition-colors duration-200">
                  <MessageCircle className="w-5 h-5 text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">
                    {commentCount}
                  </span>
                </button>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleBookmark}
                  className={`p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200 ${isBookmarked ? "text-amber-500" : ""}`}
                >
                  <Bookmark
                    className={`w-5 h-5 ${isBookmarked ? "fill-current text-amber-500" : "text-gray-600"}`}
                  />
                </button>
                <button
                  onClick={handleShare}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                >
                  <Share className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            </div>

            {/* Comment Input */}
            <form onSubmit={handleCommentSubmit} className="flex space-x-2">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200"
                maxLength={280}
              />
              <button
                type="submit"
                disabled={!newComment.trim()}
                className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 font-medium"
              >
                Post
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Click outside to close menus */}
      {showMenu && (
        <div
          className="fixed inset-0 z-10"
          onClick={() => {
            setShowMenu(false);
          }}
        />
      )}
    </div>
  );
};
