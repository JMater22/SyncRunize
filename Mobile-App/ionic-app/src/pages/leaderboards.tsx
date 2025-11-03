import React, { useState, useEffect } from "react";
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
  IonToast,
  IonBadge,
  IonRefresher,
  IonRefresherContent
} from "@ionic/react";
import {
  arrowBack,
  trophyOutline,
  arrowUpOutline,
  arrowDownOutline
} from "ionicons/icons";
import { RefresherEventDetail } from '@ionic/core';
import '../theme/leaderboards.css';
import ProfilePic from '../components/assets/close-up-portrait-serious-man-with-curly-hair.jpg';
import { usePushNotifications } from "../components/push-notification";
import { PushNotificationSchema, ActionPerformed } from '@capacitor/push-notifications';

interface LeaderboardUser {
  rank: number;
  name: string;
  weekly: string;
  total: string;
  previousRank?: number;
  isNew?: boolean;
}

const Leaderboard: React.FC = () => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([
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
  ]);

  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastColor, setToastColor] = useState<string>("primary");
  const [updatesCount, setUpdatesCount] = useState(0);
  const [highlightedRank, setHighlightedRank] = useState<number | null>(null);

  // Initialize push notifications
  usePushNotifications({
    onTokenReceived: (token) => {
      console.log("[Leaderboard] FCM Token received:", token);
      // Send token to your backend to register for leaderboard updates
      // e.g., sendTokenToBackend(token, 'leaderboard_updates', groupId);
    },
    onNotificationReceived: (notification: PushNotificationSchema) => {
      console.log("[Leaderboard] Notification received:", notification);
      
      if (notification.data?.type === 'rank_change') {
        const username = notification.data.username;
        const newRank = parseInt(notification.data.newRank);
        const oldRank = parseInt(notification.data.oldRank);
        const change = oldRank - newRank;
        
        if (change > 0) {
          setToastMessage(`${username} moved up to #${newRank}! 🎉`);
          setToastColor("success");
        } else {
          setToastMessage(`${username} dropped to #${newRank}`);
          setToastColor("warning");
        }
        setShowToast(true);
        setUpdatesCount(prev => prev + 1);
        setHighlightedRank(newRank);
        
        // Update leaderboard with new ranking
        setLeaderboard(prev => 
          prev.map(user => 
            user.name === username 
              ? { ...user, rank: newRank, previousRank: oldRank, isNew: true }
              : user
          ).sort((a, b) => a.rank - b.rank)
        );
        
        // Clear highlight after 3 seconds
        setTimeout(() => setHighlightedRank(null), 3000);
      }
      else if (notification.data?.type === 'new_leader') {
        const username = notification.data.username;
        setToastMessage(`🏆 ${username} is now #1 on the leaderboard!`);
        setToastColor("warning");
        setShowToast(true);
        setUpdatesCount(prev => prev + 1);
        setHighlightedRank(1);
        setTimeout(() => setHighlightedRank(null), 3000);
      }
      else if (notification.data?.type === 'milestone_reached') {
        const username = notification.data.username;
        const milestone = notification.data.milestone;
        setToastMessage(`${username} reached ${milestone}! 🎊`);
        setToastColor("success");
        setShowToast(true);
      }
      else if (notification.data?.type === 'weekly_reset') {
        setToastMessage("Weekly leaderboard has been reset! 🔄");
        setToastColor("primary");
        setShowToast(true);
        setUpdatesCount(prev => prev + 1);
      }
      else if (notification.data?.type === 'friend_passed_you') {
        const username = notification.data.username;
        setToastMessage(`${username} just passed you on the leaderboard! 🏃‍♂️`);
        setToastColor("danger");
        setShowToast(true);
        setUpdatesCount(prev => prev + 1);
      }
    },
    onNotificationActionPerformed: (notification: ActionPerformed) => {
      console.log("[Leaderboard] Notification tapped:", notification);
      
      // Scroll to specific rank if provided
      if (notification.notification.data?.rank) {
        const rank = parseInt(notification.notification.data.rank);
        setHighlightedRank(rank);
        setTimeout(() => setHighlightedRank(null), 3000);
      }
      
      // Clear updates count
      setUpdatesCount(0);
    }
  });

  const handleRefresh = (event: CustomEvent<RefresherEventDetail>) => {
    console.log("Refreshing leaderboard...");
    
    // Simulate fetching updated leaderboard data
    setTimeout(() => {
      // Clear new flags
      setLeaderboard(prev => prev.map(user => ({ ...user, isNew: false, previousRank: undefined })));
      setUpdatesCount(0);
      event.detail.complete();
      
      setToastMessage("Leaderboard updated!");
      setToastColor("success");
      setShowToast(true);
    }, 1500);
  };

  const getRankChangeIcon = (user: LeaderboardUser) => {
    if (!user.previousRank) return null;
    
    const change = user.previousRank - user.rank;
    if (change > 0) {
      return <IonIcon icon={arrowUpOutline} color="success" style={{ marginLeft: '5px' }} />;
    } else if (change < 0) {
      return <IonIcon icon={arrowDownOutline} color="danger" style={{ marginLeft: '5px' }} />;
    }
    return null;
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonButton routerLink="/HomeModule/homeM1/index.html">
              <IonIcon icon={arrowBack} />
            </IonButton>
          </IonButtons>
          <IonTitle>
            City Runners
            <div className="leaderboard-subtitle">
              Leaderboard
              {updatesCount > 0 && (
                <IonBadge color="danger" style={{ marginLeft: '8px' }}>
                  {updatesCount} new
                </IonBadge>
              )}
            </div>
          </IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent>
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent></IonRefresherContent>
        </IonRefresher>

        <h2 className="section-title">Distance</h2>
        <IonList>
          {leaderboard.map((user) => (
            <IonItem 
              routerLink="/profile" 
              key={`${user.rank}-${user.name}`} 
              lines="none"
              style={{
                backgroundColor: highlightedRank === user.rank 
                  ? 'rgba(255, 193, 7, 0.2)' 
                  : user.isNew 
                    ? 'rgba(66, 140, 255, 0.1)' 
                    : 'transparent',
                transition: 'background-color 0.3s ease'
              }}
            >
              <div className={`rank-circle rank-${user.rank}`}>
                {user.rank}
                {user.rank <= 3 && (
                  <IonIcon 
                    icon={trophyOutline} 
                    style={{ 
                      position: 'absolute', 
                      top: '-5px', 
                      right: '-5px', 
                      fontSize: '12px',
                      color: user.rank === 1 ? '#FFD700' : user.rank === 2 ? '#C0C0C0' : '#CD7F32'
                    }} 
                  />
                )}
              </div>
              <IonAvatar slot="start">
                <img src={ProfilePic} alt={user.name} />
              </IonAvatar>
              <IonLabel>
                <h2>
                  {user.name}
                  {getRankChangeIcon(user)}
                  {user.isNew && (
                    <IonBadge color="primary" style={{ marginLeft: '8px', fontSize: '10px' }}>
                      Updated
                    </IonBadge>
                  )}
                </h2>
                <p>{user.weekly}</p>
              </IonLabel>
              <div className="total-distance" slot="end">
                {user.total}
              </div>
            </IonItem>
          ))}
        </IonList>

        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={toastMessage}
          duration={3000}
          position="top"
          color={toastColor}
        />
      </IonContent>
    </IonPage>
  );
};

export default Leaderboard;