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
  IonImg
} from "@ionic/react";
import "../theme/Badges.css";
import GoldBadge from "../components/assets/badges/Gold Animated-modified.png"
import BronzeBadge from "../components/assets/badges/Bronze Animated-modified.png"
import SilverBadge from "../components/assets/badges/Silver Animated-modified.png"


interface Badge {
  id: number;
  title: string;
  color: string;
  image?: string;
}

const Badges: React.FC = () => {
  // Map badge IDs to their images
  const badgeImages: { [key: number]: string } = {
    1: BronzeBadge,
    2: SilverBadge,
    3: GoldBadge,
    4: BronzeBadge,
    5: SilverBadge,
    6: GoldBadge
  };

  const badges: Badge[] = [
    { id: 1, title: "First Run", color: "#C84B31", image: badgeImages[1] },
    { id: 2, title: "10K", color: "#8AB446", image: badgeImages[2] },
    { id: 3, title: "21K Run", color: "#4A7BA7", image: badgeImages[3] },
    { id: 4, title: "5 Runs", color: "#4DB8AC", image: badgeImages[4] },
    { id: 5, title: "Consistent Master", color: "#A93226", image: badgeImages[5] },
    { id: 6, title: "Runstreak", color: "#D4D41F", image: badgeImages[6] }
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
                  {badge.image && (
                    <IonImg src={badge.image} alt={badge.title} className="badge-icon" />
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