import React, { useState } from "react";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonButton,
  IonInput,
  IonItem,
  IonLabel,
  IonTextarea,
  IonSegment,
  IonSegmentButton,
  IonIcon,
  IonImg,
  IonTabButton,
  IonAvatar,
  IonTabBar
} from "@ionic/react";
import {
  chatboxEllipses,
  peopleCircle,
  barChart,
  barChartOutline,
  chatbubbleEllipsesOutline,
  peopleOutline,
} from "ionicons/icons";
import ChallengePic from "../components/assets/istockphoto-143920084-612x612.jpg";
import ProfilePic from '../components/assets/close-up-portrait-serious-man-with-curly-hair.jpg';
import "../theme/variables.css";
import '../theme/feed.css';

const Community: React.FC = () => {
  const [tab, setTab] = useState<"challenges" | "feed" | "groups">("challenges");

  return (
    <IonPage>
      {/* Header + sticky segment */}
      <IonHeader>
        <IonToolbar>
          <IonTitle>👥 Community</IonTitle>
        </IonToolbar>

        {/* Keep the segment in the header so it never disappears */}
        <IonToolbar>
          <IonSegment
            value={tab}
            onIonChange={(e) =>
              setTab((e.detail.value ?? "challenges") as
                | "challenges"
                | "feed"
                | "groups")
            }
          >
            <IonSegmentButton value="challenges">
              <IonIcon icon={barChart} />
              <IonLabel>Challenges</IonLabel>
            </IonSegmentButton>

            <IonSegmentButton value="feed">
              <IonIcon icon={chatboxEllipses} />
              <IonLabel>Feed</IonLabel>
            </IonSegmentButton>

            <IonSegmentButton value="groups">
              <IonIcon icon={peopleCircle} />
              <IonLabel>Group</IonLabel>
            </IonSegmentButton>
          </IonSegment>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        {/* CHALLENGES tab */}
        {tab === "challenges" && (
          <>
            <IonItem>
              <IonLabel position="stacked">Search challenges</IonLabel>
              <IonInput placeholder="Search challenges..." />
            </IonItem>

            <IonCard>
              <IonImg src={ChallengePic} alt="Running Challenge" />
              <IonCardHeader>
                <IonCardTitle>Running Challenge</IonCardTitle>
              </IonCardHeader>
              <IonCardContent>
                <p>Run 100 km in 30 days</p>
                <p>👥 1,341 Participants</p>

                <div className="progress-bar" style={{ margin: "12px 0" }}>
                  <div
                    className="progress"
                    style={{
                      width: "65%",
                      height: 8,
                      borderRadius: 8,
                      background: "#4caf50",
                    }}
                  />
                </div>

                <p>Current Progress: 65km</p>

                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>April 1, 2025 to April 30, 2025</span>
                  <span>Public</span>
                </div>
              </IonCardContent>
            </IonCard>

            <h2>Suggested Challenges</h2>

            <IonCard>
              <IonImg src={ChallengePic} alt="Challenge" />
              <IonCardHeader>
                <IonCardTitle>April Elevation Challenge</IonCardTitle>
              </IonCardHeader>
              <IonCardContent>
                <p>Climb a total of 2,000 m in a month.</p>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span>Apr 1, 2025 - Apr 30, 2025</span>
                  <IonButton size="small" color="success">Join</IonButton>
                </div>
              </IonCardContent>
            </IonCard>
          </>
        )}

        {/* FEED tab */}
        {tab === "feed" && (
          <>
            <div style={{ display: "flex", gap: 12, margin: "10px 0", alignItems: "center" }}>
              
            </div>

            <section className="groups-section">

            {/* Post Creation Input */}
            <IonCard className="post-input-card">
              <IonItem lines="none">
                <IonAvatar slot="start">
                  <IonImg src="/photo/profile.jpg" />
                </IonAvatar>
                <input type="text" placeholder="What's on your mind?" className="post-input" />
              </IonItem>
            </IonCard>
    
            {/* Feed Posts */}
            <div className="feed-posts">
              {/* Post 1 */}
              <IonCard className="post-card">
                <IonCardHeader>
                  <div className="post-header">
                    <IonAvatar>
                      <IonImg src={ProfilePic} />
                    </IonAvatar>
                    <div className="user-info">
                      <span className="username">Adams Smith</span>
                      <span className="timestamp">3 hrs ago</span>
                    </div>
                  </div>
                </IonCardHeader>
                <IonCardContent>
                  <p className="post-text">Just completed my first 10K! 🏃 Feeling amazing!</p>
                  <IonImg src={ChallengePic} className="post-image" />
                  <div className="post-actions">
                    <div className="action-item">❤️ 324</div>
                    <div className="action-item">💬 43</div>
                  </div>
                </IonCardContent>
              </IonCard>
    
              {/* Post 2 */}
              <IonCard className="post-card">
                <IonCardHeader>
                  <div className="post-header">
                    <IonAvatar>
                      <IonImg src={ProfilePic} />
                    </IonAvatar>
                    <div className="user-info">
                      <span className="username">Adams Smith</span>
                      <span className="timestamp">3 hrs ago</span>
                    </div>
                  </div>
                </IonCardHeader>
                <IonCardContent>
                  <p className="post-text">Great run with the team today! Marathon training is on track! 🏃‍♀️🏃‍♂️</p>
                  <IonImg src={ChallengePic} className="post-image" />
                  <div className="post-actions">
                    <div className="action-item">❤️ 41</div>
                    <div className="action-item">💬 512</div>
                  </div>
                </IonCardContent>
              </IonCard>
    
              {/* Post 3 */}
              <IonCard className="post-card">
                <IonCardHeader>
                  <div className="post-header">
                    <IonAvatar>
                      <IonImg src={ProfilePic} />
                    </IonAvatar>
                    <div className="user-info">
                      <span className="username">Adams Smith</span>
                      <span className="timestamp">5 hrs ago</span>
                    </div>
                  </div>
                </IonCardHeader>
                <IonCardContent>
                  <p className="post-text">Morning jog in the park. So refreshing! 🌳</p>
                  <IonImg src={ChallengePic} className="post-image" />
                  <div className="post-actions">
                    <div className="action-item">❤️ 150</div>
                    <div className="action-item">💬 20</div>
                  </div>
                </IonCardContent>
              </IonCard>
              </div>
            </section>
          </>
        )}
        

        {/* GROUPS tab */}
        {tab === "groups" && (
           <>
            <div style={{ display: "flex", gap: 12, margin: "10px 0", alignItems: "center" }}>
              <IonButton color="success">Find Groups</IonButton>
              <IonInput placeholder="Search groups..." className="group-search-input" />
            </div>

            <section className="groups-section">
              <h2 className="section-title">Suggested Groups</h2>

              <div className="group-list" style={{ display: "grid", gap: 12 }}>
                <IonCard className="group-card">
                  <IonImg src={ChallengePic} alt="Trail Runners Group" />
                  <IonCardContent className="group-overlay" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span className="group-name">Trail Runners</span>
                    <IonButton size="small" color="success">Join</IonButton>
                  </IonCardContent>
                </IonCard>

                <IonCard className="group-card">
                  <IonImg src={ChallengePic} alt="Sprint Team Group" />
                  <IonCardContent className="group-overlay" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span className="group-name">Sprint Team</span>
                    <IonButton size="small" color="success">Join</IonButton>
                  </IonCardContent>
                </IonCard>

                <IonCard className="group-card">
                  <IonImg src={ChallengePic} alt="Yoga Enthusiasts Group" />
                  <IonCardContent className="group-overlay" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span className="group-name">Yoga Enthusiasts</span>
                    <IonButton size="small" color="success">Join</IonButton>
                  </IonCardContent>
                </IonCard>
              </div>
            </section>
          </>
        )}
      </IonContent>
    </IonPage>
  );
};

export default Community;
