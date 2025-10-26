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
  IonAvatar,
  IonLabel,
  IonText,
} from "@ionic/react";
import '../theme/body.css';
import ProfilePic from '../components/assets/close-up-portrait-serious-man-with-curly-hair.jpg';


export default function Notifications() {
  return (
    <IonPage >
      {/* Header */}
      <IonHeader >
        <IonToolbar className="notification-content">
          <IonButtons slot="start">
            <IonBackButton  defaultHref="/HomeModule/homeM1/index.html" />
          </IonButtons>
          <IonTitle>Notification</IonTitle>
        </IonToolbar>
      </IonHeader>

      {/* Notifications List */}
      <IonContent className="ion-padding" >
        <IonList lines="none">

          {/* New Follower */}
          <IonItem routerLink="/UserProfile/userP1/index.html">
            <IonAvatar slot="start">
              <img src={ProfilePic} alt="Mike" />
            </IonAvatar>
            <IonLabel>
              <h3>New Follower</h3>
              <p>Nice! Mike is following you on Syncrunize</p>
              <IonText color="medium">
                <small>3 days ago</small>
              </IonText>
            </IonLabel>
          </IonItem>

          {/* New Reaction */}
          <IonItem  routerLink="/UserProfile/userP1/index.html">
            <IonAvatar slot="start">
              <img src={ProfilePic} alt="Jom" />
            </IonAvatar>
            <IonLabel>
              <h3>New Reaction</h3>
              <p>Jom liked your comment</p>
              <IonText color="medium">
                <small>2 days ago</small>
              </IonText>
            </IonLabel>
          </IonItem>

          {/* Way to go */}
          <IonItem  routerLink="/UserProfile/userP1/index.html">
            <IonAvatar slot="start">
              <img src={ProfilePic} alt="Alexander" />
            </IonAvatar>
            <IonLabel>
              <h3>Way to go, Alexander</h3>
              <p>Nice work!</p>
              <IonText color="medium">
                <small>3 days ago</small>
              </IonText>
            </IonLabel>
          </IonItem>

          {/* Challenge Completed */}
          <IonItem  routerLink="/UserProfile/userP1/index.html">
            <div
              slot="start"
              style={{
                background: "#8bc34a",
                borderRadius: "50%",
                width: "48px",
                height: "48px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "20px",
              }}
            >
              🏆
            </div>
            <IonLabel>
              <h3>Challenge Completed</h3>
              <p>Congrats on completing the challenge!</p>
              <IonText color="medium">
                <small>8 days ago</small>
              </IonText>
            </IonLabel>
          </IonItem>

        </IonList>
      </IonContent>
    </IonPage>
  );
}
