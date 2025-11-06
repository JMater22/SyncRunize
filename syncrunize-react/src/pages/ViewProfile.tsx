import React, { useState, useEffect } from 'react';
import { useParams, useHistory } from 'react-router-dom';
import axios from 'axios';
import {
  IonPage,
  IonContent,
  IonCard,
  IonCardContent,
  IonAvatar,
  IonButton,
  IonIcon,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonBackButton,
  IonGrid,
  IonRow,
  IonCol,
  IonSpinner,
  IonImg,
  IonInput
} from '@ionic/react';
import {
  personAddOutline,
  personRemoveOutline,
  heartOutline,
  chatbubbleEllipses,
  locationOutline,
  timeOutline,
  flameOutline,
  speedometerOutline,
  statsChart,
  trophy,
  flame,
  person,
  eyeOutline,
  lockClosedOutline
} from 'ionicons/icons';
import { supabase } from '../supabaseClient';
import Banner from '../assets/Banner UP.png';
import MapImage from '../assets/MAP 1.png';

const DEFAULT_AVATAR = 'https://ionicframework.com/docs/img/demos/avatar.svg';

// Import the same CSS as Profile.tsx
import '../components/UserProfile/UserProfile.css';

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

// User profile interface
interface UserProfile {
  user_id: number;
  name: string;
  username: string;
  email: string;
  profile_picture?: string;
  description?: string;
  gender?: string;
  age?: number;
  weight_kg?: number;
  created_at: string;
}

// Route interface for activities
interface Route {
  route_id: number;
  route_name: string;
  route_type?: string;
  distance_km: number;
  duration_seconds: number;
  average_pace?: string;
  estimated_calories?: number;
  map_image_url?: string;
  created_at: string;
}

interface StatSummary {
  title: string;
  runs_count: number;
  total_distance: string;
  avg_pace: string;
  total_calories: string;
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

const ViewProfile: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const history = useHistory();

  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [userRoutes, setUserRoutes] = useState<Route[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [postsLoading, setPostsLoading] = useState(true);
  const [routesLoading, setRoutesLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'activities' | 'badges' | 'challenges' | 'posts'>('activities');
  const [timeRange, setTimeRange] = useState<'day' | 'week' | 'month'>('day');

  // Badges and Challenges state
  const [earnedBadges, setEarnedBadges] = useState<any[]>([]);
  const [userChallenges, setUserChallenges] = useState<any[]>([]);
  const [loadingBadges, setLoadingBadges] = useState(false);
  const [loadingChallenges, setLoadingChallenges] = useState(false);

  // Comments state
  const [openComments, setOpenComments] = useState<number | null>(null);
  const [comments, setComments] = useState<{ [postId: number]: Comment[] }>({});
  const [newComment, setNewComment] = useState<{ [postId: number]: string }>({});

  const [statsData, setStatsData] = useState<{
    day: StatSummary;
    week: StatSummary;
    month: StatSummary;
  }>({
    day: { title: "Today", runs_count: 0, total_distance: "0.0 km", avg_pace: "0:00 /km", total_calories: "0 kcal" },
    week: { title: "This Week", runs_count: 0, total_distance: "0.0 km", avg_pace: "0:00 /km", total_calories: "0 kcal" },
    month: { title: "This Month", runs_count: 0, total_distance: "0.0 km", avg_pace: "0:00 /km", total_calories: "0 kcal" },
  });

  // Redirect to own profile if viewing self
  useEffect(() => {
    const checkAndRedirect = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) return;

        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/users/me`,
          {
            headers: { Authorization: `Bearer ${session.access_token}` }
          }
        );

        const myUserId = response.data.user_id;
        setCurrentUserId(myUserId);

        // Redirect if viewing own profile
        if (parseInt(userId) === myUserId) {
          history.replace('/profile');
        }
      } catch (error) {
        console.error('Failed to check user:', error);
      }
    };

    checkAndRedirect();
  }, [userId, history]);

  useEffect(() => {
    // Reset all state immediately when userId changes to prevent showing stale data
    setProfile(null);
    setPosts([]);
    setUserRoutes([]);
    setEarnedBadges([]);
    setUserChallenges([]);
    setIsFollowing(false);
    setFollowerCount(0);
    setFollowingCount(0);
    setComments({});
    setOpenComments(null);
    setStatsData({
      day: { title: "Today", runs_count: 0, total_distance: "0.0 km", avg_pace: "0:00 /km", total_calories: "0 kcal" },
      week: { title: "This Week", runs_count: 0, total_distance: "0.0 km", avg_pace: "0:00 /km", total_calories: "0 kcal" },
      month: { title: "This Month", runs_count: 0, total_distance: "0.0 km", avg_pace: "0:00 /km", total_calories: "0 kcal" },
    });

    // Fetch new data - ensure session is available first
    const initializeData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        fetchUserProfile();
        fetchUserPosts();
        fetchUserRoutes();
        fetchFollowCounts();
        checkFollowStatus();
        fetchUserBadges();
        fetchUserChallenges();
      }
    };
    initializeData();
  }, [userId]);

  // Calculate stats from routes
  useEffect(() => {
    if (!userRoutes || userRoutes.length === 0) return;

    const calculatePace = (durationSeconds: number, distanceKm: number) => {
      if (distanceKm === 0) return "0:00 /km";
      const pace = durationSeconds / 60 / distanceKm;
      const minutes = Math.floor(pace);
      const seconds = Math.round((pace - minutes) * 60);
      return `${minutes}:${seconds.toString().padStart(2, "0")} /km`;
    };

    const now = new Date();

    const filterByPeriod = (routes: Route[], days: number) =>
      routes.filter(route => {
        const created = new Date(route.created_at);
        const diffDays = (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
        return diffDays <= days;
      });

    const calcStats = (filteredRoutes: Route[]) => {
      const runs_count = filteredRoutes.length;
      const total_distance = filteredRoutes.reduce((sum, r) => sum + (r.distance_km || 0), 0);
      const total_duration = filteredRoutes.reduce((sum, r) => sum + (r.duration_seconds || 0), 0);
      const estimated_calories = filteredRoutes.reduce((sum, r) => sum + (r.estimated_calories || 0), 0);
      const avg_pace = total_duration && total_distance
        ? calculatePace(total_duration, total_distance)
        : "0:00 /km";

      return {
        runs_count,
        total_distance: `${total_distance.toFixed(1)} km`,
        avg_pace,
        total_calories: `${Math.round(estimated_calories)} kcal`
      };
    };

    const dayRoutes = filterByPeriod(userRoutes, 1);
    const weekRoutes = filterByPeriod(userRoutes, 7);
    const monthRoutes = filterByPeriod(userRoutes, 30);

    setStatsData({
      day: { title: "Today", ...calcStats(dayRoutes) },
      week: { title: "This Week", ...calcStats(weekRoutes) },
      month: { title: "This Month", ...calcStats(monthRoutes) },
    });
  }, [userRoutes]);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();

      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/users/public/${userId}`,
        session?.access_token ? {
          headers: { Authorization: `Bearer ${session.access_token}` }
        } : undefined
      );

      setProfile(response.data);
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserPosts = async () => {
    try {
      setPostsLoading(true);
      const { data: { session } } = await supabase.auth.getSession();

      console.log(`[ViewProfile] Fetching posts for userId: ${userId}, has token: ${!!session?.access_token}`);

      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/posts/user/${userId}`,
        session?.access_token ? {
          headers: { Authorization: `Bearer ${session.access_token}` }
        } : undefined
      );

      console.log(`[ViewProfile] Received ${response.data.length} posts`);
      setPosts(response.data);
    } catch (error) {
      console.error('Failed to fetch user posts:', error);
    } finally {
      setPostsLoading(false);
    }
  };

  const fetchUserRoutes = async () => {
    try {
      setRoutesLoading(true);

      // Get authentication token to identify the viewer
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/routes/user/${userId}`,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          params: {
            limit: 100,
            offset: 0,
            activities_only: true // ✅ NEW: Only fetch completed routes for activities view
          }
        }
      );

      setUserRoutes(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Failed to fetch user routes:', error);
      // If 403, it means the user has private activities
      if (axios.isAxiosError(error) && error.response?.status === 403) {
        setUserRoutes([]); // Set empty array for private activities
      }
    } finally {
      setRoutesLoading(false);
    }
  };

  const fetchFollowCounts = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/follows/${userId}/counts`
      );

      setFollowerCount(response.data.followers || 0);
      setFollowingCount(response.data.following || 0);
    } catch (error) {
      console.error('Failed to fetch follow counts:', error);
    }
  };

  const checkFollowStatus = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/follows/status/${userId}`,
        {
          headers: { Authorization: `Bearer ${session.access_token}` }
        }
      );

      setIsFollowing(response.data.isFollowing);
    } catch (error) {
      console.error('Failed to check follow status:', error);
    }
  };

  const handleToggleFollow = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      console.log(`[ViewProfile] Toggling follow for userId: ${userId}`);

      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/follows/${userId}/toggle`,
        {},
        {
          headers: { Authorization: `Bearer ${session.access_token}` }
        }
      );

      console.log(`[ViewProfile] Follow toggled. New status: ${response.data.isFollowing}`);

      setIsFollowing(response.data.isFollowing);

      // Update follower count
      if (response.data.isFollowing) {
        setFollowerCount(prev => prev + 1);
      } else {
        setFollowerCount(prev => Math.max(0, prev - 1));
      }

      // Refetch posts to apply privacy filtering based on new follow status
      console.log(`[ViewProfile] Refetching posts after follow toggle...`);
      await fetchUserPosts();
    } catch (error) {
      console.error('Failed to toggle follow:', error);
    }
  };

  const fetchUserBadges = async () => {
    try {
      setLoadingBadges(true);
      const { data: { session } } = await supabase.auth.getSession();

      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/routes/badges/${userId}`,
        session?.access_token ? {
          headers: { Authorization: `Bearer ${session.access_token}` }
        } : undefined
      );

      // Filter only completed challenges with badges
      const raw = response.data.data
        .filter((challenge: any) => challenge.completed && challenge.badge_image_url)
        .map((challenge: any) => ({
          title: challenge.badge_name || "Badge",
          description: challenge.badge_description || "Achievement unlocked",
          tier: challenge.badge_tier || "Bronze",
          earned: true,
          date: new Date(challenge.updated_at).toLocaleDateString(),
          image: challenge.badge_image_url,          awardedFor: challenge.challenge_name || challenge.challenge_slug || undefined
        }));

      // Deduplicate by image URL (fallback to name|tier)
      const seen = new Set<string>();
      const unique = raw.filter((b: any) => {
        const key = b.image || `${b.title}|${b.tier}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      setEarnedBadges(unique);
    } catch (error) {
      console.error('Failed to fetch user badges:', error);
      setEarnedBadges([]);
    } finally {
      setLoadingBadges(false);
    }
  };

  const fetchUserChallenges = async () => {
    try {
      setLoadingChallenges(true);
      const { data: { session } } = await supabase.auth.getSession();

      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/routes/challenges/${userId}`,
        session?.access_token ? {
          headers: { Authorization: `Bearer ${session.access_token}` }
        } : undefined
      );

      setUserChallenges(
        Array.isArray(response.data.challenges) ? response.data.challenges : []
      );
    } catch (error) {
      console.error('Failed to fetch user challenges:', error);
      setUserChallenges([]);
    } finally {
      setLoadingChallenges(false);
    }
  };

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

  const formatDuration = (duration: any) => {
    if (!duration) return '00:00:00';

    if (typeof duration === 'string' && duration.includes(':')) {
      return duration;
    }

    const totalSeconds = typeof duration === 'number' ? duration : parseInt(duration);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      const daysAgo = Math.floor((today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
      if (daysAgo < 7) {
        return `${daysAgo} days ago`;
      }
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

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

  const renderStatusPage = (message: string, showSpinner = false) => (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/home" />
          </IonButtons>
          <IonTitle>Profile</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <div style={{ textAlign: 'center', padding: '40px' }}>
          {showSpinner && <IonSpinner name="crescent" />}
          <p>{message}</p>
        </div>
      </IonContent>
    </IonPage>
  );

  const currentStats = statsData[timeRange];

  if (loading) {
    return renderStatusPage('Loading profile...', true);
  }

  if (!profile) {
    return renderStatusPage('User not found');
  }

  return (
    <IonPage>
      <IonContent className="profile-content">
        <div className="profile-container">
          <div className="profile-header-section">
            <div className="banner-container">
              <IonImg src={Banner} alt="User Banner" className="banner-image" />
              <div className="banner-overlay"></div>
            </div>

            <div className="profile-info-card">
              <div className="profile-avatar-container">
                <IonImg src={profile.profile_picture || DEFAULT_AVATAR} alt="Profile" className="profile-avatar" />
              </div>

              <div className="profile-details">
                <div className="profile-text">
                  <h1 className="profile-name">{profile.name}</h1>
                  <p className="profile-username">@{profile.username}</p>
                  <div className="profile-bio">
                    <span>{profile.description || 'No description yet'}</span>
                  </div>
                </div>

                <div className="profile-stats-row">
                  <div className="stat-item">
                    <span className="stat-number">{followerCount}</span>
                    <span className="stat-label">Followers</span>
                  </div>
                  <div className="stat-divider"></div>
                  <div className="stat-item">
                    <span className="stat-number">{followingCount}</span>
                    <span className="stat-label">Following</span>
                  </div>
                  <div className="stat-divider"></div>
                  <div className="stat-item">
                    <span className="stat-number">{userRoutes.length}</span>
                    <span className="stat-label">Activities</span>
                  </div>
                </div>

                <div style={{ marginTop: '12px' }}>
                  <IonButton
                    fill={isFollowing ? 'outline' : 'solid'}
                    onClick={handleToggleFollow}
                  >
                    <IonIcon icon={isFollowing ? personRemoveOutline : personAddOutline} slot="start" />
                    {isFollowing ? 'Unfollow' : 'Follow'}
                  </IonButton>
                </div>
              </div>
            </div>

            <div className="nav-tabs-container">
              <div className="nav-tabs">
                <button
                  className={`nav-tab ${activeTab === "activities" ? "active" : ""}`}
                  onClick={() => setActiveTab("activities")}
                >
                  <IonIcon icon={statsChart} />
                  <span>Activities</span>
                </button>
                <button
                  className={`nav-tab ${activeTab === "posts" ? "active" : ""}`}
                  onClick={() => setActiveTab("posts")}
                >
                  <IonIcon icon={person} />
                  <span>Posts</span>
                </button>
                <button
                  className={`nav-tab ${activeTab === "badges" ? "active" : ""}`}
                  onClick={() => setActiveTab("badges")}
                >
                  <IonIcon icon={trophy} />
                  <span>Badges</span>
                </button>
                <button
                  className={`nav-tab ${activeTab === "challenges" ? "active" : ""}`}
                  onClick={() => setActiveTab("challenges")}
                >
                  <IonIcon icon={flame} />
                  <span>Challenges</span>
                </button>
              </div>
            </div>
          </div>

          <IonGrid className="content-grid">
            <IonRow>
              <IonCol size="12" sizeLg="3" className="sidebar-col">
                <div className="stats-sidebar">
                  <div className="stats-header">
                    <h3>Performance Stats</h3>
                  </div>

                  <div className="time-range-dropdown">
                    <select
                      value={timeRange}
                      onChange={(e) => setTimeRange(e.target.value as 'day' | 'week' | 'month')}
                      className="time-range-select"
                    >
                      <option value="day">Today</option>
                      <option value="week">This Week</option>
                      <option value="month">This Month</option>
                    </select>
                  </div>

                  <div className={`stats-card ${timeRange}`}>
                    <div className="stats-card-header">
                      <h4>{currentStats.title}</h4>
                    </div>
                    <div className="stats-list">
                      <div className="stats-item">
                        <div className="stats-content">
                          <span className="stats-label">Runs</span>
                          <span className="stats-value">{currentStats.runs_count}</span>
                        </div>
                      </div>
                      <div className="stats-item">
                        <div className="stats-content">
                          <span className="stats-label">Distance</span>
                          <span className="stats-value">{currentStats.total_distance}</span>
                        </div>
                      </div>
                      <div className="stats-item">
                        <div className="stats-content">
                          <span className="stats-label">Pace</span>
                          <span className="stats-value">{currentStats.avg_pace}</span>
                        </div>
                      </div>
                      <div className="stats-item">
                        <div className="stats-content">
                          <span className="stats-label">Calories</span>
                          <span className="stats-value">{currentStats.total_calories}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </IonCol>

              <IonCol size="12" sizeLg="9" className="main-content-col">
                {activeTab === "activities" && (
                  <div className="content-section">
                    <div className="section-header">
                      <h2>Activities</h2>
                    </div>
                    {routesLoading ? (
                      <div className="loading-center">
                        <IonSpinner name="crescent" />
                        <p>Loading activities...</p>
                      </div>
                    ) : userRoutes.length === 0 ? (
                      <div className="loading-center">
                        <p>No activities yet.</p>
                      </div>
                    ) : (
                      <div className="activities-list">
                        {userRoutes.slice(0, 10).map((route, index) => (
                          <IonCard key={route.route_id || index} className="activity-card-modern">
                            <IonCardContent>
                              <div className="activity-top">
                                <div className="activity-meta">
                                  <span className="activity-type">{route.route_type ? route.route_type.charAt(0).toUpperCase() + route.route_type.slice(1) : "Run"}</span>
                                  <span className="activity-date">{formatDate(route.created_at)}</span>
                                </div>
                                <h3 className="activity-title">{route.route_name || "Untitled Route"}</h3>
                              </div>
                              <div className="activity-stats-row">
                                <div className="activity-stat">
                                  <strong>{route.distance_km} km</strong>
                                  <span>Distance</span>
                                </div>
                                <div className="activity-stat">
                                  <strong>{formatDuration(route.duration_seconds)}</strong>
                                  <span>Duration</span>
                                </div>
                                <div className="activity-stat">
                                  <strong>{route.average_pace || "N/A"}</strong>
                                  <span>Pace</span>
                                </div>
                              </div>
                              <div className="activity-map">
                                <IonImg src={route.map_image_url || MapImage} alt="Activity Map" />
                              </div>
                            </IonCardContent>
                          </IonCard>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "posts" && (
                  <div className="content-section">
                    <div className="section-header">
                      <h2>Posts</h2>
                      <span className="badge-count">{posts.length} posts</span>
                    </div>
                    {postsLoading ? (
                      <div className="loading-center">
                        <IonSpinner name="crescent" />
                        <p>Loading posts...</p>
                      </div>
                    ) : posts.length === 0 ? (
                      <div className="loading-center">
                        <p>No posts yet.</p>
                      </div>
                    ) : (
                      <div className="activity-feed">
                        {posts.map((post) => (
                          <IonCard key={post.post_id} className="activity-card-enhanced">
                            <IonCardContent>
                              {post.route_name && <h4 style={{ marginBottom: '10px', fontWeight: 'bold' }}>{post.route_name}</h4>}
                              {post.content && <p style={{ marginBottom: '15px' }}>{post.content}</p>}
                              {post.route_id && (
                                <div className="activity-stats-row">
                                  <div className="activity-stat">
                                    <strong>{(post.distance_km || 0).toFixed(1)} km</strong>
                                    <span>Distance</span>
                                  </div>
                                  <div className="activity-stat">
                                    <strong>{formatDuration(post.duration_seconds || 0)}</strong>
                                    <span>Time</span>
                                  </div>
                                  <div className="activity-stat">
                                    <strong>{post.average_pace || "N/A"}</strong>
                                    <span>Pace</span>
                                  </div>
                                  <div className="activity-stat">
                                    <strong>{post.estimated_calories || "N/A"}</strong>
                                    <span>Calories</span>
                                  </div>
                                </div>
                              )}
                              {post.snapshot_url && (
                                <div className="activity-map">
                                  <IonImg src={post.snapshot_url} alt="Run Map" />
                                </div>
                              )}
                            </IonCardContent>
                          </IonCard>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "badges" && (
                  <div className="content-section">
                    <div className="section-header">
                      <h2>Achievement Badges</h2>
                      <span className="badge-count">{earnedBadges.length} earned</span>
                    </div>
                    {loadingBadges ? (
                      <div className="loading-center">
                        <IonSpinner name="crescent" />
                        <p>Loading badges...</p>
                      </div>
                    ) : earnedBadges.length === 0 ? (
                      <div className="loading-center">
                        <p>No badges earned yet.</p>
                      </div>
                    ) : (
                      <div className="badges-grid">
                        {earnedBadges.map((badge, i) => (
                          <IonCard key={i} className="badge-card-modern">
                            <div className="badge-glow"></div>
                            <IonImg src={badge.image} alt={badge.title} className="badge-image" />
                            <IonCardContent>
                              <h4 className="badge-title">{badge.title}</h4>
                              <p className="badge-description">{badge.description}</p>
                              <div className="badge-earned">
                                Earned {badge.date}
                                {badge.awardedFor ? (
                                  <span className="badge-award"> for "{badge.awardedFor}"</span>
                                ) : null}
                              </div>
                            </IonCardContent>
                          </IonCard>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "challenges" && (
                  <div className="content-section">
                    <div className="section-header">
                      <h2>Active Challenges</h2>
                    </div>
                    {loadingChallenges ? (
                      <div className="loading-center">
                        <IonSpinner name="crescent" />
                        <p>Loading challenges...</p>
                      </div>
                    ) : (
                      <>
                        <div className="challenges-grid">
                          {userChallenges.filter((c) => (c.progress_percent || 0) < 100).length === 0 ? (
                            <p>No active challenges.</p>
                          ) : (
                            userChallenges
                              .filter((c) => (c.progress_percent || 0) < 100)
                              .map((challenge, i) => (
                                <IonCard key={i} className="challenge-card-modern">
                                  <div className="challenge-image-container">
                                    <IonImg src={challenge.challenge_image} alt={challenge.challenge_name} />
                                  </div>
                                  <IonCardContent>
                                    <h4 className="challenge-title">{challenge.challenge_name}</h4>
                                    <p className="challenge-target">{challenge.challenge_description}</p>
                                    <p className="challenge-duration">{challenge.challenge_duration_days} days</p>
                                  </IonCardContent>
                                </IonCard>
                              ))
                          )}
                        </div>
                        <div className="section-header completed-header" style={{ marginTop: '24px' }}>
                          <h2>Completed Challenges</h2>
                        </div>
                        <div className="challenges-grid">
                          {userChallenges.filter((c) => (c.progress_percent || 0) >= 100).length === 0 ? (
                            <p>No completed challenges yet.</p>
                          ) : (
                            userChallenges
                              .filter((c) => (c.progress_percent || 0) >= 100)
                              .map((challenge, i) => (
                                <IonCard key={i} className="challenge-card-modern completed">
                                  <div className="challenge-image-container">
                                    <IonImg src={challenge.challenge_image} alt={challenge.challenge_name} />
                                  </div>
                                  <IonCardContent>
                                    <h4 className="challenge-title">{challenge.challenge_name}</h4>
                                    <p className="challenge-target">{challenge.challenge_description}</p>
                                    <p className="challenge-duration">{challenge.challenge_duration_days} days</p>
                                  </IonCardContent>
                                </IonCard>
                              ))
                          )}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </IonCol>
            </IonRow>
          </IonGrid>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default ViewProfile;
