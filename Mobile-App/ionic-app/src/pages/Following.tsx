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
  IonSelectOption
} from "@ionic/react";
import { useState } from "react";
import '../theme/variables.css';
import ProfilePic from '../components/assets/close-up-portrait-serious-man-with-curly-hair.jpg';


export default function FollowingFollowers() {
  const [tab, setTab] = useState<"following" | "followers">("following");

  return (
    <IonPage>
      {/* Header */}
      <IonHeader>
        <IonToolbar >
          <IonButtons slot="start">
            <IonBackButton defaultHref="/HomeModule/homeM1/index.html" />
          </IonButtons>
          <IonTitle>Profile</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding" >
        {/* Tab Navigation */}
        <IonSegment
          value={tab}
          onIonChange={(e) => setTab(e.detail.value as "following" | "followers")}
        >
          <IonSegmentButton value="following">
            <IonLabel>Following</IonLabel>
          </IonSegmentButton>
          <IonSegmentButton value="followers">
            <IonLabel>Followers</IonLabel>
          </IonSegmentButton>
        </IonSegment>

        {/* Section Header */}
        {tab === "following" && (
          <>
            <div className="space-between" style={{ margin: "16px 0" }}>
             <IonLabel>Athletes you follow</IonLabel>
              <IonLabel>4</IonLabel>
            </div>

            {/* Users List */}
            <IonList lines="none">
              {/* User 1 */}
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

              {/* User 2 */}
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

              {/* User 3 */}
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

              {/* User 4 */}
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

        {/* Followers Tab (Empty for now) */}
        {tab === "followers" && (
          <div style={{ marginTop: "20px" }}>
            <h2>People following you</h2>
            <p>No followers yet.</p>
          </div>
        )}
      </IonContent>
    </IonPage>
  );
}
