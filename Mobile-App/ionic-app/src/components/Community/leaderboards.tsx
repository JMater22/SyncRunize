// Leaderboard.tsx
import React from "react";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonButtons,
  IonButton,
  IonIcon,
  IonTitle,
  IonContent,
  IonList,
  IonItem,
  IonAvatar,
  IonLabel,
  IonFooter,
  IonTabBar,
  IonTabButton
} from "@ionic/react";
import {
  arrowBack,
  
} from "ionicons/icons";
import '../theme/leaderboards.css';
import ProfilePic from '../components/assets/close-up-portrait-serious-man-with-curly-hair.jpg';



const Leaderboard: React.FC = () => {
  const leaderboard = [
    { rank: 1, name: "Raen Jun", weekly: "12.5 km this week", total: "103 km" },
    { rank: 2, name: "Jon Meyu", weekly: "10.5 km this week", total: "92 km" },
    { rank: 3, name: "Alma Tars", weekly: "7.5 km this week", total: "83 km" },
    { rank: 4, name: "Ji Anne", weekly: "4.5 km this week", total: "75 km" },
    { rank: 5, name: "Ian", weekly: "12.5 km this week", total: "73 km" },
    { rank: 6, name: "Jon", weekly: "10.5 km this week", total: "62 km" },
    { rank: 7, name: "Mary", weekly: "7.5 km this week", total: "53 km" },
    { rank: 8, name: "Arielle", weekly: "4.5 km this week", total: "43 km" },
    { rank: 9, name: "Ian", weekly: "12.5 km this week", total: "23 km" },
    { rank: 10, name: "Jon", weekly: "7.5 km this week", total: "22 km" }
  ];

  return (
    <IonPage>
      {/* Top Header */}
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonButton routerLink="/HomeModule/homeM1/index.html">
              <IonIcon icon={arrowBack} />
            </IonButton>
          </IonButtons>
          <IonTitle>
            City Runners
            <div className="leaderboard-subtitle">Leaderboard</div>
          </IonTitle>
        </IonToolbar>
      </IonHeader>

      {/* Main Content */}
      <IonContent>
        <h2 className="section-title">Distance</h2>
        <IonList>
          {leaderboard.map((user) => (
            <IonItem key={user.rank} lines="none">
              <div className={`rank-circle rank-${user.rank}`}>
                {user.rank}
              </div>
              <IonAvatar slot="start">
                <img src={ProfilePic} alt={user.name} />
              </IonAvatar>
              <IonLabel>
                <h2>{user.name}</h2>
                <p>{user.weekly}</p>
              </IonLabel>
              <div className="total-distance" slot="end">
                {user.total}
              </div>
            </IonItem>
          ))}
        </IonList>
      </IonContent>

      
    </IonPage>
  );
};

export default Leaderboard;
