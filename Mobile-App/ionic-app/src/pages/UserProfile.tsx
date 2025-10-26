import React from "react";
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
  IonList,
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
} from "@ionic/react";
import { settingsOutline, chevronForwardOutline, location } from "ionicons/icons";
import "../theme/User-Profile.css";
import ProfilePic from "../components/assets/close-up-portrait-serious-man-with-curly-hair.jpg";
import ChallengePic from "../components/assets/istockphoto-143920084-612x612.jpg";

export default function Profile() {
  return (
    <IonPage>
      {/* Header */}
      <IonHeader className="dark-header">
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/HomeModule/homeM1/index.html" />
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
            <img src={ProfilePic} alt="Alexander Smith" />
          </IonAvatar>
          <IonLabel>
            <h2>Alexander Smith</h2>
            <p>@alexsmith</p>
           <p>  <IonIcon icon={location}  />Dolores Capas, Tarlac</p>
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
                <h2>4</h2>
                <p>Following</p>
              </IonRouterLink>
            </IonCol>
            <IonCol>
              <IonRouterLink routerLink="/followers">
                <h2>2</h2>
                <p>Followers</p>
              </IonRouterLink>
            </IonCol>
            <IonCol>
              <IonRouterLink routerLink="/badges">
              <h2>24</h2>
              <p>Badges</p>
              </IonRouterLink>
            </IonCol>
          </IonRow>
        </IonGrid>

        {/* Distance Chart */}
        <IonCard>
          <IonCardHeader>
            <IonCardTitle>Distance</IonCardTitle>
            <p>Distance covered per day</p>
          </IonCardHeader>
          <IonCardContent>
            <IonSelect value="day" interface="popover">
              <IonSelectOption value="day">Per Day</IonSelectOption>
              <IonSelectOption value="week">Per Week</IonSelectOption>
              <IonSelectOption value="month">Per Month</IonSelectOption>
            </IonSelect>

            <div className="chart">
              {[
                ["Mon", "85%"],
                ["Tues", "35%"],
                ["Wed", "45%"],
                ["Thurs", "90%"],
                ["Fri", "70%"],
                ["Sat", "80%"],
                ["Sun", "50%"],
              ].map(([day, width]) => (
                <div className="chart-row" key={day}>
                  <span>{day}</span>
                  <div className="bar" style={{ width }}></div>
                </div>
              ))}
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

        {/* New Sections */}
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
              <h2>View Post</h2>
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

        {/* Challenges */}
        <IonCard >
          <IonCardTitle className="challenges-title">Challenges</IonCardTitle>
          <img src={ChallengePic} alt="Challenge" />
          <IonCardHeader>
            <IonCardTitle>April Run 300K Challenge</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            Run a total of 300 km (186.4 mi) in a month.
            <p>Apr 1, 2025 to Apr 30, 2025</p>
          </IonCardContent>
        </IonCard>

        {/* Groups */}
        <h3 className="groups-title">Your Running Groups</h3>
        <IonGrid className="groups-grid">
          <IonRow>
            <IonCol size="6">
              <div className="group-card">
                <div className="group-icon red">👥</div>
                <div className="group-info">
                  <h4>Morning Runners</h4>
                  <p>523 Members</p>
                </div>
              </div>
            </IonCol>
            <IonCol size="6">
              <div className="group-card">
                <div className="group-icon colorful">🏃</div>
                <div className="group-info">
                  <h4>Trail Runners</h4>
                  <p>324 Members</p>
                </div>
              </div>
            </IonCol>
          </IonRow>
        </IonGrid>
      </IonContent>
    </IonPage>
  );
}
