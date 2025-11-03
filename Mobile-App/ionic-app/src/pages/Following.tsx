import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonButtons,
  IonBackButton,
  IonTitle,
  IonContent,
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonList,
  IonItem,
  IonAvatar,
  IonSelect,
  IonSelectOption,
  IonToast,
  IonBadge
} from "@ionic/react";
import { useState } from "react";
import '../theme/variables.css';
import ProfilePic from '../components/assets/close-up-portrait-serious-man-with-curly-hair.jpg';
import { usePushNotifications } from "../components/push-notification";
import { PushNotificationSchema, ActionPerformed } from '@capacitor/push-notifications';

export default function FollowingFollowers() {
  const [tab, setTab] = useState<"following" | "followers">("following");
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [newFollowersCount, setNewFollowersCount] = useState(0);

  // Initialize push notifications
  usePushNotifications({
    onTokenReceived: (token) => {
      console.log("[FollowingFollowers] FCM Token received:", token);
      // Send token to your backend to register for follow notifications
      // e.g., sendTokenToBackend(token, 'follow_notifications');
    },
    onNotificationReceived: (notification: PushNotificationSchema) => {
      console.log("[FollowingFollowers] Notification received:", notification);
      // Handle new follower notifications
      if (notification.data?.type === 'new_follower') {
        setToastMessage(`${notification.data.username} started following you!`);
        setShowToast(true);
        setNewFollowersCount(prev => prev + 1);
      } else if (notification.data?.type === 'follow_back') {
        setToastMessage(`${notification.data.username} followed you back!`);
        setShowToast(true);
      }
    },
    onNotificationActionPerformed: (notification: ActionPerformed) => {
      console.log("[FollowingFollowers] Notification tapped:", notification);
      // Navigate to followers tab when notification is tapped
      if (notification.notification.data?.type === 'new_follower') {
        setTab('followers');
        setNewFollowersCount(0);
      }
    }
  });

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar >
          <IonButtons slot="start">
            <IonBackButton defaultHref="/HomeModule/homeM1/index.html" />
          </IonButtons>
          <IonTitle>Profile</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding" >
        <IonSegment
          value={tab}
          onIonChange={(e) => {
            setTab(e.detail.value as "following" | "followers");
            if (e.detail.value === "followers") {
              setNewFollowersCount(0);
            }
          }}
        >
          <IonSegmentButton value="following">
            <IonLabel>Following</IonLabel>
          </IonSegmentButton>
          <IonSegmentButton value="followers">
            <IonLabel>
              Followers
              {newFollowersCount > 0 && (
                <IonBadge color="danger" style={{ marginLeft: '8px' }}>
                  {newFollowersCount}
                </IonBadge>
              )}
            </IonLabel>
          </IonSegmentButton>
        </IonSegment>

        {tab === "following" && (
          <>
            <div className="space-between" style={{ margin: "16px 0" }}>
             <IonLabel>Athletes you follow</IonLabel>
              <IonLabel>4</IonLabel>
            </div>

            <IonList lines="none">
              <IonItem>
                <IonAvatar slot="start">
                  <img src={ProfilePic} alt="Raen Jun" />
                </IonAvatar>
                <IonLabel>
                  <h3>Raen Jun</h3>
                  <p>Capas, Tarlac</p>
                </IonLabel>
                <IonSelect
                  interface="popover"
                  placeholder="Following"
                  value="following"
                  slot="end"
                >
                  <IonSelectOption value="following">Following</IonSelectOption>
                  <IonSelectOption value="unfollow">Unfollow</IonSelectOption>
                </IonSelect>
              </IonItem>

              <IonItem>
                <IonAvatar slot="start">
                  <img src={ProfilePic} alt="Jon Meyu" />
                </IonAvatar>
                <IonLabel>
                  <h3>Jon Meyu</h3>
                  <p>San Vicente, Tarlac</p>
                </IonLabel>
                <IonSelect
                  interface="popover"
                  placeholder="Following"
                  value="following"
                  slot="end"
                >
                  <IonSelectOption value="following">Following</IonSelectOption>
                  <IonSelectOption value="unfollow">Unfollow</IonSelectOption>
                </IonSelect>
              </IonItem>

              <IonItem>
                <IonAvatar slot="start">
                  <img src={ProfilePic} alt="Alma Tars" />
                </IonAvatar>
                <IonLabel>
                  <h3>Alma Tars</h3>
                  <p>Capas, Tarlac</p>
                </IonLabel>
                <IonSelect
                  interface="popover"
                  placeholder="Following"
                  value="following"
                  slot="end"
                >
                  <IonSelectOption value="following">Following</IonSelectOption>
                  <IonSelectOption value="unfollow">Unfollow</IonSelectOption>
                </IonSelect>
              </IonItem>

              <IonItem>
                <IonAvatar slot="start">
                  <img src={ProfilePic} alt="Ji Anne" />
                </IonAvatar>
                <IonLabel>
                  <h3>Ji Anne</h3>
                  <p>Talaga, Capas</p>
                </IonLabel>
                <IonSelect
                  interface="popover"
                  placeholder="Following"
                  value="following"
                  slot="end"
                >
                  <IonSelectOption value="following">Following</IonSelectOption>
                  <IonSelectOption value="unfollow">Unfollow</IonSelectOption>
                </IonSelect>
              </IonItem>
            </IonList>
          </>
        )}

        {tab === "followers" && (
          <div style={{ marginTop: "20px" }}>
            <h2>People following you</h2>
            <p>No followers yet.</p>
          </div>
        )}

        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={toastMessage}
          duration={3000}
          position="top"
          color="success"
        />
      </IonContent>
    </IonPage>
  );
}