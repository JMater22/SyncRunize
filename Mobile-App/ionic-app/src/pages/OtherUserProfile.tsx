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
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonSpinner,
  IonToast,
  IonSelect,
  IonSelectOption,
  IonModal,
  IonImg,
} from "@ionic/react";
import { personAddOutline, personRemoveOutline, lockClosedOutline, chevronForwardOutline, close } from "ionicons/icons";
import { useLocation, useHistory } from "react-router-dom";
import { useUser } from "../contexts/UserContext";
import { UsersApi, MeResponse } from "../services/users";
import { RoutesApi } from "../services/routes";
import { FollowsApi } from "../services/follows";
import { ChallengesApi, Badge } from "../services/challenges";
import { getAvatarUrl } from "../lib/utils";
import "../theme/User-Profile.css";
import "../theme/Badges.css";
import GoldBadge from "../components/assets/badges/Gold Animated-modified.png";
import BronzeBadge from "../components/assets/badges/Bronze Animated-modified.png";
import SilverBadge from "../components/assets/badges/Silver Animated-modified.png";

interface LocationState {
  userId: number;
}

export default function OtherUserProfile() {
  const location = useLocation<LocationState>();
  const history = useHistory();
  const { currentUser } = useUser();
  const userId = location.state?.userId;

  const [profile, setProfile] = useState<MeResponse | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [userRoutes, setUserRoutes] = useState<any[]>([]);
  const [timePeriod, setTimePeriod] = useState<'day' | 'week' | 'month'>('day');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Badge modal state
  const [isBadgeModalOpen, setIsBadgeModalOpen] = useState(false);
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);

  const isMountedRef = useRef(true);

  // Performance stats state
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

  // Badge helpers
  const getDefaultBadgeImage = (tier: 'Bronze' | 'Silver' | 'Gold') => {
    switch (tier) {
      case 'Bronze': return BronzeBadge;
      case 'Silver': return SilverBadge;
      case 'Gold': return GoldBadge;
      default: return BronzeBadge;
    }
  };

  const getBadgeColor = (tier: 'Bronze' | 'Silver' | 'Gold') => {
    switch (tier) {
      case 'Bronze': return "#CD7F32";
      case 'Silver': return "#C0C0C0";
      case 'Gold': return "#FFD700";
      default: return "#CD7F32";
    }
  };

  // Calculate performance stats from user routes
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

    const dayRoutes = filterByPeriod(userRoutes, 1);
    const weekRoutes = filterByPeriod(userRoutes, 7);
    const monthRoutes = filterByPeriod(userRoutes, 30);

    setStatsData({
      day: { title: "Today", ...calcStats(dayRoutes) },
      week: { title: "This Week", ...calcStats(weekRoutes) },
      month: { title: "This Month", ...calcStats(monthRoutes) },
    });
  }, [userRoutes]);

  // Redirect if no userId or viewing own profile
  useEffect(() => {
    if (!userId) {
      history.replace('/search-runners');
      return;
    }
    if (currentUser && userId === currentUser.user_id) {
      history.replace('/profile');
    }
  }, [currentUser, userId, history]);

  const fetchProfileData = useCallback(async () => {
    if (!userId || !currentUser) return;

    try {
      if (isMountedRef.current) {
        setLoading(true);
        setError(null);
      }

      // Fetch user profile
      const userProfile = await UsersApi.getUser(userId);

      // Fetch follow counts
      const followCounts = await FollowsApi.getFollowCounts(userId);

      // Check follow status
      const followStatus = await FollowsApi.getFollowStatus(userId);

      // Fetch badges
      const userBadges = await ChallengesApi.getUserBadges(userId);

      // Fetch user routes (for stats) - only if public or following
      let routes: any[] = [];
      if (userProfile.activities_visibility === 'public' || followStatus.isFollowing) {
        routes = await RoutesApi.getUserRoutes(userId, true);
      }

      if (isMountedRef.current) {
        setProfile(userProfile);
        setFollowerCount(followCounts.followers);
        setFollowingCount(followCounts.following);
        setIsFollowing(followStatus.isFollowing);
        setBadges(userBadges);
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
  }, [userId, currentUser]);

  useEffect(() => {
    isMountedRef.current = true;

    if (!currentUser || !userId) return;

    fetchProfileData();

    return () => {
      isMountedRef.current = false;
    };
  }, [currentUser, userId, fetchProfileData]);

  const handleToggleFollow = async () => {
    if (!userId) return;

    try {
      setActionLoading(true);
      const response = await FollowsApi.toggleFollow(userId);

      setIsFollowing(response.isFollowing);

      // Update follower count
      if (response.isFollowing) {
        setFollowerCount(prev => prev + 1);
      } else {
        setFollowerCount(prev => Math.max(0, prev - 1));
      }

      // Refetch routes if follow status changed (privacy might affect access)
      await fetchProfileData();
    } catch (error: any) {
      console.error('Failed to toggle follow:', error);
      setError('Failed to update follow status');
    } finally {
      setActionLoading(false);
    }
  };

  const handleBadgeClick = () => {
    setIsBadgeModalOpen(true);
  };

  const handleViewActivities = () => {
    history.push('/activities', { userId, userName: profile?.name });
  };

  const handleViewPosts = () => {
    history.push('/posts', { userId, userName: profile?.name });
  };

  const handleViewChallenges = () => {
    history.push('/my-challenges', { userId, userName: profile?.name });
  };

  const currentStats = statsData[timePeriod];
  const isPrivate = profile?.activities_visibility === 'private';
  const canViewActivities = !isPrivate || isFollowing;

  // Group badges by tier - ensure badges is an array
  const badgesByTier = {
    Gold: Array.isArray(badges) ? badges.filter(b => b.badge_tier === 'Gold') : [],
    Silver: Array.isArray(badges) ? badges.filter(b => b.badge_tier === 'Silver') : [],
    Bronze: Array.isArray(badges) ? badges.filter(b => b.badge_tier === 'Bronze') : [],
  };

  if (loading) {
    return (
      <IonPage>
        <IonHeader className="dark-header">
          <IonToolbar>
            <IonButtons slot="start">
              <IonBackButton defaultHref="/search-runners" text="" />
            </IonButtons>
            <IonTitle>Profile</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent className="profile-content ion-text-center ion-padding">
          <IonSpinner name="crescent" style={{ color: '#92C628', marginTop: '50px' }} />
          <p style={{ color: '#999', marginTop: '10px' }}>Loading profile...</p>
        </IonContent>
      </IonPage>
    );
  }

  if (!profile) {
    return (
      <IonPage>
        <IonHeader className="dark-header">
          <IonToolbar>
            <IonButtons slot="start">
              <IonBackButton defaultHref="/search-runners" text="" />
            </IonButtons>
            <IonTitle>Profile</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-text-center ion-padding">
          <p>User not found</p>
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
            <IonBackButton defaultHref="/search-runners" text="" />
          </IonButtons>
          <IonTitle>{profile.name}</IonTitle>
        </IonToolbar>
      </IonHeader>

      {/* Scrollable Content */}
      <IonContent className="profile-content">
        {/* Profile Section */}
        <IonItem lines="none">
          <IonAvatar slot="start">
            <img
              src={getAvatarUrl(profile.profile_picture)}
              alt={profile.name}
              onError={(e) => {
                console.warn('[OtherUserProfile] Avatar failed to load');
                const target = e.target as HTMLImageElement;
                target.src = 'https://ionicframework.com/docs/img/demos/avatar.svg';
              }}
            />
          </IonAvatar>
          <IonLabel>
            <h2 style={{ color: '#ffffff', fontWeight: '600', fontSize: '18px' }}>{profile.name}</h2>
            <p style={{ color: '#a0a0a0', fontSize: '14px', marginTop: '4px' }}>@{profile.username}</p>
            {profile.description && (
              <p style={{ marginTop: '8px', color: '#d0d0d0', fontSize: '14px' }}>{profile.description}</p>
            )}
          </IonLabel>
          <IonButton
            fill={isFollowing ? "outline" : "solid"}
            slot="end"
            onClick={handleToggleFollow}
            disabled={actionLoading}
            style={{
              '--background': isFollowing ? 'transparent' : 'linear-gradient(135deg, #92C628 0%, #7ab020 100%)',
              '--border-color': isFollowing ? '#ef4444' : '#92C628',
              '--color': isFollowing ? '#ef4444' : '#ffffff',
            }}
          >
            {actionLoading ? (
              <IonSpinner name="crescent" />
            ) : (
              <>
                <IonIcon
                  icon={isFollowing ? personRemoveOutline : personAddOutline}
                  slot="start"
                />
                {isFollowing ? 'Unfollow' : 'Follow'}
              </>
            )}
          </IonButton>
        </IonItem>

        {/* Stats */}
        <IonGrid>
          <IonRow>
            <IonCol>
              <h2>{followingCount}</h2>
              <p>Following</p>
            </IonCol>
            <IonCol>
              <h2>{followerCount}</h2>
              <p>Followers</p>
            </IonCol>
            <IonCol onClick={handleBadgeClick} style={{ cursor: 'pointer' }}>
              <h2>{Array.isArray(badges) ? badges.length : 0}</h2>
              <p>Badges</p>
            </IonCol>
          </IonRow>
        </IonGrid>

        {/* Performance Stats - Only if account is public or following */}
        {canViewActivities ? (
          <IonCard className="performance-stats-card">
            <IonCardHeader>
              <IonCardTitle>Performance Stats</IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
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
        ) : (
          <IonCard className="performance-stats-card">
            <IonCardContent style={{ textAlign: 'center', padding: '40px 20px' }}>
              <IonIcon
                icon={lockClosedOutline}
                style={{ fontSize: '48px', color: '#666', marginBottom: '16px' }}
              />
              <h3 style={{ color: '#aaa', fontSize: '16px', marginBottom: '8px' }}>
                This Account is Private
              </h3>
              <p style={{ color: '#666', fontSize: '14px', margin: 0 }}>
                Follow this account to see their activity stats
              </p>
            </IonCardContent>
          </IonCard>
        )}

        {/* Menu Sections */}
        <div className="menu-section">
          {canViewActivities && (
            <IonItem className="dark-content" onClick={handleViewActivities} button lines="none">
              <IonIcon icon={chevronForwardOutline} slot="end" />
              <IonLabel>
                <h2>Activities</h2>
                <p>View all running sessions</p>
              </IonLabel>
            </IonItem>
          )}
          <IonItem className="dark-content" onClick={handleViewPosts} button lines="none">
            <IonIcon icon={chevronForwardOutline} slot="end" />
            <IonLabel>
              <h2>View Posts</h2>
              <p>View public posts</p>
            </IonLabel>
          </IonItem>
          <IonItem className="dark-content" onClick={handleViewChallenges} button lines="none">
            <IonIcon icon={chevronForwardOutline} slot="end" />
            <IonLabel>
              <h2>View Challenges</h2>
              <p>See active and completed challenges</p>
            </IonLabel>
          </IonItem>
        </div>

      </IonContent>

      {/* Badges Modal */}
      <IonModal
        isOpen={isBadgeModalOpen}
        onDidDismiss={() => {
          setIsBadgeModalOpen(false);
          setSelectedBadge(null);
        }}
      >
        <IonHeader>
          <IonToolbar>
            <IonTitle>Badges</IonTitle>
            <IonButtons slot="end">
              <IonButton onClick={() => setIsBadgeModalOpen(false)}>
                <IonIcon icon={close} />
              </IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>

        <IonContent className="badges-content">
          {badges.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px' }}>
              <p style={{ color: 'var(--ion-color-medium)' }}>
                No badges earned yet.
              </p>
            </div>
          ) : (
            <>
              {/* Gold Badges */}
              {badgesByTier.Gold.length > 0 && (
                <div style={{ marginBottom: '24px' }}>
                  <h2 style={{ padding: '0 16px', fontSize: '20px', fontWeight: 'bold', color: '#FFD700' }}>
                    Gold Badges ({badgesByTier.Gold.length})
                  </h2>
                  <div className="badges-grid">
                    {badgesByTier.Gold.map((badge) => (
                      <IonCard
                        key={badge.badge_id}
                        className="badge-card"
                        onClick={() => setSelectedBadge(badge)}
                        style={{ cursor: 'pointer', position: 'relative' }}
                      >
                        <IonCardContent className="badge-card-content">
                          {(badge as any).count && (badge as any).count > 1 && (
                            <div style={{
                              position: 'absolute',
                              top: '8px',
                              right: '8px',
                              backgroundColor: 'rgba(0, 0, 0, 0.7)',
                              color: 'white',
                              borderRadius: '12px',
                              padding: '4px 10px',
                              fontSize: '12px',
                              fontWeight: 'bold',
                              zIndex: 10
                            }}>
                              ×{(badge as any).count}
                            </div>
                          )}
                          <div className="badge-circle" style={{ backgroundColor: getBadgeColor('Gold') }}>
                            <IonImg
                              src={badge.badge_image_url || getDefaultBadgeImage('Gold')}
                              alt={badge.badge_name}
                              className="badge-icon"
                            />
                          </div>
                          <h3 className="badge-title">{badge.badge_name}</h3>
                          <p style={{ fontSize: '12px', color: 'var(--ion-color-medium)', marginTop: '4px' }}>
                            {badge.badge_description}
                          </p>
                          {badge.count && badge.count > 1 && (
                            <p style={{ fontSize: '11px', color: 'var(--ion-color-primary)', marginTop: '6px', fontWeight: '600' }}>
                              Earned {badge.count} times
                            </p>
                          )}
                        </IonCardContent>
                      </IonCard>
                    ))}
                  </div>
                </div>
              )}

              {/* Silver Badges */}
              {badgesByTier.Silver.length > 0 && (
                <div style={{ marginBottom: '24px' }}>
                  <h2 style={{ padding: '0 16px', fontSize: '20px', fontWeight: 'bold', color: '#C0C0C0' }}>
                    Silver Badges ({badgesByTier.Silver.length})
                  </h2>
                  <div className="badges-grid">
                    {badgesByTier.Silver.map((badge) => (
                      <IonCard
                        key={badge.badge_id}
                        className="badge-card"
                        onClick={() => setSelectedBadge(badge)}
                        style={{ cursor: 'pointer', position: 'relative' }}
                      >
                        <IonCardContent className="badge-card-content">
                          {(badge as any).count && (badge as any).count > 1 && (
                            <div style={{
                              position: 'absolute',
                              top: '8px',
                              right: '8px',
                              backgroundColor: 'rgba(0, 0, 0, 0.7)',
                              color: 'white',
                              borderRadius: '12px',
                              padding: '4px 10px',
                              fontSize: '12px',
                              fontWeight: 'bold',
                              zIndex: 10
                            }}>
                              ×{(badge as any).count}
                            </div>
                          )}
                          <div className="badge-circle" style={{ backgroundColor: getBadgeColor('Silver') }}>
                            <IonImg
                              src={badge.badge_image_url || getDefaultBadgeImage('Silver')}
                              alt={badge.badge_name}
                              className="badge-icon"
                            />
                          </div>
                          <h3 className="badge-title">{badge.badge_name}</h3>
                          <p style={{ fontSize: '12px', color: 'var(--ion-color-medium)', marginTop: '4px' }}>
                            {badge.badge_description}
                          </p>
                          {badge.count && badge.count > 1 && (
                            <p style={{ fontSize: '11px', color: 'var(--ion-color-primary)', marginTop: '6px', fontWeight: '600' }}>
                              Earned {badge.count} times
                            </p>
                          )}
                        </IonCardContent>
                      </IonCard>
                    ))}
                  </div>
                </div>
              )}

              {/* Bronze Badges */}
              {badgesByTier.Bronze.length > 0 && (
                <div style={{ marginBottom: '24px' }}>
                  <h2 style={{ padding: '0 16px', fontSize: '20px', fontWeight: 'bold', color: '#CD7F32' }}>
                    Bronze Badges ({badgesByTier.Bronze.length})
                  </h2>
                  <div className="badges-grid">
                    {badgesByTier.Bronze.map((badge) => (
                      <IonCard
                        key={badge.badge_id}
                        className="badge-card"
                        onClick={() => setSelectedBadge(badge)}
                        style={{ cursor: 'pointer', position: 'relative' }}
                      >
                        <IonCardContent className="badge-card-content">
                          {(badge as any).count && (badge as any).count > 1 && (
                            <div style={{
                              position: 'absolute',
                              top: '8px',
                              right: '8px',
                              backgroundColor: 'rgba(0, 0, 0, 0.7)',
                              color: 'white',
                              borderRadius: '12px',
                              padding: '4px 10px',
                              fontSize: '12px',
                              fontWeight: 'bold',
                              zIndex: 10
                            }}>
                              ×{(badge as any).count}
                            </div>
                          )}
                          <div className="badge-circle" style={{ backgroundColor: getBadgeColor('Bronze') }}>
                            <IonImg
                              src={badge.badge_image_url || getDefaultBadgeImage('Bronze')}
                              alt={badge.badge_name}
                              className="badge-icon"
                            />
                          </div>
                          <h3 className="badge-title">{badge.badge_name}</h3>
                          <p style={{ fontSize: '12px', color: 'var(--ion-color-medium)', marginTop: '4px' }}>
                            {badge.badge_description}
                          </p>
                          {badge.count && badge.count > 1 && (
                            <p style={{ fontSize: '11px', color: 'var(--ion-color-primary)', marginTop: '6px', fontWeight: '600' }}>
                              Earned {badge.count} times
                            </p>
                          )}
                        </IonCardContent>
                      </IonCard>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Badge Detail Modal (nested) */}
          {selectedBadge && (
            <IonModal
              isOpen={!!selectedBadge}
              onDidDismiss={() => setSelectedBadge(null)}
            >
              <IonHeader>
                <IonToolbar>
                  <IonTitle>Badge History</IonTitle>
                  <IonButtons slot="end">
                    <IonButton onClick={() => setSelectedBadge(null)}>
                      <IonIcon icon={close} />
                    </IonButton>
                  </IonButtons>
                </IonToolbar>
              </IonHeader>

              <IonContent>
                <div style={{ padding: '20px' }}>
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
                      src={selectedBadge.badge_image_url || getDefaultBadgeImage(selectedBadge.badge_tier)}
                      alt={selectedBadge.badge_name}
                      style={{ width: '120px', height: '120px', marginBottom: '15px' }}
                    />
                    <h2 style={{ margin: '0 0 8px 0', fontSize: '22px', fontWeight: 'bold', textAlign: 'center' }}>
                      {selectedBadge.badge_name}
                    </h2>
                    <p style={{ margin: '0', color: '#666', textAlign: 'center', fontSize: '14px' }}>
                      {selectedBadge.badge_description}
                    </p>
                    <p style={{ marginTop: '10px', fontSize: '13px', color: '#999' }}>
                      Earned {selectedBadge.count || 1} {selectedBadge.count === 1 ? 'time' : 'times'}
                    </p>
                  </div>

                  {/* Challenge History */}
                  <div>
                    <h3 style={{ marginBottom: '15px', fontSize: '18px', fontWeight: 'bold' }}>
                      Challenges Completed
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {selectedBadge.challenges?.map((challenge: any, index: number) => (
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
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: '600', fontSize: '15px', marginBottom: '4px' }}>
                              {challenge.challenge_name}
                            </div>
                            <div style={{ fontSize: '13px', color: '#666' }}>
                              Completed: {new Date(challenge.completed_date).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </IonContent>
            </IonModal>
          )}
        </IonContent>
      </IonModal>

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
