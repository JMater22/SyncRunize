import React from "react";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonButtons,
  IonBackButton,
  IonTitle,
  IonContent,
  IonList,
  IonItem,
  IonLabel,
  IonSelect,
  IonSelectOption,
  IonToggle,
  IonButton,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
} from "@ionic/react";
import '../theme/variables.css';


export default function Settings() {
  return (
    <IonPage>
      {/* Header */}
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/UserProfile/userP1/index.html" />
          </IonButtons>
          <IonTitle>Settings</IonTitle>
        </IonToolbar>
      </IonHeader>

      {/* Scrollable Content */}
     <IonContent fullscreen>

  {/* Account Settings */}
  <IonCard>
    <IonCardHeader>
      <IonCardTitle>Account Settings</IonCardTitle>
    </IonCardHeader>
    <IonCardContent>
      <IonList>
        <IonItem button routerLink="/Settings/settings2/index.html">
          <IonLabel>
            <h2>Profile Information</h2>
            <p>Name, email, and personal details</p>
          </IonLabel>
        </IonItem>

        <IonItem button routerLink="/Settings/settings3/index.html">
          <IonLabel>
            <h2>Password & Security</h2>
            <p>Update password and security settings</p>
          </IonLabel>
        </IonItem>
      </IonList>
    </IonCardContent>
  </IonCard>

  {/* Privacy Controls */}
  <IonCard>
    <IonCardHeader>
      <IonCardTitle>Privacy Controls</IonCardTitle>
    </IonCardHeader>
    <IonCardContent>
      <IonList>
        <IonItem>
          <IonLabel >
            <h2>Profile Visibility</h2>
            <p>Who can see your profile</p>
          </IonLabel>
          <IonSelect justify="end"  value="friends" interface="action-sheet">
            <IonSelectOption value="friends">Friends Only</IonSelectOption>
            <IonSelectOption value="everyone">Everyone</IonSelectOption>
            <IonSelectOption value="private">Private</IonSelectOption>
          </IonSelect>
        </IonItem>

        <IonItem>
          <IonLabel>
            <h2>Activity Visibility</h2>
            <p>Default privacy for new activities</p>
          </IonLabel>
          <IonSelect justify="end" value="everyone" interface="action-sheet">
            <IonSelectOption value="everyone">Everyone</IonSelectOption>
            <IonSelectOption value="friends">Friends Only</IonSelectOption>
            <IonSelectOption value="private">Private</IonSelectOption>
          </IonSelect>
        </IonItem>
      </IonList>
    </IonCardContent>
  </IonCard>

  {/* Notifications Preferences */}
  <IonCard>
    <IonCardHeader>
      <IonCardTitle>Notifications Preferences</IonCardTitle>
    </IonCardHeader>
    <IonCardContent>
      <IonList>
        <IonItem>
          <IonLabel>
            <h2>Push Notifications</h2>
            <p>Enable or disable all notifications</p>
          </IonLabel>
          <IonToggle slot="end"color="success"  checked />
        </IonItem>

        <IonItem>
          <IonLabel><h2>Challenge Updates</h2></IonLabel>
          <IonToggle slot="end" color="success" checked />
        </IonItem>

        <IonItem>
          <IonLabel><h2>Friend Activity</h2></IonLabel>
          <IonToggle slot="end" color="success"/>
        </IonItem>

        <IonItem>
          <IonLabel><h2>Comments</h2></IonLabel>
          <IonToggle slot="end" color="success" />
        </IonItem>

        <IonItem>
          <IonLabel><h2>Group Events</h2></IonLabel>
          <IonToggle slot="end" color="success" checked />
        </IonItem>

        <IonItem>
          <IonLabel><h2>Achievement Alerts</h2></IonLabel>
          <IonToggle  slot="end" color="success" checked />
        </IonItem>

        <IonItem>
          <IonLabel><h2>Weekly Reports</h2></IonLabel>
          <IonToggle slot="end" color="success"/>
        </IonItem>
      </IonList>
    </IonCardContent>
  </IonCard>

  {/* App Preferences */}
  <IonCard>
    <IonCardHeader>
      <IonCardTitle>App Preferences</IonCardTitle>
    </IonCardHeader>
    <IonCardContent>
      <IonList>
        <IonItem>
          <IonLabel>
            <h2>Distance Units</h2>
            <p>Choose kilometers or miles</p>
          </IonLabel>
          <div style={{ display: "flex", gap: "8px" }}>
            <IonButton size="small" fill="outline" color="success">km</IonButton>
            <IonButton size="small" fill="outline" color="success">mi</IonButton>
          </div>
        </IonItem>

      </IonList>
    </IonCardContent>
  </IonCard>

  {/* Log Out */}
  <div style={{ padding: "16px" }}>
    <IonButton expand="block" color="danger">
      Log Out →
    </IonButton>
  </div>

</IonContent>

    </IonPage>
    
  );
}