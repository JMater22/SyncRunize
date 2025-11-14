import React, { useState, useEffect, useMemo } from "react";
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
  IonSearchbar,
  IonSegment,
  IonSegmentButton,
  IonInput,
  IonText,
  IonInfiniteScroll,
  IonInfiniteScrollContent
} from "@ionic/react";
import {
  heartOutline,
  heart,
  chatbubbleOutline,
  ellipsisVertical,
  exitOutline,
  peopleOutline,
  personAddOutline,
  trophyOutline,
  documentTextOutline,
  searchOutline,
  camera,
  close,
  images as imagesIcon,
  trashOutline
} from "ionicons/icons";
import { useHistory, useParams } from "react-router-dom";
import ChallengePic from '../components/assets/istockphoto-143920084-612x612.jpg';
import ProfilePic from '../components/assets/close-up-portrait-serious-man-with-curly-hair.jpg';
import { usePushNotifications } from "../components/push-notification";
import { PushNotificationSchema, ActionPerformed } from '@capacitor/push-notifications';
import { Camera, CameraResultType, CameraSource } from "@capacitor/camera";
import { GroupsApi, Group, GroupMember, GroupPost } from "../services/groups";
import { UsersApi } from "../services/users";
import { useUser } from "../contexts/UserContext";
import { getAvatarUrl, formatRelativeTime, DEFAULT_AVATAR } from "../lib/utils";
import "../theme/Group-feed.css";

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

  // Pagination state for posts
  const [postsOffset, setPostsOffset] = useState(0);
  const [hasMorePosts, setHasMorePosts] = useState(true);
  const POSTS_PER_PAGE = 10;

  // UI state
  const [activeTab, setActiveTab] = useState<'posts' | 'leaderboard' | 'members'>('posts');
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

  // Leave/Disband Group state
  const [showActionSheet, setShowActionSheet] = useState(false);
  const [showLeaveAlert, setShowLeaveAlert] = useState(false);
  const [showDisbandAlert, setShowDisbandAlert] = useState(false);

  // Leaderboard state
  const [weekFilter, setWeekFilter] = useState<'current' | 'last'>('current');
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [lastWeekLeaders, setLastWeekLeaders] = useState<{distance: any[], time: any[]}>({distance: [], time: []});
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);

  // Invite Members state
  const [inviteSearchQuery, setInviteSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [invitingUsers, setInvitingUsers] = useState<{[userId: number]: boolean}>({});

  // Create Post Modal state
  const [showCreatePostModal, setShowCreatePostModal] = useState(false);
  const [postTitle, setPostTitle] = useState("");
  const [postContent, setPostContent] = useState("");
  const [postImages, setPostImages] = useState<string[]>([]);
  const [isCreatingPost, setIsCreatingPost] = useState(false);

  // Fetch group data from backend
  useEffect(() => {
    if (!currentUser) {
      setError('Please log in to view group details.');
      setLoading(false);
      return;
    }

    if (groupId && currentUser) {
      fetchGroupData();
    }
  }, [groupId, currentUser]);

  // Fetch members when Members tab is activated
  useEffect(() => {
    if (activeTab === 'members' && groupId && members.length === 0) {
      fetchMembers();
    }
  }, [activeTab]);

  const fetchGroupData = async () => {
    if (!groupId) {
      setError('Group ID is missing. Please select a group from the Community page.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // ⚡ PARALLEL API CALLS - Fetch all data simultaneously
      const [groupData, postsData, membersData] = await Promise.all([
        GroupsApi.getGroup(parseInt(groupId)),
        GroupsApi.getGroupPosts(parseInt(groupId), POSTS_PER_PAGE, 0),
        GroupsApi.getGroupMembers(parseInt(groupId))
      ]);

      // Set group data
      setGroup(groupData);

      // Set posts with pagination
      setGroupPosts(Array.isArray(postsData) ? postsData : []);
      setPostsOffset(POSTS_PER_PAGE);
      setHasMorePosts(postsData.length === POSTS_PER_PAGE);

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

      // Set members data
      setMembers(Array.isArray(membersData) ? membersData : []);

      // Check if current user is a member and their role
      if (currentUser) {
        const userMember = membersData.find(m => m.user_id === currentUser.user_id);
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

  const loadMorePosts = async (event: any) => {
    if (!groupId || !hasMorePosts) {
      event.target.complete();
      return;
    }

    try {
      console.log('[GroupFeed] Loading more posts...');
      const morePosts = await GroupsApi.getGroupPosts(parseInt(groupId), POSTS_PER_PAGE, postsOffset);

      setGroupPosts(prev => [...prev, ...(Array.isArray(morePosts) ? morePosts : [])]);
      setPostsOffset(prev => prev + POSTS_PER_PAGE);
      setHasMorePosts(morePosts.length === POSTS_PER_PAGE);

      // Initialize likes/comments for new posts
      morePosts.forEach(post => {
        setLikes(prev => ({
          ...prev,
          [post.post_id]: {
            count: post.likes_count || 0,
            isLiked: post.is_liked || false
          }
        }));
        setComments(prev => ({
          ...prev,
          [post.post_id]: []
        }));
      });
    } catch (err: any) {
      console.error('[GroupFeed] Failed to load more posts:', err);
    } finally {
      event.target.complete();
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

  const fetchLeaderboard = async (week: 'current' | 'last' = weekFilter) => {
    if (!groupId) return;

    try {
      setLoadingLeaderboard(true);

      // Fetch weekly leaderboard
      const leaderboardData = await GroupsApi.getLeaderboard(parseInt(groupId), week);
      setLeaderboard(Array.isArray(leaderboardData) ? leaderboardData : []);

      // Fetch last week's leaders for podium display (if the API supports it)
      if (week === 'last') {
        try {
          const leadersData = await GroupsApi.getLastWeekLeaders(parseInt(groupId));
          // Assume leadersData is an array, we'll extract top 3 for distance and time
          const topDistance = Array.isArray(leadersData) ? leadersData.slice(0, 3) : [];
          const topTime = Array.isArray(leadersData) ? leadersData.slice(0, 3) : [];
          setLastWeekLeaders({distance: topDistance, time: topTime});
        } catch (err) {
          console.log('Last week leaders not available');
          setLastWeekLeaders({distance: [], time: []});
        }
      }
    } catch (err: any) {
      console.error('Failed to fetch leaderboard:', err);
      setLeaderboard([]);
    } finally {
      setLoadingLeaderboard(false);
    }
  };

  // Fetch leaderboard when tab changes to leaderboard
  useEffect(() => {
    if (activeTab === 'leaderboard' && groupId) {
      fetchLeaderboard(weekFilter);
    }
  }, [activeTab, weekFilter, groupId]);

  // Debounced user search for inviting members
  useEffect(() => {
    const debounceTimer = setTimeout(async () => {
      if (inviteSearchQuery.trim().length > 0) {
        setIsSearching(true);
        try {
          const results = await UsersApi.searchUsers(inviteSearchQuery);

          // Filter out current user and existing members
          const memberIds = members.map(m => m.user_id);
          const filtered = Array.isArray(results)
            ? results.filter((u: any) =>
                u.user_id !== currentUser?.user_id &&
                !memberIds.includes(u.user_id)
              )
            : [];

          setSearchResults(filtered);
        } catch (err) {
          console.error('Search error:', err);
          setSearchResults([]);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSearchResults([]);
      }
    }, 500);

    return () => clearTimeout(debounceTimer);
  }, [inviteSearchQuery, currentUser, members]);

  const handleInviteUser = async (userId: number) => {
    if (!groupId) return;

    try {
      setInvitingUsers(prev => ({ ...prev, [userId]: true }));

      await GroupsApi.inviteToGroup(parseInt(groupId), userId);

      setToastMessage('User invited successfully!');
      setToastColor('success');
      setShowToast(true);

      // Refresh members list
      fetchMembers();

      // Remove user from search results
      setSearchResults(prev => prev.filter(u => u.user_id !== userId));
    } catch (err: any) {
      console.error('Failed to invite user:', err);
      setToastMessage(err.message || 'Failed to invite user');
      setToastColor('danger');
      setShowToast(true);
    } finally {
      setInvitingUsers(prev => ({ ...prev, [userId]: false }));
    }
  };

  const handleAddPostImage = async () => {
    try {
      const image = await Camera.getPhoto({
        quality: 80,
        allowEditing: true,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Prompt, // Allows user to choose camera or gallery
      });

      if (image.dataUrl) {
        setPostImages(prev => [...prev, image.dataUrl!]);
      }
    } catch (error) {
      console.error('Error selecting image:', error);
      setToastMessage('Failed to select image');
      setToastColor('danger');
      setShowToast(true);
    }
  };

  const handleRemovePostImage = (index: number) => {
    setPostImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleCreatePost = async () => {
    if (!groupId || !currentUser || !postContent.trim()) return;

    try {
      setIsCreatingPost(true);

      await GroupsApi.createGroupPost(parseInt(groupId), {
        title: postTitle.trim() || undefined,
        content: postContent.trim(),
        images: postImages.length > 0 ? postImages : undefined
      });

      setToastMessage('Post created successfully!');
      setToastColor('success');
      setShowToast(true);

      // Close modal and reset
      setShowCreatePostModal(false);
      setPostTitle("");
      setPostContent("");
      setPostImages([]);

      // Refresh posts
      fetchGroupData();
    } catch (err: any) {
      console.error('Failed to create post:', err);
      setToastMessage(err.message || 'Failed to create post');
      setToastColor('danger');
      setShowToast(true);
    } finally {
      setIsCreatingPost(false);
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
    if (!currentUser) {
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
      const response = await GroupsApi.toggleLikeGroupPost(postId);
      // Update with actual count from server
      setLikes(prev => ({
        ...prev,
        [postId]: {
          count: response.likes,
          isLiked: response.liked
        }
      }));
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
    if (!newComment.trim() || selectedPostId === null || !currentUser) {
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
      await GroupsApi.commentOnGroupPost(selectedPostId, commentText);

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
      await GroupsApi.leaveGroup(parseInt(groupId), currentUser.user_id);
      setToastMessage('Left group successfully');
      setToastColor('success');
      setShowToast(true);
      setIsUserJoined(false);

      // Redirect back to community after a short delay
      setTimeout(() => {
        history.push("/community");
      }, 1000);
    } catch (error: any) {
      console.error('Failed to leave group:', error);
      setToastMessage(error.message || 'Failed to leave group');
      setToastColor('danger');
      setShowToast(true);
    }
  };

  const handleDisbandGroup = async () => {
    if (!groupId) return;

    try {
      await GroupsApi.deleteGroup(parseInt(groupId));
      setToastMessage('Group disbanded successfully');
      setToastColor('success');
      setShowToast(true);

      // Redirect back to community after a short delay
      setTimeout(() => {
        history.push("/community");
      }, 1000);
    } catch (error: any) {
      console.error('Failed to disband group:', error);
      setToastMessage(error.message || 'Failed to disband group');
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
    // Disband for admins, Leave for regular members
    if (isUserAdmin) {
      buttons.push({
        text: 'Disband Group',
        role: 'destructive',
        icon: trashOutline,
        handler: () => {
          setShowDisbandAlert(true);
        }
      });
    } else if (isUserJoined) {
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

  // Filter members based on search query (memoized for performance)
  const filteredMembers = useMemo(() => {
    return members.filter(member => {
      const searchLower = memberSearchQuery.toLowerCase();
      return (
        member.users?.name.toLowerCase().includes(searchLower) ||
        member.users?.username.toLowerCase().includes(searchLower)
      );
    });
  }, [members, memberSearchQuery]);

  return (
    <IonPage className="group-feed-page">
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/community" />
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
          <div className="loading-container">
            <IonSpinner name="crescent" />
            <p>Loading group...</p>
          </div>
        ) : error ? (
          <div className="error-container">
            <p>{error}</p>
            <IonButton onClick={() => fetchGroupData()} size="small" color="success">
              Retry
            </IonButton>
          </div>
        ) : (
          <div className="feed-tab">
            {/* Group Info Card */}
            {group && (
              <IonCard className="group-info-card">
                <IonCardContent>
                  <h2>
                    {group.name}
                  </h2>
                  <p>
                    {group.description}
                  </p>
                  <div className="group-meta">
                    <span>{group.member_count || members.length} members</span>
                    {group.location && <span>📍 {group.location}</span>}
                    <span>{group.privacy ? '🔒 Private' : '🌐 Public'}</span>
                  </div>
                </IonCardContent>
              </IonCard>
            )}

            {/* Tab Navigation */}
            <IonSegment
              value={activeTab}
              onIonChange={(e) => setActiveTab(e.detail.value as 'posts' | 'leaderboard' | 'members')}
            >
              <IonSegmentButton value="posts">
                <IonIcon icon={documentTextOutline} />
                <IonLabel>Posts</IonLabel>
              </IonSegmentButton>
              <IonSegmentButton value="leaderboard">
                <IonIcon icon={trophyOutline} />
                <IonLabel>Leaderboard</IonLabel>
              </IonSegmentButton>
              <IonSegmentButton value="members">
                <IonIcon icon={peopleOutline} />
                <IonLabel>Members</IonLabel>
              </IonSegmentButton>
            </IonSegment>

            {/* Posts Tab */}
            {activeTab === 'posts' && (
              <>
                {/* Post Creation Input - Only shown if user has joined */}
                {isUserJoined && (
                  <IonCard
                    className="post-input-card"
                    onClick={() => setShowCreatePostModal(true)}
                    style={{ cursor: 'pointer' }}
                  >
                    <IonItem lines="none">
                      <IonAvatar slot="start">
                        <img src={getAvatarUrl(currentUser?.profile_picture)} alt="You" />
                      </IonAvatar>
                      <div style={{
                        flex: 1,
                        padding: '12px',
                        color: '#999999',
                        fontSize: '15px'
                      }}>
                        What's on your mind?
                      </div>
                    </IonItem>
                  </IonCard>
                )}

                {/* Feed Posts from Backend */}
                <div className="feed-posts">
                  {groupPosts.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '48px 16px' }}>
                      <IonIcon icon={documentTextOutline} style={{ fontSize: '64px', color: '#666666', marginBottom: '16px' }} />
                      <h3 style={{ color: '#ffffff', margin: '0 0 8px 0', fontSize: '18px' }}>No Posts Yet</h3>
                      <p style={{ color: '#999999', margin: 0, fontSize: '14px' }}>
                        {isUserJoined ? 'Be the first to share something with the group!' : 'Join the group to see posts.'}
                      </p>
                    </div>
                  ) : (
                    groupPosts.map((post) => (
                      <IonCard key={post.post_id} className="post-card">
                        <IonCardContent style={{ padding: '16px' }}>
                          <div className="post-header" style={{display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px'}}>
                            <IonAvatar style={{ width: '44px', height: '44px' }}>
                              <img
                                src={getAvatarUrl((post as any).author_avatar || (post as any).users?.profile_picture)}
                                alt={post.author_name}
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.src = DEFAULT_AVATAR;
                                }}
                              />
                            </IonAvatar>
                            <div className="user-info" style={{ flex: 1 }}>
                              <div className="username" style={{fontWeight: '700', color: '#ffffff', fontSize: '15px', marginBottom: '2px'}}>
                                {post.author_name || (post as any).users?.name || 'Unknown User'}
                              </div>
                              <div className="timestamp" style={{fontSize: '13px', color: '#999999'}}>
                                {formatRelativeTime(post.created_at)}
                              </div>
                            </div>
                          </div>

                          {post.title && (
                            <h3 style={{ margin: '0 0 8px 0', color: '#ffffff', fontSize: '17px', fontWeight: '700' }}>
                              {post.title}
                            </h3>
                          )}
                          <p className="post-text" style={{ color: '#ffffff', fontSize: '15px', lineHeight: '1.5', margin: '0 0 12px 0' }}>
                            {post.content}
                          </p>

                          {post.images && post.images.length > 0 && post.images[0] && (
                            <img
                              src={post.images[0]}
                              alt="Post content"
                              className="post-image"
                              loading="lazy"
                              style={{
                                borderRadius: '12px',
                                marginBottom: '12px',
                                width: '100%',
                                maxHeight: '400px',
                                objectFit: 'cover'
                              }}
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                              }}
                            />
                          )}

                          <div className="post-actions" style={{
                            display: 'flex',
                            gap: '24px',
                            paddingTop: '12px',
                            borderTop: '1px solid #2a2a2a'
                          }}>
                            <IonButton
                              fill="clear"
                              size="small"
                              onClick={() => handleLike(post.post_id)}
                              style={{ '--padding-start': '0', '--padding-end': '0', margin: 0 }}
                            >
                              <IonIcon
                                icon={likes[post.post_id]?.isLiked ? heart : heartOutline}
                                color={likes[post.post_id]?.isLiked ? "danger" : "medium"}
                                style={{ fontSize: '22px', marginRight: '6px' }}
                              />
                              <span style={{ color: '#ffffff', fontSize: '14px' }}>
                                {likes[post.post_id]?.count || 0}
                              </span>
                            </IonButton>
                            <IonButton
                              fill="clear"
                              size="small"
                              onClick={() => openComments(post.post_id)}
                              style={{ '--padding-start': '0', '--padding-end': '0', margin: 0 }}
                            >
                              <IonIcon
                                icon={chatbubbleOutline}
                                color="medium"
                                style={{ fontSize: '22px', marginRight: '6px' }}
                              />
                              <span style={{ color: '#ffffff', fontSize: '14px' }}>
                                {post.comments_count || 0}
                              </span>
                            </IonButton>
                          </div>
                        </IonCardContent>
                      </IonCard>
                    ))
                  )}

                  {/* Infinite Scroll for Posts */}
                  <IonInfiniteScroll
                    onIonInfinite={loadMorePosts}
                    threshold="100px"
                    disabled={!hasMorePosts}
                  >
                    <IonInfiniteScrollContent
                      loadingSpinner="bubbles"
                      loadingText="Loading more posts..."
                    ></IonInfiniteScrollContent>
                  </IonInfiniteScroll>
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
              </>
            )}

            {/* Leaderboard Tab */}
            {activeTab === 'leaderboard' && (
              <div className="leaderboard-section">
                {/* Week Toggle */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
                  <IonButton
                    expand="block"
                    fill={weekFilter === 'current' ? 'solid' : 'outline'}
                    color="success"
                    onClick={() => setWeekFilter('current')}
                    style={{ flex: 1 }}
                  >
                    This Week
                  </IonButton>
                  <IonButton
                    expand="block"
                    fill={weekFilter === 'last' ? 'solid' : 'outline'}
                    color="success"
                    onClick={() => setWeekFilter('last')}
                    style={{ flex: 1 }}
                  >
                    Last Week
                  </IonButton>
                </div>

                {loadingLeaderboard ? (
                  <div style={{ textAlign: 'center', padding: '32px' }}>
                    <IonSpinner name="crescent" color="success" />
                    <p style={{ color: '#999999', marginTop: '16px' }}>Loading leaderboard...</p>
                  </div>
                ) : (
                  <>
                    {/* Last Week's Top 3 Leaders - Only show for "Last Week" */}
                    {weekFilter === 'last' && lastWeekLeaders.distance.length > 0 && (
                      <>
                        <IonCard className="leaderboard-card">
                          <IonCardHeader style={{ background: 'linear-gradient(135deg, #84cc16 0%, #65a30d 100%)', padding: '16px' }}>
                            <h3 style={{ margin: 0, color: '#000000', fontWeight: '700', fontSize: '16px' }}>
                              🏆 Last Week's Distance Leaders
                            </h3>
                          </IonCardHeader>
                          <IonCardContent>
                            <div style={{ display: 'flex', justifyContent: 'space-around', padding: '16px 0' }}>
                              {lastWeekLeaders.distance.slice(0, 3).map((leader: any, idx: number) => (
                                <div key={idx} style={{ textAlign: 'center', flex: 1 }}>
                                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>
                                    {idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}
                                  </div>
                                  <IonAvatar style={{ width: '60px', height: '60px', margin: '0 auto 8px' }}>
                                    <img
                                      src={getAvatarUrl(leader.avatar || leader.profile_picture)}
                                      alt={leader.name}
                                      onError={(e) => {
                                        const target = e.target as HTMLImageElement;
                                        target.src = DEFAULT_AVATAR;
                                      }}
                                    />
                                  </IonAvatar>
                                  <p style={{ fontWeight: '600', color: '#ffffff', fontSize: '14px', margin: '4px 0' }}>
                                    {leader.name}
                                  </p>
                                  <p style={{ color: '#84cc16', fontSize: '16px', fontWeight: '700', margin: '4px 0' }}>
                                    {leader.value}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </IonCardContent>
                        </IonCard>

                        {lastWeekLeaders.time.length > 0 && (
                          <IonCard className="leaderboard-card">
                            <IonCardHeader style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', padding: '16px' }}>
                              <h3 style={{ margin: 0, color: '#000000', fontWeight: '700', fontSize: '16px' }}>
                                ⏱️ Last Week's Time Leaders
                              </h3>
                            </IonCardHeader>
                            <IonCardContent>
                              <div style={{ display: 'flex', justifyContent: 'space-around', padding: '16px 0' }}>
                                {lastWeekLeaders.time.slice(0, 3).map((leader: any, idx: number) => (
                                  <div key={idx} style={{ textAlign: 'center', flex: 1 }}>
                                    <div style={{ fontSize: '32px', marginBottom: '8px' }}>
                                      {idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}
                                    </div>
                                    <IonAvatar style={{ width: '60px', height: '60px', margin: '0 auto 8px' }}>
                                      <img
                                        src={getAvatarUrl(leader.avatar || leader.profile_picture)}
                                        alt={leader.name}
                                        onError={(e) => {
                                          const target = e.target as HTMLImageElement;
                                          target.src = DEFAULT_AVATAR;
                                        }}
                                      />
                                    </IonAvatar>
                                    <p style={{ fontWeight: '600', color: '#ffffff', fontSize: '14px', margin: '4px 0' }}>
                                      {leader.name}
                                    </p>
                                    <p style={{ color: '#f59e0b', fontSize: '16px', fontWeight: '700', margin: '4px 0' }}>
                                      {leader.value}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            </IonCardContent>
                          </IonCard>
                        )}
                      </>
                    )}

                    {/* Full Leaderboard Table */}
                    {leaderboard.length > 0 ? (
                      <IonCard className="leaderboard-card">
                        <IonCardHeader style={{ background: '#1a1a1a', padding: '16px' }}>
                          <h3 style={{ margin: 0, color: '#84cc16', fontWeight: '700', fontSize: '18px' }}>
                            {weekFilter === 'current' ? 'This Week' : 'Last Week'} Rankings
                          </h3>
                        </IonCardHeader>
                        <IonCardContent style={{ padding: 0 }}>
                          <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                              <thead>
                                <tr style={{ background: '#0a0a0a', borderBottom: '2px solid #2a2a2a' }}>
                                  <th style={{ padding: '12px 8px', textAlign: 'center', color: '#999999', fontSize: '12px', fontWeight: '700' }}>RANK</th>
                                  <th style={{ padding: '12px 8px', textAlign: 'left', color: '#999999', fontSize: '12px', fontWeight: '700' }}>ATHLETE</th>
                                  <th style={{ padding: '12px 8px', textAlign: 'right', color: '#999999', fontSize: '12px', fontWeight: '700' }}>DISTANCE</th>
                                  <th style={{ padding: '12px 8px', textAlign: 'center', color: '#999999', fontSize: '12px', fontWeight: '700' }}>RUNS</th>
                                  <th style={{ padding: '12px 8px', textAlign: 'right', color: '#999999', fontSize: '12px', fontWeight: '700' }}>LONGEST</th>
                                </tr>
                              </thead>
                              <tbody>
                                {leaderboard.map((entry: any, index: number) => (
                                  <tr key={entry.user_id || index} style={{ borderBottom: '1px solid #2a2a2a' }}>
                                    <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                                      <span style={{ fontWeight: '700', color: index < 3 ? '#84cc16' : '#ffffff', fontSize: '16px' }}>
                                        {entry.rank || index + 1}
                                      </span>
                                    </td>
                                    <td style={{ padding: '12px 8px' }}>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <IonAvatar style={{ width: '36px', height: '36px', flexShrink: 0 }}>
                                          <img
                                            src={getAvatarUrl(entry.avatar || entry.profile_picture)}
                                            alt={entry.name}
                                            onError={(e) => {
                                              const target = e.target as HTMLImageElement;
                                              target.src = DEFAULT_AVATAR;
                                            }}
                                          />
                                        </IonAvatar>
                                        <span style={{ color: '#ffffff', fontWeight: '600', fontSize: '14px' }}>
                                          {entry.name || 'Unknown'}
                                        </span>
                                      </div>
                                    </td>
                                    <td style={{ padding: '12px 8px', textAlign: 'right', color: '#84cc16', fontWeight: '600', fontSize: '14px' }}>
                                      {entry.distance || '0 km'}
                                    </td>
                                    <td style={{ padding: '12px 8px', textAlign: 'center', color: '#ffffff', fontSize: '14px' }}>
                                      {entry.runs || 0}
                                    </td>
                                    <td style={{ padding: '12px 8px', textAlign: 'right', color: '#ffffff', fontSize: '14px' }}>
                                      {entry.longest || '0 km'}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </IonCardContent>
                      </IonCard>
                    ) : (
                      <div style={{ textAlign: 'center', padding: '48px 16px' }}>
                        <IonIcon icon={trophyOutline} style={{ fontSize: '64px', color: '#666666', marginBottom: '16px' }} />
                        <h3 style={{ color: '#ffffff', margin: '0 0 8px 0' }}>No Data Yet</h3>
                        <p style={{ color: '#999999', margin: 0 }}>
                          Leaderboard will appear once members start logging runs.
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Members Tab */}
            {activeTab === 'members' && (
              <div>
                <IonSearchbar
                  value={memberSearchQuery}
                  onIonInput={(e) => setMemberSearchQuery(e.detail.value || '')}
                  placeholder="Search members..."
                  style={{ padding: '8px 0' }}
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
                        <IonAvatar slot="start" style={{ width: '48px', height: '48px' }}>
                          <img
                            src={getAvatarUrl(member.users?.profile_picture)}
                            alt={member.users?.name}
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = DEFAULT_AVATAR;
                            }}
                          />
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
              </div>
            )}
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
                    <IonAvatar slot="start" style={{ width: '48px', height: '48px' }}>
                      <img
                        src={getAvatarUrl(member.users?.profile_picture)}
                        alt={member.users?.name}
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = DEFAULT_AVATAR;
                        }}
                      />
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

        {/* Create Post Modal */}
        <IonModal isOpen={showCreatePostModal} onDidDismiss={() => {
          setShowCreatePostModal(false);
          setPostTitle("");
          setPostContent("");
          setPostImages([]);
        }}>
          <IonHeader>
            <IonToolbar style={{ '--background': '#000000', '--color': '#ffffff' }}>
              <IonButtons slot="start">
                <IonButton onClick={() => {
                  setShowCreatePostModal(false);
                  setPostTitle("");
                  setPostContent("");
                  setPostImages([]);
                }} style={{ color: '#3b82f6' }}>
                  Cancel
                </IonButton>
              </IonButtons>
              <IonTitle style={{ color: '#ffffff', fontWeight: '700' }}>Create Post</IonTitle>
              <IonButtons slot="end">
                <IonButton
                  onClick={handleCreatePost}
                  disabled={!postContent.trim() || isCreatingPost}
                  style={{ color: postContent.trim() ? '#84cc16' : '#666666', fontWeight: '700' }}
                  strong
                >
                  {isCreatingPost ? 'Posting...' : 'Post'}
                </IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent style={{ '--background': '#000000' }}>
            <div style={{ padding: '16px' }}>
              <IonItem style={{ '--background': '#1a1a1a', '--border-radius': '12px', '--border-color': '#2a2a2a', '--color': '#ffffff', marginBottom: '16px' }}>
                <IonLabel position="stacked" style={{ color: '#ffffff', fontWeight: '600', marginBottom: '8px' }}>
                  Title (Optional)
                </IonLabel>
                <IonInput
                  value={postTitle}
                  onIonInput={e => setPostTitle(e.detail.value!)}
                  placeholder="Add a title..."
                  maxlength={100}
                  style={{ '--color': '#ffffff', '--placeholder-color': '#666666' }}
                />
              </IonItem>
              <IonText color="medium" style={{ fontSize: '12px', padding: '0 4px', display: 'block', marginTop: '-8px', marginBottom: '16px' }}>
                {postTitle.length}/100 characters
              </IonText>

              <IonItem style={{ '--background': '#1a1a1a', '--border-radius': '12px', '--border-color': '#2a2a2a', '--color': '#ffffff' }}>
                <IonLabel position="stacked" style={{ color: '#ffffff', fontWeight: '600', marginBottom: '8px' }}>
                  What's on your mind?
                </IonLabel>
                <IonTextarea
                  value={postContent}
                  onIonInput={e => setPostContent(e.detail.value!)}
                  placeholder="Share something with the group..."
                  rows={8}
                  autoGrow
                  style={{ '--color': '#ffffff', '--placeholder-color': '#666666', minHeight: '150px' }}
                />
              </IonItem>

              {/* Image Upload Section */}
              <div style={{ marginTop: '16px' }}>
                <IonButton
                  expand="block"
                  fill="outline"
                  color="success"
                  onClick={handleAddPostImage}
                  disabled={postImages.length >= 4}
                  style={{ '--border-width': '2px' }}
                >
                  <IonIcon slot="start" icon={imagesIcon} />
                  Add Images ({postImages.length}/4)
                </IonButton>

                {/* Image Previews */}
                {postImages.length > 0 && (
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: '8px',
                    marginTop: '16px'
                  }}>
                    {postImages.map((image, index) => (
                      <div key={index} style={{ position: 'relative' }}>
                        <img
                          src={image}
                          alt={`Preview ${index + 1}`}
                          style={{
                            width: '100%',
                            height: '120px',
                            objectFit: 'cover',
                            borderRadius: '8px',
                            border: '2px solid #2a2a2a'
                          }}
                        />
                        <IonButton
                          fill="solid"
                          color="danger"
                          size="small"
                          style={{
                            position: 'absolute',
                            top: '4px',
                            right: '4px',
                            '--padding-start': '8px',
                            '--padding-end': '8px',
                            height: '32px',
                            minWidth: '32px'
                          }}
                          onClick={() => handleRemovePostImage(index)}
                        >
                          <IonIcon icon={close} slot="icon-only" />
                        </IonButton>
                      </div>
                    ))}
                  </div>
                )}
                <IonText color="medium" style={{ fontSize: '12px', padding: '8px 4px', display: 'block' }}>
                  You can add up to 4 images
                </IonText>
              </div>
            </div>
          </IonContent>
        </IonModal>

        {/* Invite Members Modal (placeholder for future implementation) */}
        <IonModal isOpen={showInviteModal} onDidDismiss={() => {
          setShowInviteModal(false);
          setInviteSearchQuery("");
          setSearchResults([]);
        }}>
          <IonHeader>
            <IonToolbar>
              <IonTitle>Invite Members</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => {
                  setShowInviteModal(false);
                  setInviteSearchQuery("");
                  setSearchResults([]);
                }} color="success">
                  Done
                </IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent>
            <div style={{ padding: '16px' }}>
              {/* Search Bar */}
              <IonSearchbar
                value={inviteSearchQuery}
                onIonInput={(e) => setInviteSearchQuery(e.detail.value || '')}
                placeholder="Search users by name or username..."
                debounce={0}
                style={{
                  '--background': '#1a1a1a',
                  '--color': '#ffffff',
                  '--placeholder-color': '#999999',
                  '--icon-color': '#84cc16',
                  '--border-radius': '12px',
                  padding: '8px 0'
                }}
              />

              {/* Search Results */}
              <div style={{ marginTop: '16px' }}>
                {isSearching ? (
                  <div style={{ textAlign: 'center', padding: '32px' }}>
                    <IonSpinner name="crescent" color="success" />
                    <p style={{ color: '#999999', marginTop: '12px' }}>Searching...</p>
                  </div>
                ) : inviteSearchQuery.trim().length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '48px 16px' }}>
                    <IonIcon icon={searchOutline} style={{ fontSize: '64px', color: '#666666', marginBottom: '16px' }} />
                    <h3 style={{ color: '#ffffff', margin: '0 0 8px 0' }}>Search for Users</h3>
                    <p style={{ color: '#999999', margin: 0, fontSize: '14px' }}>
                      Enter a name or username to find users to invite to this group.
                    </p>
                  </div>
                ) : searchResults.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '48px 16px' }}>
                    <IonIcon icon={personAddOutline} style={{ fontSize: '64px', color: '#666666', marginBottom: '16px' }} />
                    <h3 style={{ color: '#ffffff', margin: '0 0 8px 0' }}>No Users Found</h3>
                    <p style={{ color: '#999999', margin: 0, fontSize: '14px' }}>
                      Try a different search term.
                    </p>
                  </div>
                ) : (
                  <>
                    <p style={{ color: '#999999', fontSize: '13px', padding: '0 4px 12px 4px', margin: 0 }}>
                      {searchResults.length} user{searchResults.length !== 1 ? 's' : ''} found
                    </p>
                    {searchResults.map((user: any) => (
                      <IonCard key={user.user_id} className="member-card" style={{ marginBottom: '12px' }}>
                        <IonItem lines="none">
                          <IonAvatar slot="start" style={{ width: '48px', height: '48px' }}>
                            <img src={user.profile_picture || ProfilePic} alt={user.name} />
                          </IonAvatar>
                          <IonLabel>
                            <h2 style={{ color: '#ffffff', fontWeight: '600', fontSize: '15px', margin: '0 0 4px 0' }}>
                              {user.name}
                            </h2>
                            <p style={{ color: '#999999', fontSize: '13px', margin: '0 0 2px 0' }}>
                              @{user.username || 'user'}
                            </p>
                            {user.location && (
                              <p style={{ color: '#666666', fontSize: '12px', margin: '2px 0 0 0' }}>
                                📍 {user.location}
                              </p>
                            )}
                          </IonLabel>
                          <IonButton
                            slot="end"
                            color="success"
                            size="small"
                            onClick={() => handleInviteUser(user.user_id)}
                            disabled={invitingUsers[user.user_id]}
                            style={{ '--border-radius': '8px', textTransform: 'none' }}
                          >
                            {invitingUsers[user.user_id] ? (
                              <>
                                <IonSpinner name="crescent" style={{ width: '16px', height: '16px', marginRight: '6px' }} />
                                Inviting...
                              </>
                            ) : (
                              <>
                                <IonIcon icon={personAddOutline} slot="start" />
                                Invite
                              </>
                            )}
                          </IonButton>
                        </IonItem>
                      </IonCard>
                    ))}
                  </>
                )}
              </div>
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

        {/* Disband Group Confirmation Alert */}
        <IonAlert
          isOpen={showDisbandAlert}
          onDidDismiss={() => setShowDisbandAlert(false)}
          header="Disband Group"
          message="Are you sure you want to disband this group? This action cannot be undone. All posts, members, and data will be permanently deleted."
          buttons={[
            {
              text: 'Cancel',
              role: 'cancel'
            },
            {
              text: 'Disband',
              role: 'destructive',
              handler: handleDisbandGroup
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
