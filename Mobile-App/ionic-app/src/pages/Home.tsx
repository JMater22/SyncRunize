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
  IonFooter,
  IonTabBar,
  IonTabButton,
  IonImg,
  IonProgressBar, IonSelect, IonSelectOption, 
} from "@ionic/react";
import { notifications, search, trophy, homeOutline, mapOutline, peopleOutline, calendarOutline, analyticsOutline } from "ionicons/icons";
import '../theme/Home.css';
import ProfilePic from '../components/assets/close-up-portrait-serious-man-with-curly-hair.jpg';
import ChallengePic from '../components/assets/istockphoto-143920084-612x612.jpg';
import "../theme/global.css";

export default function Dashboard() {
  return (
    <IonPage >
      {/* Header */}
      <IonHeader className="dark-header">
        <IonToolbar className="dashboard-toolbar">
          <IonTitle className="dashboard-title">SyncRunize</IonTitle>
          <IonButtons slot="end">
            <IonButton routerLink="/notification">
              <IonIcon  className="header-icon"  icon={notifications} />
            </IonButton>
            <IonButton>
              <IonIcon className="header-icon" icon={search} />
            </IonButton>
            <IonButton routerLink="/profile">
              <IonAvatar className="header-avatar">
                <img src={ProfilePic} alt="Profile" />
              </IonAvatar>
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      {/* Scrollable Content */}
      <IonContent fullscreen className="dark-content">
        {/* Personal Records */}
        <div className="section-header">
         
          <span>Personal Records</span>
        </div>
        
        <IonCard className="records-card">
          <IonCardContent>
            <div className="stats-container">
              <div className="stat">
                <div className="stat-value">52</div>
                <div className="stat-label">Total Hours</div>
              </div>
              <div className="stat">
                <div className="stat-value">425</div>
                <div className="stat-label">Total Distance</div>
              </div>
            </div>
          </IonCardContent>
        </IonCard>

        {/* Distance Chart */}
        <div className="section-header">Distance</div>
        
        
        <IonCard className="chart-card">
          <IonCardContent>
          
           <div className="distance-header">
      <h3 className="section-subtitle">Distance covered per month</h3>
      <IonSelect slot="end" value="per-month" interface="action-sheet">
        <IonSelectOption value="per-week">Per Week</IonSelectOption>
        <IonSelectOption value="per-month">Per Month</IonSelectOption>
        <IonSelectOption value="per-year">Per Year</IonSelectOption>
      </IonSelect>
    </div>
          
            <div className="chart-container">
              <div className="chart-row">
                <span className="month-label">Jan</span>
                <div className="bar-container">
                  <IonProgressBar value={0.25} color="success" className="distance-bar"></IonProgressBar>
                </div>
              </div>
              <div className="chart-row">
                <span className="month-label">Feb</span>
                <div className="bar-container">
                  <IonProgressBar value={0.35} color="success" className="distance-bar"></IonProgressBar>
                </div>
              </div>
              <div className="chart-row">
                <span className="month-label">Mar</span>
                <div className="bar-container">
                  <IonProgressBar value={0.5} color="success" className="distance-bar"></IonProgressBar>
                </div>
              </div>
              <div className="chart-row">
                <span className="month-label">April</span>
                <div className="bar-container">
                  <IonProgressBar value={0.75} color="success" className="distance-bar"></IonProgressBar>
                </div>
              </div>
              <div className="chart-row">
                <span className="month-label">May</span>
                <div className="bar-container">
                  <IonProgressBar value={0.6} color="success" className="distance-bar"></IonProgressBar>
                </div>
              </div>
              <div className="chart-row">
                <span className="month-label">June</span>
                <div className="bar-container">
                  <IonProgressBar value={0.4} color="success" className="distance-bar"></IonProgressBar>
                </div>
              </div>
              <div className="chart-row">
                <span className="month-label">July</span>
                <div className="bar-container">
                  <IonProgressBar value={0.3} color="success" className="distance-bar"></IonProgressBar>
                </div>
              </div>
            </div>
            
            <div className="chart-labels">
              <span>0</span>
              <span>5km</span>
              <span>10km</span>
              <span>15km</span>
              <span>20km</span>
            </div>
          </IonCardContent>
        </IonCard>

        {/* Recent Activity */}
        <div className="section-header">
          <IonIcon icon={calendarOutline} className="section-icon" />
          <span>Recent Activity</span>
        </div>
        
        <IonCard className="activity-card">
          <IonCardContent>
            <IonList className="activity-list">
              <IonItem className="activity-item">
                <IonAvatar slot="start" className="activity-avatar">
                  <img src={ProfilePic} alt="Profile" />
                </IonAvatar>
                <IonLabel>
                  <h2 className="activity-title">Morning Run!</h2>
                  <p className="activity-details">
                    <span className="activity-stat">Distance: <strong>14.3km</strong></span>
                    <span className="activity-stat">Pace: <strong>5:18/km</strong></span>
                    <span className="activity-stat">Time: <strong>1h 16m</strong></span>
                  </p>
                </IonLabel>
              </IonItem>
              <IonItem className="activity-item">
                <IonAvatar slot="start" className="activity-avatar">
                  <img src={ProfilePic} alt="Profile" />
                </IonAvatar>
                <IonLabel>
                  <h2 className="activity-title">Quick Run!</h2>
                  <p className="activity-details">
                    <span className="activity-stat">Distance: <strong>3.3km</strong></span>
                    <span className="activity-stat">Pace: <strong>6:58/km</strong></span>
                    <span className="activity-stat">Time: <strong>23m</strong></span>
                  </p>
                </IonLabel>
              </IonItem>
            </IonList>
          </IonCardContent>
        </IonCard>

        {/* Suggested Challenges */}
        <div className="section-header">
          <IonIcon icon={trophy}  className="section-icon"/>
          <span>Suggested Challenges</span>
        </div>
        <div className="section-subtitle">Make accountability more fun!</div>

        <IonCard className="challenge-card">
          <div className="challenge-image-container">
            <img src={ChallengePic} alt="Challenge" className="challenge-image" />
          </div>
          <IonCardHeader>
            <IonCardTitle className="challenge-title">April Elevation Challenge</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <p className="challenge-description">Climb a total of 2,000 m (6,561.7 ft) in a month.</p>
            <div className="challenge-footer">
              <span className="challenge-date">Apr 1, 2025 - Apr 30, 2025</span>
              <IonButton className="join-button" color="success" size="small">
                Join
              </IonButton>
            </div>
          </IonCardContent>
        </IonCard>

        {/* Leaderboard */}
        <div className="section-header" >
          <IonIcon icon={analyticsOutline} className="section-icon" />
          <span>Leaderboard</span>
        </div>
        
        <IonCard  className="leaderboard-card">
          <IonCardContent >
            <div className="leaderboard-header">
              <span>Group Name</span>
              <span>Distance</span>
            </div>
            <IonList className="leaderboard-list">
              <IonItem routerLink="/profile" className="leaderboard-item">
                <span className="rank">1</span>
                <IonAvatar className="leaderboard-avatar">
                  <img src={ProfilePic} alt="Avatar" />
                </IonAvatar>
                <IonLabel className="leader-name">
                  <h3>John Doe</h3>
                  <p>4 Runs this week</p>
                </IonLabel>
                <span className="leader-distance green-text">543 km</span>
              </IonItem>
              <IonItem routerLink="/profile" className="leaderboard-item">
                <span className="rank">2</span>
                <IonAvatar className="leaderboard-avatar">
                  <img src={ProfilePic} alt="Avatar" />
                </IonAvatar>
                <IonLabel className="leader-name">
                  <h3>Jane Smith</h3>
                  <p>6 Runs this week</p>
                </IonLabel>
                <span className="leader-distance">502 km</span>
              </IonItem>
              <IonItem routerLink="/profile" className="leaderboard-item">
                <span className="rank">3</span>
                <IonAvatar className="leaderboard-avatar">
                  <img src={ProfilePic} alt="Avatar" />
                </IonAvatar>
                <IonLabel className="leader-name">
                  <h3>Alex Tan</h3>
                  <p>3 Runs this week</p>
                </IonLabel>
                <span className="leader-distance green-text">499 km</span>
              </IonItem>
              <IonItem routerLink="/profile" className="leaderboard-item">
                <span className="rank">4</span>
                <IonAvatar className="leaderboard-avatar">
                  <img src={ProfilePic} alt="Avatar" />
                </IonAvatar>
                <IonLabel className="leader-name">
                  <h3>Amelia</h3>
                  <p>5 Runs this week</p>
                </IonLabel>
                <span className="leader-distance">241 km</span>
              </IonItem>
            </IonList>
          <IonButton color="success" className="view-more" routerLink="/leaderboards"><div > View Full Leaderboard</div></IonButton>
          </IonCardContent>
        </IonCard>
      </IonContent>
    </IonPage>
  );
}