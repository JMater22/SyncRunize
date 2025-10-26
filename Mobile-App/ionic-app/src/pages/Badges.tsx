import React from "react";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonBackButton,
  IonCard,
  IonCardContent,
  IonIcon
} from "@ionic/react";
import { triangle } from "ionicons/icons";
import "../theme/Badges.css";

interface Badge {
  id: number;
  title: string;
  color: string;
  icon?: string;
}

const Badges: React.FC = () => {
  const badges: Badge[] = [
    { id: 1, title: "First Run", color: "#C84B31" },
    { id: 2, title: "10K", color: "#8AB446", icon: "triangle" },
    { id: 3, title: "21K Run", color: "#4A7BA7" },
    { id: 4, title: "5 Runs", color: "#4DB8AC" },
    { id: 5, title: "Consistent Master", color: "#A93226" },
    { id: 6, title: "Runstreak", color: "#D4D41F" }
  ];

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar className="badges-toolbar">
          <IonButtons slot="start">
            <IonBackButton defaultHref="/profile" />
          </IonButtons>
          <IonTitle>Badges</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="badges-content">
        <div className="badges-grid">
          {badges.map((badge) => (
            <IonCard key={badge.id} className="badge-card">
              <IonCardContent className="badge-card-content">
                <div className="badge-circle" style={{ backgroundColor: badge.color }}>
                  {badge.icon === "triangle" && (
                    <IonIcon icon={triangle} className="badge-icon" />
                  )}
                </div>
                <h3 className="badge-title">{badge.title}</h3>
              </IonCardContent>
            </IonCard>
          ))}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Badges;