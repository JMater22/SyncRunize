import { useEffect, useState } from "react";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonIcon,
  IonContent,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonList,
  IonItem,
  IonLabel,
  IonAvatar,
  IonSelect,
  IonSelectOption,
  IonSearchbar,
  SearchbarCustomEvent,
  IonImg,
  IonSpinner,
  IonToast,
  IonBadge
} from "@ionic/react";
import {
  notifications,
  search,
  trophy,
  calendarOutline,
  analyticsOutline,
  close,
} from "ionicons/icons";

import "../theme/Home.css"; 
import "../theme/global.css";

import ProfilePic from "../components/assets/close-up-portrait-serious-man-with-curly-hair.jpg";
import ChallengePic from "../components/assets/istockphoto-143920084-612x612.jpg";
import { usePushNotifications } from "../components/push-notification";
import { UsersApi } from "../services/users";
import { StatsApi, StatsPeriod } from "../services/stats";

// Import Google Fonts
const fontLink = document.createElement('link');
fontLink.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Poppins:wght@600;700;800&display=swap';
fontLink.rel = 'stylesheet';
if (!document.head.querySelector(`link[href="${fontLink.href}"]`)) {
  document.head.appendChild(fontLink);
}

// =======================
// Interface & Subcomponents
// =======================

interface Stat {
  label: string;
  value: string;
  change: number;
}

const RecordsCard: React.FC = () => {
  const stats: Stat[] = [
    { label: "Distance", value: "45 km", change: 18.4 },
    { label: "Duration", value: "4.2 hrs", change: 12.5 },
    { label: "Avg Pace", value: "5:36", change: -3.2 },
    { label: "Calories", value: "3,240", change: 15.8 },
  ];

  return (
    <IonCard className="records-card">
      <IonCardHeader>
      </IonCardHeader>
      <IonCardContent>
        <div className="stats-container">
          {stats.map((stat, index) => (
            <div key={index} className="stat">
              <div className="stat-label">{stat.label}</div>
              <div className="stat-value">{stat.value}</div>
              <div
                className={`stat-change ${
                  stat.change >= 0 ? "positive" : "negative"
                }`}
              >
                {stat.change >= 0 ? "+" : ""}
                {stat.change}%
              </div>
            </div>
          ))}
        </div>
      </IonCardContent>
    </IonCard>
  );
};

type ChartPeriod = 'per-day' | 'per-week' | 'per-month';
const chartPeriodMap: Record<ChartPeriod, StatsPeriod> = {
  'per-day': 'day',
  'per-week': 'week',
  'per-month': 'month',
};

interface ChartPoint {
  label: string;
  distance: number;
}

interface ChartPeriodState {
  points: ChartPoint[];
  loaded: boolean;
}

const formatChartLabel = (period: ChartPeriod, value: string) => {
  if (period === 'per-month') {
    const [year, month] = value.split('-');
    const date = new Date(Number(year), Number(month) - 1, 1);
    return date.toLocaleString(undefined, { month: 'short' });
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  if (period === 'per-week') {
    return `Week of ${date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`;
  }

  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

interface DistanceChartProps {
  userId: number | null;
  userLoading?: boolean;
  userError?: string | null;
}

const DistanceChart: React.FC<DistanceChartProps> = ({ userId, userLoading = false, userError }) => {
  const [timePeriod, setTimePeriod] = useState<ChartPeriod>('per-month');
  const [chartData, setChartData] = useState<Partial<Record<ChartPeriod, ChartPeriodState>>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const periodState = chartData[timePeriod];
  const data = periodState?.points ?? [];
  const hasLoaded = periodState?.loaded ?? false;
  const hasPoints = data.length > 0;

  useEffect(() => {
    if (!userId || userLoading || hasLoaded) return;

    let isMounted = true;
    setLoading(true);
    setError(null);

    (async () => {
      try {
        const stats = await StatsApi.getAggregatedStats(userId, chartPeriodMap[timePeriod]);
        if (!isMounted) return;

        const normalized: ChartPoint[] = stats.map((stat) => ({
          label: formatChartLabel(timePeriod, stat.period_start),
          distance: Number(stat.total_distance ?? 0),
        }));

        setChartData((prev) => ({
          ...prev,
          [timePeriod]: {
            points: normalized,
            loaded: true,
          },
        }));
      } catch (err: any) {
        if (isMounted) {
          setError(err?.message || 'Failed to load distance stats');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [userId, userLoading, timePeriod, hasLoaded]);

  const padding = 10;
  const chartHeight = 40;
  const chartWidth = 80;
  const safeMax = hasPoints ? Math.max(...data.map((d) => d.distance)) || 1 : 1;

  const linePath = hasPoints
    ? data
        .map((d, i) => {
          const x = padding + (i / Math.max(data.length - 1, 1)) * chartWidth;
          const y = padding + chartHeight - (d.distance / safeMax) * chartHeight;
          return `${i === 0 ? 'M' : 'L'} ${x},${y}`;
        })
        .join(' ')
    : '';

  const areaPath = hasPoints
    ? `${linePath} L ${padding + chartWidth},${padding + chartHeight} L ${padding},${padding + chartHeight} Z`
    : '';

  const dataPoints = hasPoints
    ? data.map((d, i) => {
        const x = padding + (i / Math.max(data.length - 1, 1)) * chartWidth;
        const y = padding + chartHeight - (d.distance / safeMax) * chartHeight;
        return { x, y };
      })
    : [];

  const getSubtitle = () => {
    switch (timePeriod) {
      case 'per-day':
        return 'Distance Covered Per Day';
      case 'per-week':
        return 'Distance Covered Per Week';
      case 'per-month':
        return 'Distance Covered Per Month';
    }
  };

  const handleRetry = () => {
    if (!userId) return;
    setChartData((prev) => {
      const next = { ...prev };
      delete next[timePeriod];
      return next;
    });
    setError(null);
  };

  return (
    <>
      <div className="section-header"></div>
      <IonCard className="chart-card">
        <IonCardContent>
          <div className="distance-header">
            <h3 className="distance-subtitle">{getSubtitle()}</h3>
            <IonSelect
              slot="end"
              value={timePeriod}
              interface="action-sheet"
              onIonChange={(e) => setTimePeriod(e.detail.value)}
              disabled={!userId || userLoading}
              className="period-select"
            >
              <IonSelectOption value="per-day">Per Day</IonSelectOption>
              <IonSelectOption value="per-week">Per Week</IonSelectOption>
              <IonSelectOption value="per-month">Per Month</IonSelectOption>
            </IonSelect>
          </div>

        <div className="line-chart-container">
          {userLoading ? (
            <div className="ion-text-center ion-padding">
              <IonSpinner name="crescent" />
              <p>Loading your stats...</p>
            </div>
          ) : userError ? (
            <div className="ion-text-center ion-padding">
              <p style={{ color: 'var(--ion-color-danger)' }}>{userError}</p>
            </div>
          ) : !userId ? (
            <div className="ion-text-center ion-padding">
              <p style={{ color: 'var(--ion-color-medium)' }}>
                Sign in to view your distance trends.
              </p>
            </div>
          ) : loading && !hasLoaded ? (
            <div className="ion-text-center ion-padding">
              <IonSpinner name="crescent" />
              <p>Loading distance stats...</p>
            </div>
          ) : error && !hasPoints ? (
            <div className="ion-text-center ion-padding">
              <p style={{ color: 'var(--ion-color-danger)' }}>{error}</p>
              <IonButton size="small" onClick={handleRetry}>
                Retry
              </IonButton>
            </div>
          ) : hasPoints ? (
            <svg viewBox="0 0 100 60" className="line-chart-svg">
              {[0, 25, 50, 75, 100].map((y) => (
                <line
                  key={y}
                  x1={padding}
                  y1={padding + (chartHeight * y) / 100}
                  x2={padding + chartWidth}
                  y2={padding + (chartHeight * y) / 100}
                  stroke="rgba(255, 255, 255, 0.05)"
                  strokeWidth="0.2"
                />
              ))}

              <defs>
                <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#92C628" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#92C628" stopOpacity="0" />
                </linearGradient>
              </defs>

              <path d={areaPath} fill="url(#areaGradient)" />
              <path
                d={linePath}
                fill="none"
                stroke="#92C628"
                strokeWidth="0.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {dataPoints.map((point, index) => (
                <circle
                  key={index}
                  cx={point.x}
                  cy={point.y}
                  r="1.5"
                  fill="#fff"
                  stroke="#92C628"
                  strokeWidth="0.3"
                />
              ))}
            </svg>
          ) : (
            <div className="ion-text-center ion-padding">
              <p style={{ color: 'var(--ion-color-medium)' }}>
                No stats yet for this period. Complete a run to see your progress.
              </p>
            </div>
          )}
        </div>

        {hasPoints && (
          <div className="chart-values-scroll">
            {data.map((d, index) => (
              <div key={index} className="value-item">
                <span className="value-month">{d.label}</span>
                <span className="value-distance">{d.distance.toFixed(1)} km</span>
              </div>
            ))}
          </div>
        )}
      </IonCardContent>
    </IonCard>
  </>
  );
};

const UserGreeting: React.FC<{ name?: string | null }> = ({ name }) => {
  if (!name) return null;

  return (
    <div style={{ padding: '12px 16px' }}>
      <IonTitle style={{ fontSize: '16px' }}>Welcome, {name}</IonTitle>
    </div>
  );
};

// =======================
// Main Dashboard Component
// =======================

export default function Dashboard() {
  const [showSearchbar, setShowSearchbar] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [notificationCount, setNotificationCount] = useState(0);
  const [userProfile, setUserProfile] = useState<{ name: string; userId: number } | null>(null);
  const [userProfileError, setUserProfileError] = useState<string | null>(null);
  const [userProfileLoading, setUserProfileLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    (async () => {
      try {
        const me = await UsersApi.me();
        if (!isMounted) return;

        setUserProfile({
          name: me.name || me.username || `User ${me.user_id}`,
          userId: me.user_id,
        });
      } catch (err: any) {
        if (!isMounted) return;
        setUserProfileError(err?.message || 'Failed to load profile');
      } finally {
        if (isMounted) setUserProfileLoading(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  // Initialize push notifications
  usePushNotifications({
    onNotificationReceived: (notification) => {
      // Handle notification received while app is in foreground
      console.log('Notification received on Home:', notification);
      setToastMessage(notification.title || 'New notification');
      setShowToast(true);
      setNotificationCount(prev => prev + 1);
    },
    onNotificationActionPerformed: (notification) => {
      // Handle notification tap
      console.log('Notification tapped on Home:', notification);
      setNotificationCount(prev => prev + 1);
      
      // You can add navigation logic here based on notification type
      // For example, navigate to specific challenge, activity, or leaderboard
      const data = notification.notification.data;
      if (data?.type === 'challenge') {
        // Navigate to challenge page if needed
        console.log('Navigate to challenge:', data?.challengeId);
      } else if (data?.type === 'activity') {
        // Navigate to activity page
        console.log('Navigate to activity:', data?.activityId);
      }
    }
  });

  const toggleSearchbar = () => {
    setShowSearchbar(!showSearchbar);
    if (showSearchbar) setSearchText("");
  };

  const handleNotificationClick = () => {
    // Reset notification count when user opens notifications
    setNotificationCount(0);
  };

  return (
    <IonPage>
      {/* ===== Header ===== */}
      <IonHeader className="dark-header">
        <IonToolbar className="dashboard-toolbar">
          {!showSearchbar ? (
            <>
              <IonTitle slot="start" className="dashboard-title">SyncRunize</IonTitle>
              <IonButtons slot="end">
                <IonButton 
                  routerLink="/notification"
                  onClick={handleNotificationClick}
                  style={{ position: 'relative' }}
                >
                  <IonIcon className="header-icon" icon={notifications} />
                  {notificationCount > 0 && (
                    <IonBadge 
                      color="danger" 
                      style={{
                        position: 'absolute',
                        top: '8px',
                        right: '8px',
                        fontSize: '10px',
                        minWidth: '16px',
                        height: '16px',
                        borderRadius: '8px',
                        padding: '0 4px'
                      }}
                    >
                      {notificationCount > 9 ? '9+' : notificationCount}
                    </IonBadge>
                  )}
                </IonButton>
                <IonButton onClick={toggleSearchbar}>
                  <IonIcon className="header-icon" icon={search} />
                </IonButton>
                <IonButton routerLink="/profile">
                  <IonAvatar className="header-avatar">
                    <img src={ProfilePic} alt="Profile" />
                  </IonAvatar>
                </IonButton>
              </IonButtons>
            </>
          ) : (
            <>
              <IonSearchbar
                value={searchText}
                onIonInput={(e: SearchbarCustomEvent) =>
                  setSearchText(e.detail.value!)
                }
                placeholder="Search athletes"
                animated={true}
                showCancelButton="never"
              />
              <IonButtons slot="end">
                <IonButton onClick={toggleSearchbar}>
                  <IonIcon className="header-icon" icon={close} />
                </IonButton>
              </IonButtons>
            </>
          )}
        </IonToolbar>
      </IonHeader>

      {/* ===== Scrollable Content ===== */}
      <IonContent fullscreen className="dark-content">
        <UserGreeting name={userProfile?.name} />
        {/* Personal Records */}
        <div className="section-header">
          <span>Personal Records</span>
        </div>
        <RecordsCard />

        {/* Distance Chart */}
        <DistanceChart
          userId={userProfile?.userId ?? null}
          userLoading={userProfileLoading}
          userError={userProfileError}
        />

          {/* Recent Activity */}
          <div className="section-header">
            <IonIcon icon={calendarOutline} className="section-icon" />
            <span>Recent Activity</span>
          </div>

          <IonCard className="activity-card">
            <IonCardContent>
              <IonList className="activity-list">
                {[
                  {
                    title: "Morning Run",
                    distance: "14.3km",
                    pace: "5:18/km",
                    time: "1h 6m",
                    calories: "876 kcal"
                  },
                  {
                    title: "Quick Run!",
                    distance: "3.3km",
                    pace: "6:58/km",
                    time: "23m",
                    calories: "245 kcal"
                  },
                ].map((activity, index) => (
                  <IonItem key={index} className="activity-item">
                    <IonAvatar slot="start" className="activity-avatar">
                      <img src={ProfilePic} alt="Profile" />
                    </IonAvatar>
                    <IonLabel>
                      <h2 className="activity-title">{activity.title}</h2>
                      <div className="activity-details">
                        <span className="activity-stat">
                          Distance: <strong>{activity.distance}</strong>
                        </span>
                        <span className="activity-stat">
                          Pace: <strong>{activity.pace}</strong>
                        </span>
                        <span className="activity-stat">
                          Time: <strong>{activity.time}</strong>
                        </span>
                        <span className="activity-stat">
                          Calories: <strong>{activity.calories}</strong>
                        </span>
                      </div>
                    </IonLabel>
                  </IonItem>
                ))}
              </IonList>
            </IonCardContent>
          </IonCard>

        {/* Suggested Challenges */}
        <div className="section-header">
          <IonIcon icon={trophy} className="section-icon" />
          <span>Suggested Challenges</span>
        </div>

        <IonCard className="current-challenge-card">
          <div className="challenge-image-container">
            <IonImg src={ChallengePic} alt="Running Challenge" />
            <div className="challenge-badge">
              <span>Join Challenge</span>
            </div>
          </div>
          <IonCardContent className="challenge-content">
            <h3 className="challenge-title">Couch to 5k</h3>
            <p className="challenge-description">
              Build from walking to running 5K continuously with intervals.
            </p>
            <div className="challenge-details">
              <span>Target Distance: 5km • Duration: 56 days</span>
            </div>
          </IonCardContent>
        </IonCard>

        {/* Leaderboard */}
        <div className="section-header">
          <IonIcon icon={analyticsOutline} className="section-icon" />
          <span>Leaderboard</span>
        </div>

        <IonCard className="leaderboard-card">
          <IonCardContent>
            <div className="leaderboard-header">
              <span>Rank</span>
              <span>Distance</span>
            </div>
            <IonList className="leaderboard-list">
              {[
                { rank: 1, name: "John Doe", runs: 4, distance: "543 km" },
                { rank: 2, name: "Jane Smith", runs: 6, distance: "502 km" },
                { rank: 3, name: "Alex Tan", runs: 3, distance: "499 km" },
                { rank: 4, name: "Amelia", runs: 5, distance: "241 km" },
              ].map((leader, index) => (
                <IonItem
                  key={index}
                  routerLink="/profile"
                  className="leaderboard-item"
                >
                  <span className="rank">{leader.rank}</span>
                  <IonAvatar className="leaderboard-avatar">
                    <img src={ProfilePic} alt="Avatar" />
                  </IonAvatar>
                  <IonLabel className="leader-name">
                    <h3>{leader.name}</h3>
                    <p>{leader.runs} Runs this week </p>
                  </IonLabel>
                  <span
                    className={`leader-distance ${
                      index < 4 ? "green-text" : ""
                    }`}
                  >
                    {leader.distance}
                  </span>
                </IonItem>
              ))}
            </IonList>
            <IonButton
              className="view-more"
              routerLink="/leaderboards"
            >
              View Full Leaderboard
            </IonButton>
          </IonCardContent>
        </IonCard>

        {/* Toast for notifications */}
        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={toastMessage}
          duration={3000}
          position="top"
          color="primary"
          buttons={[
            {
              text: 'View',
              role: 'info',
              handler: () => {
                // Navigate to notification page
                window.location.href = '/notification';
              }
            }
          ]}
        />
      </IonContent>
    </IonPage>
  );
}

