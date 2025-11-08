import { useState, useEffect, useCallback, useRef } from "react";
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
  IonImg,
  IonSpinner,
  IonToast,
} from "@ionic/react";
import { settingsOutline, chevronForwardOutline, location, people } from "ionicons/icons";
import { useUser } from "../contexts/UserContext";
import { useChallenges } from "../contexts/ChallengesContext";
import { RoutesApi } from "../services/routes";
import { FollowsApi } from "../services/follows";
import { getAvatarUrl } from "../lib/utils";
import "../theme/User-Profile.css";

export default function Profile() {
  const { currentUser, loading: userLoading } = useUser();
  const { userChallenges, badges } = useChallenges();

  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [weeklyStats, setWeeklyStats] = useState<any[]>([]);
  const [timePeriod, setTimePeriod] = useState<'day' | 'week' | 'month'>('week');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isMountedRef = useRef(true);

  const fetchWeeklyStats = useCallback(async () => {
    if (!currentUser) return;

    try {
      // Fetch user routes for the last 7 days
      const routes = await RoutesApi.getUserRoutes(currentUser.user_id, true);

      // Group by day of week
      const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const now = new Date();
      const stats: any[] = [];

      for (let i = 6; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const dayName = daysOfWeek[date.getDay()];

        // Filter routes for this day
        const dayRoutes = routes.filter(route => {
          const routeDate = new Date(route.created_at);
          return routeDate.toDateString() === date.toDateString();
        });

        const totalDistance = dayRoutes.reduce((sum, route) => sum + route.distance_km, 0);

        stats.push({
          day: dayName,
          distance: totalDistance,
          percentage: Math.min((totalDistance / 20) * 100, 100), // Scale to 20km max
        });
      }

      if (isMountedRef.current) {
        setWeeklyStats(stats);
      }
    } catch (err) {
      console.error('Failed to fetch weekly stats:', err);
    }
  }, [currentUser]);

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
      await RoutesApi.getUserRoutes(currentUser.user_id, true);

      // Fetch weekly stats for chart
      await fetchWeeklyStats();
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
  }, [currentUser, fetchWeeklyStats]);

  useEffect(() => {
    isMountedRef.current = true;

    if (!currentUser) return;

    fetchProfileData();

    return () => {
      isMountedRef.current = false;
    };
  }, [currentUser, fetchProfileData]);

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

  // Get active challenge (first non-completed challenge)
  const activeChallenge = userChallenges.find(c => !c.completed);

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
              <IonRouterLink routerLink="/following">
                <h2>{followingCount}</h2>
                <p>Following</p>
              </IonRouterLink>
            </IonCol>
            <IonCol>
              <IonRouterLink routerLink="/following">
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

        {/* Distance Chart */}
        <IonCard>
          <IonCardHeader>
            <IonCardTitle>Distance</IonCardTitle>
            <p>Distance covered per day (last 7 days)</p>
          </IonCardHeader>
          <IonCardContent>
            <IonSelect
              value={timePeriod}
              interface="popover"
              onIonChange={(e) => setTimePeriod(e.detail.value)}
            >
              <IonSelectOption value="day">Per Day</IonSelectOption>
              <IonSelectOption value="week">Per Week</IonSelectOption>
              <IonSelectOption value="month">Per Month</IonSelectOption>
            </IonSelect>

            <div className="chart">
              {weeklyStats.length > 0 ? (
                weeklyStats.map((stat) => (
                  <div className="chart-row" key={stat.day}>
                    <span>{stat.day}</span>
                    <div className="bar" style={{ width: `${stat.percentage}%` }}></div>
                  </div>
                ))
              ) : (
                <p className="ion-text-center">No activity data yet</p>
              )}
            </div>

            <div className="chart-scale">
              <span>0</span>
              <span>5km</span>
              <span>10km</span>
              <span>15km</span>
              <span>20km</span>
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
          <IonItem className="dark-content" routerLink="/analytics" lines="none">
            <IonIcon icon={chevronForwardOutline} slot="end" />
            <IonLabel>
              <h2>Statistics</h2>
              <p>Check your running stats</p>
            </IonLabel>
          </IonItem>
        </div>

        {/* Active Challenge */}
        {activeChallenge && (
          <>
            <h3 className="groups-title">Current Challenge</h3>
            <IonCard className="current-challenge-card">
              <div className="challenge-image-container">
                <IonImg src={activeChallenge.challenge_image} alt={activeChallenge.challenge_name} />
                <div className="challenge-overlay">
                  <h3 className="challenge-title">{activeChallenge.challenge_name}</h3>
                  <div className="participants">
                    <IonIcon icon={people} className="participants-icon" />
                    <span>Challenge Active</span>
                  </div>
                </div>
              </div>
              <IonCardContent className="challenge-content">
                <p>{activeChallenge.challenge_description}</p>
                <div className="progress-section">
                  <span className="progress-label">
                    Progress: {activeChallenge.progress_percent.toFixed(0)}%
                  </span>
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{ width: `${activeChallenge.progress_percent}%` }}
                    ></div>
                  </div>
                </div>
              </IonCardContent>
            </IonCard>
          </>
        )}

        {/* All Challenges Link */}
        <IonButton expand="block" routerLink="/community" className="ion-margin">
          View All Challenges
        </IonButton>
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
