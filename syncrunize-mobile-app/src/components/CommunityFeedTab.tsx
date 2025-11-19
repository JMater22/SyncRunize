import React, { useEffect, useState, useRef } from 'react';
import {
  IonAvatar,
  IonButton,
  IonCard,
  IonCardContent,
  IonContent,
  IonImg,
  IonModal,
  IonRefresher,
  IonRefresherContent,
  IonSpinner,
  IonTextarea,
  IonTitle,
  IonToolbar,
  IonHeader,
  IonIcon,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
} from '@ionic/react';
import { heart, heartOutline, chatbubbleOutline, close, searchOutline } from 'ionicons/icons';
import { RefresherEventDetail, InfiniteScrollCustomEvent } from '@ionic/react';
import { useUser } from '../contexts/UserContext';
import { PostsApi, Post } from '../services/posts';
import { LikesApi } from '../services/likes';
import { CommentsApi, Comment } from '../services/comments';
import { getAvatarUrl, formatRelativeTime, formatDuration } from '../lib/utils';
import PostCardSkeleton from './skeletons/PostCardSkeleton';
import CommentSkeleton from './skeletons/CommentSkeleton';

type ToastColor = 'success' | 'danger' | 'warning';

interface CommunityFeedTabProps {
  onToast?: (message: string, color?: ToastColor) => void;
}

const POSTS_PER_PAGE = 20;

const CommunityFeedTab: React.FC<CommunityFeedTabProps> = ({ onToast }) => {
  const { currentUser, loading: userLoading } = useUser();

  // Pagination states
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const hasLoadedRef = useRef(false);

  // Comments states
  const [isCommentsModalOpen, setIsCommentsModalOpen] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState<number | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  // Initial load - only once, not on every tab switch
  useEffect(() => {
    if (!currentUser || userLoading) return;

    // Try to restore posts from sessionStorage first
    const cachedPostsKey = `feed_posts_${currentUser.user_id}`;
    const cachedPosts = sessionStorage.getItem(cachedPostsKey);

    if (cachedPosts && posts.length === 0) {
      try {
        const parsedPosts = JSON.parse(cachedPosts);
        console.log('[CommunityFeedTab] Restoring', parsedPosts.length, 'posts from cache');
        setPosts(parsedPosts);
        hasLoadedRef.current = true;
        return; // Skip fetch, use cached data
      } catch (err) {
        console.error('[CommunityFeedTab] Failed to parse cached posts:', err);
        sessionStorage.removeItem(cachedPostsKey);
      }
    }

    // Skip fetch if we already have posts in state
    if (posts.length > 0 && hasLoadedRef.current) {
      console.log('[CommunityFeedTab] Posts already in state, skipping fetch');
      return;
    }

    // Only fetch if we don't have cached data
    if (!hasLoadedRef.current) {
      console.log('[CommunityFeedTab] No cache found, fetching feed');
      loadInitialFeed();
    }
  }, [currentUser, userLoading, posts.length]);

  const notify = (message: string, color: ToastColor = 'success') => {
    onToast?.(message, color);
  };

  const loadInitialFeed = async () => {
    console.log('[CommunityFeedTab] loadInitialFeed called');
    try {
      setLoading(true);
      setError(null);
      const fetchedPosts = await PostsApi.getFeed(POSTS_PER_PAGE, 0);
      console.log('[CommunityFeedTab] Fetched posts:', fetchedPosts.length);
      setPosts(fetchedPosts);
      setOffset(POSTS_PER_PAGE);
      setHasMore(fetchedPosts.length === POSTS_PER_PAGE);
      hasLoadedRef.current = true; // Mark as loaded

      // ✅ FIX: Cache posts with size limit to prevent bloat
      // Limit to 50 most recent posts instead of unbounded growth
      if (currentUser) {
        const postsToCache = fetchedPosts.slice(0, 50); // Max 50 posts (~100KB)
        sessionStorage.setItem(`feed_loaded_${currentUser.user_id}`, 'true');
        sessionStorage.setItem(`feed_posts_${currentUser.user_id}`, JSON.stringify(postsToCache));
      }
    } catch (err: any) {
      console.error('[CommunityFeedTab] Failed to fetch feed:', err);
      setError(err.response?.data?.error || 'Failed to load feed');
    } finally {
      setLoading(false);
    }
  };

  const loadMorePosts = async (event: InfiniteScrollCustomEvent) => {
    try {
      const fetchedPosts = await PostsApi.getFeed(POSTS_PER_PAGE, offset);
      const updatedPosts = [...posts, ...fetchedPosts];
      setPosts(updatedPosts);
      setOffset(prev => prev + POSTS_PER_PAGE);
      setHasMore(fetchedPosts.length === POSTS_PER_PAGE);

      // ✅ FIX: Limit cache to 50 posts to prevent unbounded growth
      // Previous bug: cache grew to 400KB+ after 10 scrolls (200 posts)
      if (currentUser) {
        const postsToCache = updatedPosts.slice(0, 50); // Keep only most recent 50
        sessionStorage.setItem(`feed_posts_${currentUser.user_id}`, JSON.stringify(postsToCache));
      }
    } catch (err: any) {
      console.error('Failed to load more posts:', err);
      notify('Failed to load more posts', 'danger');
    } finally {
      event.target.complete();
    }
  };

  const handleRefresh = async (event: CustomEvent<RefresherEventDetail>) => {
    try {
      console.log('[CommunityFeedTab] Pull-to-refresh triggered');
      const fetchedPosts = await PostsApi.getFeed(POSTS_PER_PAGE, 0);
      setPosts(fetchedPosts);
      setOffset(POSTS_PER_PAGE);
      setHasMore(fetchedPosts.length === POSTS_PER_PAGE);
      hasLoadedRef.current = true; // Keep loaded state

      // Update cache with refreshed posts
      if (currentUser) {
        sessionStorage.setItem(`feed_posts_${currentUser.user_id}`, JSON.stringify(fetchedPosts));
      }

      console.log('[CommunityFeedTab] Refreshed with', fetchedPosts.length, 'posts');
    } catch (err: any) {
      console.error('Failed to refresh feed:', err);
      notify('Failed to refresh feed', 'danger');
    } finally {
      event.detail.complete();
    }
  };

  const handleLike = async (postId: number) => {
    try {
      // Optimistic update
      const updatedPosts = posts.map(post =>
        post.post_id === postId
          ? { ...post, is_liked: !post.is_liked, likes_count: post.is_liked ? post.likes_count - 1 : post.likes_count + 1 }
          : post
      );
      setPosts(updatedPosts);

      // Update cache
      if (currentUser) {
        sessionStorage.setItem(`feed_posts_${currentUser.user_id}`, JSON.stringify(updatedPosts));
      }

      await LikesApi.toggleLike(postId);
    } catch (err) {
      console.error('Failed to update like:', err);
      // Revert optimistic update on error
      const revertedPosts = posts.map(post =>
        post.post_id === postId
          ? { ...post, is_liked: !post.is_liked, likes_count: post.is_liked ? post.likes_count - 1 : post.likes_count + 1 }
          : post
      );
      setPosts(revertedPosts);

      // Update cache with reverted state
      if (currentUser) {
        sessionStorage.setItem(`feed_posts_${currentUser.user_id}`, JSON.stringify(revertedPosts));
      }

      notify('Failed to update like', 'danger');
    }
  };

  const fetchComments = async (postId: number) => {
    try {
      setLoadingComments(true);
      const fetchedComments = await CommentsApi.getComments(postId, 50, 0); // Load first 50 comments
      setComments(fetchedComments);
    } catch (err) {
      console.error('Failed to fetch comments:', err);
      notify('Failed to load comments', 'danger');
    } finally {
      setLoadingComments(false);
    }
  };

  const openComments = async (postId: number) => {
    setSelectedPostId(postId);
    setIsCommentsModalOpen(true);
    await fetchComments(postId);
  };

  const handleAddComment = async () => {
    if (!selectedPostId || !newComment.trim()) return;

    try {
      setSubmittingComment(true);
      await CommentsApi.addComment(selectedPostId, { content: newComment.trim() });

      // Update comment count optimistically
      const updatedPosts = posts.map(post =>
        post.post_id === selectedPostId
          ? { ...post, comments_count: post.comments_count + 1 }
          : post
      );
      setPosts(updatedPosts);

      // Update cache
      if (currentUser) {
        sessionStorage.setItem(`feed_posts_${currentUser.user_id}`, JSON.stringify(updatedPosts));
      }

      await fetchComments(selectedPostId);
      setNewComment('');
      notify('Comment added successfully', 'success');
    } catch (err) {
      console.error('Failed to add comment:', err);
      notify('Failed to add comment', 'danger');
    } finally {
      setSubmittingComment(false);
    }
  };

  const closeCommentsModal = () => {
    setIsCommentsModalOpen(false);
    setSelectedPostId(null);
    setComments([]);
    setNewComment('');
  };

  if (!currentUser) {
    return (
      <div className="ion-text-center ion-padding">
        <p style={{ color: 'var(--ion-color-medium)' }}>
          Please log in to view the community feed.
        </p>
      </div>
    );
  }

  console.log('[CommunityFeedTab] Rendering with posts:', posts.length);

  return (
    <>
      <div className="feed-tab-container">
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh} pullMin={90} pullMax={150}>
          <IonRefresherContent></IonRefresherContent>
        </IonRefresher>

        <IonButton
          expand="block"
          fill="outline"
          routerLink="/search-runners"
          style={{ margin: '16px' }}
        >
          <IonIcon slot="start" icon={searchOutline} />
          Find Athletes
        </IonButton>

        {loading && posts.length === 0 ? (
          // Show skeleton loaders on initial load
          <div className="feed-posts">
            {[1, 2, 3].map(i => <PostCardSkeleton key={i} />)}
          </div>
        ) : error ? (
          <div className="ion-text-center ion-padding">
            <p style={{ color: 'var(--ion-color-danger)' }}>{error}</p>
            <IonButton onClick={loadInitialFeed} size="small">
              Retry
            </IonButton>
          </div>
        ) : posts.length === 0 ? (
          <div className="ion-text-center ion-padding">
            <p style={{ marginTop: '2rem', color: 'var(--ion-color-medium)' }}>
              No posts yet. Follow athletes to see their activities!
            </p>
            <IonButton routerLink="/search-runners" size="small">
              Find Athletes
            </IonButton>
          </div>
        ) : (
          <>
            <div className="feed-posts">
              {posts.map((post) => (
              <IonCard key={post.post_id} className="post-card">
                <IonCardContent>
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                    <IonAvatar style={{ width: '40px', height: '40px', marginRight: '12px' }}>
                      <img
                        src={getAvatarUrl(post.author_avatar)}
                        alt={post.author_name}
                        onError={(e) => {
                          console.warn('[CommunityFeed] Avatar failed to load for user:', post.author_username);
                          // Fallback to default avatar
                          const target = e.target as HTMLImageElement;
                          target.src = 'https://ionicframework.com/docs/img/demos/avatar.svg';
                        }}
                      />
                    </IonAvatar>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>{post.author_name}</h3>
                      <p style={{ margin: 0, fontSize: '14px', color: 'var(--ion-color-medium)' }}>
                        @{post.author_username} · {formatRelativeTime(post.created_at)}
                      </p>
                    </div>
                  </div>

                  {post.content && (
                    <p style={{ marginBottom: '12px', fontSize: '15px' }}>{post.content}</p>
                  )}

                  {post.route_id && (
                    <div
                      style={{
                        backgroundColor: 'var(--ion-color-light)',
                        padding: '12px',
                        borderRadius: '8px',
                        marginBottom: '12px',
                      }}
                    >
                      {post.route_name && (
                        <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: 600 }}>
                          {post.route_name}
                        </h4>
                      )}
                      <div style={{ display: 'flex', justifyContent: 'space-around', fontSize: '13px' }}>
                        {post.distance_km && (
                          <div>
                            <strong>{post.distance_km.toFixed(2)} km</strong>
                            <p style={{ margin: 0, color: 'var(--ion-color-medium)' }}>Distance</p>
                          </div>
                        )}
                        {post.duration_seconds && (
                          <div>
                            <strong>{formatDuration(post.duration_seconds)}</strong>
                            <p style={{ margin: 0, color: 'var(--ion-color-medium)' }}>Duration</p>
                          </div>
                        )}
                        {post.average_pace && (
                          <div>
                            <strong>{post.average_pace}</strong>
                            <p style={{ margin: 0, color: 'var(--ion-color-medium)' }}>Pace</p>
                          </div>
                        )}
                        {post.estimated_calories && (
                          <div>
                            <strong>{post.estimated_calories}</strong>
                            <p style={{ margin: 0, color: 'var(--ion-color-medium)' }}>Calories</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {post.snapshot_url && (
                    <IonImg
                      src={post.snapshot_url}
                      alt="Route map"
                      style={{ borderRadius: '8px', marginBottom: '12px' }}
                      onIonError={(e) => {
                        console.warn('[CommunityFeed] Route snapshot failed to load for post:', post.post_id);
                        // Hide the broken image by setting display to none
                        const target = e.target as HTMLElement;
                        if (target) {
                          target.style.display = 'none';
                        }
                      }}
                    />
                  )}

                  <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginTop: '12px' }}>
                    <IonButton
                      fill="clear"
                      size="small"
                      onClick={() => handleLike(post.post_id)}
                      style={{ margin: 0 }}
                    >
                      <IonIcon
                        slot="start"
                        icon={post.is_liked ? heart : heartOutline}
                        color={post.is_liked ? 'danger' : 'medium'}
                      />
                      <span style={{ marginLeft: '4px' }}>{post.likes_count}</span>
                    </IonButton>

                    <IonButton
                      fill="clear"
                      size="small"
                      onClick={() => openComments(post.post_id)}
                      style={{ margin: 0 }}
                    >
                      <IonIcon slot="start" icon={chatbubbleOutline} color="medium" />
                      <span style={{ marginLeft: '4px' }}>{post.comments_count}</span>
                    </IonButton>
                  </div>
                </IonCardContent>
              </IonCard>
            ))}
            </div>

            {/* Infinite Scroll */}
            <IonInfiniteScroll
              onIonInfinite={loadMorePosts}
              threshold="100px"
              disabled={!hasMore}
            >
              <IonInfiniteScrollContent
                loadingSpinner="bubbles"
                loadingText="Loading more posts..."
              ></IonInfiniteScrollContent>
            </IonInfiniteScroll>
          </>
        )}
      </div>

      <IonModal isOpen={isCommentsModalOpen} onDidDismiss={closeCommentsModal}>
        <IonHeader>
          <IonToolbar>
            <IonTitle>Comments</IonTitle>
            <IonButton slot="end" fill="clear" onClick={closeCommentsModal}>
              <IonIcon icon={close} />
            </IonButton>
          </IonToolbar>
        </IonHeader>

        <IonContent className="ion-padding">
          {loadingComments ? (
            // Show skeleton loaders while loading comments
            <div>
              {[1, 2, 3].map(i => <CommentSkeleton key={i} />)}
            </div>
          ) : comments.length === 0 ? (
            <div className="ion-text-center ion-padding">
              <p style={{ color: 'var(--ion-color-medium)' }}>
                No comments yet. Be the first to comment!
              </p>
            </div>
          ) : (
            <div style={{ marginBottom: '80px' }}>
              {comments.map((comment) => (
                <div
                  key={comment.comment_id}
                  style={{
                    display: 'flex',
                    marginBottom: '16px',
                    padding: '12px',
                    backgroundColor: 'var(--ion-color-light)',
                    borderRadius: '8px',
                  }}
                >
                  <IonAvatar style={{ width: '36px', height: '36px', marginRight: '12px', flexShrink: 0 }}>
                    <img src={getAvatarUrl(comment.profile_picture)} alt={comment.name} />
                  </IonAvatar>
                  <div style={{ flex: 1 }}>
                    <div style={{ marginBottom: '4px' }}>
                      <strong style={{ fontSize: '14px' }}>{comment.name}</strong>
                      <span style={{ fontSize: '12px', color: 'var(--ion-color-medium)', marginLeft: '8px' }}>
                        {formatRelativeTime(comment.created_at)}
                      </span>
                    </div>
                    <p style={{ margin: 0, fontSize: '14px' }}>{comment.content}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div
            style={{
              position: 'fixed',
              bottom: 0,
              left: 0,
              right: 0,
              padding: '12px',
              backgroundColor: 'var(--ion-background-color)',
              borderTop: '1px solid var(--ion-color-light)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <IonAvatar style={{ width: '36px', height: '36px', flexShrink: 0 }}>
              <img src={getAvatarUrl(currentUser?.profile_picture)} alt="You" />
            </IonAvatar>
            <IonTextarea
              value={newComment}
              onIonInput={(e) => setNewComment(e.detail.value ?? '')}
              placeholder="Add a comment..."
              rows={1}
              autoGrow={true}
              disabled={submittingComment}
              style={{ flex: 1 }}
            />
            <IonButton onClick={handleAddComment} disabled={!newComment.trim() || submittingComment} size="small">
              {submittingComment ? <IonSpinner name="crescent" /> : 'Post'}
            </IonButton>
          </div>
        </IonContent>
      </IonModal>
    </>
  );
};

export default CommunityFeedTab;
