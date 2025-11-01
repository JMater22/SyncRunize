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
import { settings, trophy, flame, statsChart, close, camera, checkmark, person, logOut } from "ionicons/icons";

import ProfilePic from "../assets/Profile Picture.png";
import Banner from "../assets/Banner UP.png";
import MapImage from "../assets/MAP 1.png";
import Challenges from "../assets/Couch to 5K.jpg";
import SevenDayStarter from "../assets/The 7-Day Starter.jpg";
import ThirtyDayStreak from "../assets/30-Day Streak.jpg";
import FiveKImprover from "../assets/5K Improver.jpg";
import WeekendLongRun from "../assets/Weekend Long Run.jpg";
import FiftyKMonth from "../assets/The 50K Month.jpg"; 
import ThreeTimesAWeek from "../assets/Three Times a Week.jpg"; 
import TenKBeginner from "../assets/10K Beginner.jpg";
// import BronzeBadge from "../assets/badges/Bronze.png";
// import SilverBadge from "../assets/badges/Silver.png";
// import GoldBadge from "../assets/badges/Gold.png";


import "../components/UserProfile/UserProfile.css";
import { supabase } from "../supabaseClient";
import axios from "axios";




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
  const [activeTab, setActiveTab] = useState<"activities" | "badges" | "challenges">("activities");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isActionSheetOpen, setIsActionSheetOpen] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [showLogoutAlert, setShowLogoutAlert] = useState(false);
  const [isFollowersModalOpen, setIsFollowersModalOpen] = useState(false);
  const [followersModalType, setFollowersModalType] = useState<"followers" | "following">("followers");
  const [timeRange, setTimeRange] = useState<'day' | 'week' | 'month'>('day');
  
  const [userRoutes, setUserRoutes] = useState<any[]>([]);
  const [loadingRoutes, setLoadingRoutes] = useState(false);

  // Profile data state
  const [profileData, setProfileData] = useState({
    Name: "",
    description: "",
    profilePic: "https://ionicframework.com/docs/img/demos/avatar.svg"
  });

  const [followersCount, setFollowersCount] = useState(1);
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


  

    // Fetch user data on mount
  useEffect(() => {
  const fetchUserData = async () => {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      if (!session) return;

      const token = session.access_token;
      const { data: user } = await axios.get(`${import.meta.env.VITE_API_URL}/users/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setCurrentUserId(user.user_id);

      setProfileData({
        Name: user.name || "Unknown User",
        description: user.description || "",
        profilePic: user.profile_picture || profileData.profilePic,
      });
      console.log(user.description);
      // Fetch both counts at once (more efficient!)
      const { data: counts } = await axios.get(
        `${import.meta.env.VITE_API_URL}/follows/${user.user_id}/counts`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setFollowersCount(counts.followers);
      setFollowingCount(counts.following); // If you need following count too
      await fetchEarnedBadges(user.user_id, token);
    } catch (error) {
      console.error("Error fetching user data or counts:", error);
    }
  };

  fetchUserData();

}, []);

  const fetchEarnedBadges = async (userId: number, token: string) => {
    try {
      setLoadingBadges(true);
      
      const { data: response } = await axios.get(
        `${import.meta.env.VITE_API_URL}/routes/badges/${userId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Filter only completed challenges with badges
      const badges = response.data
        .filter((challenge: any) => challenge.completed && challenge.badge_image_url)
        .map((challenge: any) => ({
          title: challenge.badge_name || "Badge",
          description: challenge.badge_description || "Achievement unlocked",
          tier: challenge.badge_tier || "Bronze",
          earned: true,
          date: new Date(challenge.updated_at).toLocaleDateString(),
          image: challenge.badge_image_url
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



  // Mock data for followers and following
  const [followersData, setFollowersData] = useState([
    { id: 1, name: "Sarah Johnson", username: "sarahj_runs", avatar: ProfilePic, isFollowing: true, mutualFollows: 3 },
    { id: 2, name: "Mike Chen", username: "mike_fitness", avatar: ProfilePic, isFollowing: false, mutualFollows: 1 },
    { id: 3, name: "Emma Wilson", username: "emma_marathon", avatar: ProfilePic, isFollowing: true, mutualFollows: 7 },
    { id: 4, name: "David Park", username: "david_trails", avatar: ProfilePic, isFollowing: false, mutualFollows: 2 },
    { id: 5, name: "Lisa Rodriguez", username: "lisa_5k", avatar: ProfilePic, isFollowing: true, mutualFollows: 5 },
    { id: 6, name: "Tom Anderson", username: "tom_cycling", avatar: ProfilePic, isFollowing: false, mutualFollows: 0 },
    { id: 7, name: "Rachel Green", username: "rachel_yoga", avatar: ProfilePic, isFollowing: true, mutualFollows: 4 },
    { id: 8, name: "James Wilson", username: "james_crossfit", avatar: ProfilePic, isFollowing: false, mutualFollows: 1 }
  ]);

  const [followingData, setFollowingData] = useState([
    { id: 1, name: "Nike Running", username: "nike_running", avatar: ProfilePic, isFollowing: true, mutualFollows: 15 },
    { id: 2, name: "Strava", username: "strava_official", avatar: ProfilePic, isFollowing: true, mutualFollows: 23 },
    { id: 3, name: "Runner's World", username: "runnersworld", avatar: ProfilePic, isFollowing: true, mutualFollows: 12 },
    { id: 4, name: "Maria Santos", username: "maria_ultra", avatar: ProfilePic, isFollowing: true, mutualFollows: 8 },
    { id: 5, name: "Fitness Guru", username: "fitness_guru", avatar: ProfilePic, isFollowing: true, mutualFollows: 6 },
    { id: 6, name: "Alex Turner", username: "alex_marathoner", avatar: ProfilePic, isFollowing: true, mutualFollows: 9 },
    { id: 7, name: "Running Coach", username: "coach_running", avatar: ProfilePic, isFollowing: true, mutualFollows: 11 },
    { id: 8, name: "Jane Smith", username: "jane_triathlon", avatar: ProfilePic, isFollowing: true, mutualFollows: 4 }
  ]);



  // Add this useEffect to fetch user routes
useEffect(() => {
  const fetchUserRoutes = async () => {
    if (!currentUserId) return;

    try {
      setLoadingRoutes(true);
      
      // No need for authentication token
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/routes/user/${currentUserId}`,
        { 
          params: {
            limit: 20,
            offset: 0
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


  const handleFollowToggle = (userId: number, currentType: "followers" | "following") => {
    if (currentType === "followers") {
      setFollowersData(prevData => 
        prevData.map(user => 
          user.id === userId ? { ...user, isFollowing: !user.isFollowing } : user
        )
      );
    } else {
      setFollowingData(prevData => 
        prevData.map(user => 
          user.id === userId ? { ...user, isFollowing: !user.isFollowing } : user
        )
      );
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
                        <IonCard key={i} className={`badge-card-modern ${!badge.earned ? 'locked' : ''}`}>
                          <div className={`badge-glow ${badge.tier.toLowerCase()}`}></div>
                          <IonImg src={badge.image} alt={badge.title} className="badge-image" />
                          <IonCardContent>
                            <h4 className="badge-title">{badge.title}</h4>
                            <p className="badge-description">{badge.description}</p>
                            <div className={`badge-earned ${!badge.earned ? 'locked-text' : ''}`}>
                              Earned {badge.date}
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
                                <p className="challenge-duration">{challenge.challenge_duration_days} days</p>
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

              </IonCol>
            </IonRow>
          </IonGrid>

          {/* Profile Action Buttons - Moved Under Content Section */}
          <div className="profile-action-buttons-bottom">
            <IonButton 
              className="edit-profile-button" 
              fill="clear"
              onClick={() => setIsEditModalOpen(true)}
            >
              <IonIcon icon={settings} slot="start" />
              Edit Profile
            </IonButton>
            
            <IonButton 
              className="logout-button"
              fill="clear"
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
                    <span className="tab-count">32</span>
                    <span className="tab-label">Followers</span>
                  </button>
                  <button
                    className={`followers-tab ${followersModalType === "following" ? "active" : ""}`}
                    onClick={() => setFollowersModalType("following")}
                  >
                    <span className="tab-count">21</span>
                    <span className="tab-label">Following</span>
                  </button>
                </div>
              </div>

              <div className="followers-list">
                {(followersModalType === "followers" ? followersData : followingData).map((user) => (
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
                      {user.mutualFollows > 0 && (
                        <p className="follower-mutual">
                          {user.mutualFollows} mutual {user.mutualFollows === 1 ? 'follow' : 'follows'}
                        </p>
                      )}
                    </div>

                    <div className="follower-actions">
                      <IonButton
                        className={`follow-btn ${user.isFollowing ? 'following' : 'follow'}`}
                        size="small"
                        onClick={() => handleFollowToggle(user.id, followersModalType)}
                      >
                        {user.isFollowing ? 'Following' : 'Follow'}
                      </IonButton>
                    </div>
                  </div>
                ))}
              </div>

              {/* Load More Section */}
              <div className="load-more-section">
                <IonButton 
                  fill="outline" 
                  expand="block" 
                  className="load-more-btn"
                  onClick={() => console.log('Load more')}
                >
                  Load More
                </IonButton>
              </div>
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
                <IonIcon icon={close} />
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
                  fill="outline" 
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
                  fill="outline"
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
      </IonContent>
    </IonPage>
  );
};

export default Profile;