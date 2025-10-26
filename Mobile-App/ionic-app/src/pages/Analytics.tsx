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
  IonIcon,
  IonTabBar,
  IonTabButton,
  IonLabel,
} from "@ionic/react";
import { homeOutline, mapOutline, peopleOutline, analyticsOutline } from "ionicons/icons";
import { useHistory } from "react-router-dom";
import '../theme/Analytics.css';


export default function Analytics() {
  const history = useHistory();

  return (
    <IonPage className="analytics-page">
      {/* Header */}
      <IonHeader className="analytics-header">
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/HomeModule/homeM1" />
          </IonButtons>
          <IonTitle>Analytics</IonTitle>
        </IonToolbar>
      </IonHeader>

      {/* Scrollable Content */}
      <IonContent fullscreen className="analytics-content">

        {/* Activity Summary */}
        <section >
          <h2>Activity Summary</h2>
          <IonGrid >
            <IonRow>
              <IonCol>
                <IonCard>
                  <IonCardContent>
                    <div className="period">This Week</div>
                    <div className="value">32.3 km</div>
                    <div className="change positive">+12% vs last week</div>
                  </IonCardContent>
                </IonCard>
              </IonCol>
              <IonCol>
                <IonCard>
                  <IonCardContent>
                    <div className="period">This Month</div>
                    <div className="value">152 km</div>
                    <div className="change positive">+8% vs last month</div>
                  </IonCardContent>
                </IonCard>
              </IonCol>
              <IonCol>
                <IonCard>
                  <IonCardContent>
                    <div className="period">This Year</div>
                    <div className="value">32.3 km</div>
                    <div className="change neutral">On track for goal</div>
                  </IonCardContent>
                </IonCard>
              </IonCol>
            </IonRow>
          </IonGrid>
        </section>

        {/* Weekly Activity */}
        <section>
          <h2>Weekly Activity</h2>
          <IonCard>
            <IonCardContent>
              <div className="activity-metrics">
                <div className="metric">
                  <div className="metric-label">Distance</div>
                  <div className="metric-value green">5.2 km</div>
                </div>
                <div className="metric">
                  <div className="metric-label">Pace</div>
                  <div className="metric-value orange">5:43 / km</div>
                </div>
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: "65%" }}></div>
              </div>
            </IonCardContent>
          </IonCard>
        </section>

        {/* Best Efforts */}
        <section>
          <h2>Best Efforts</h2>
          <IonCard >
            <IonCardContent>
              <div className="efforts-list">
                <div className="effort-item">
                  <div className="effort-icon">📈</div>
                  <div className="effort-content">
                    <div className="effort-title">Fastest 5K</div>
                    <div className="effort-subtitle">Achieved on March 12, 2025</div>
                  </div>
                  <div className="effort-value">23:45</div>
                </div>
                <div className="effort-item">
                  <div className="effort-icon">🏃</div>
                  <div className="effort-content">
                    <div className="effort-title">Longest Run</div>
                    <div className="effort-subtitle">Achieved on April 2, 2025</div>
                  </div>
                  <div className="effort-value">15.3km</div>
                </div>
              </div>

              {/* Badge Achievement */}
              <div className="badge-section">
                <h3>Badge Achievement</h3>
                <div className="badges">
                  <div className="badge">☀️ Early Bird</div>
                  <div className="badge">🏃 10K Master</div>
                  <div className="badge">👑 Streak King</div>
                  <div className="badge">💪 Endurance</div>
                </div>
              </div>
            </IonCardContent>
          </IonCard>
        </section>

        {/* Recent Activities */}
        <section>
          <h2>Recent Activities</h2>
          <IonCard>
            <IonCardHeader>
              <IonCardTitle>Evening Run</IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <div className="activity-stats">
                <div>📏 6.8 km</div>
                <div>⏱️ 30:41</div>
              </div>
              <div className="activity-metrics-small">
                <span>❤️ 23</span>
                <span>💬 51</span>
              </div>
            </IonCardContent>
          </IonCard>
        </section>

        {/* Active Challenges */}
        <section>
          <h2>Active Challenges</h2>
          <IonCard>
            <IonCardHeader>
              <IonCardTitle>Summer Running Challenge</IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <div className="progress-bar-challenge">
                <div className="progress-fill-challenge" style={{ width: "65%" }}></div>
              </div>
              <div className="progress-text">
                <span>65 of 100 km</span>
                <span>65%</span>
              </div>
            </IonCardContent>
          </IonCard>

          <IonCard>
            <IonCardHeader>
              <IonCardTitle>Takbo muna!</IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <div className="progress-bar-challenge">
                <div className="progress-fill-challenge" style={{ width: "0.8%" }}></div>
              </div>
              <div className="progress-text">
                <span>4 of 20 km</span>
                <span>0.8%</span>
              </div>
            </IonCardContent>
          </IonCard>
        </section>
      </IonContent>
    </IonPage>
  );
}
