import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonButtons,
  IonBackButton,
  IonTitle,
  IonButton,
  IonIcon,
  IonContent,
  IonItem,
  IonLabel,
  IonAvatar,
  IonGrid,
  IonRow,
  IonCol,
  IonSelect,
  IonSelectOption,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonRouterLink,
  IonSpinner,
  IonToast,
} from "@ionic/react";
import { settingsOutline, chevronForwardOutline, location } from "ionicons/icons";
import { useUser } from "../contexts/UserContext";
import { useChallenges } from "../contexts/ChallengesContext";
import { RoutesApi } from "../services/routes";
import { FollowsApi } from "../services/follows";
import { getAvatarUrl } from "../lib/utils";
import "../theme/User-Profile.css";

export default function Profile() {
  const { currentUser, loading: userLoading } = useUser();
  const { badges } = useChallenges();

  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [userRoutes, setUserRoutes] = useState<any[]>([]);
  const [timePeriod, setTimePeriod] = useState<'day' | 'week' | 'month'>('day');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isMountedRef = useRef(true);

  // Performance stats state
  interface StatSummary {
    title: string;
    runs_count: number;
    total_distance: string;
    avg_pace: string;
    total_calories: string;
  }

  // Calculate performance stats from user routes using useMemo for better performance
  const statsData = useMemo<{
    day: StatSummary;
    week: StatSummary;
    month: StatSummary;
  }>(() => {
    if (!userRoutes || userRoutes.length === 0) {
      return {
        day: { title: "Today", runs_count: 0, total_distance: "0.0 km", avg_pace: "0:00 /km", total_calories: "0 kcal" },
        week: { title: "This Week", runs_count: 0, total_distance: "0.0 km", avg_pace: "0:00 /km", total_calories: "0 kcal" },
        month: { title: "This Month", runs_count: 0, total_distance: "0.0 km", avg_pace: "0:00 /km", total_calories: "0 kcal" },
      };
    }

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

    return {
      day: { title: "Today", ...calcStats(dayRoutes) },
      week: { title: "This Week", ...calcStats(weekRoutes) },
      month: { title: "This Month", ...calcStats(monthRoutes) },
    };
  }, [userRoutes]);

  const fetchProfileData = useCallback(async () => {
    if (!currentUser) return;

    try {
      if (isMountedRef.current) {
        setLoading(true);
        setError(null);
      }

      // Fetch follow counts
      const followCounts = await FollowsApi.getFollowCounts(currentUser.user_id);

      if (isMountedRef.current) {
        setFollowerCount(followCounts.followers);
        setFollowingCount(followCounts.following);
      }

      // Fetch user routes (used for stats calculation)
      const routes = await RoutesApi.getUserRoutes(currentUser.user_id, true);

      if (isMountedRef.current) {
        setUserRoutes(Array.isArray(routes) ? routes : []);
      }
    } catch (err: any) {
      console.error('Failed to fetch profile data:', err);
      if (isMountedRef.current) {
        setError('Failed to load profile data');
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [currentUser]);

  useEffect(() => {
    isMountedRef.current = true;

    if (!currentUser) return;

    fetchProfileData();

    return () => {
      isMountedRef.current = false;
    };
  }, [currentUser, fetchProfileData]);

  const currentStats = statsData[timePeriod];

  if (userLoading || loading) {
    return (
      <IonPage>
        <IonHeader className="dark-header">
          <IonToolbar>
            <IonButtons slot="start">
              <IonBackButton defaultHref="/home" className="back-button" text="" />
            </IonButtons>
            <IonTitle>Profile</IonTitle>
            <IonButtons slot="end">
              <IonButton routerLink="/settings">
                <IonIcon icon={settingsOutline} />
              </IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>
        <IonContent className="profile-content">
          {/* Profile Header Skeleton */}
          <div className="profile-header" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <div style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                background: 'linear-gradient(90deg, #2a2a2a 25%, #3a3a3a 50%, #2a2a2a 75%)',
                backgroundSize: '200% 100%',
                animation: 'loading 1.5s ease-in-out infinite'
              }} />
              <div style={{ flex: 1 }}>
                <div style={{
                  width: '150px',
                  height: '24px',
                  borderRadius: '4px',
                  background: 'linear-gradient(90deg, #2a2a2a 25%, #3a3a3a 50%, #2a2a2a 75%)',
                  backgroundSize: '200% 100%',
                  animation: 'loading 1.5s ease-in-out infinite',
                  marginBottom: '8px'
                }} />
                <div style={{
                  width: '100px',
                  height: '16px',
                  borderRadius: '4px',
                  background: 'linear-gradient(90deg, #2a2a2a 25%, #3a3a3a 50%, #2a2a2a 75%)',
                  backgroundSize: '200% 100%',
                  animation: 'loading 1.5s ease-in-out infinite'
                }} />
              </div>
            </div>
          </div>

          {/* Stats Grid Skeleton */}
          <IonGrid style={{ padding: '0 20px' }}>
            <IonRow>
              {[1, 2, 3].map((i) => (
                <IonCol key={i} size="4">
                  <div style={{
                    height: '60px',
                    borderRadius: '12px',
                    background: 'linear-gradient(90deg, #2a2a2a 25%, #3a3a3a 50%, #2a2a2a 75%)',
                    backgroundSize: '200% 100%',
                    animation: 'loading 1.5s ease-in-out infinite',
                    animationDelay: `${i * 0.1}s`
                  }} />
                </IonCol>
              ))}
            </IonRow>
          </IonGrid>

          {/* Chart Skeleton */}
          <IonCard style={{ margin: '15px' }}>
            <IonCardContent>
              <div style={{
                width: '120px',
                height: '20px',
                borderRadius: '4px',
                background: 'linear-gradient(90deg, #2a2a2a 25%, #3a3a3a 50%, #2a2a2a 75%)',
                backgroundSize: '200% 100%',
                animation: 'loading 1.5s ease-in-out infinite',
                marginBottom: '15px'
              }} />
              <div style={{
                width: '100%',
                height: '150px',
                borderRadius: '8px',
                background: 'linear-gradient(90deg, #2a2a2a 25%, #3a3a3a 50%, #2a2a2a 75%)',
                backgroundSize: '200% 100%',
                animation: 'loading 1.5s ease-in-out infinite'
              }} />
            </IonCardContent>
          </IonCard>

          {/* Loading Text */}
          <div className="ion-text-center" style={{ marginTop: '20px' }}>
            <IonSpinner name="crescent" style={{ color: '#92C628' }} />
            <p style={{ color: '#999', marginTop: '10px', fontSize: '14px' }}>Loading your profile...</p>
          </div>

          <style>{`
            @keyframes loading {
              0% { background-position: 200% 0; }
              100% { background-position: -200% 0; }
            }
          `}</style>
        </IonContent>
      </IonPage>
    );
  }

  if (!currentUser) {
    return (
      <IonPage>
        <IonHeader className="dark-header">
          <IonToolbar>
            <IonTitle>Profile</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-text-center ion-padding">
          <p>Please log in to view your profile</p>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      {/* Header */}
      <IonHeader className="dark-header">
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/home" className="back-button" text="" />
          </IonButtons>
          <IonTitle>Profile</IonTitle>
          <IonButtons slot="end">
            <IonButton routerLink="/settings">
              <IonIcon icon={settingsOutline} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      {/* Scrollable Content */}
      <IonContent className="profile-content">
        {/* Profile Section */}
        <IonItem lines="none">
          <IonAvatar slot="start">
            <img src={getAvatarUrl(currentUser.profile_picture)} alt={currentUser.name} />
          </IonAvatar>
          <IonLabel>
            <h2>{currentUser.name}</h2>
            <p>@{currentUser.username}</p>
            {currentUser.location && (
              <p>
                <IonIcon icon={location} />
                {currentUser.location}
              </p>
            )}
          </IonLabel>
          <IonButton routerLink="/edit-profile" fill="outline" slot="end">
            Edit
          </IonButton>
        </IonItem>

        {/* Stats */}
        <IonGrid>
          <IonRow>
            <IonCol>
              <IonRouterLink routerLink="/following?tab=following">
                <h2>{followingCount}</h2>
                <p>Following</p>
              </IonRouterLink>
            </IonCol>
            <IonCol>
              <IonRouterLink routerLink="/following?tab=followers">
                <h2>{followerCount}</h2>
                <p>Followers</p>
              </IonRouterLink>
            </IonCol>
            <IonCol>
              <IonRouterLink routerLink="/badges">
                <h2>{badges.length}</h2>
                <p>Badges</p>
              </IonRouterLink>
            </IonCol>
          </IonRow>
        </IonGrid>

        {/* Performance Stats */}
        <IonCard className="performance-stats-card">
          <IonCardHeader>
            <IonCardTitle>Performance Stats</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            {/* Time Range Selector */}
            <IonSelect
              value={timePeriod}
              interface="popover"
              onIonChange={(e) => setTimePeriod(e.detail.value)}
              className="time-range-select"
            >
              <IonSelectOption value="day">Today</IonSelectOption>
              <IonSelectOption value="week">This Week</IonSelectOption>
              <IonSelectOption value="month">This Month</IonSelectOption>
            </IonSelect>

            {/* Stats Display */}
            <div className="stats-grid">
              <div className="stat-item">
                <div className="stat-label">Runs</div>
                <div className="stat-value">{currentStats.runs_count}</div>
              </div>
              <div className="stat-item">
                <div className="stat-label">Distance</div>
                <div className="stat-value">{currentStats.total_distance}</div>
              </div>
              <div className="stat-item">
                <div className="stat-label">Pace</div>
                <div className="stat-value">{currentStats.avg_pace}</div>
              </div>
              <div className="stat-item">
                <div className="stat-label">Calories</div>
                <div className="stat-value">{currentStats.total_calories}</div>
              </div>
            </div>
          </IonCardContent>
        </IonCard>

        {/* Menu Sections */}
        <div className="menu-section">
          <IonItem className="dark-content" routerLink="/activities" lines="none">
            <IonIcon icon={chevronForwardOutline} slot="end" />
            <IonLabel>
              <h2>Activities</h2>
              <p>View all your running sessions</p>
            </IonLabel>
          </IonItem>
          <IonItem className="dark-content" routerLink="/posts" lines="none">
            <IonIcon icon={chevronForwardOutline} slot="end" />
            <IonLabel>
              <h2>View Posts</h2>
              <p>View all your posts</p>
            </IonLabel>
          </IonItem>
          <IonItem className="dark-content" routerLink="/my-challenges" lines="none">
            <IonIcon icon={chevronForwardOutline} slot="end" />
            <IonLabel>
              <h2>View Challenges</h2>
              <p>See your active and completed challenges</p>
            </IonLabel>
          </IonItem>
        </div>

      </IonContent>

      {/* Error Toast */}
      <IonToast
        isOpen={!!error}
        message={error || ''}
        duration={3000}
        onDidDismiss={() => setError(null)}
        color="danger"
      />
    </IonPage>
  );
}
