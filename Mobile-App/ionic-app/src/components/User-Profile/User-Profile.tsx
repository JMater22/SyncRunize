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
  IonCardContent
} from "@ionic/react";
import { settingsOutline } from "ionicons/icons";
import '../theme/User-Profile.css';
import ProfilePic from '../components/assets/close-up-portrait-serious-man-with-curly-hair.jpg';
import ChallengePic from '../components/assets/istockphoto-143920084-612x612.jpg';

export default function Profile() {
  return (
    <IonPage>
      {/* Header */}
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/HomeModule/homeM1/index.html" />
          </IonButtons>
          <IonTitle>Profile</IonTitle>
          <IonButtons slot="end">
            <IonButton routerLink="/Settings/settings1/index.html">
              <IonIcon icon={settingsOutline} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      {/* Scrollable Content */}
      <IonContent className="ion-padding">
        {/* Profile Section */}
        <IonItem lines="none">
          <IonAvatar slot="start">
            <img src={ProfilePic} alt="Alexander Smith" />
          </IonAvatar>
          <IonLabel>
            <h2>Alexander Smith</h2>
            <p>@alexsmith</p>
            <p>📍 Dolores Capas, Tarlac</p>
          </IonLabel>
          <IonButton fill="outline" slot="end">
            Edit
          </IonButton>
        </IonItem>

        {/* Stats */}
        <IonGrid>
          <IonRow>
            <IonCol>
              <h2>4</h2>
              <p>Following</p>
            </IonCol>
            <IonCol>
              <h2>2</h2>
              <p>Followers</p>
            </IonCol>
            <IonCol>
              <h2>24</h2>
              <p>Badges</p>
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
              <div className="chart-row">
                <span>Mon</span>
                <div className="bar" style={{ width: "85%" }}></div>
              </div>
              <div className="chart-row">
                <span>Tues</span>
                <div className="bar" style={{ width: "35%" }}></div>
              </div>
              <div className="chart-row">
                <span>Wed</span>
                <div className="bar" style={{ width: "45%" }}></div>
              </div>
              <div className="chart-row">
                <span>Thurs</span>
                <div className="bar" style={{ width: "90%" }}></div>
              </div>
              <div className="chart-row">
                <span>Fri</span>
                <div className="bar" style={{ width: "70%" }}></div>
              </div>
              <div className="chart-row">
                <span>Sat</span>
                <div className="bar" style={{ width: "80%" }}></div>
              </div>
              <div className="chart-row">
                <span>Sun</span>
                <div className="bar" style={{ width: "50%" }}></div>
              </div>
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

       

        {/* Challenges */}
        <IonCard>
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
