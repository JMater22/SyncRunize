  import React from "react";
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
    return (
      <IonCard className="group-card" routerLink={routerLink}>
        <IonImg src={imageSrc} alt={`${name} Group`} />
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