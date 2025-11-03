import { useState } from "react";
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

const DistanceChart: React.FC = () => {
  const [timePeriod, setTimePeriod] = useState<'per-day' | 'per-week' | 'per-month'>('per-month');

  // Data for different time periods
  const chartData = {
    'per-day': [
      { label: "Mon", distance: 5 },
      { label: "Tue", distance: 7 },
      { label: "Wed", distance: 10 },
      { label: "Thu", distance: 8 },
      { label: "Fri", distance: 12 },
      { label: "Sat", distance: 15 },
      { label: "Sun", distance: 6 },
    ],
    'per-week': [
      { label: "Week 1", distance: 45 },
      { label: "Week 2", distance: 52 },
      { label: "Week 3", distance: 48 },
      { label: "Week 4", distance: 55 },
      { label: "Week 5", distance: 50 },
      { label: "Week 6", distance: 60 },
      { label: "Week 7", distance: 58 },
      { label: "Week 8", distance: 62 },
    ],
    'per-month': [
      { label: "Jan", distance: 180 },
      { label: "Feb", distance: 195 },
      { label: "Mar", distance: 210 },
      { label: "Apr", distance: 225 },
      { label: "May", distance: 200 },
      { label: "Jun", distance: 185 },
      { label: "Jul", distance: 190 },
      { label: "Aug", distance: 205 },
      { label: "Sep", distance: 220 },
      { label: "Oct", distance: 215 },
      { label: "Nov", distance: 230 },
      { label: "Dec", distance: 240 },
    ]
  };

  const data = chartData[timePeriod];
  const maxDistance = Math.max(...data.map(d => d.distance));
  const padding = 10;
  const chartHeight = 40;
  const chartWidth = 80;

  // Generate line path
  const linePath = data.map((d, i) => {
    const x = padding + (i / (data.length - 1)) * chartWidth;
    const y = padding + chartHeight - (d.distance / maxDistance) * chartHeight;
    return `${i === 0 ? 'M' : 'L'} ${x},${y}`;
  }).join(' ');

  // Generate area path
  const areaPath = `${linePath} L ${padding + chartWidth},${padding + chartHeight} L ${padding},${padding + chartHeight} Z`;

  // Generate data points
  const dataPoints = data.map((d, i) => {
    const x = padding + (i / (data.length - 1)) * chartWidth;
    const y = padding + chartHeight - (d.distance / maxDistance) * chartHeight;
    return { x, y };
  });

  const getSubtitle = () => {
    switch(timePeriod) {
      case 'per-day': return 'Distance Covered Per Day';
      case 'per-week': return 'Distance Covered Per Week';
      case 'per-month': return 'Distance Covered Per Month';
    }
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
              className="period-select"
            >
              <IonSelectOption value="per-day">Per Day</IonSelectOption>
              <IonSelectOption value="per-week">Per Week</IonSelectOption>
              <IonSelectOption value="per-month">Per Month</IonSelectOption>
            </IonSelect>
          </div>

        <div className="line-chart-container">
          <svg viewBox="0 0 100 60" className="line-chart-svg">
            {/* Grid lines */}
            {[0, 25, 50, 75, 100].map((y) => (
              <line
                key={y}
                x1={padding}
                y1={padding + (chartHeight * y / 100)}
                x2={padding + chartWidth}
                y2={padding + (chartHeight * y / 100)}
                stroke="rgba(255, 255, 255, 0.05)"
                strokeWidth="0.2"
              />
            ))}

            {/* Area gradient fill */}
            <defs>
              <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#92C628" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#92C628" stopOpacity="0" />
              </linearGradient>
            </defs>

            {/* Area path */}
            <path
              d={areaPath}
              fill="url(#areaGradient)"
            />

            {/* Line path */}
            <path
              d={linePath}
              fill="none"
              stroke="#92C628"
              strokeWidth="0.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Data points */}
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
        </div>

        {/* Distance values - Scrollable */}
        <div className="chart-values-scroll">
          {data.map((d, index) => (
            <div key={index} className="value-item">
              <span className="value-month">{d.label}</span>
              <span className="value-distance">{d.distance}km</span>
            </div>
          ))}
        </div>
      </IonCardContent>
    </IonCard>
  </>
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
        {/* Personal Records */}
        <div className="section-header">
          <span>Personal Records</span>
        </div>
        <RecordsCard />

        {/* Distance Chart */}
        <DistanceChart />

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