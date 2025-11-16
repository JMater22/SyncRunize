import React from 'react';
import { useHistory } from 'react-router-dom';
import {
  IonContent,
  IonList,
  IonItem,
  IonLabel,
  IonAvatar,
  IonNote,
  IonButton,
  IonText,
  IonSpinner,
} from '@ionic/react';
import { useNotifications } from '../../contexts/NotificationContext';
import './NotificationMenu.css';
import { DEFAULT_AVATAR, generateAvatarUrl } from '../../constants/avatar';

const NotificationMenu: React.FC = () => {
  const { notifications, unreadCount, loading, markAsRead, clearAll, refreshNotifications } = useNotifications();
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

  const handleNotificationClick = async (notification: any) => {
    // Debug: surface IDs to verify routing context
    console.log('[NotificationMenu.debug] Clicked notification:', {
      notification_id: notification.notification_id,
      type: notification.type,
      post_id: notification.post_id,
      actor_id: notification.actor_id,
      user_id: notification.user_id,
      group_id: notification.group_id,
      group_post_id: notification.group_post_id,
    });

    // Mark as read and refresh list to ensure actor relation stays populated
    await markAsRead(notification.notification_id);
    refreshNotifications().catch(() => {});

    // Navigate based on notification type
    switch (notification.type) {
      case 'follow':
        if (notification.actor_id) {
          history.push(`/user/${notification.actor_id}`);
        }
        break;

      case 'group_invite':
        if (notification.group_id) {
          history.push(`/group/${notification.group_id}`);
        }
        break;

      case 'like':
      case 'comment':
        // Scroll to post in Home feed instead of separate ViewPost page
        if (notification.post_id) {
          history.push(`/home?focusPost=${notification.post_id}`);
          // Ask parent to close the modal and allow Home to refresh/scroll
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent('notifications:close'));
          }, 0);
        } else {
          history.push('/home');
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent('notifications:close'));
          }, 0);
        }
        break;

      case 'group_like':
      case 'group_comment':
        if (notification.group_id) {
          const focusParam = notification.group_post_id ? `?focusGroupPost=${notification.group_post_id}` : '';
          history.push(`/group/${notification.group_id}${focusParam}`);
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent('notifications:close'));
          }, 0);
        }
        break;

      case 'challenge_progress':
        // Navigate to profile challenges tab
        history.push('/profile?tab=challenges');
        setTimeout(() => window.dispatchEvent(new CustomEvent('notifications:close')), 0);
        break;

      case 'badge_earned':
        // Navigate to profile badges tab
        history.push('/profile?tab=badges');
        setTimeout(() => window.dispatchEvent(new CustomEvent('notifications:close')), 0);
        break;

      default:
        break;
    }
  };

  const renderNotificationMessage = (notification: any) => {
    // Prefer username, then name; fall back to actor_id to avoid 'Someone'
    const actorName = notification.actor?.username
      || notification.actor?.name
      || (notification.actor_id ? `User ${notification.actor_id}` : 'Someone');

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

    // For other notifications, show actor's profile picture or generate avatar with initials
    if (notification.actor?.profile_picture) {
      return notification.actor.profile_picture;
    }

    // Generate avatar with user initials if no profile picture
    const actorName = notification.actor?.username || notification.actor?.name;
    return generateAvatarUrl(actorName);
  };

  if (loading) {
    return (
      <IonContent className="notification-menu">
        <div className="notification-loading">
          <IonSpinner />
        </div>
      </IonContent>
    );
  }

  return (
    <IonContent className="notification-menu">
      <div className="notification-header">
        {notifications.length > 0 && (
          <IonButton fill="clear" size="small"onClick={clearAll}>
            Clear All
          </IonButton>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="notification-empty">
          <IonText color="medium">
            <p>No new notifications</p>
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
  );
};

export default NotificationMenu;
