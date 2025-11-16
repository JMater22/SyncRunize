import React, { useState, useEffect} from "react";
import { useHistory } from "react-router-dom";
import {
  IonPage,
  IonContent,
  IonButton,
  IonCard,
  IonCardContent,
  IonImg,
  IonGrid,
  IonRow,
  IonCol,
  IonIcon,
  IonModal, 
  IonHeader,
  IonToolbar,
  IonTitle,
  IonItem,
  IonInput,
  IonTextarea,
  IonLabel,
  IonAvatar,  
  IonActionSheet, 
  IonToast, 
  IonAlert,
  IonSpinner
} from "@ionic/react";
import { settings, trophy, flame, statsChart, close, camera, checkmark, person, logOut, createOutline, trashOutline, heartOutline, chatbubbleEllipses, locationOutline, timeOutline, speedometerOutline, flameOutline as flameIcon, eyeOutline, lockClosedOutline } from "ionicons/icons";


import Banner from "../assets/Banner UP.png";
import MapImage from "../assets/MAP 1.png";

// import BronzeBadge from "../assets/badges/Bronze.png";
// import SilverBadge from "../assets/badges/Silver.png";
// import GoldBadge from "../assets/badges/Gold.png";


import "../components/UserProfile/UserProfile.css";
import { DEFAULT_AVATAR } from "../constants/avatar";
import { supabase } from "../supabaseClient";
import axios from "axios";
import { useLocation } from "react-router-dom";
import Settings from "../components/Settings/Settings";

 interface FollowsFormat {
  id:number;
  name : string;
  username: string;
  avatar: string;
  isFollowing: boolean;
}

 interface FollowingFormat {
  id:number;
  name : String;
  username: String;
  avatar: String;
}



const Profile: React.FC = () => {

  const [badgeImages, setBadgeImages] = useState<{
    Bronze?: string;
    Silver?: string;
    Gold?: string;
  }>({});
  // New state for earned badges from user_challenges
  const [earnedBadges, setEarnedBadges] = useState<any[]>([]);
  const [loadingBadges, setLoadingBadges] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  useEffect(() => {
  const fetchBadges = async () => {
    const bucket = 'assets';
    const folder = 'badges';
    const badges = ['Bronze.png', 'Silver.png', 'Gold.png'];
    const badgeUrls: Record<string, string> = {};

    for (const badge of badges) {
      const { data } = supabase
        .storage
        .from(bucket)
        .getPublicUrl(`${folder}/${badge}`);
        
      badgeUrls[badge.split('.')[0]] = data.publicUrl;
    }

    setBadgeImages(badgeUrls);
  };

  fetchBadges();
}, []);


  const history = useHistory();
  const [activeTab, setActiveTab] = useState<"activities" | "badges" | "challenges" | "posts">("activities");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isActionSheetOpen, setIsActionSheetOpen] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [showLogoutAlert, setShowLogoutAlert] = useState(false);
  const [isFollowersModalOpen, setIsFollowersModalOpen] = useState(false);
  const [followersModalType, setFollowersModalType] = useState<"followers" | "following">("followers");
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [timeRange, setTimeRange] = useState<'day' | 'week' | 'month'>('day');
  
  const [userRoutes, setUserRoutes] = useState<any[]>([]);
  const [loadingRoutes, setLoadingRoutes] = useState(false);

  // Posts state
  const [userPosts, setUserPosts] = useState<any[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [editingPost, setEditingPost] = useState<any | null>(null);
  const [isEditPostModalOpen, setIsEditPostModalOpen] = useState(false);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [postToDelete, setPostToDelete] = useState<number | null>(null);

  // Likes modal state
  const [isLikesModalOpen, setIsLikesModalOpen] = useState(false);
  const [selectedPostLikers, setSelectedPostLikers] = useState<any[]>([]);
  const [loadingLikers, setLoadingLikers] = useState(false);

  // Comments modal state
  const [isCommentsModalOpen, setIsCommentsModalOpen] = useState(false);
  const [selectedPostComments, setSelectedPostComments] = useState<any[]>([]);
  const [selectedPostId, setSelectedPostId] = useState<number | null>(null);
  const [loadingComments, setLoadingComments] = useState(false);

  // Badge history modal state
  const [isBadgeHistoryModalOpen, setIsBadgeHistoryModalOpen] = useState(false);
  const [selectedBadge, setSelectedBadge] = useState<any | null>(null);

  const location = useLocation();

  // Switch profile tab based on query param ?tab=badges|challenges|activities|posts
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = (params.get('tab') || '').toLowerCase();
    if (tab === 'badges' || tab === 'challenges' || tab === 'activities' || tab === 'posts') {
      setActiveTab(tab as any);
      // Clean the URL to avoid repeated switching on re-renders
      const cleanPath = '/profile';
      window.history.replaceState({}, '', cleanPath);
    }
  }, [location.search]);

  // Profile data state
  const [profileData, setProfileData] = useState({
    Name: "",
    description: "",
    profilePic: DEFAULT_AVATAR
  });

  // Full user data for settings
  const [fullUserData, setFullUserData] = useState<any>(null);

  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  
  // const statsData = {
  //   day: {
  //     title: 'Today',
  //     runs: 1,
  //     time: '45m',
  //     distance: '5.2 km',
  //     pace: '8:39 /km',
  //     calories: '420 kcal'
  //   },
  //   week: {
  //     title: 'This Week',
  //     runs: 3,
  //     time: '4h 22m',
  //     distance: '7.2 km',
  //     pace: '7:15 /km',
  //     calories: '850 kcal'
  //   },
  //   month: {
  //     title: 'This Month',
  //     runs: 12,
  //     time: '18h 45m',
  //     distance: '28.5 km',
  //     pace: '6:58 /km',
  //     calories: '3,420 kcal'
  //   }
  // };

interface Route {
  distance_km: number;
  duration_seconds: number;
  calories: number;
  created_at: string;
}
  
interface StatSummary {
  title: string;
  runs_count: number;
  total_distance: string;
  avg_pace: string;
  total_calories: string;
}

const [statsData, setStatsData] = useState<{
  day: StatSummary;
  week: StatSummary;
  month: StatSummary;
}>({
  day: { title: "Today", runs_count: 0, total_distance: "0.0 km", avg_pace: "0:00 /km", total_calories: "0 kcal" },
  week: { title: "This Week", runs_count: 0, total_distance: "0.0 km", avg_pace: "0:00 /km", total_calories: "0 kcal" },
  month: { title: "This Month", runs_count: 0, total_distance: "0.0 km", avg_pace: "0:00 /km", total_calories: "0 kcal" },
});


//statistics
useEffect(() => {
  if (!userRoutes || userRoutes.length === 0) return;

  // Helper function to calculate pace (min/km)
  const calculatePace = (durationSeconds: number, distanceKm: number) => {
    if (distanceKm === 0) return "0:00 /km";
    const pace = durationSeconds / 60 / distanceKm; // min per km
    const minutes = Math.floor(pace);
    const seconds = Math.round((pace - minutes) * 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")} /km`;
  };

  const now = new Date();

  // Helper to filter routes by time period
  const filterByPeriod = (routes: any[], days: number) =>
    routes.filter(route => {
      const created = new Date(route.created_at);
      const diffDays = (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
      return diffDays <= days;
    });

  const calcStats = (filteredRoutes: any[]) => {
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

  // Compute by period
  const dayRoutes = filterByPeriod(userRoutes, 1);
  const weekRoutes = filterByPeriod(userRoutes, 7);
  const monthRoutes = filterByPeriod(userRoutes, 30);

  setStatsData({
    day: { title: "Today", ...calcStats(dayRoutes) },
    week: { title: "This Week", ...calcStats(weekRoutes) },
    month: { title: "This Month", ...calcStats(monthRoutes) },
  });
}, [userRoutes]);


  

//Fetch Followers and Following Count
  useEffect(() => {
  const fetchUserData = async () => {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;

      // Clear state if no session
      if (!session) {
        setProfileData({
          Name: "",
          description: "",
          profilePic: DEFAULT_AVATAR
        });
        setCurrentUserId(null);
        setFollowersData([]);
        setFollowingsData([]);
        setFollowersCount(0);
        setFollowingCount(0);
        return;
      }

      const token = session.access_token;
      const { data: user } = await axios.get(`${import.meta.env.VITE_API_URL}/users/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setCurrentUserId(user.user_id);
      setFullUserData(user); // Store full user data for settings

      setProfileData({
        Name: user.name || "Unknown User",
        description: user.description || "",
        profilePic: user.profile_picture || DEFAULT_AVATAR,
      });
      console.log(user.description);
      // Fetch both counts at once (more efficient!)
      const { data: counts } = await axios.get(
        `${import.meta.env.VITE_API_URL}/follows/${user.user_id}/counts`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Fetch followers and following lists in parallel
      const [followersRes, followingRes] = await Promise.all([
        axios.get(`${import.meta.env.VITE_API_URL}/follows/${user.user_id}/followers`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${import.meta.env.VITE_API_URL}/follows/${user.user_id}/following`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      const followersList = followersRes.data;
      const followingList = followingRes.data;

      // Map followers
      const formattedFollowers = followersList.map((follower: any) => ({
        id: follower.follower_id,
        name: follower.username,
        username: `@${follower.username.toLowerCase()}`,
        avatar: follower.profile_picture || DEFAULT_AVATAR,
        isFollowing: follower.isFollowedBack
      }));

      // Map following
      const formattedFollowing = followingList.map((following: any) => ({
        id: following.followed_id,
        name: following.username,
        username: `@${following.username.toLowerCase()}`,
        avatar: following.profile_picture || DEFAULT_AVATAR,
      }));

      // Save to state
      setFollowersData(formattedFollowers);
      setFollowingsData(formattedFollowing);

      setFollowersCount(counts.followers);
      setFollowingCount(counts.following); // If you need following count too
      await fetchEarnedBadges(user.user_id, token);
    } catch (error) {
      console.error("Error fetching user data or counts:", error);
    }
  };

  fetchUserData();

  // Subscribe to auth state changes to refetch when user logs in/out
  const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
    if (session) {
      fetchUserData();
    }
  });

  return () => {
    authListener?.subscription.unsubscribe();
  };
}, []);


  const fetchEarnedBadges = async (userId: number, token: string) => {
    try {
      setLoadingBadges(true);

      const { data: response } = await axios.get(
        `${import.meta.env.VITE_API_URL}/routes/badges/${userId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Filter only completed challenges with badges
      const completedChallenges = response.data
        .filter((challenge: any) => challenge.completed && challenge.badge_image_url);

      // Group badges by badge_name to avoid duplicates
      const badgeGroups = completedChallenges.reduce((acc: any, challenge: any) => {
        const badgeName = challenge.badge_name || "Badge";

        if (!acc[badgeName]) {
          acc[badgeName] = {
            title: badgeName,
            description: challenge.badge_description || "Achievement unlocked",
            tier: challenge.badge_tier || "Bronze",
            earned: true,
            image: challenge.badge_image_url,
            challenges: []
          };
        }

        // Add this challenge to the badge's history
        acc[badgeName].challenges.push({
          challenge_name: challenge.challenge_name || "Challenge",
          completed_date: new Date(challenge.updated_at).toLocaleDateString(),
          updated_at: challenge.updated_at
        });

        return acc;
      }, {});

      // Convert to array and sort challenges by date (most recent first)
      const badges = Object.values(badgeGroups).map((badge: any) => ({
        ...badge,
        count: badge.challenges.length,
        challenges: badge.challenges.sort((a: any, b: any) =>
          new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
        )
      }));

      setEarnedBadges(badges);
      setLoadingBadges(false);
    } catch (error) {
      console.error("Error fetching earned badges:", error);
      setLoadingBadges(false);
    }
  };

  const currentStats = statsData[timeRange];

  // Form state for editing
  const [editForm, setEditForm] = useState({ ...profileData });

  // Active challenges data aligned with new challenges
const [userChallenges, setUserChallenges] = useState<any[]>([]);

useEffect(() => {
  const fetchUserChallenges = async () => {
    if (!currentUserId) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/routes/challenges/${currentUserId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Use response.data.challenges instead of response.data
      setUserChallenges(
        Array.isArray(response.data.challenges) ? response.data.challenges : []
      );

    } catch (error) {
      console.error("Error fetching user challenges:", error);
    }
  };

  fetchUserChallenges();
}, [currentUserId]);


  //FOLLOWERS DATA
  // Mock data for followers and following
  const [followersData, setFollowersData] = useState<FollowsFormat[]>([]);
  const [followingsData, setFollowingsData] = useState<FollowsFormat[]>([]);


  // Add this useEffect to fetch user routes
useEffect(() => {
  const fetchUserRoutes = async () => {
    if (!currentUserId) return;

    try {
      setLoadingRoutes(true);

      // Get authentication token to prove ownership
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/routes/user/${currentUserId}`,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          params: {
            limit: 100, // Increased to get all activities for accurate stats
            offset: 0,
            activities_only: true // ✅ Only fetch completed routes for activities view (excludes generated routes)
          }
        }
      );

      setUserRoutes(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error("Error fetching user routes:", error);
    } finally {
      setLoadingRoutes(false);
    }
  };

  fetchUserRoutes();
}, [currentUserId]);

// Fetch user's posts
useEffect(() => {
  const fetchUserPosts = async () => {
    if (!currentUserId) return;

    try {
      setLoadingPosts(true);
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/posts/my`,
        {
          headers: { Authorization: `Bearer ${token}` },
          params: { limit: 50, offset: 0 }
        }
      );

      setUserPosts(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error("Error fetching user posts:", error);
    } finally {
      setLoadingPosts(false);
    }
  };

  fetchUserPosts();
}, [currentUserId]);


// Helper function to format duration from seconds or string
const formatDuration = (duration: any) => {
  if (!duration) return '00:00:00';
  
  // If duration is already a string in HH:MM:SS format
  if (typeof duration === 'string' && duration.includes(':')) {
    return duration;
  }
  
  // If duration is in seconds
  const totalSeconds = typeof duration === 'number' ? duration : parseInt(duration);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

// Helper function to format distance
const formatDistance = (distance: number) => {
  if (!distance) return '0.0 km';
  return `${(distance / 1000).toFixed(1)} km`;
};

// Helper function to format date
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



const [showAllActivities, setShowAllActivities] = useState(false);

// Post management functions
const handleEditPost = (post: any) => {
  setEditingPost(post);
  setIsEditPostModalOpen(true);
};

const handleSavePostEdit = async () => {
  if (!editingPost) return;

  try {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;

    const response = await axios.put(
      `${import.meta.env.VITE_API_URL}/posts/${editingPost.post_id}`,
      {
        content: editingPost.content,
        route_name: editingPost.route_name,
        visibility: editingPost.visibility
      },
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );

    // Update local state
    setUserPosts(prevPosts =>
      prevPosts.map(post =>
        post.post_id === editingPost.post_id ? { ...post, ...response.data } : post
      )
    );

    setIsEditPostModalOpen(false);
    setEditingPost(null);
    setShowToast(true);
  } catch (error) {
    console.error("Error updating post:", error);
    alert("Failed to update post");
  }
};

const handleDeletePost = async () => {
  if (!postToDelete) return;

  try {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;

    await axios.delete(
      `${import.meta.env.VITE_API_URL}/posts/${postToDelete}`,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );

    // Remove from local state
    setUserPosts(prevPosts =>
      prevPosts.filter(post => post.post_id !== postToDelete)
    );

    setShowDeleteAlert(false);
    setPostToDelete(null);
  } catch (error) {
    console.error("Error deleting post:", error);
    alert("Failed to delete post");
  }
};

// Handle settings updates
const handleSettingsUpdate = async (updatedSettings: any) => {
  // Refresh profile data to reflect updated settings
  setProfileData(prev => ({
    ...prev,
    ...updatedSettings,
  }));

  // Update full user data as well
  setFullUserData((prev: any) => ({
    ...prev,
    ...updatedSettings,
  }));

  // Refetch user data from backend to ensure we have the latest settings
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      const token = session.access_token;
      const { data: user } = await axios.get(`${import.meta.env.VITE_API_URL}/users/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setFullUserData(user);
    }
  } catch (error) {
    console.error("Error refetching user data:", error);
  }

  // If distance unit changed, refetch routes to update display
  if (updatedSettings.distance_unit && currentUserId) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/routes/user/${currentUserId}`,
          {
            headers: { Authorization: `Bearer ${session.access_token}` },
            params: {
              limit: 100,
              offset: 0,
              activities_only: true
            }
          }
        );
        setUserRoutes(Array.isArray(response.data) ? response.data : []);
      }
    } catch (error) {
      console.error("Error refreshing user routes:", error);
    }
  }
};

const openDeleteConfirmation = (postId: number) => {
  setPostToDelete(postId);
  setShowDeleteAlert(true);
};

// Handle viewing likes
const handleViewLikes = async (postId: number) => {
  try {
    setLoadingLikers(true);
    setIsLikesModalOpen(true);

    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;

    const response = await axios.get(
      `${import.meta.env.VITE_API_URL}/likes/${postId}/users`,
      {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      }
    );

    setSelectedPostLikers(Array.isArray(response.data) ? response.data : []);
  } catch (error) {
    console.error("Error fetching likers:", error);
    setSelectedPostLikers([]);
  } finally {
    setLoadingLikers(false);
  }
};

// Handle viewing comments
const handleViewComments = async (postId: number) => {
  try {
    setLoadingComments(true);
    setSelectedPostId(postId);
    setIsCommentsModalOpen(true);

    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;

    const response = await axios.get(
      `${import.meta.env.VITE_API_URL}/comments/${postId}`,
      {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      }
    );

    setSelectedPostComments(Array.isArray(response.data) ? response.data : []);
  } catch (error) {
    console.error("Error fetching comments:", error);
    setSelectedPostComments([]);
  } finally {
    setLoadingComments(false);
  }
};



    const handleFollowToggle = async (targetUserId: number) => {
      try {
        // Get session from Supabase
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;
        if (!session) return;

        const token = session.access_token;

        // Get current user info (to verify)
        const { data: currentUser } = await axios.get(
          `${import.meta.env.VITE_API_URL}/users/me`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        // Check if user is currently following that user
        const isCurrentlyFollowing = followingsData.some(f => f.id === targetUserId);

        // Decide endpoint based on follow state
        const endpoint = `${import.meta.env.VITE_API_URL}/follows/${targetUserId}/${isCurrentlyFollowing ? "unfollow" : "follow"}`;

        // Perform follow/unfollow request
        await axios.post(endpoint, {}, {
          headers: { Authorization: `Bearer ${token}` },
        });

        // Refresh following list after action
        const { data: updatedFollowing } = await axios.get(
          `${import.meta.env.VITE_API_URL}/follows/${currentUser.user_id}/following`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        // Format and update following list
        const formattedFollowing = updatedFollowing.map((u: any) => ({
          id: u.followed_id,
          name: u.username,
          username: `@${u.username.toLowerCase()}`,
          profile_picture: u.profile_picture,
          isFollowing: true
        }));

        setFollowingsData(formattedFollowing);
      } catch (error) {
        console.error("Error toggling follow:", error);
      }
    };


  const openFollowersModal = (type: "followers" | "following") => {
    setFollowersModalType(type);
    setIsFollowersModalOpen(true);
  };

const handleSaveProfile = async () => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (!token) throw new Error("No active session");

    // Prepare payload (match backend field names)
    const updateData = {
      name: editForm.Name,
      description: editForm.description,
      profile_picture: editForm.profilePic,
    };

    // Send update request
    const response = await axios.put(
      `${import.meta.env.VITE_API_URL}/users/update-me`,
      updateData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    // Update frontend state on success
    setProfileData({
      Name: response.data.name || editForm.Name,
      description: response.data.description || editForm.description,
      profilePic: response.data.profile_picture || editForm.profilePic,
    });

    setIsEditModalOpen(false);
    setShowToast(true);
  } catch (error) {
    console.error("Error updating profile:", error);
  }
};


  const handleCancelEdit = () => {
    setEditForm({ ...profileData });
    setIsEditModalOpen(false);
  };

  const handleImageSelection = async (source: string) => {
    try {
      const fileInput = document.createElement("input");
      fileInput.type = "file";
      fileInput.accept = "image/*";
      fileInput.click();

      fileInput.onchange = async () => {
        const file = fileInput.files?.[0];
        if (!file) return;

        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const filePath = `profile-pictures/${fileName}`;

        // Upload to Supabase Storage (bucket: assets)
        const { data, error } = await supabase.storage
          .from("assets")
          .upload(filePath, file, { upsert: true });

        if (error) throw error;

        // Get public URL
        const { data: urlData } = supabase.storage
          .from("assets")
          .getPublicUrl(filePath);

        const publicUrl = urlData.publicUrl;

        // Update the edit form preview
        setEditForm((prev) => ({ ...prev, profilePic: publicUrl }));

        console.log("Profile picture uploaded:", publicUrl);
      };

      setIsActionSheetOpen(false);
    } catch (err) {
      console.error("Error uploading profile picture:", err);
    }
  };
  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Error logging out:", error.message);
    } else {
      console.log("User logged out and session cleared");

      // Reset ALL local state to prevent data persistence
      setProfileData({
        Name: "",
        description: "",
        profilePic: DEFAULT_AVATAR
      });
      setCurrentUserId(null);
      setUserRoutes([]);
      setUserPosts([]);
      setUserChallenges([]);
      setEarnedBadges([]);
      setFollowersData([]);
      setFollowingsData([]);
      setFollowersCount(0);
      setFollowingCount(0);
      setStatsData({
        day: { title: "Today", runs_count: 0, total_distance: "0.0 km", avg_pace: "0:00 /km", total_calories: "0 kcal" },
        week: { title: "This Week", runs_count: 0, total_distance: "0.0 km", avg_pace: "0:00 /km", total_calories: "0 kcal" },
        month: { title: "This Month", runs_count: 0, total_distance: "0.0 km", avg_pace: "0:00 /km", total_calories: "0 kcal" },
      });

      setShowLogoutAlert(false);
      history.push("/login");
    }
  };

  return ( 
    <IonPage>
      <IonContent className="profile-content">
        <div className="profile-container">
          {/* Enhanced Profile Header */}
          <div className="profile-header-section">
            <div className="banner-container">
              <IonImg src={Banner} alt="User Banner" className="banner-image" />
              <div className="banner-overlay"></div>
            </div>
            
            <div className="profile-info-card">
              <div className="profile-avatar-container">
                <IonImg src={profileData.profilePic} alt="Profile" className="profile-avatar" />
              </div>
              
              <div className="profile-details">
                <div className="profile-text">
                  <h1 className="profile-name">{profileData.Name}</h1>
                  <p className="profile-username">@{profileData.Name.toLowerCase()}</p>
                  <div className="profile-bio">
                    <span>{profileData.description}</span>
                  </div>
                </div>
                
                <div className="profile-stats-row">
                  <div 
                    className="stat-item clickable-stat" 
                    onClick={() => openFollowersModal("followers")}
                  >
                        <span className="stat-number">{followersCount}</span>
                    <span className="stat-label">Followers</span>
                  </div>
                  <div className="stat-divider"></div>
                  <div  
                    className="stat-item clickable-stat" 
                    onClick={() => openFollowersModal("following")}
                  >
                    <span className="stat-number">{followingCount}</span>
                    <span className="stat-label">Following</span>
                  </div>
                  <div className="stat-divider"></div>
                  <div className="stat-item">
                    <span className="stat-number">{userRoutes.length}</span>
                    <span className="stat-label">Activities</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Modern Navigation Tabs */}
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
                  <span>Manage Posts</span>
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
              {/* Enhanced Sidebar */}
              <IonCol size="12" sizeLg="3" className="sidebar-col">
                <div className="stats-sidebar">
                  <div className="stats-header">
                    <h3>Performance Stats</h3>
                  </div>
                  
                  {/* Time Range Dropdown */}
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

                  {/* Dynamic Stats Card */}
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

              {/* Enhanced Main Content */}
              <IonCol size="12" sizeLg="9" className="main-content-col">
                {/* Activities Section */}
{activeTab === "activities" && (
  <div className="content-section">
    <div className="section-header">
      <h2>Your Activities</h2>
      {userRoutes.length > 3 && (
        <IonButton
          fill="clear"
          className="view-all-btn"
          onClick={() => setShowAllActivities(!showAllActivities)}
        >
          {showAllActivities ? "Show Less" : "View All"}
        </IonButton>
      )}
    </div>

    {loadingRoutes ? (
      <div className="loading-center">
        <IonSpinner name="crescent" />
        <p>Loading activities...</p>
      </div>
    ) : userRoutes.length === 0 ? (
      <div className="loading-center">
        <p>No activities yet. Start running to see your progress here!</p>
      </div>
    ) : (
      <div className="activities-list">
        {(showAllActivities ? userRoutes : userRoutes.slice(0, 3)).map((route, index) => (
          <IonCard key={route.route_id || index} className="activity-card-modern">
            <IonCardContent>
              <div className="activity-top">
                <div className="activity-meta">
                  <span className="activity-type">
                    {route.route_type?.charAt(0).toUpperCase() + route.route_type?.slice(1) || "Run"}
                  </span>
                  <span className="activity-date">{formatDate(route.created_at)}</span>
                </div>

                <h3 className="activity-title">
                  {route.route_name || "Untitled Route"}
                </h3>
              </div>

              <div className="activity-stats-row">
                <div className="activity-stat">
                  <strong>{route.distance_km}</strong>
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
                <div className="activity-stat">
                  <strong>{route.estimated_calories || "N/A"}</strong>
                  <span>Calorie Burned</span>
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

              {/* Badges Section - Only 3 Animated Badges */}
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
                      <p>No badges earned yet. Complete challenges to earn badges!</p>
                    </div>
                  ) : (
                    <div className="badges-grid">
                      {earnedBadges.map((badge, i) => (
                        <IonCard
                          key={i}
                          className={`badge-card-modern ${!badge.earned ? 'locked' : ''}`}
                          onClick={() => {
                            setSelectedBadge(badge);
                            setIsBadgeHistoryModalOpen(true);
                          }}
                          style={{ cursor: 'pointer' }}
                        >
                          <div className={`badge-glow ${badge.tier.toLowerCase()}`}></div>
                          <IonImg src={badge.image} alt={badge.title} className="badge-image" />

                          {/* Count indicator - only show if earned 2 or more times */}
                          {badge.count > 1 && (
                            <div style={{
                              position: 'absolute',
                              top: '10px',
                              right: '10px',
                              backgroundColor: 'rgba(0, 0, 0, 0.7)',
                              color: 'white',
                              borderRadius: '12px',
                              padding: '4px 10px',
                              fontSize: '13px',
                              fontWeight: 'bold'
                            }}>
                              ×{badge.count}
                            </div>
                          )}

                          <IonCardContent>
                            <h4 className="badge-title">{badge.title}</h4>
                            <p className="badge-description">{badge.description}</p>
                            <div className={`badge-earned ${!badge.earned ? 'locked-text' : ''}`}>
                              {badge.count > 1 ? `Earned ${badge.count} times` : `Earned`}
                            </div>
                          </IonCardContent>
                        </IonCard>
                      ))}
                    </div>
                  )}
                </div>
              )}

               {/* Challenges Section - Updated with new challenge data */}
                {activeTab === "challenges" && (
                  <div className="content-section">

                    {/* Active Challenges */}
                    <div className="section-header">
                      <h2>Active Challenges</h2>
                      <IonButton fill="clear" className="browse-challenges">Browse More</IonButton>
                    </div>

                    <div className="challenges-grid">
                      {userChallenges.filter((challenge) => challenge.progress_percent < 100).length === 0 ? (
                        <p>No active challenges yet.</p>
                      ) : (
                        userChallenges
                          .filter((challenge) => challenge.progress_percent < 100)
                          .map((challenge, i) => (
                            <IonCard key={i} className="challenge-card-modern">
                              <div className="challenge-image-container">
                                <IonImg src={challenge.challenge_image} alt={challenge.challenge_name} />
                                <div className="challenge-progress-overlay">
                                  <div className="progress-circle">
                                    <span className="progress-text">{Math.round(challenge.progress_percent) || 0}%</span>
                                  </div>
                                </div>
                              </div>
                              <IonCardContent>
                                <h4 className="challenge-title">{challenge.challenge_name}</h4>
                                <p className="challenge-target">{challenge.challenge_description}</p>
                                {challenge.days_remaining !== null && challenge.days_remaining !== undefined ? (
                                  <p className="challenge-duration" style={{
                                    color: challenge.days_remaining <= 3 ? '#eb445a' : 'inherit',
                                    fontWeight: challenge.days_remaining <= 3 ? 600 : 'normal'
                                  }}>
                                    {challenge.days_remaining === 0 ? 'Last day!' :
                                     challenge.days_remaining === 1 ? '1 day remaining' :
                                     `${challenge.days_remaining} days remaining`}
                                  </p>
                                ) : (
                                  <p className="challenge-duration">{challenge.challenge_duration_days} days</p>
                                )}
                              </IonCardContent>
                            </IonCard>
                          ))
                      )}
                    </div>

                    {/* Completed Challenges */}
                    <div className="section-header completed-header">
                      <h2>Completed Challenges</h2>
                    </div>

                    <div className="challenges-grid">
                      {userChallenges.filter((challenge) => challenge.progress_percent >= 100).length === 0 ? (
                        <p>No completed challenges yet.</p>
                      ) : (
                        userChallenges
                          .filter((challenge) => challenge.progress_percent >= 100)
                          .map((challenge, i) => (
                            <IonCard key={i} className="challenge-card-modern completed">
                              <div className="challenge-image-container">
                                <IonImg src={challenge.challenge_image} alt={challenge.challenge_name} />
                                <div className="challenge-completed-overlay">
                                  <span className="completed-text">Completed</span>
                                </div>
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
                  </div>
                )}

                {/* Manage Posts Section */}
                {activeTab === "posts" && (
                  <div className="content-section">
                    <div className="section-header">
                      <h2>Manage Posts</h2>
                      <span className="badge-count">{userPosts.length} posts</span>
                    </div>

                    {loadingPosts ? (
                      <div className="loading-center">
                        <IonSpinner name="crescent" />
                        <p>Loading posts...</p>
                      </div>
                    ) : userPosts.length === 0 ? (
                      <div className="loading-center">
                        <p>No posts yet. Complete routes and share them to create posts!</p>
                      </div>
                    ) : (
                      <div className="activities-list">
                        {userPosts.map((post) => (
                          <IonCard key={post.post_id} className="activity-card-modern">
                            <IonCardContent>
                              <div className="activity-top">
                                <div className="activity-meta">
                                  <span className="activity-type">
                                    {post.route_name || "Post"}
                                  </span>
                                  <span className="activity-date">
                                    {formatDate(post.created_at)}
                                  </span>
                                </div>

                                {/* Action Buttons */}
                                <div style={{ display: 'flex', gap: '8px' }}>
                                  <IonButton
                                    fill="clear"
                                    size="small"
                                    onClick={() => handleEditPost(post)}
                                  >
                                    <IonIcon icon={createOutline} slot="icon-only" />
                                  </IonButton>
                                  <IonButton
                                    fill="clear"
                                    size="small"
                                    color="danger"
                                    onClick={() => openDeleteConfirmation(post.post_id)}
                                  >
                                    <IonIcon icon={trashOutline} slot="icon-only" />
                                  </IonButton>
                                </div>
                              </div>

                              {/* Content */}
                              {post.content && (
                                <p style={{ marginBottom: '12px' }}>{post.content}</p>
                              )}

                              {/* Stats (if route-based post) */}
                              {post.route_id && (
                                <div style={{
                                  backgroundColor: '#f5f5f5',
                                  padding: '12px',
                                  borderRadius: '8px',
                                  marginBottom: '12px'
                                }}>
                                  {post.route_name && (
                                    <h4 style={{ margin: '0 0 12px 0', fontSize: '15px', fontWeight: 600 }}>
                                      {post.route_name}
                                    </h4>
                                  )}
                                  <div className="activity-stats-row">
                                    <div className="activity-stat">
                                      <IonIcon icon={locationOutline} />
                                      <strong>{post.distance_km?.toFixed(1)} km</strong>
                                      <span>Distance</span>
                                    </div>
                                    <div className="activity-stat">
                                      <IonIcon icon={timeOutline} />
                                      <strong>{formatDuration(post.duration_seconds)}</strong>
                                      <span>Time</span>
                                    </div>
                                    <div className="activity-stat">
                                      <IonIcon icon={speedometerOutline} />
                                      <strong>{post.average_pace || 'N/A'}</strong>
                                      <span>Pace</span>
                                    </div>
                                    <div className="activity-stat">
                                      <IonIcon icon={flameIcon} />
                                      <strong>{post.estimated_calories || 'N/A'}</strong>
                                      <span>Calories</span>
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* Map Image */}
                              {post.snapshot_url && (
                                <div className="activity-map">
                                  <IonImg src={post.snapshot_url} alt="Route Map" />
                                </div>
                              )}

                              {/* Post Stats */}
                              <div style={{
                                display: 'flex',
                                gap: '16px',
                                marginTop: '12px',
                                paddingTop: '12px',
                                borderTop: '1px solid #e2e8f0',
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
                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginLeft: 'auto' }}>
                                  <IonIcon icon={post.visibility === 'public' ? eyeOutline : lockClosedOutline} />
                                  <span>{post.visibility === 'public' ? 'Public' : 'Private'}</span>
                                </div>
                              </div>
                            </IonCardContent>
                          </IonCard>
                        ))}
                      </div>
                    )}
                  </div>
                )}

              </IonCol>
            </IonRow>
          </IonGrid>

          {/* Profile Action Buttons - Moved Under Content Section */}
          <div className="profile-action-buttons-bottom">
            <IonButton
              className="edit-profile-button"
              onClick={() => setIsEditModalOpen(true)}
            >
              <IonIcon icon={createOutline} slot="start" />
              Edit Profile
            </IonButton>

            <IonButton
              className="settings-button"
              onClick={() => setIsSettingsModalOpen(true)}
            >
              <IonIcon icon={settings} slot="start" />
              Settings
            </IonButton>

            <IonButton
              className="logout-button"
              onClick={() => setShowLogoutAlert(true)}
            >
              <IonIcon icon={logOut} slot="start" />
              Log Out
            </IonButton>
          </div>
        </div>

        {/* Followers/Following Modal */}
        <IonModal 
          isOpen={isFollowersModalOpen} 
          onDidDismiss={() => setIsFollowersModalOpen(false)}
          className="followers-modal"
        >
          <IonHeader>
            <IonToolbar>
              <IonTitle>
                {followersModalType === "followers" ? "Followers" : "Following"}
              </IonTitle>
              <IonButton
                slot="end"
                fill="clear"
                onClick={() => setIsFollowersModalOpen(false)}
              >
                <IonIcon icon={close} />
              </IonButton>
            </IonToolbar>
          </IonHeader>
          
          <IonContent className="followers-modal-content">
            <div className="followers-container">
              <div className="followers-header">
                <div className="followers-tabs">
                  <button
                    className={`followers-tab ${followersModalType === "followers" ? "active" : ""}`}
                    onClick={() => setFollowersModalType("followers")}
                  >
                    <span className="tab-count">{followersCount}</span>
                    <span className="tab-label">Followers</span>
                  </button>
                  <button
                    className={`followers-tab ${followersModalType === "following" ? "active" : ""}`}
                    onClick={() => setFollowersModalType("following")}
                  >
                    <span className="tab-count">{followingCount}</span>
                    <span className="tab-label">Following</span>
                  </button>
                </div>
              </div>

              <div className="followers-list">
                {(followersModalType === "followers" ? followersData : followingsData).map((user) => (
                  <div key={user.id} className="follower-item">
                    <div className="follower-avatar-container">
                      <IonImg src={user.avatar} alt={user.name} className="follower-avatar" />
                      <div className="follower-online-indicator"></div>
                    </div>
                    
                    <div className="follower-info">
                      <div className="follower-main-info">
                        <h4 className="follower-name">{user.name}</h4>
                        <p className="follower-username">@{user.username}</p>
                      </div>
                    </div>

                    <div className="follower-actions">
                      <IonButton
                        className={`follow-btn ${user.isFollowing ? "following" : "follow"}`}
                        size="small"
                        onClick={() => handleFollowToggle(user.id)}
                      >
                        {user.isFollowing ? "Following" : "Follow"}
                      </IonButton>
                    </div>
                  </div>
                ))}
              </div>

              {/* Load More Section */}
              {/* <div className="load-more-section">
                <IonButton 
                  fill="outline" 
                  expand="block" 
                  className="load-more-btn"
                  onClick={() => console.log('Load more')}
                >
                  Load More
                </IonButton>
              </div> */}
            </div>
          </IonContent>
        </IonModal>

        {/* Logout Confirmation Alert */} 
        <IonAlert
          isOpen={showLogoutAlert}
          onDidDismiss={() => setShowLogoutAlert(false)}
          header="Confirm Logout"
          message="Are you sure you want to log out?"
          cssClass="logout-alert"
          buttons={[
            {
              text: 'Cancel',
              role: 'cancel',
              cssClass: 'alert-button-cancel'
            },
            {
              text: 'Log Out',
              role: 'destructive',
              cssClass: 'alert-button-logout',
              handler: handleLogout
            }
          ]}
        />    

        {/* Edit Profile Modal */}
        <IonModal isOpen={isEditModalOpen} className="edit-profile-modal">
          <IonHeader>
            <IonToolbar>
              <IonTitle>Edit Profile</IonTitle>
              <IonButton
                slot="end"
                fill="clear"
                onClick={handleCancelEdit}
              >
              </IonButton>
            </IonToolbar>
          </IonHeader>
          
          <IonContent className="edit-modal-content">
            <div className="edit-form-container">
              
              {/* Profile Picture Section */}
              <div className="edit-avatar-section">
                <IonAvatar className="edit-avatar">
                  <IonImg src={editForm.profilePic} alt="Profile" />
                </IonAvatar>
                <IonButton 
                  fill="solid" 
                  size="small" 
                  className="change-photo-btn"
                  onClick={() => setIsActionSheetOpen(true)}
                >
                  <IonIcon icon={camera} slot="start" />
                  Change Photo
                </IonButton>
              </div>

              {/* Form Fields */}
              <div className="edit-form-fields">
                <IonItem className="edit-form-item">
                  <IonLabel position="stacked">Full Name</IonLabel>
                  <IonInput
                    value={editForm.Name}
                    onIonInput={(e) => setEditForm({
                      ...editForm,
                      Name: e.detail.value!
                    })}
                    placeholder="Enter your first name"
                    className="edit-input"
                  />
                </IonItem>

                <IonItem className="edit-form-item description-item">
                  <IonLabel position="stacked">Description</IonLabel>
                  <IonTextarea
                    value={editForm.description}
                    onIonInput={(e) => setEditForm({
                      ...editForm,
                      description: e.detail.value!
                    })}
                    placeholder="Tell us about yourself..."
                    rows={3}
                    className="edit-textarea"
                  />
                </IonItem>
                
              </div>

              {/* Action Buttons */}
              <div className="edit-form-actions">
                <IonButton
                  expand="block"
                  fill="solid"
                  onClick={handleSaveProfile}
                  className="save-profile-btn"
                >
                  <IonIcon icon={checkmark} slot="start" />
                  Save Changes
                </IonButton>
                
                <IonButton
                  expand="block"
                  fill="solid"
                  onClick={handleCancelEdit}
                  className="cancel-profile-btn"
                > 
                  Cancel
                </IonButton>
              </div>
            </div>
          </IonContent>
        </IonModal>

        {/* Image Selection Action Sheet */}
        <IonActionSheet
          isOpen={isActionSheetOpen}
          onDidDismiss={() => setIsActionSheetOpen(false)}
          header="Change Profile Picture"
          buttons={[
            {
              text: 'Camera',
              icon: camera,
              handler: () => handleImageSelection('camera')
            },
            {
              text: 'Photo Library',
              icon: person,
              handler: () => handleImageSelection('library')
            },
            {
              text: 'Cancel',
              role: 'cancel'
            }
          ]}
        />

        {/* Success Toast */}
        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message="Profile updated successfully!"
          duration={2000}
          color="success"
          position="top"
        />

        {/* Edit Post Modal */}
        <IonModal isOpen={isEditPostModalOpen} className="edit-profile-modal">
          <IonHeader>
            <IonToolbar>
              <IonTitle>Edit Post</IonTitle>
              <IonButton
                slot="end"
                fill="clear"
                onClick={() => {
                  setIsEditPostModalOpen(false);
                  setEditingPost(null);
                }}
              >
                <IonIcon icon={close} />
              </IonButton>
            </IonToolbar>
          </IonHeader>

          <IonContent className="edit-modal-content">
            <div className="edit-form-container">
              {/* Form Fields */}
              <div className="edit-form-fields">
                <IonItem className="edit-form-item">
                  <IonLabel position="stacked">Title / Activity Name</IonLabel>
                  <IonInput
                    value={editingPost?.route_name || ''}
                    onIonInput={(e) => setEditingPost({
                      ...editingPost,
                      route_name: e.detail.value!
                    })}
                    placeholder="Enter activity title..."
                    className="edit-input"
                  />
                </IonItem>

                <IonItem className="edit-form-item description-item">
                  <IonLabel position="stacked">Post Content</IonLabel>
                  <IonTextarea
                    value={editingPost?.content || ''}
                    onIonInput={(e) => setEditingPost({
                      ...editingPost,
                      content: e.detail.value!
                    })}
                    placeholder="Share your thoughts about this activity..."
                    rows={4}
                    className="edit-textarea"
                  />
                </IonItem>

                <IonItem className="edit-form-item">
                  <IonLabel position="stacked">Visibility</IonLabel>
                  <select
                    value={editingPost?.visibility || 'public'}
                    onChange={(e) => setEditingPost({
                      ...editingPost,
                      visibility: e.target.value
                    })}
                    style={{
                      width: '100%',
                      padding: '12px',
                      marginTop: '8px',
                      borderRadius: '8px',
                      border: '1px solid #ccc',
                      fontSize: '16px'
                    }}
                  >
                    <option value="public">Public - Everyone can see</option>
                    <option value="private">Private - Only followers can see</option>
                  </select>
                </IonItem>
              </div>

              {/* Action Buttons */}
              <div className="edit-form-actions">
                <IonButton
                  expand="block"
                  fill="solid"
                  onClick={handleSavePostEdit}
                  className="save-profile-btn"
                >
                  <IonIcon icon={checkmark} slot="start" />
                  Save Changes
                </IonButton>

                <IonButton
                  expand="block"
                  fill="outline"
                  onClick={() => {
                    setIsEditPostModalOpen(false);
                    setEditingPost(null);
                  }}
                  className="cancel-profile-btn"
                >
                  Cancel
                </IonButton>
              </div>
            </div>
          </IonContent>
        </IonModal>

        {/* Delete Post Confirmation Alert */}
        <IonAlert
          isOpen={showDeleteAlert}
          onDidDismiss={() => {
            setShowDeleteAlert(false);
            setPostToDelete(null);
          }}
          header="Delete Post"
          message="Are you sure you want to delete this post? This action cannot be undone."
          cssClass="logout-alert"
          buttons={[
            {
              text: 'Cancel',
              role: 'cancel',
              cssClass: 'alert-button-cancel'
            },
            {
              text: 'Delete',
              role: 'destructive',
              cssClass: 'alert-button-logout',
              handler: handleDeletePost
            }
          ]}
        />

        {/* Likes Modal */}
        <IonModal
          isOpen={isLikesModalOpen}
          onDidDismiss={() => {
            setIsLikesModalOpen(false);
            setSelectedPostLikers([]);
          }}
          className="followers-modal"
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

          <IonContent className="followers-modal-content">
            {loadingLikers ? (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
                <IonSpinner name="crescent" />
              </div>
            ) : selectedPostLikers.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                No likes yet
              </div>
            ) : (
              <div className="followers-list">
                {selectedPostLikers.map((liker) => (
                  <div key={liker.user_id} className="follower-item">
                    <div className="follower-avatar-container">
                      <IonImg
                        src={liker.profile_picture || DEFAULT_AVATAR}
                        alt={liker.name}
                        className="follower-avatar"
                      />
                    </div>
                    <div className="follower-info">
                      <h4 className="follower-name">{liker.name}</h4>
                      <p className="follower-username">@{liker.username}</p>
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
          className="edit-profile-modal"
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

          <IonContent className="edit-modal-content">
            <div className="edit-form-container">
              {/* Comments List - Read Only */}
              {loadingComments ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}>
                  <IonSpinner name="crescent" />
                </div>
              ) : selectedPostComments.length === 0 ? (
                <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                  No comments yet.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  {selectedPostComments.map((comment) => (
                    <div
                      key={comment.comment_id}
                      style={{
                        padding: '15px',
                        backgroundColor: '#f5f5f5',
                        borderRadius: '8px',
                        position: 'relative'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                        <IonAvatar style={{ width: '40px', height: '40px', minWidth: '40px' }}>
                          <IonImg src={comment.profile_picture || DEFAULT_AVATAR} />
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
                            {new Date(comment.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </IonContent>
        </IonModal>

        {/* Badge History Modal */}
        <IonModal
          isOpen={isBadgeHistoryModalOpen}
          onDidDismiss={() => {
            setIsBadgeHistoryModalOpen(false);
            setSelectedBadge(null);
          }}
          className="edit-profile-modal"
        >
          <IonHeader>
            <IonToolbar>
              <IonTitle>Badge History</IonTitle>
              <IonButton
                slot="end"
                fill="clear"
                onClick={() => {
                  setIsBadgeHistoryModalOpen(false);
                  setSelectedBadge(null);
                }}
              >
                <IonIcon icon={close} />
              </IonButton>
            </IonToolbar>
          </IonHeader>

          <IonContent className="edit-modal-content">
            <div className="edit-form-container">
              {selectedBadge && (
                <>
                  {/* Badge Details */}
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    padding: '20px',
                    borderBottom: '1px solid #e0e0e0',
                    marginBottom: '20px'
                  }}>
                    <IonImg
                      src={selectedBadge.image}
                      alt={selectedBadge.title}
                      style={{ width: '120px', height: '120px', marginBottom: '15px' }}
                    />
                    <h3 style={{ margin: '0 0 8px 0', fontSize: '20px', fontWeight: 'bold' }}>
                      {selectedBadge.title}
                    </h3>
                    <p style={{ margin: '0', color: '#666', textAlign: 'center' }}>
                      {selectedBadge.description}
                    </p>
                    <div style={{ marginTop: '10px', fontSize: '14px', color: '#999' }}>
                      Earned {selectedBadge.count} {selectedBadge.count === 1 ? 'time' : 'times'}
                    </div>
                  </div>

                  {/* Challenge History */}
                  <div style={{ padding: '0 20px 20px 20px' }}>
                    <h4 style={{ marginBottom: '15px', fontSize: '16px', fontWeight: 'bold' }}>
                      Challenges Completed
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {selectedBadge.challenges.map((challenge: any, index: number) => (
                        <div
                          key={index}
                          style={{
                            padding: '15px',
                            backgroundColor: '#f5f5f5',
                            borderRadius: '8px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                          }}
                        >
                          <div>
                            <div style={{ fontWeight: '600', fontSize: '14px', marginBottom: '4px' }}>
                              {challenge.challenge_name}
                            </div>
                            <div style={{ fontSize: '12px', color: '#666' }}>
                              Completed: {challenge.completed_date}
                            </div>
                          </div>
                          <IonIcon icon={checkmark} style={{ color: '#4CAF50', fontSize: '24px' }} />
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </IonContent>
        </IonModal>

        {/* Settings Modal */}
        <Settings
          isOpen={isSettingsModalOpen}
          onDidDismiss={() => setIsSettingsModalOpen(false)}
          currentUser={fullUserData}
          onSettingsUpdate={handleSettingsUpdate}
        />
      </IonContent>
    </IonPage>
  );
};

export default Profile;
