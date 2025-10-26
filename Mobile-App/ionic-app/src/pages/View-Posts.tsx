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
  IonTabBar,
  IonSearchbar,
  IonModal,
  IonDatetime,
  IonSelect,
  IonSelectOption,
  IonCheckbox,IonBackButton, IonButtons
} from "@ionic/react";
import {
  trophy,
  chatboxEllipses,
  people,
  searchOutline,
  addOutline,
  calendarOutline,
  locationOutline,
} from "ionicons/icons";
import ChallengePic from "../components/assets/istockphoto-143920084-612x612.jpg";
import ProfilePic from '../components/assets/close-up-portrait-serious-man-with-curly-hair.jpg';
import "../theme/Community.css"; // custom styles if needed


export default function CommunityFeed() {
  return (
    <IonPage>
          {/* Top Header */}
          <IonHeader>
            <IonToolbar>
                <IonButtons slot="start">
                            <IonBackButton defaultHref="/HomeModule/homeM1" />
                          </IonButtons>
              <IonTitle>Your Posts</IonTitle>
            </IonToolbar>
          </IonHeader>
    
          {/* Content */}
          <IonContent fullscreen  className="ion-padding">
    
           <div className="feed-tab">
           
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
                  
                </IonCardContent>
              </IonCard>
            </div>
          </div>
          </IonContent>
        </IonPage>
  );
}