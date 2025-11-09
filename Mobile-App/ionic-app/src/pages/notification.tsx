import React from 'react';
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
  IonButton,
  IonRefresher,
  IonRefresherContent,
  IonSpinner,
  IonNote
} from "@ionic/react";
import { RefresherEventDetail } from '@ionic/core';
import { useHistory } from 'react-router-dom';
import '../theme/notification.css';
import '../theme/global.css';
import { useNotifications } from "../contexts/NotificationContext";
import { DEFAULT_AVATAR } from "../constants/avatar";

export default function Notifications() {
  const { notifications, loading, markAsRead, clearAll, fetchNotifications } = useNotifications();
  const history = useHistory();

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const notifTime = new Date(timestamp);
    const diffMs = now.getTime() - notifTime.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSecs < 60) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return notifTime.toLocaleDateString();
  };

  const handleRefresh = async (event: CustomEvent<RefresherEventDetail>) => {
    try {
      await fetchNotifications();
    } catch (error) {
      console.error('Failed to refresh notifications:', error);
    } finally {
      event.detail.complete();
    }
  };

  const handleNotificationClick = async (notification: any) => {
    console.log('[Notification] Clicked:', {
      notification_id: notification.notification_id,
      type: notification.type,
      post_id: notification.post_id,
      actor_id: notification.actor_id,
      user_id: notification.user_id,
      group_id: notification.group_id,
    });

    // Mark as read
    await markAsRead(notification.notification_id);

    // Navigate based on notification type
    switch (notification.type) {
      case 'follow':
        if (notification.actor_id) {
          history.push(`/other-profile?userId=${notification.actor_id}`);
        }
        break;

      case 'like':
      case 'comment':
        // Navigate to posts page or home
        history.push('/posts');
        break;

      case 'group_like':
      case 'group_comment':
      case 'group_invite':
        if (notification.group_id) {
          history.push(`/group-feed/${notification.group_id}`);
        }
        break;

      case 'challenge_progress':
        history.push('/my-challenges');
        break;

      case 'badge_earned':
        history.push('/badges');
        break;

      default:
        break;
    }
  };

  const renderNotificationMessage = (notification: any) => {
    // Debug logging
    console.log('💬 [renderNotificationMessage] Notification:', {
      type: notification.type,
      actor: notification.actor,
      actor_id: notification.actor_id,
      message: notification.message
    });

    // Prefer username, then name; fall back to actor_id
    const actorName = notification.actor?.username
      || notification.actor?.name
      || (notification.actor_id ? `User ${notification.actor_id}` : 'Someone');

    console.log('💬 [renderNotificationMessage] Resolved actorName:', actorName);

    switch (notification.type) {
      case 'follow':
        return (
          <>
            <strong>{actorName}</strong> {notification.message}
          </>
        );

      case 'like':
        return (
          <>
            <strong>{actorName}</strong> {notification.message}
          </>
        );

      case 'comment':
        return (
          <>
            <strong>{actorName}</strong> {notification.message}
          </>
        );

      case 'group_like':
        return (
          <>
            <strong>{actorName}</strong> {notification.message}
          </>
        );

      case 'group_comment':
        return (
          <>
            <strong>{actorName}</strong> {notification.message}
          </>
        );

      case 'group_invite':
        return <>{notification.message}</>;

      case 'challenge_progress':
        return <>{notification.message}</>;

      case 'badge_earned':
        return <>{notification.message}</>;

      default:
        return <>{notification.message}</>;
    }
  };

  const getNotificationAvatar = (notification: any) => {
    // For challenge and badge notifications, show the badge image
    if (notification.type === 'challenge_progress' || notification.type === 'badge_earned') {
      return notification.badge_image_url || DEFAULT_AVATAR;
    }

    // For other notifications, show actor's profile picture
    const profilePicture = notification.actor?.profile_picture;

    // If no profile picture, use default avatar
    if (!profilePicture) {
      return DEFAULT_AVATAR;
    }

    // If it's already a full URL (starts with http:// or https://), use it directly
    if (profilePicture.startsWith('http://') || profilePicture.startsWith('https://')) {
      return profilePicture;
    }

    // If it's a Supabase storage path, construct the full URL
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://hooceemtoyucadhxuevx.supabase.co';

    // Remove leading slash if present
    const cleanPath = profilePicture.startsWith('/') ? profilePicture.slice(1) : profilePicture;

    // Construct full Supabase storage URL
    const fullUrl = `${supabaseUrl}/storage/v1/object/public/${cleanPath}`;
    return fullUrl;
  };

  return (
    <IonPage>
      <IonHeader className="dark-header">
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/home" />
          </IonButtons>
          <IonTitle>Notifications</IonTitle>
          {notifications.length > 0 && (
            <IonButtons slot="end">
              <IonButton fill="clear" onClick={clearAll}>
                Clear All
              </IonButton>
            </IonButtons>
          )}
        </IonToolbar>
      </IonHeader>

      <IonContent className="dark-content notification-content" fullscreen>
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent></IonRefresherContent>
        </IonRefresher>

        {loading ? (
          <div className="notification-loading">
            <IonSpinner name="crescent" />
            <p>Loading notifications...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="notification-empty">
            <IonText color="medium">
              <p>No notifications yet</p>
            </IonText>
          </div>
        ) : (
          <IonList lines="full">
            {notifications.map((notification) => (
              <IonItem
                key={notification.notification_id}
                button
                onClick={() => handleNotificationClick(notification)}
                className={`notification-item ${notification.is_read ? 'read' : 'unread'}`}
              >
                <IonAvatar slot="start">
                  <img
                    src={getNotificationAvatar(notification)}
                    alt={notification.type === 'challenge_progress' || notification.type === 'badge_earned' ? 'Badge' : (notification.actor?.username || 'User')}
                    onError={(e) => {
                      // Fallback to default avatar if image fails to load
                      (e.target as HTMLImageElement).src = DEFAULT_AVATAR;
                    }}
                  />
                </IonAvatar>
                <IonLabel className="ion-text-wrap">
                  <p className="notification-message">
                    {renderNotificationMessage(notification)}
                  </p>
                  <IonNote className="notification-time">
                    {formatTimeAgo(notification.created_at)}
                  </IonNote>
                </IonLabel>
                {!notification.is_read && (
                  <div className="unread-indicator" slot="end"></div>
                )}
              </IonItem>
            ))}
          </IonList>
        )}
      </IonContent>
    </IonPage>
  );
}
