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
  IonBadge,
  IonRefresher,
  IonRefresherContent
} from "@ionic/react";
import { useState } from "react";
import { RefresherEventDetail } from '@ionic/core';
import '../theme/body.css';
import ProfilePic from '../components/assets/close-up-portrait-serious-man-with-curly-hair.jpg';
import '../theme/global.css';
import { usePushNotifications } from "../components/push-notification";
import { PushNotificationSchema, ActionPerformed } from '@capacitor/push-notifications';

interface Notification {
  id: string;
  type: string;
  user: string;
  message: string;
  time: string;
  avatar: string;
  isNew?: boolean;
}

export default function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      type: 'follower',
      user: 'Mike',
      message: 'Nice! Mike is following you on Syncrunize',
      time: '3 days ago',
      avatar: ProfilePic,
      isNew: false
    },
    {
      id: '2',
      type: 'reaction',
      user: 'Jom',
      message: 'Jom liked your comment',
      time: '2 days ago',
      avatar: ProfilePic,
      isNew: false
    },
    {
      id: '3',
      type: 'kudos',
      user: 'Alexander',
      message: 'Nice work!',
      time: '3 days ago',
      avatar: ProfilePic,
      isNew: false
    },
    {
      id: '4',
      type: 'achievement',
      user: 'System',
      message: 'Congrats on completing the challenge!',
      time: '8 days ago',
      avatar: '🏆',
      isNew: false
    }
  ]);

  const [unreadCount, setUnreadCount] = useState(0);

  // Initialize push notifications
  usePushNotifications({
    onTokenReceived: (token) => {
      console.log("[Notifications] FCM Token received:", token);
      // Send token to your backend to register for all notification types
      // e.g., sendTokenToBackend(token, 'all_notifications');
    },
    onNotificationReceived: (notification: PushNotificationSchema) => {
      console.log("[Notifications] Notification received:", notification);
      
      // Add new notification to the list
      const newNotification: Notification = {
        id: Date.now().toString(),
        type: notification.data?.type || 'general',
        user: notification.data?.username || 'User',
        message: notification.body || 'New notification',
        time: 'Just now',
        avatar: notification.data?.avatar || ProfilePic,
        isNew: true
      };

      setNotifications(prev => [newNotification, ...prev]);
      setUnreadCount(prev => prev + 1);
    },
    onNotificationActionPerformed: (notification: ActionPerformed) => {
      console.log("[Notifications] Notification tapped:", notification);
      
      // Mark notification as read when tapped
      const notificationId = notification.notification.data?.notificationId;
      if (notificationId) {
        setNotifications(prev =>
          prev.map(n => n.id === notificationId ? { ...n, isNew: false } : n)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    }
  });

  const handleRefresh = (event: CustomEvent<RefresherEventDetail>) => {
    console.log("Refreshing notifications...");
    // Simulate fetching new notifications
    setTimeout(() => {
      // Mark all as read
      setNotifications(prev => prev.map(n => ({ ...n, isNew: false })));
      setUnreadCount(0);
      event.detail.complete();
    }, 1000);
  };

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, isNew: false } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  return (
    <IonPage >
      <IonHeader className="dark-header">
        <IonToolbar className="notification-content">
          <IonButtons slot="start">
            <IonBackButton defaultHref="/HomeModule/homeM1/index.html" />
          </IonButtons>
          <IonTitle>
            Notification
            {unreadCount > 0 && (
              <IonBadge color="danger" style={{ marginLeft: '8px', verticalAlign: 'super' }}>
                {unreadCount}
              </IonBadge>
            )}
          </IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="dark-content" >
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent></IonRefresherContent>
        </IonRefresher>

        <IonList lines="none">
          {notifications.map((notif) => (
            <IonItem 
              key={notif.id}
              routerLink="/UserProfile/userP1/index.html"
              onClick={() => markAsRead(notif.id)}
              style={{ 
                backgroundColor: notif.isNew ? 'rgba(66, 140, 255, 0.1)' : 'transparent'
              }}
            >
              {notif.type === 'achievement' ? (
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
                  {notif.avatar}
                </div>
              ) : (
                <IonAvatar slot="start">
                  <img src={notif.avatar} alt={notif.user} />
                </IonAvatar>
              )}
              <IonLabel>
                <h3>
                  {notif.type === 'follower' && 'New Follower'}
                  {notif.type === 'reaction' && 'New Reaction'}
                  {notif.type === 'kudos' && `Way to go, ${notif.user}`}
                  {notif.type === 'achievement' && 'Challenge Completed'}
                  {notif.type === 'general' && 'Notification'}
                  {notif.isNew && (
                    <IonBadge color="primary" style={{ marginLeft: '8px' }}>New</IonBadge>
                  )}
                </h3>
                <p>{notif.message}</p>
                <IonText color="medium">
                  <small>{notif.time}</small>
                </IonText>
              </IonLabel>
            </IonItem>
          ))}
        </IonList>
      </IonContent>
    </IonPage>
  );
}