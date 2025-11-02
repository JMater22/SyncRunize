import { useState } from "react";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonButtons,
  IonBackButton,
  IonTitle,
  IonContent,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonGrid,
  IonRow, 
  IonCol,
  IonImg,
  IonToast
} from "@ionic/react";
import '../theme/Analytics.css';
import GoldBadge from "../components/assets/badges/Gold Animated-modified.png";
import SilverBadge from "../components/assets/badges/Silver Animated-modified.png";
import BronzeBadge from "../components/assets/badges/Bronze Animated-modified.png";
import { usePushNotifications } from "../components/push-notification";

export default function Analytics() {
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastColor, setToastColor] = useState<"primary" | "success" | "warning">("primary");

  // Initialize push notifications
  usePushNotifications({
    onNotificationReceived: (notification) => {
      // Handle notification received while app is in foreground
      console.log('Notification received on Analytics:', notification);
      
      // Customize toast based on notification type
      const notifType = notification.data?.type;
      
      if (notifType === 'achievement') {
        setToastMessage(`🏆 ${notification.title || 'New Achievement Unlocked!'}`);
        setToastColor("success");
      } else if (notifType === 'challenge') {
        setToastMessage(`🎯 ${notification.title || 'Challenge Update'}`);
        setToastColor("warning");
      } else if (notifType === 'milestone') {
        setToastMessage(`🎉 ${notification.title || 'New Milestone Reached!'}`);
        setToastColor("success");
      } else {
        setToastMessage(notification.title || 'New notification');
        setToastColor("primary");
      }
      
      setShowToast(true);
    },
    onNotificationActionPerformed: (notification) => {
      // Handle notification tap
      console.log('Notification tapped on Analytics:', notification);
      
      const data = notification.notification.data;
      
      // Navigate based on notification type
      if (data?.type === 'achievement') {
        // Scroll to achievements section or show achievement details
        console.log('Navigate to achievement:', data?.achievementId);
        const achievementsSection = document.querySelector('.achievements');
        achievementsSection?.scrollIntoView({ behavior: 'smooth' });
      } else if (data?.type === 'challenge') {
        // Scroll to challenges section
        console.log('Navigate to challenge:', data?.challengeId);
        const challengesSection = document.querySelector('.challenges');
        challengesSection?.scrollIntoView({ behavior: 'smooth' });
      } else if (data?.type === 'goal') {
        // Scroll to weekly activity section
        const weeklySection = document.querySelector('.weekly-activity');
        weeklySection?.scrollIntoView({ behavior: 'smooth' });
      }
    }
  });

  return (
    <IonPage className="analytics-page">
      <IonHeader className="analytics-header">
        <IonToolbar>
          <IonButtons slot="start">
          </IonButtons>
          <IonTitle>Analytics</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen className="analytics-content">
        {/* Activity Summary */}
        <section className="activity-summary">
          <h2>Activity Summary</h2>
          <IonGrid className="summary-grid">
            <IonRow>
              <IonCol>
                <div className="summary-card">
                  <div className="summary-period">This Week</div>
                  <div className="summary-value">32.3 km</div>
                  <div className="summary-change positive">+12%</div>
                </div>
              </IonCol>
              <IonCol>
                <div className="summary-card">
                  <div className="summary-period">This Month</div>
                  <div className="summary-value">152 km</div>
                  <div className="summary-change positive">+8%</div>
                </div>
              </IonCol>
              <IonCol>
                <div className="summary-card">
                  <div className="summary-period">This Year</div>
                  <div className="summary-value">1,824 km</div>
                  <div className="summary-change neutral">On track</div>
                </div>
              </IonCol>
            </IonRow>
          </IonGrid>
        </section>

        {/* Weekly Activity */}
        <section className="weekly-activity">
          <h2>Weekly Activity</h2>
          <IonCard className="activity-card">
            <IonCardContent>
              <div className="activity-metrics">
                <div className="metric">
                  <div className="metric-label">Distance</div>
                  <div className="metric-value green">5.2 km</div>
                </div>
                <div className="metric">
                  <div className="metric-label">Pace</div>
                  <div className="metric-value orange">5:43/km</div>
                </div>
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: "65%" }}></div>
              </div>
              <div className="progress-label">65% of weekly goal</div>
            </IonCardContent>
          </IonCard>
        </section>

        {/* Best Efforts */}
        <section className="best-efforts">
          <h2>Best Efforts</h2>
          <IonCard className="efforts-card">
            <IonCardContent>
              <div className="effort-item">
                <div className="effort-badge">
                  <IonImg src={SilverBadge} alt="Silver Badge" />
                </div>
                <div className="effort-content">
                  <div className="effort-title">Fastest 5K</div>
                  <div className="effort-subtitle">March 12, 2025</div>
                </div>
                <div className="effort-value">23:45</div>
              </div>
              <div className="effort-item">
                <div className="effort-badge">
                  <IonImg src={GoldBadge} alt="Gold Badge" />
                </div>
                <div className="effort-content">
                  <div className="effort-title">Longest Run</div>
                  <div className="effort-subtitle">April 2, 2025</div>
                </div>
                <div className="effort-value">15.3km</div>
              </div>
            </IonCardContent>
          </IonCard>
        </section>

        {/* Achievements */}
        <section className="achievements">
          <h2>Recent Achievements</h2>
          <div className="badges-container">
            <div className="badge-item">
              <IonImg src={BronzeBadge} alt="Bronze Badge" />
            </div>
            <div className="badge-item">
              <IonImg src={GoldBadge} alt="Gold Badge" />
            </div>
            <div className="badge-item">
              <IonImg src={SilverBadge} alt="Silver Badge" />
            </div>
          </div>
        </section>

        {/* Active Challenges */}
        <section className="challenges">
          <h2>Active Challenges</h2>
          <IonCard className="challenge-card">
            <IonCardHeader>
              <IonCardTitle>Summer Running Challenge</IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <div className="challenge-progress-bar">
                <div className="challenge-progress-fill" style={{ width: "65%" }}></div>
              </div>
              <div className="challenge-stats">
                <span className="challenge-current">65 of 100 km</span>
                <span className="challenge-percent">65%</span>
              </div>
            </IonCardContent>
          </IonCard>

          <IonCard className="challenge-card">
            <IonCardHeader>
              <IonCardTitle>Takbo muna!</IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <div className="challenge-progress-bar">
                <div className="challenge-progress-fill low" style={{ width: "20%" }}></div>
              </div>
              <div className="challenge-stats">
                <span className="challenge-current">4 of 20 km</span>
                <span className="challenge-percent">20%</span>
              </div>
            </IonCardContent>
          </IonCard>
        </section>

        {/* Toast for notifications */}
        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={toastMessage}
          duration={4000}
          position="top"
          color={toastColor}
          buttons={[
            {
              text: 'View',
              role: 'info',
              handler: () => {
                console.log('View notification clicked');
              }
            },
            {
              text: 'Dismiss',
              role: 'cancel'
            }
          ]}
        />
      </IonContent>
    </IonPage>
  )
};