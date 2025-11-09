import React, { useEffect, useState } from 'react';
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
} from '@ionic/react';
import { heart, heartOutline, chatbubbleOutline, close, searchOutline } from 'ionicons/icons';
import { RefresherEventDetail } from '@ionic/react';
import { useUser } from '../contexts/UserContext';
import { usePosts } from '../contexts/PostsContext';
import { CommentsApi, Comment } from '../services/comments';
import { getAvatarUrl, formatRelativeTime, formatDuration } from '../lib/utils';

type ToastColor = 'success' | 'danger' | 'warning';

interface CommunityFeedTabProps {
  onToast?: (message: string, color?: ToastColor) => void;
}

const CommunityFeedTab: React.FC<CommunityFeedTabProps> = ({ onToast }) => {
  const { currentUser, loading: userLoading } = useUser();
  const { posts, loading, error, fetchFeed, toggleLike, addComment } = usePosts();

  const [isCommentsModalOpen, setIsCommentsModalOpen] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState<number | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  useEffect(() => {
    if (!currentUser || userLoading) return;
    fetchFeed();
  }, [currentUser, userLoading]);

  const notify = (message: string, color: ToastColor = 'success') => {
    onToast?.(message, color);
  };

  const handleRefresh = async (event: CustomEvent<RefresherEventDetail>) => {
    try {
      if (!currentUser || userLoading) return;
      await fetchFeed();
    } finally {
      event.detail.complete();
    }
  };

  const handleLike = async (postId: number) => {
    try {
      await toggleLike(postId);
    } catch (err) {
      console.error('Failed to update like:', err);
      notify('Failed to update like', 'danger');
    }
  };

  const fetchComments = async (postId: number) => {
    try {
      setLoadingComments(true);
      const fetchedComments = await CommentsApi.getComments(postId);
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
      await addComment(selectedPostId, newComment.trim());
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

  return (
    <>
      <div className="feed-tab">
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
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

        {loading ? (
          <div className="ion-text-center ion-padding">
            <IonSpinner name="crescent" />
            <p>Loading posts...</p>
          </div>
        ) : error ? (
          <div className="ion-text-center ion-padding">
            <p style={{ color: 'var(--ion-color-danger)' }}>{error}</p>
            <IonButton onClick={() => fetchFeed()} size="small">
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
          <div className="feed-posts">
            {posts.map((post) => (
              <IonCard key={post.post_id} className="post-card">
                <IonCardContent>
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                    <IonAvatar style={{ width: '40px', height: '40px', marginRight: '12px' }}>
                      <img src={getAvatarUrl(post.author_avatar)} alt={post.author_name} />
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
            <div className="ion-text-center ion-padding">
              <IonSpinner name="crescent" />
              <p>Loading comments...</p>
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
