import React, { useState, useEffect } from "react";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonCard,
  IonCardHeader,
  IonCardContent,
  IonButton,
  IonIcon,
  IonImg,
  IonBackButton,
  IonButtons,
  IonSpinner,
  IonModal,
  IonItem,
  IonLabel,
  IonInput,
  IonTextarea,
  IonAlert,
  IonAvatar,
  IonSelect,
  IonSelectOption
} from "@ionic/react";
import {
  createOutline,
  trashOutline,
  heartOutline,
  heart,
  chatbubbleEllipses,
  chatbubbleOutline,
  eyeOutline,
  lockClosedOutline,
  close,
  locationOutline,
  timeOutline,
  speedometerOutline,
  flameOutline,
  sendOutline
} from "ionicons/icons";
import { useLocation } from "react-router-dom";
import { PostsApi, Post } from "../services/posts";
import { LikesApi, Liker } from "../services/likes";
import { CommentsApi, Comment } from "../services/comments";
import { useUser } from "../contexts/UserContext";
import { formatDurationShort, formatRelativeTime, getAvatarUrl } from "../lib/utils";
import "../theme/Community.css";
import "./View-Activity.css";

interface LocationState {
  userId?: number;
  userName?: string;
}

export default function ViewPosts() {
  const { currentUser } = useUser();
  const location = useLocation<LocationState>();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);

  // Determine which user's posts to fetch
  const userId = location.state?.userId;
  const userName = location.state?.userName;
  const isViewingOtherUser = !!userId;

  // Edit modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | null>(null);

  // Delete alert state
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [postToDelete, setPostToDelete] = useState<number | null>(null);

  // Likes modal state
  const [isLikesModalOpen, setIsLikesModalOpen] = useState(false);
  const [selectedPostLikers, setSelectedPostLikers] = useState<Liker[]>([]);
  const [loadingLikers, setLoadingLikers] = useState(false);

  // Comments modal state
  const [isCommentsModalOpen, setIsCommentsModalOpen] = useState(false);
  const [selectedPostComments, setSelectedPostComments] = useState<Comment[]>([]);
  const [selectedPostId, setSelectedPostId] = useState<number | null>(null);
  const [loadingComments, setLoadingComments] = useState(false);
  const [newComment, setNewComment] = useState("");

  // Fetch posts
  useEffect(() => {
    const fetchPosts = async () => {
      if (!currentUser) return;
      try {
        setLoading(true);
        const data = isViewingOtherUser && userId
          ? await PostsApi.getUserPosts(userId)
          : await PostsApi.getMyPosts();
        setPosts(data);
      } catch (error) {
        console.error("Error fetching posts:", error);
        setPosts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [currentUser, userId, isViewingOtherUser]);

  // Handle edit post
  const handleEditPost = (post: Post) => {
    setEditingPost(post);
    setIsEditModalOpen(true);
  };

  // Handle save post edit
  const handleSavePostEdit = async () => {
    if (!editingPost) return;

    try {
      const updated = await PostsApi.updatePost(editingPost.post_id, {
        content: editingPost.content,
        route_name: editingPost.route_name,
        visibility: editingPost.visibility
      });

      setPosts(prevPosts =>
        prevPosts.map(post =>
          post.post_id === editingPost.post_id ? { ...post, ...updated } : post
        )
      );

      setIsEditModalOpen(false);
      setEditingPost(null);
    } catch (error) {
      console.error("Error updating post:", error);
      alert("Failed to update post");
    }
  };

  // Handle delete post
  const handleDeletePost = async () => {
    if (!postToDelete) return;

    try {
      await PostsApi.deletePost(postToDelete);
      setPosts(prevPosts => prevPosts.filter(post => post.post_id !== postToDelete));
      setShowDeleteAlert(false);
      setPostToDelete(null);
    } catch (error) {
      console.error("Error deleting post:", error);
      alert("Failed to delete post");
    }
  };

  // Handle view likes
  const handleViewLikes = async (postId: number) => {
    try {
      setLoadingLikers(true);
      setIsLikesModalOpen(true);
      const likers = await LikesApi.getLikers(postId);
      setSelectedPostLikers(likers);
    } catch (error) {
      console.error("Error fetching likers:", error);
      setSelectedPostLikers([]);
    } finally {
      setLoadingLikers(false);
    }
  };

  // Handle view comments
  const handleViewComments = async (postId: number) => {
    try {
      setLoadingComments(true);
      setSelectedPostId(postId);
      setIsCommentsModalOpen(true);
      const comments = await CommentsApi.getComments(postId);
      setSelectedPostComments(comments);
    } catch (error) {
      console.error("Error fetching comments:", error);
      setSelectedPostComments([]);
    } finally {
      setLoadingComments(false);
    }
  };

  // Handle toggle like (for viewing other users' posts)
  const handleToggleLike = async (postId: number) => {
    try {
      const response = await LikesApi.toggleLike(postId);

      // Update the post's like status and count
      setPosts(prevPosts =>
        prevPosts.map(post =>
          post.post_id === postId
            ? {
                ...post,
                is_liked: response.liked,
                likes_count: response.liked
                  ? post.likes_count + 1
                  : Math.max(0, post.likes_count - 1)
              }
            : post
        )
      );
    } catch (error) {
      console.error("Error toggling like:", error);
    }
  };

  // Handle add comment
  const handleAddComment = async () => {
    if (!selectedPostId || !newComment.trim()) return;

    try {
      await CommentsApi.addComment(selectedPostId, { content: newComment.trim() });
      setNewComment("");

      // Refresh comments
      const comments = await CommentsApi.getComments(selectedPostId);
      setSelectedPostComments(comments);

      // Update comment count
      setPosts(prevPosts =>
        prevPosts.map(post =>
          post.post_id === selectedPostId
            ? { ...post, comments_count: post.comments_count + 1 }
            : post
        )
      );
    } catch (error) {
      console.error("Error adding comment:", error);
      alert("Failed to add comment");
    }
  };


  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref={isViewingOtherUser ? "/other-profile" : "/home"} />
          </IonButtons>
          <IonTitle>{isViewingOtherUser && userName ? `${userName}'s Posts` : "Your Posts"}</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen className="ion-padding">
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
            <IonSpinner name="crescent" />
          </div>
        ) : posts.length === 0 ? (
          <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
            No posts yet. Complete routes and share them to create posts!
          </div>
        ) : (
          <div className="feed-tab">
            <div className="feed-posts">
              {posts.map((post) => (
                <IonCard key={post.post_id} className="post-card">
                  <IonCardHeader>
                    <div className="post-header">
                      <div className="user-info">
                        <span className="username">{isViewingOtherUser ? post.author_name : "Your Post"}</span>
                        <span className="timestamp">{formatRelativeTime(post.created_at)}</span>
                      </div>
                      {!isViewingOtherUser && (
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <IonButton fill="clear" size="small" onClick={() => handleEditPost(post)}>
                            <IonIcon icon={createOutline} slot="icon-only" />
                          </IonButton>
                          <IonButton
                            fill="clear"
                            size="small"
                            color="danger"
                            onClick={() => {
                              setPostToDelete(post.post_id);
                              setShowDeleteAlert(true);
                            }}
                          >
                            <IonIcon icon={trashOutline} slot="icon-only" />
                          </IonButton>
                        </div>
                      )}
                    </div>
                  </IonCardHeader>
                  <IonCardContent>
                    {post.content && <p className="post-text">{post.content}</p>}

                    {/* Route stats with title */}
                    {post.route_id && (
                      <div style={{
                        backgroundColor: 'var(--ion-color-light)',
                        padding: '12px',
                        borderRadius: '8px',
                        marginBottom: '12px'
                      }}>
                        {post.route_name && (
                          <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: 600 }}>
                            {post.route_name}
                          </h4>
                        )}
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(2, 1fr)',
                          gap: '10px'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <IonIcon icon={locationOutline} />
                            <span><strong>{post.distance_km?.toFixed(1)} km</strong></span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <IonIcon icon={timeOutline} />
                            <span><strong>{formatDurationShort(post.duration_seconds)}</strong></span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <IonIcon icon={speedometerOutline} />
                            <span><strong>{post.average_pace || 'N/A'}</strong></span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <IonIcon icon={flameOutline} />
                            <span><strong>{post.estimated_calories || 'N/A'} kcal</strong></span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Map image */}
                    {post.snapshot_url && <IonImg src={post.snapshot_url} className="post-image" />}

                    {/* Action buttons for other users' posts */}
                    {isViewingOtherUser && (
                      <div style={{
                        display: 'flex',
                        gap: '12px',
                        marginTop: '12px',
                        paddingTop: '12px',
                        borderTop: '1px solid #e2e8f0'
                      }}>
                        <IonButton
                          fill="clear"
                          size="small"
                          color={post.is_liked ? "danger" : "medium"}
                          onClick={() => handleToggleLike(post.post_id)}
                        >
                          <IonIcon icon={post.is_liked ? heart : heartOutline} slot="start" />
                          {post.is_liked ? "Liked" : "Like"}
                        </IonButton>
                        <IonButton
                          fill="clear"
                          size="small"
                          color="medium"
                          onClick={() => handleViewComments(post.post_id)}
                        >
                          <IonIcon icon={chatbubbleOutline} slot="start" />
                          Comment
                        </IonButton>
                      </div>
                    )}

                    {/* Post stats */}
                    <div style={{
                      display: 'flex',
                      gap: '16px',
                      marginTop: '12px',
                      paddingTop: isViewingOtherUser ? '8px' : '12px',
                      borderTop: isViewingOtherUser ? 'none' : '1px solid #e2e8f0',
                      fontSize: '14px',
                      color: '#666'
                    }}>
                      <div
                        style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}
                        onClick={() => handleViewLikes(post.post_id)}
                      >
                        <IonIcon icon={heartOutline} />
                        <span style={{ textDecoration: 'underline' }}>{post.likes_count || 0} Likes</span>
                      </div>
                      <div
                        style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}
                        onClick={() => handleViewComments(post.post_id)}
                      >
                        <IonIcon icon={chatbubbleEllipses} />
                        <span style={{ textDecoration: 'underline' }}>{post.comments_count || 0} Comments</span>
                      </div>
                      {!isViewingOtherUser && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginLeft: 'auto' }}>
                          <IonIcon icon={post.visibility === 'public' ? eyeOutline : lockClosedOutline} />
                          <span>{post.visibility === 'public' ? 'Public' : 'Private'}</span>
                        </div>
                      )}
                    </div>
                  </IonCardContent>
                </IonCard>
              ))}
            </div>
          </div>
        )}

        {/* Edit Post Modal */}
        <IonModal
          isOpen={isEditModalOpen}
          onDidDismiss={() => {
            setIsEditModalOpen(false);
            setEditingPost(null);
          }}
        >
          <IonHeader>
            <IonToolbar>
              <IonTitle>Edit Post</IonTitle>
              <IonButton
                slot="end"
                fill="clear"
                onClick={() => {
                  setIsEditModalOpen(false);
                  setEditingPost(null);
                }}
              >
                <IonIcon icon={close} />
              </IonButton>
            </IonToolbar>
          </IonHeader>

          <IonContent>
            <div style={{ padding: '20px' }}>
              <IonItem>
                <IonLabel position="stacked">Title / Activity Name</IonLabel>
                <IonInput
                  value={editingPost?.route_name || ''}
                  onIonChange={(e) => setEditingPost(prev => prev ? { ...prev, route_name: e.detail.value! } : null)}
                  placeholder="Enter activity title..."
                />
              </IonItem>

              <IonItem>
                <IonLabel position="stacked">Post Content</IonLabel>
                <IonTextarea
                  value={editingPost?.content || ''}
                  onIonChange={(e) => setEditingPost(prev => prev ? { ...prev, content: e.detail.value! } : null)}
                  placeholder="Share your thoughts about this activity..."
                  rows={4}
                />
              </IonItem>

              <IonItem>
                <IonLabel position="stacked">Visibility</IonLabel>
                <IonSelect
                  value={editingPost?.visibility || 'public'}
                  onIonChange={(e) => setEditingPost(prev => prev ? { ...prev, visibility: e.detail.value! } : null)}
                >
                  <IonSelectOption value="public">Public - Everyone can see</IonSelectOption>
                  <IonSelectOption value="private">Private - Only followers can see</IonSelectOption>
                </IonSelect>
              </IonItem>

              <IonButton expand="block" onClick={handleSavePostEdit} style={{ marginTop: '20px' }}>
                Save Changes
              </IonButton>
              <IonButton
                expand="block"
                fill="outline"
                onClick={() => {
                  setIsEditModalOpen(false);
                  setEditingPost(null);
                }}
                style={{ marginTop: '10px' }}
              >
                Cancel
              </IonButton>
            </div>
          </IonContent>
        </IonModal>

        {/* Likes Modal */}
        <IonModal
          isOpen={isLikesModalOpen}
          onDidDismiss={() => {
            setIsLikesModalOpen(false);
            setSelectedPostLikers([]);
          }}
        >
          <IonHeader>
            <IonToolbar>
              <IonTitle>Likes</IonTitle>
              <IonButton
                slot="end"
                fill="clear"
                onClick={() => {
                  setIsLikesModalOpen(false);
                  setSelectedPostLikers([]);
                }}
              >
                <IonIcon icon={close} />
              </IonButton>
            </IonToolbar>
          </IonHeader>

          <IonContent>
            {loadingLikers ? (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
                <IonSpinner name="crescent" />
              </div>
            ) : selectedPostLikers.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                No likes yet
              </div>
            ) : (
              <div style={{ padding: '10px' }}>
                {selectedPostLikers.map((liker) => (
                  <div key={liker.user_id} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px',
                    borderBottom: '1px solid #eee'
                  }}>
                    <IonAvatar style={{ width: '40px', height: '40px' }}>
                      <img src={getAvatarUrl(liker.profile_picture)} alt={liker.name} />
                    </IonAvatar>
                    <div>
                      <div style={{ fontWeight: 'bold' }}>{liker.name}</div>
                      <div style={{ fontSize: '12px', color: '#666' }}>@{liker.username}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </IonContent>
        </IonModal>

        {/* Comments Modal */}
        <IonModal
          isOpen={isCommentsModalOpen}
          onDidDismiss={() => {
            setIsCommentsModalOpen(false);
            setSelectedPostComments([]);
            setSelectedPostId(null);
          }}
        >
          <IonHeader>
            <IonToolbar>
              <IonTitle>Comments</IonTitle>
              <IonButton
                slot="end"
                fill="clear"
                onClick={() => {
                  setIsCommentsModalOpen(false);
                  setSelectedPostComments([]);
                  setSelectedPostId(null);
                }}
              >
                <IonIcon icon={close} />
              </IonButton>
            </IonToolbar>
          </IonHeader>

          <IonContent>
            <div style={{ padding: '20px' }}>
              {/* Comments List */}
              {loadingComments ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}>
                  <IonSpinner name="crescent" />
                </div>
              ) : selectedPostComments.length === 0 ? (
                <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                  No comments yet. {isViewingOtherUser && "Be the first to comment!"}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  {selectedPostComments.map((comment) => (
                    <div
                      key={comment.comment_id}
                      style={{
                        padding: '15px',
                        backgroundColor: '#f5f5f5',
                        borderRadius: '8px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                        <IonAvatar style={{ width: '40px', height: '40px', minWidth: '40px' }}>
                          <img src={getAvatarUrl(comment.profile_picture)} alt={comment.name} />
                        </IonAvatar>
                        <div style={{ flex: 1 }}>
                          <div>
                            <strong style={{ fontSize: '14px' }}>{comment.name}</strong>
                            <span style={{ color: '#666', fontSize: '12px', marginLeft: '8px' }}>
                              @{comment.username}
                            </span>
                          </div>
                          <p style={{ margin: '8px 0 0 0', fontSize: '14px' }}>{comment.content}</p>
                          <span style={{ fontSize: '12px', color: '#999', marginTop: '4px', display: 'block' }}>
                            {formatRelativeTime(comment.created_at)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Add comment section - only for viewing other users' posts */}
              {isViewingOtherUser && (
                <div style={{
                  position: 'sticky',
                  bottom: 0,
                  backgroundColor: 'white',
                  padding: '16px',
                  borderTop: '1px solid #e2e8f0',
                  marginTop: '20px'
                }}>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
                    <IonTextarea
                      value={newComment}
                      onIonChange={(e) => setNewComment(e.detail.value!)}
                      placeholder="Write a comment..."
                      rows={2}
                      style={{ flex: 1 }}
                    />
                    <IonButton
                      onClick={handleAddComment}
                      disabled={!newComment.trim()}
                      size="small"
                    >
                      <IonIcon icon={sendOutline} slot="icon-only" />
                    </IonButton>
                  </div>
                </div>
              )}
            </div>
          </IonContent>
        </IonModal>

        {/* Delete Alert */}
        <IonAlert
          isOpen={showDeleteAlert}
          onDidDismiss={() => {
            setShowDeleteAlert(false);
            setPostToDelete(null);
          }}
          header="Delete Post"
          message="Are you sure you want to delete this post? This action cannot be undone."
          buttons={[
            {
              text: 'Cancel',
              role: 'cancel'
            },
            {
              text: 'Delete',
              role: 'destructive',
              handler: handleDeletePost
            }
          ]}
        />
      </IonContent>
    </IonPage>
  );
}
