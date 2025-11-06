import React, { useState, useEffect } from "react";
import { useHistory, useLocation } from 'react-router-dom';
import axios from 'axios';
import { useNotifications } from '../contexts/NotificationContext';
import NotificationMenu from '../components/Notifications/NotificationMenu';
import {
  IonPage,
  IonContent,
  IonCard,
  IonCardContent,
  IonItem,
  IonInput,
  IonButton,
  IonAvatar,
  IonIcon,
  IonFab,
  IonFabButton,
  IonBadge,
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonList,
} from "@ionic/react";
import {
  chatbubbleEllipses,
  peopleOutline,
  flagOutline,
  createOutline,
  heartOutline,
  timeOutline,
  locationOutline,
  flameOutline,
  notifications,
  close,
  personAddOutline,
  trophyOutline,
  ribbonOutline,
  speedometerOutline,
  person
} from "ionicons/icons";

// Import the new CreatePostPage component
import CreatePostPage from "../components/Home/CreatePostPage";
import "../components/Home/Home.css";

// Post interface
interface Post {
  post_id: number;
  user_id: number;
  route_id?: number;
  content?: string;
  route_name?: string;
  distance_km?: number;
  duration_seconds?: number;
  average_pace?: string;
  estimated_calories?: number;
  snapshot_url?: string;
  visibility: 'public' | 'private';
  created_at: string;
  author_name: string;
  author_username: string;
  author_avatar?: string;
  likes_count: number;
  comments_count: number;
  is_liked: boolean;
}

// Comment interface
interface Comment {
  comment_id: number;
  content: string;
  created_at: string;
  user_id: number;
  username: string;
  name: string;
  profile_picture?: string;
}

// User search result interface
interface UserSearchResult {
  user_id: number;
  name: string;
  username: string;
  profile_picture?: string;
  location?: string;
}

// Placeholder images
import ProfilePic from "../assets/Profile Picture.png";
import Couch5K from "../assets/Couch to 5K.jpg";
import SevenDayStarter from "../assets/The 7-Day Starter.jpg";
import ThreeTimesAWeek from "../assets/Three Times a Week.jpg";
import { supabase } from "../supabaseClient";

const Home: React.FC = () => {
  const [openComments, setOpenComments] = useState<number | null>(null);
  const [showCreatePostPage, setShowCreatePostPage] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const { unreadCount } = useNotifications();
  const [posts, setPosts] = useState<Post[]>([]);
  const [comments, setComments] = useState<{ [postId: number]: Comment[] }>({});
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState<{ [postId: number]: string }>({});

  // User search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [followingUsers, setFollowingUsers] = useState<Set<number>>(new Set());

  // Current user profile state
  const [currentUser, setCurrentUser] = useState<{
    name: string;
    username: string;
    profile_picture?: string;
    user_id?: number;
  } | null>(null);
  const [followCounts, setFollowCounts] = useState({ followers: 0, following: 0 });
  const [userRoutes, setUserRoutes] = useState<any[]>([]);
  const [weeklyStats, setWeeklyStats] = useState({
    distance: '0.0 km',
    time: '0h 0m',
    calories: '0'
  });

  const history = useHistory();
  const location = useLocation();

  // Calculate weekly stats from user routes
  useEffect(() => {
    if (!userRoutes || userRoutes.length === 0) {
      setWeeklyStats({
        distance: '0.0 km',
        time: '0h 0m',
        calories: '0'
      });
      return;
    }

    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Filter routes from the last 7 days
    const weekRoutes = userRoutes.filter(route => {
      const created = new Date(route.created_at);
      return created >= weekAgo;
    });

    // Calculate totals
    const total_distance = weekRoutes.reduce((sum, r) => sum + (r.distance_km || 0), 0);
    const total_duration = weekRoutes.reduce((sum, r) => sum + (r.duration_seconds || 0), 0);
    const total_calories = weekRoutes.reduce((sum, r) => sum + (r.estimated_calories || 0), 0);

    // Format distance
    const distance = `${total_distance.toFixed(1)} km`;

    // Format time (duration in seconds to hours and minutes)
    const hours = Math.floor(total_duration / 3600);
    const minutes = Math.floor((total_duration % 3600) / 60);
    const time = `${hours}h ${minutes}m`;

    // Format calories
    const calories = Math.round(total_calories).toString();

    setWeeklyStats({
      distance,
      time,
      calories
    });
  }, [userRoutes]);

  // Check session and initialize
  useEffect(() => {
    const initialize = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.error('❌ Home: Error getting session:', error);
          setLoading(false);
          return;
        }

        if (session) {
          console.log('✅ Home: Session found, initializing data');

          // Fetch data in parallel
          await Promise.all([
            fetchCurrentUserProfile(),
            fetchFeed()
          ]);
        } else {
          console.log('⚠️ Home: No session found');
          setLoading(false);
        }
      } catch (error) {
        console.error('❌ Home: Error in initialization:', error);
        setLoading(false);
      }
    };

    initialize();
  }, []);

  // Debounced search for users
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchQuery.trim().length >= 2) {
        searchUsers(searchQuery.trim());
      } else {
        setSearchResults([]);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  // Search users
  const searchUsers = async (query: string) => {
    try {
      setSearchLoading(true);
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.access_token) return;

      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/users/search?q=${encodeURIComponent(query)}`,
        {
          headers: { Authorization: `Bearer ${session.access_token}` }
        }
      );

      setSearchResults(response.data);

      // Check follow status for each user
      const userIds = response.data.map((u: UserSearchResult) => u.user_id);
      const followStatuses = await Promise.all(
        userIds.map((userId: number) => checkFollowStatus(userId))
      );

      const following = new Set<number>(
        userIds.filter((_: number, index: number) => followStatuses[index])
      );
      setFollowingUsers(following);
    } catch (error) {
      console.error('Failed to search users:', error);
    } finally {
      setSearchLoading(false);
    }
  };

  // Check if following a user
  const checkFollowStatus = async (userId: number): Promise<boolean> => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return false;

      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/follows/status/${userId}`,
        {
          headers: { Authorization: `Bearer ${session.access_token}` }
        }
      );

      return response.data.isFollowing;
    } catch (error) {
      console.error('Failed to check follow status:', error);
      return false;
    }
  };

  // Toggle follow user
  const handleToggleFollow = async (userId: number) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/follows/${userId}/toggle`,
        {},
        {
          headers: { Authorization: `Bearer ${session.access_token}` }
        }
      );

      // Update following state
      setFollowingUsers(prev => {
        const newSet = new Set(prev);
        if (response.data.isFollowing) {
          newSet.add(userId);
        } else {
          newSet.delete(userId);
        }
        return newSet;
      });
    } catch (error) {
      console.error('Failed to toggle follow:', error);
    }
  };

  // Navigate to user profile
  const handleViewProfile = (userId: number) => {
    history.push(`/user/${userId}`);
  };

  const fetchCurrentUserProfile = async () => {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      if (!session) return;

      const token = session.access_token;

      // Fetch user profile
      const { data: user } = await axios.get(
        `${import.meta.env.VITE_API_URL}/users/me`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setCurrentUser({
        name: user.name,
        username: user.username,
        profile_picture: user.profile_picture,
        user_id: user.user_id
      });

      // Fetch follow counts
      const { data: counts } = await axios.get(
        `${import.meta.env.VITE_API_URL}/follows/${user.user_id}/counts`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setFollowCounts(counts);

      // Fetch user routes (for activities count and weekly stats calculation)
      // Only fetch completed routes (activities_only = true) - excludes generated routes
      const routesResponse = await axios.get(
        `${import.meta.env.VITE_API_URL}/routes/user/${user.user_id}`,
        {
          params: {
            limit: 100, // Increased to get all activities for accurate stats
            offset: 0,
            activities_only: true // Only count completed runs, not generated routes
          }
        }
      );
      setUserRoutes(Array.isArray(routesResponse.data) ? routesResponse.data : []);
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
    }
  };

  const fetchFeed = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.access_token) {
        console.error('No access token found');
        setLoading(false);
        return;
      }

      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/posts/feed`,
        {
          headers: { Authorization: `Bearer ${session.access_token}` }
        }
      );

      setPosts(response.data);
    } catch (error) {
      console.error('Failed to fetch feed:', error);
    } finally {
      setLoading(false);
    }
  };

  // Listen for a close event from NotificationMenu to hide the modal
  useEffect(() => {
    const handler = () => setShowNotifications(false);
    window.addEventListener('notifications:close', handler);
    return () => window.removeEventListener('notifications:close', handler);
  }, []);

  // If navigated with ?focusPost, refresh feed to get latest, then scroll after posts load
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const focus = params.get('focusPost');
    if (focus) {
      fetchFeed();
    }
  }, [location.search]);

  // Scroll to focused post after posts are present
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const focus = params.get('focusPost');
    if (!focus) return;
    const targetId = `post-${Number(focus)}`;
    const el = document.getElementById(targetId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Remove focus param from URL to avoid repeated scrolls
      history.replace('/home');
    }
  }, [posts]);

  // Scroll to a post if focusPost query param is present
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const focus = params.get('focusPost');
    if (!focus) return;
    const targetId = `post-${Number(focus)}`;
    const el = document.getElementById(targetId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Optional: brief highlight class for UX
      el.classList.add('highlight-focus');
      setTimeout(() => el.classList.remove('highlight-focus'), 2000);
    }
  }, [posts]);

  // Fetch comments for a post
  const fetchComments = async (postId: number) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.access_token) return;

      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/comments/${postId}`,
        {
          headers: { Authorization: `Bearer ${session.access_token}` }
        }
      );

      setComments(prev => ({ ...prev, [postId]: response.data }));
    } catch (error) {
      console.error('Failed to fetch comments:', error);
    }
  };

  // Toggle like on a post
  const handleToggleLike = async (postId: number) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.access_token) return;

      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/likes/${postId}/toggle`,
        {},
        {
          headers: { Authorization: `Bearer ${session.access_token}` }
        }
      );

      // Update the post in state
      setPosts(prevPosts =>
        prevPosts.map(post =>
          post.post_id === postId
            ? { ...post, is_liked: response.data.liked, likes_count: response.data.likes }
            : post
        )
      );
    } catch (error) {
      console.error('Failed to toggle like:', error);
    }
  };

  // Add a comment to a post
  const handleAddComment = async (postId: number) => {
    const commentText = newComment[postId]?.trim();
    if (!commentText) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.access_token) return;

      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/comments/${postId}`,
        { content: commentText },
        {
          headers: { Authorization: `Bearer ${session.access_token}` }
        }
      );

      // Add the new comment to state
      setComments(prev => ({
        ...prev,
        [postId]: [...(prev[postId] || []), response.data]
      }));

      // Update comments count
      setPosts(prevPosts =>
        prevPosts.map(post =>
          post.post_id === postId
            ? { ...post, comments_count: post.comments_count + 1 }
            : post
        )
      );

      // Clear input
      setNewComment(prev => ({ ...prev, [postId]: '' }));
    } catch (error) {
      console.error('Failed to add comment:', error);
    }
  };

  // Handle opening comments section
  const handleOpenComments = async (postId: number) => {
    if (openComments === postId) {
      setOpenComments(null);
    } else {
      setOpenComments(postId);
      if (!comments[postId]) {
        await fetchComments(postId);
      }
    }
  };

  // Format duration from seconds to HH:MM:SS
  const formatDuration = (seconds?: number) => {
    if (!seconds) return 'N/A';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Format relative time
  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;

    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  const handlePostSubmit = (content: string) => {
    console.log("New post:", content);
    // Handle post submission here
  };

  const handleViewAllChallenges = () => {
    history.push('/challenges');
  };
  

  // If create post page is shown, render it instead
  if (showCreatePostPage) {
    return (
      <CreatePostPage
        userName={currentUser?.name || 'User'}
        userAvatar={currentUser?.profile_picture || ProfilePic}
        onClose={() => setShowCreatePostPage(false)}
        onSubmit={handlePostSubmit}
      />
    );
  }

  return (
    <IonPage>
      <IonContent className="home-content">
        <div className="page-layout-enhanced">
          {/* Left Sidebar */}
          <aside className="left-sidebar">
            <IonCard className="profile-card-enhanced">
              <div className="profile-card-header">
                <IonAvatar className="profile-avatar-large">
                  {currentUser?.profile_picture ? (
                    <img src={currentUser.profile_picture} alt="Profile" />
                  ) : (
                    <IonIcon icon={person} style={{ fontSize: '64px', color: '#92C628' }} />
                  )}
                </IonAvatar>
                
              </div>

              <IonCardContent className="profile-card-content">
                <h2 className="profile-name">{currentUser?.name || 'Loading...'}</h2>
                <p className="profile-handle">@{currentUser?.username || 'username'}</p>

                <div className="profile-stats-grid">
                  <div className="stat-item">
                    <span className="stat-number">{followCounts.following}</span>
                    <span className="stat-label">Following</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-number">{followCounts.followers}</span>
                    <span className="stat-label">Followers</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-number">{userRoutes.length}</span>
                    <span className="stat-label">Activities</span>
                  </div>
                </div>

                <div className="weekly-summary">
                  <h4>This Week</h4>
                  <div className="summary-stats">
                    <div className="summary-item">
                      <span className="summary-value">{weeklyStats.distance}</span>
                      <span className="summary-label">Distance</span>
                    </div>
                    <div className="summary-item">
                      <span className="summary-value">{weeklyStats.time}</span>
                      <span className="summary-label">Time</span>
                    </div>
                    <div className="summary-item">
                      <span className="summary-value">{weeklyStats.calories}</span>
                      <span className="summary-label">Calories</span>
                    </div>
                  </div>
                </div>
              </IonCardContent>
            </IonCard>


          </aside>

          {/* Center Feed */}
          <main className="feed-column-enhanced">
            <div className="feed-header">
              <div className="search-section">
                <IonItem className="search-input">
                  <IonInput
                    placeholder="Find athletes"
                    value={searchQuery}
                    onIonInput={(e) => setSearchQuery(e.detail.value || '')}
                  />
                </IonItem>
              </div>
            </div>

            {/* Find Athletes - Search Results */}
            {searchQuery.trim().length >= 2 && (
              <IonCard style={{ marginBottom: '20px' }}>
                <IonCardContent>
                  <h3 style={{ marginBottom: '15px', fontWeight: 'bold' }}>Find Athletes</h3>

                  {searchLoading ? (
                    <div style={{ textAlign: 'center', padding: '20px' }}>
                      Searching...
                    </div>
                  ) : searchResults.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
                      No users found
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {searchResults.map((user) => (
                        <div
                          key={user.user_id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            padding: '12px',
                            borderRadius: '8px',
                            backgroundColor: '#f8fafc',
                            cursor: 'pointer',
                            transition: 'background-color 0.2s'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e2e8f0'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                        >
                          <IonAvatar
                            style={{ width: '50px', height: '50px', marginRight: '12px', cursor: 'pointer' }}
                            onClick={() => handleViewProfile(user.user_id)}
                          >
                            {user.profile_picture ? (
                              <img src={user.profile_picture} alt={user.name} />
                            ) : (
                              <IonIcon icon={person} style={{ fontSize: '32px', color: '#92C628' }} />
                            )}
                          </IonAvatar>

                          <div
                            style={{ flex: 1, cursor: 'pointer' }}
                            onClick={() => handleViewProfile(user.user_id)}
                          >
                            <div style={{ fontWeight: 'bold', fontSize: '16px' }}>{user.name}</div>
                            <div style={{ color: '#666', fontSize: '14px' }}>@{user.username}</div>
                            {user.location && (
                              <div style={{ color: '#999', fontSize: '12px', marginTop: '4px' }}>
                                <IonIcon icon={locationOutline} style={{ fontSize: '12px', marginRight: '4px' }} />
                                {user.location}
                              </div>
                            )}
                          </div>

                          <IonButton
                            fill={followingUsers.has(user.user_id) ? "outline" : "solid"}
                            size="small"
                            onClick={() => handleToggleFollow(user.user_id)}
                            style={{ minWidth: '100px' }}
                          >
                            {followingUsers.has(user.user_id) ? 'Following' : 'Follow'}
                          </IonButton>
                        </div>
                      ))}
                    </div>
                  )}
                </IonCardContent>
              </IonCard>
            )}

            {/* Activity Feed */}
            <div className="activity-feed">
              {loading ? (
                <div style={{ textAlign: 'center', padding: '20px' }}>
                  Loading feed...
                </div>
              ) : posts.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '20px' }}>
                  No posts yet. Follow some users to see their activities!
                </div>
              ) : (
                posts.map((post) => (
                  <IonCard key={post.post_id} id={`post-${post.post_id}`} className="activity-card-enhanced">
                    {/* Activity Header */}
                    <div className="activity-header-enhanced">
                      <IonAvatar
                        className="activity-user-avatar"
                        style={{ cursor: 'pointer' }}
                        onClick={() => handleViewProfile(post.user_id)}
                      >
                        {post.author_avatar ? (
                          <img src={post.author_avatar} alt="Profile" />
                        ) : (
                          <IonIcon icon={person} style={{ fontSize: '32px', color: '#92C628' }} />
                        )}
                      </IonAvatar>
                      <div className="activity-user-info">
                        <h3
                          className="activity-user-name"
                          style={{ cursor: 'pointer' }}
                          onClick={() => handleViewProfile(post.user_id)}
                        >
                          {post.author_name} <span className="activity-handle">@{post.author_username}</span>
                        </h3>
                        <div className="activity-meta">
                          <span className="activity-time">{formatRelativeTime(post.created_at)}</span> • {new Date(post.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>

                    <IonCardContent className="activity-content-enhanced">
                      {/* Route Name & Content */}
                      {post.route_name && (
                        <h4 style={{ marginBottom: '10px', fontWeight: 'bold' }}>{post.route_name}</h4>
                      )}
                      {post.content && (
                        <p style={{ marginBottom: '15px' }}>{post.content}</p>
                      )}

                      {/* Stats */}
                      {post.route_id && (
                        <div className="activity-stats-grid">
                          <div className="stat-card distance">
                            <IonIcon icon={locationOutline} />
                            <div>
                              <span className="stat-value">{post.distance_km?.toFixed(1)} km</span>
                              <span className="stat-label">Distance</span>
                            </div>
                          </div>
                          <div className="stat-card time">
                            <IonIcon icon={timeOutline} />
                            <div>
                              <span className="stat-value">{formatDuration(post.duration_seconds)}</span>
                              <span className="stat-label">Time</span>
                            </div>
                          </div>
                          <div className="stat-card pace">
                            <IonIcon icon={speedometerOutline} />
                            <div>
                              <span className="stat-value">{post.average_pace || 'N/A'}</span>
                              <span className="stat-label">Pace</span>
                            </div>
                          </div>
                          <div className="stat-card calories">
                            <IonIcon icon={flameOutline} />
                            <div>
                              <span className="stat-value">{post.estimated_calories || 'N/A'}</span>
                              <span className="stat-label">Calories</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Map */}
                      {post.snapshot_url && (
                        <div className="activity-map-container">
                          <img src={post.snapshot_url} alt="Run Map" className="activity-map" />
                          <div className="map-overlay"></div>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="activity-actions-enhanced">
                        <IonButton
                          fill="clear"
                          size="small"
                          className={`action-btn like-btn ${post.is_liked ? 'liked' : ''}`}
                          onClick={() => handleToggleLike(post.post_id)}
                        >
                          <IonIcon icon={heartOutline} slot="start" />
                          <span>{post.likes_count} Likes</span>
                        </IonButton>

                        <IonButton
                          fill="clear"
                          size="small"
                          className="action-btn comment-btn"
                          onClick={() => handleOpenComments(post.post_id)}
                        >
                          <IonIcon icon={chatbubbleEllipses} slot="start" />
                          <span>{post.comments_count} Comments</span>
                        </IonButton>
                      </div>

                      {/* Comments */}
                      {openComments === post.post_id && (
                        <div className="comments-section-enhanced">
                          <div className="comments-header">
                            <h4>Comments ({post.comments_count})</h4>
                          </div>
                          {comments[post.post_id]?.map((comment) => (
                            <div key={comment.comment_id} className="comment-enhanced">
                              <IonAvatar
                                className="comment-avatar"
                                style={{ cursor: 'pointer' }}
                                onClick={() => handleViewProfile(comment.user_id)}
                              >
                                {comment.profile_picture ? (
                                  <img src={comment.profile_picture} alt={comment.username} />
                                ) : (
                                  <IonIcon icon={person} style={{ fontSize: '24px', color: '#92C628' }} />
                                )}
                              </IonAvatar>
                              <div className="comment-content">
                                <div className="comment-header">
                                  <strong
                                    className="comment-user"
                                    style={{ cursor: 'pointer' }}
                                    onClick={() => handleViewProfile(comment.user_id)}
                                  >
                                    {comment.name}
                                  </strong>
                                  <span className="comment-time">{formatRelativeTime(comment.created_at)}</span>
                                </div>
                                <p className="comment-text">{comment.content}</p>
                              </div>
                            </div>
                          ))}
                          <div className="add-comment">
                            <IonAvatar className="comment-avatar">
                              {currentUser?.profile_picture ? (
                                <img src={currentUser.profile_picture} alt="You" />
                              ) : (
                                <IonIcon icon={person} style={{ fontSize: '24px', color: '#92C628' }} />
                              )}
                            </IonAvatar>
                            <IonInput
                              placeholder="Add a comment..."
                              className="comment-input"
                              value={newComment[post.post_id] || ''}
                              onIonInput={(e) => setNewComment(prev => ({
                                ...prev,
                                [post.post_id]: e.detail.value || ''
                              }))}
                              onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                  handleAddComment(post.post_id);
                                }
                              }}
                            />
                            <IonButton
                              fill="clear"
                              size="small"
                              onClick={() => handleAddComment(post.post_id)}
                            >
                              Post
                            </IonButton>
                          </div>
                        </div>
                      )}
                    </IonCardContent>
                  </IonCard>
                ))
              )}
            </div>
          </main>

          {/* Right Sidebar */}
          <aside className="right-sidebar">
            <IonCard className="sidebar-card-enhanced challenges-card">
                <div className="sidebar-card-header">
                  <div>
                    <h3 className="sidebar-title">Your Challenges</h3>
                  </div>
                </div>
                <div className="sidebar-card-content">
                    <div className="challenge-list">
                      <div className="strava-challenge-item">
                        <div className="challenge-badge">
                          <img src={Couch5K} alt="Couch to 5K" />
                        </div>
                        <div className="challenge-info">
                          <h4 className="challenge-title">Couch to 5K</h4>
                          <div className="challenge-days-left">
                            <IonIcon icon={timeOutline} />
                            <span>38 days left</span>
                          </div>
                        </div>
                      </div>

                      <div className="strava-challenge-item">
                        <div className="challenge-badge">
                          <img src={SevenDayStarter} alt="The 7-Day Starter" />
                        </div>
                        <div className="challenge-info">
                          <h4 className="challenge-title">The 7-Day Starter</h4>
                          <div className="challenge-days-left">
                            <IonIcon icon={timeOutline} />
                            <span>2 days left</span>
                          </div>
                        </div>
                      </div>

                      <div className="strava-challenge-item">
                        <div className="challenge-badge">
                          <img src={ThreeTimesAWeek} alt="Three Times a Week" />
                        </div>
                        <div className="challenge-info">
                          <h4 className="challenge-title">Three Times a Week</h4>
                          <div className="challenge-days-left">
                            <IonIcon icon={timeOutline} />
                            <span>10 days left</span>
                          </div>
                        </div>
                      </div>
                  </div>
                  <IonButton expand="block" fill="clear" className="sidebar-cta" onClick={handleViewAllChallenges}>
                    View All Challenges
                  </IonButton>
                </div>
              </IonCard>
          </aside>
        </div>

        {/* Floating Action Button for Notifications */}
        <IonFab vertical="bottom" horizontal="end" slot="fixed">
          <IonFabButton onClick={() => setShowNotifications(true)}>
            <IonIcon icon={notifications} />
            {unreadCount > 0 && (
              <IonBadge color="danger" className="fab-badge">
                {unreadCount > 99 ? '99+' : unreadCount}
              </IonBadge>
            )}
          </IonFabButton>
        </IonFab>

        {/* Notifications Modal */}
        <IonModal isOpen={showNotifications} onDidDismiss={() => setShowNotifications(false)} className="notifications-modal">
          <IonHeader>
            <IonToolbar>
              <IonTitle>Notifications</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => setShowNotifications(false)}>
                  <IonIcon icon={close} />
                </IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <NotificationMenu />
        </IonModal>
      </IonContent>
    </IonPage>
  );
};

export default Home;
