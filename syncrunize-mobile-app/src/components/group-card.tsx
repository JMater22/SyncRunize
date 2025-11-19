  import React, { useState } from "react";
  import {
    IonCard,
    IonCardContent,
    IonButton,
    IonImg
  } from "@ionic/react";
  import GroupFeed from "../pages/Group-feed";

  interface GroupCardProps {
    name: string;
    imageSrc: string;
    showJoinButton?: boolean;
    isJoined?: boolean;
    routerLink?: string;
    onJoin?: () => void;
  }

  const GroupCard: React.FC<GroupCardProps> = ({
    name,
    imageSrc,
    showJoinButton = false,
    isJoined = false,
    routerLink="/group-feed",
    onJoin
  }) => {
    const [imageError, setImageError] = useState(false);
    const defaultGroupImage = "https://i.pinimg.com/736x/43/a5/4b/43a54b5ac213b39d702b16a503738437.jpg";

    return (
      <IonCard className="group-card" routerLink={routerLink}>
        <IonImg
          src={imageError ? defaultGroupImage : (imageSrc || defaultGroupImage)}
          alt={`${name} Group`}
          onIonError={() => {
            console.error(`[GroupCard] Failed to load image: ${imageSrc}`);
            setImageError(true);
          }}
        />
        <IonCardContent className="group-overlay">
          <span className="group-name">{name}</span>
          {showJoinButton && !isJoined && (
            <IonButton
              size="small"
              className="join-group-btn"
              color="primary"
              onClick={(e) => {
                e.stopPropagation();
                onJoin?.();
              }}
            >
              Join
            </IonButton>
          )}
          {isJoined && (
            <IonButton
              size="small"
              className="joined-group-btn"
              color="success"
              fill="outline"
              disabled
            >
              Joined
            </IonButton>
          )}
        </IonCardContent>
      </IonCard>
    );
  };

  export default GroupCard;