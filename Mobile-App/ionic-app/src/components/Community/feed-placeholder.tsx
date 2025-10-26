import React from "react";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonBackButton,
  IonTabBar,
  IonTabButton,
  IonLabel,
  IonIcon,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonAvatar,
  IonImg,
  IonItem,
} from "@ionic/react";
import { chatbubbleEllipsesOutline, peopleOutline, barChartOutline } from "ionicons/icons";
import '../theme/feed.css';
import ProfilePic from '../components/assets/close-up-portrait-serious-man-with-curly-hair.jpg';
import ChallengePic from '../components/assets/istockphoto-143920084-612x612.jpg';


export default function Settings() {
  return (
    <IonPage>
          {/* Top Header */}
          <IonHeader>
            <IonToolbar>
              <IonTitle>👥 Community</IonTitle>
            </IonToolbar>
          </IonHeader>
    
          {/* Content */}
          <IonContent fullscreen className="ion-padding">
    
            {/* Navigation Tabs */}
            <IonTabBar>
              <IonTabButton tab="challenges" href="/Community/comm1">
                <IonIcon color="success" icon={barChartOutline} />
                <IonLabel>Challenges</IonLabel>
              </IonTabButton>
              <IonTabButton tab="feed" href="/Community/comm2">
                <IonIcon color="success" icon={chatbubbleEllipsesOutline} />
                <IonLabel>Feed</IonLabel>
              </IonTabButton>
              <IonTabButton  tab="group" href="/Community/comm4">
                <IonIcon color="success" icon={peopleOutline} />
                <IonLabel>Group</IonLabel>
              </IonTabButton>
            </IonTabBar>
    
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
          </IonContent>
        </IonPage>
  );
}