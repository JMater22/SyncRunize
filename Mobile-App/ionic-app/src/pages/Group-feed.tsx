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
  IonItem,
  IonAvatar,
  IonImg,
  IonIcon,
  IonButtons,
  IonBackButton,
  IonModal,
  IonTextarea,
  IonActionSheet,
  IonAlert,
  IonToast,
  IonBadge,
  IonList,
  IonLabel,
  IonSpinner,
  IonSearchbar
} from "@ionic/react";
import {
  heartOutline,
  heart,
  chatbubbleOutline,
  ellipsisVertical,
  exitOutline,
  peopleOutline,
  personAddOutline,
  trophyOutline
} from "ionicons/icons";
import { useHistory, useParams } from "react-router-dom";
import ChallengePic from '../components/assets/istockphoto-143920084-612x612.jpg';
import ProfilePic from '../components/assets/close-up-portrait-serious-man-with-curly-hair.jpg';
import { usePushNotifications } from "../components/push-notification";
import { PushNotificationSchema, ActionPerformed } from '@capacitor/push-notifications';
import { GroupsApi, Group, GroupMember, GroupPost } from "../services/groups";
import { useUser } from "../contexts/UserContext";
import { getAvatarUrl } from "../lib/utils";

interface Post {
  id: number;
  user: string;
  time: string;
  text: string;
  image: string;
}

const GroupFeed: React.FC = () => {
  const history = useHistory();
  const { groupId } = useParams<{ groupId: string }>();
  const { currentUser } = useUser();

  // Backend state
  const [group, setGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [groupPosts, setGroupPosts] = useState<GroupPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // UI state
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [memberSearchQuery, setMemberSearchQuery] = useState("");

  // Group membership state
  const [isUserJoined, setIsUserJoined] = useState(false);
  const [isUserAdmin, setIsUserAdmin] = useState(false);

  // Comments state
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState<number | null>(null);
  const [newComment, setNewComment] = useState("");
  const [comments, setComments] = useState<{[key: number]: Array<{id: number, user: string, text: string, time: string}>}>({});

  // Likes state
  const [likes, setLikes] = useState<{[key: number]: {count: number, isLiked: boolean}}>({});

  // Legacy posts state for backward compatibility with notifications
  const [posts, setPosts] = useState<Post[]>([]);

  // Push notification state
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastColor, setToastColor] = useState<"success" | "danger" | "primary">("primary");
  const [newPostsCount, setNewPostsCount] = useState(0);

  // Leave Group state
  const [showActionSheet, setShowActionSheet] = useState(false);
  const [showLeaveAlert, setShowLeaveAlert] = useState(false);

  // Fetch group data from backend
  useEffect(() => {
    if (groupId && currentUser) {
      fetchGroupData();
    }
  }, [groupId, currentUser]);

  const fetchGroupData = async () => {
    if (!groupId) return;

    try {
      setLoading(true);
      setError(null);

      // Fetch group details
      const groupData = await GroupsApi.getGroup(parseInt(groupId));
      setGroup(groupData);

      // Fetch group posts
      const postsData = await GroupsApi.getGroupPosts(parseInt(groupId));
      setGroupPosts(Array.isArray(postsData) ? postsData : []);

      // Initialize likes and comments for posts
      const initialLikes: {[key: number]: {count: number, isLiked: boolean}} = {};
      const initialComments: {[key: number]: Array<{id: number, user: string, text: string, time: string}>} = {};

      postsData.forEach(post => {
        initialLikes[post.post_id] = {
          count: post.likes_count || 0,
          isLiked: post.is_liked || false
        };
        initialComments[post.post_id] = [];
      });

      setLikes(initialLikes);
      setComments(initialComments);

      // Fetch group members to check user role
      const membersData = await GroupsApi.getGroupMembers(parseInt(groupId));
      setMembers(Array.isArray(membersData) ? membersData : []);

      // Check if current user is a member and their role
      if (currentUser) {
        const userMember = membersData.find(m => m.user_id === currentUser.id);
        setIsUserJoined(!!userMember);
        setIsUserAdmin(userMember?.role === 'admin');
      }
    } catch (err: any) {
      console.error('Failed to fetch group data:', err);
      setError(err.message || 'Failed to load group');
      setGroupPosts([]);
      setMembers([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchMembers = async () => {
    if (!groupId) return;

    try {
      setLoadingMembers(true);
      const membersData = await GroupsApi.getGroupMembers(parseInt(groupId));
      setMembers(Array.isArray(membersData) ? membersData : []);
    } catch (err: any) {
      console.error('Failed to fetch members:', err);
      setToastMessage(err.message || 'Failed to load members');
      setToastColor('danger');
      setShowToast(true);
    } finally {
      setLoadingMembers(false);
    }
  };

  // Initialize push notifications
  usePushNotifications({
    onTokenReceived: (token) => {
      console.log("[GroupFeed] FCM Token received:", token);
      // Send token to your backend to register for group activity notifications
      // e.g., sendTokenToBackend(token, 'group_feed', groupId);
    },
    onNotificationReceived: (notification: PushNotificationSchema) => {
      console.log("[GroupFeed] Notification received:", notification);
      
      // Handle different types of group notifications
      if (notification.data?.type === 'new_post') {
        setToastMessage(`${notification.data.username} posted in the group`);
        setShowToast(true);
        setNewPostsCount(prev => prev + 1);
        
        // Add new post to feed
        const newPost: Post = {
          id: Date.now(),
          user: notification.data.username || "Group Member",
          time: "Just now",
          text: notification.body || "New post",
          image: notification.data.imageUrl || ChallengePic
        };
        setPosts(prev => [newPost, ...prev]);
        
        // Initialize likes and comments for new post
        setLikes(prev => ({ ...prev, [newPost.id]: { count: 0, isLiked: false } }));
        setComments(prev => ({ ...prev, [newPost.id]: [] }));
      } 
      else if (notification.data?.type === 'new_comment') {
        setToastMessage(`${notification.data.username} commented on a post`);
        setShowToast(true);
        
        // Add comment to the specific post
        const postId = parseInt(notification.data.postId);
        if (postId) {
          const newCommentObj = {
            id: Date.now(),
            user: notification.data.username,
            text: notification.body || "",
            time: "Just now"
          };
          setComments(prev => ({
            ...prev,
            [postId]: [...(prev[postId] || []), newCommentObj]
          }));
        }
      }
      else if (notification.data?.type === 'post_like') {
        setToastMessage(`${notification.data.username} liked your post`);
        setShowToast(true);
      }
      else if (notification.data?.type === 'group_announcement') {
        setToastMessage(`Group Admin: ${notification.body}`);
        setShowToast(true);
      }
    },
    onNotificationActionPerformed: (notification: ActionPerformed) => {
      console.log("[GroupFeed] Notification tapped:", notification);
      
      // Navigate to specific post if postId is provided
      if (notification.notification.data?.postId) {
        const postId = parseInt(notification.notification.data.postId);
        openComments(postId);
      }
      
      // Clear new posts count when user opens the app
      setNewPostsCount(0);
    }
  });

  const handleLike = async (postId: number) => {
    if (!currentUser || !groupId) {
      setToastMessage('Please log in to like posts');
      setToastColor('danger');
      setShowToast(true);
      return;
    }

    // Optimistic UI update
    const wasLiked = likes[postId]?.isLiked;
    setLikes(prev => ({
      ...prev,
      [postId]: {
        count: wasLiked ? prev[postId].count - 1 : prev[postId].count + 1,
        isLiked: !wasLiked
      }
    }));

    try {
      await GroupsApi.likeGroupPost(parseInt(groupId), postId);
    } catch (error: any) {
      console.error('Failed to like post:', error);
      // Revert optimistic update on error
      setLikes(prev => ({
        ...prev,
        [postId]: {
          count: wasLiked ? prev[postId].count + 1 : prev[postId].count - 1,
          isLiked: wasLiked
        }
      }));
      setToastMessage(error.message || 'Failed to like post');
      setToastColor('danger');
      setShowToast(true);
    }
  };

  const openComments = (postId: number) => {
    setSelectedPostId(postId);
    setIsCommentsOpen(true);
  };

  const closeComments = () => {
    setIsCommentsOpen(false);
    setNewComment("");
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || selectedPostId === null || !groupId || !currentUser) {
      return;
    }

    const commentText = newComment.trim();

    // Optimistic UI update
    const newCommentObj = {
      id: Date.now(),
      user: currentUser.name || "You",
      text: commentText,
      time: "Just now"
    };

    setComments(prev => ({
      ...prev,
      [selectedPostId]: [...(prev[selectedPostId] || []), newCommentObj]
    }));

    setNewComment("");

    try {
      await GroupsApi.commentOnGroupPost(parseInt(groupId), selectedPostId, commentText);

      // Update comment count in the post
      setGroupPosts(prev => prev.map(post =>
        post.post_id === selectedPostId
          ? { ...post, comments_count: post.comments_count + 1 }
          : post
      ));

      setToastMessage('Comment added successfully!');
      setToastColor('success');
      setShowToast(true);
    } catch (error: any) {
      console.error('Failed to add comment:', error);
      // Revert optimistic update on error
      setComments(prev => ({
        ...prev,
        [selectedPostId]: (prev[selectedPostId] || []).filter(c => c.id !== newCommentObj.id)
      }));
      setToastMessage(error.message || 'Failed to add comment');
      setToastColor('danger');
      setShowToast(true);
    }
  };

  const handleLeaveGroup = async () => {
    if (!groupId || !currentUser) return;

    try {
      await GroupsApi.leaveGroup(parseInt(groupId), currentUser.id);
      setToastMessage('Left group successfully');
      setToastColor('success');
      setShowToast(true);
      setIsUserJoined(false);

      // Redirect back to community after a short delay
      setTimeout(() => {
        history.push("/HomeModule/homeM1");
      }, 1000);
    } catch (error: any) {
      console.error('Failed to leave group:', error);
      setToastMessage(error.message || 'Failed to leave group');
      setToastColor('danger');
      setShowToast(true);
    }
  };

  // Build action sheet buttons conditionally
  const getActionSheetButtons = () => {
    const buttons = [];

    // View Leaderboard button
    buttons.push({
      text: 'View Leaderboard',
      icon: trophyOutline,
      handler: () => {
        history.push(`/leaderboards/${groupId}`);
      }
    });

    // View Members button
    buttons.push({
      text: 'View Members',
      icon: peopleOutline,
      handler: () => {
        setShowMembersModal(true);
        fetchMembers();
      }
    });

    // Invite Members button (only for admins)
    if (isUserAdmin) {
      buttons.push({
        text: 'Invite Members',
        icon: personAddOutline,
        handler: () => {
          setShowInviteModal(true);
        }
      });
    }

    // Leave Group button (only for members)
    if (isUserJoined) {
      buttons.push({
        text: 'Leave Group',
        role: 'destructive',
        icon: exitOutline,
        handler: () => {
          setShowLeaveAlert(true);
        }
      });
    }

    buttons.push({
      text: 'Cancel',
      role: 'cancel'
    });

    return buttons;
  };

  // Filter members based on search query
  const filteredMembers = members.filter(member => {
    const searchLower = memberSearchQuery.toLowerCase();
    return (
      member.users?.name.toLowerCase().includes(searchLower) ||
      member.users?.username.toLowerCase().includes(searchLower)
    );
  });

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/HomeModule/homeM1" />
          </IonButtons>
          <IonTitle>
            {group?.name || 'Group Feed'}
            {newPostsCount > 0 && (
              <IonBadge color="danger" style={{ marginLeft: '8px', verticalAlign: 'super' }}>
                {newPostsCount}
              </IonBadge>
            )}
          </IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={() => setShowActionSheet(true)}>
              <IonIcon icon={ellipsisVertical} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen className="ion-padding">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '32px' }}>
            <IonSpinner name="crescent" />
            <p>Loading group...</p>
          </div>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: '32px' }}>
            <p style={{ color: 'var(--ion-color-danger)' }}>{error}</p>
            <IonButton onClick={() => fetchGroupData()} size="small">
              Retry
            </IonButton>
          </div>
        ) : (
          <div className="feed-tab">
            {/* Group Info Card */}
            {group && (
              <IonCard style={{ marginBottom: '16px' }}>
                <IonCardContent>
                  <h2 style={{ margin: '0 0 8px 0', fontSize: '20px', fontWeight: 'bold' }}>
                    {group.name}
                  </h2>
                  <p style={{ margin: '0 0 8px 0', color: 'var(--ion-color-medium)', fontSize: '14px' }}>
                    {group.description}
                  </p>
                  <div style={{ display: 'flex', gap: '16px', fontSize: '14px', color: 'var(--ion-color-medium)' }}>
                    <span>{group.member_count || members.length} members</span>
                    {group.location && <span>📍 {group.location}</span>}
                    <span>{group.privacy ? '🔒 Private' : '🌐 Public'}</span>
                  </div>
                </IonCardContent>
              </IonCard>
            )}

            {/* Post Creation Input - Only shown if user has joined */}
            {isUserJoined && (
              <IonCard className="post-input-card" routerLink="/create-post">
                <IonItem lines="none">
                  <IonAvatar slot="start">
                    <IonImg src={currentUser?.profile_picture || ProfilePic} />
                  </IonAvatar>
                  <input
                    type="text"
                    placeholder="What's on your mind?"
                    className="post-input"
                    style={{border: 'none', outline: 'none', width: '100%', padding: '10px'}}
                    readOnly
                  />
                </IonItem>
              </IonCard>
            )}

            {/* Feed Posts from Backend */}
            <div className="feed-posts">
              {groupPosts.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px' }}>
                  <p style={{ color: 'var(--ion-color-medium)' }}>
                    No posts yet. {isUserJoined && 'Be the first to post!'}
                  </p>
                </div>
              ) : (
                groupPosts.map((post) => (
                  <IonCard key={post.post_id} className="post-card">
                    <IonCardHeader>
                      <div className="post-header" style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                        <IonAvatar>
                          <IonImg src={post.author_avatar || getAvatarUrl(post.author_username)} />
                        </IonAvatar>
                        <div className="user-info">
                          <div style={{fontWeight: 'bold'}}>{post.author_name}</div>
                          <div style={{fontSize: '0.85rem', color: '#666'}}>
                            {new Date(post.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </IonCardHeader>
                    <IonCardContent>
                      {post.title && <h3 style={{ marginTop: 0 }}>{post.title}</h3>}
                      <p className="post-text">{post.content}</p>
                      {post.images && post.images.length > 0 && (
                        <IonImg
                          src={post.images[0]}
                          className="post-image"
                          style={{borderRadius: '8px', marginTop: '10px'}}
                        />
                      )}
                      <div className="post-actions" style={{display: 'flex', gap: '20px', marginTop: '15px', padding: '10px 0', borderTop: '1px solid #eee'}}>
                        <div
                          className="action-item"
                          onClick={() => handleLike(post.post_id)}
                          style={{display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer'}}
                        >
                          <IonIcon
                            icon={likes[post.post_id]?.isLiked ? heart : heartOutline}
                            color={likes[post.post_id]?.isLiked ? "danger" : "medium"}
                          />
                          <span>{likes[post.post_id]?.count || 0}</span>
                        </div>
                        <div
                          className="action-item"
                          onClick={() => openComments(post.post_id)}
                          style={{display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer'}}
                        >
                          <IonIcon icon={chatbubbleOutline} color="medium" />
                          <span>{post.comments_count || 0}</span>
                        </div>
                      </div>
                    </IonCardContent>
                  </IonCard>
                ))
              )}
            </div>

            {/* Legacy posts from push notifications */}
            {posts.map((post) => (
              <IonCard key={post.id} className="post-card">
                <IonCardHeader>
                  <div className="post-header" style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                    <IonAvatar>
                      <IonImg src={ProfilePic} />
                    </IonAvatar>
                    <div className="user-info">
                      <div style={{fontWeight: 'bold'}}>{post.user}</div>
                      <div style={{fontSize: '0.85rem', color: '#666'}}>{post.time}</div>
                    </div>
                  </div>
                </IonCardHeader>
                <IonCardContent>
                  <p className="post-text">{post.text}</p>
                  <IonImg src={post.image} className="post-image" style={{borderRadius: '8px', marginTop: '10px'}} />
                  <div className="post-actions" style={{display: 'flex', gap: '20px', marginTop: '15px', padding: '10px 0', borderTop: '1px solid #eee'}}>
                    <div 
                      className="action-item" 
                      onClick={() => handleLike(post.id)}
                      style={{display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer'}}
                    >
                      <IonIcon 
                        icon={likes[post.id]?.isLiked ? heart : heartOutline} 
                        color={likes[post.id]?.isLiked ? "danger" : "medium"} 
                      /> 
                      <span>{likes[post.id]?.count || 0}</span>
                    </div>
                    <div 
                      className="action-item" 
                      onClick={() => openComments(post.id)}
                      style={{display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer'}}
                    >
                      <IonIcon icon={chatbubbleOutline} color="medium" /> 
                      <span>{comments[post.id]?.length || 0}</span>
                    </div>
                  </div>
                </IonCardContent>
              </IonCard>
            ))}
          </div>
        )}

        {/* Comments Modal */}
        <IonModal isOpen={isCommentsOpen} onDidDismiss={closeComments}>
          <IonHeader>
            <IonToolbar>
              <IonTitle>Comments</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={closeComments}>Close</IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent className="ion-padding">
            {selectedPostId && comments[selectedPostId]?.map((comment) => (
              <IonCard key={comment.id}>
                <IonCardContent>
                  <div style={{fontWeight: 'bold', marginBottom: '5px'}}>{comment.user}</div>
                  <div>{comment.text}</div>
                  <div style={{fontSize: '0.85rem', color: '#666', marginTop: '5px'}}>{comment.time}</div>
                </IonCardContent>
              </IonCard>
            ))}
            
            <div style={{position: 'fixed', bottom: '0', left: '0', right: '0', padding: '10px', background: 'black', borderTop: '1px solid #535252ff'}}>
              <IonItem>
                <IonTextarea
                  value={newComment}
                  onIonChange={(e) => setNewComment(e.detail.value || "")}
                  placeholder="Write a comment..."
                  autoGrow
                />
              </IonItem>
              <IonButton color="success" expand="block" onClick={handleAddComment} disabled={!newComment.trim()}>
                Post Comment
              </IonButton>
            </div>
          </IonContent>
        </IonModal>

        {/* Members Modal */}
        <IonModal isOpen={showMembersModal} onDidDismiss={() => setShowMembersModal(false)}>
          <IonHeader>
            <IonToolbar>
              <IonTitle>Group Members ({members.length})</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => setShowMembersModal(false)}>Close</IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent>
            <IonSearchbar
              value={memberSearchQuery}
              onIonInput={(e) => setMemberSearchQuery(e.detail.value || '')}
              placeholder="Search members..."
              style={{ padding: '8px' }}
            />

            {loadingMembers ? (
              <div style={{ textAlign: 'center', padding: '32px' }}>
                <IonSpinner name="crescent" />
                <p>Loading members...</p>
              </div>
            ) : filteredMembers.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px' }}>
                <p style={{ color: 'var(--ion-color-medium)' }}>
                  {memberSearchQuery ? 'No members found' : 'No members yet'}
                </p>
              </div>
            ) : (
              <IonList>
                {filteredMembers.map((member) => (
                  <IonItem key={member.user_id}>
                    <IonAvatar slot="start">
                      <IonImg src={member.users?.profile_picture || getAvatarUrl(member.users?.username || '')} />
                    </IonAvatar>
                    <IonLabel>
                      <h2>{member.users?.name || 'Unknown User'}</h2>
                      <p>@{member.users?.username || 'username'}</p>
                      {member.users?.location && (
                        <p style={{ fontSize: '12px', color: 'var(--ion-color-medium)' }}>
                          📍 {member.users.location}
                        </p>
                      )}
                    </IonLabel>
                    <IonBadge
                      slot="end"
                      color={member.role === 'admin' ? 'primary' : 'medium'}
                      style={{ textTransform: 'capitalize' }}
                    >
                      {member.role}
                    </IonBadge>
                  </IonItem>
                ))}
              </IonList>
            )}
          </IonContent>
        </IonModal>

        {/* Invite Members Modal (placeholder for future implementation) */}
        <IonModal isOpen={showInviteModal} onDidDismiss={() => setShowInviteModal(false)}>
          <IonHeader>
            <IonToolbar>
              <IonTitle>Invite Members</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => setShowInviteModal(false)}>Close</IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent className="ion-padding">
            <div style={{ textAlign: 'center', padding: '32px' }}>
              <IonIcon icon={personAddOutline} style={{ fontSize: '64px', color: 'var(--ion-color-medium)' }} />
              <h2>Invite Members to {group?.name}</h2>
              <p style={{ color: 'var(--ion-color-medium)' }}>
                Member invitation functionality coming soon! You'll be able to search for users and send group invitations.
              </p>
              <IonButton onClick={() => setShowInviteModal(false)} style={{ marginTop: '16px' }}>
                Got it
              </IonButton>
            </div>
          </IonContent>
        </IonModal>

        {/* Action Sheet for Group Options */}
        <IonActionSheet
          isOpen={showActionSheet}
          onDidDismiss={() => setShowActionSheet(false)}
          buttons={getActionSheetButtons()}
        />

        {/* Leave Group Confirmation Alert */}
        <IonAlert 
          isOpen={showLeaveAlert}
          onDidDismiss={() => setShowLeaveAlert(false)}
          header="Leave Group"
          message="Are you sure you want to leave this group? You won't be able to see posts or participate anymore."
          buttons={[
            {
              text: 'Cancel',
              role: 'cancel'
            },
            {
              text: 'Leave',
              role: 'destructive',
              handler: handleLeaveGroup
            }
          ]}
        />

        {/* Toast for Notifications and Actions */}
        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={toastMessage}
          duration={3000}
          position="top"
          color={toastColor}
        />
      </IonContent>
    </IonPage>
  );
};

export default GroupFeed;