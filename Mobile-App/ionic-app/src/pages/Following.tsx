import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonButtons,
  IonBackButton,
  IonTitle,
  IonContent,
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonList,
  IonItem,
  IonAvatar,
  IonButton,
  IonToast,
  IonBadge,
  IonSpinner,
} from "@ionic/react";
import { useState, useEffect } from "react";
import { useHistory } from "react-router-dom";
import '../theme/variables.css';
import { usePushNotifications } from "../components/push-notification";
import { PushNotificationSchema, ActionPerformed } from '@capacitor/push-notifications';
import { useUser } from "../contexts/UserContext";
import { FollowsApi, FollowUser } from "../services/follows";
import { getAvatarUrl } from "../lib/utils";

export default function FollowingFollowers() {
  const history = useHistory();
  const { currentUser } = useUser();
  const [tab, setTab] = useState<"following" | "followers">("following");
  const [following, setFollowing] = useState<FollowUser[]>([]);
  const [followers, setFollowers] = useState<FollowUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastColor, setToastColor] = useState<'success' | 'danger' | 'warning'>('success');
  const [newFollowersCount, setNewFollowersCount] = useState(0);

  useEffect(() => {
    if (currentUser) {
      fetchFollowData();
    }
  }, [currentUser]);

  const fetchFollowData = async () => {
    if (!currentUser) return;

    try {
      setLoading(true);
      const [followingData, followersData] = await Promise.all([
        FollowsApi.getFollowing(currentUser.user_id),
        FollowsApi.getFollowers(currentUser.user_id),
      ]);

      setFollowing(followingData);
      setFollowers(followersData);
    } catch (error: any) {
      console.error('Failed to fetch follow data:', error);
      setToastMessage('Failed to load follow data');
      setToastColor('danger');
      setShowToast(true);
    } finally {
      setLoading(false);
    }
  };

  const handleUnfollow = async (userId: number) => {
    try {
      setActionLoading(userId);
      await FollowsApi.toggleFollow(userId);

      // Remove from following list
      setFollowing(prev => prev.filter(user => user.user_id !== userId));

      setToastMessage('Unfollowed successfully');
      setToastColor('success');
      setShowToast(true);
    } catch (error: any) {
      console.error('Failed to unfollow:', error);
      setToastMessage('Failed to unfollow user');
      setToastColor('danger');
      setShowToast(true);
    } finally {
      setActionLoading(null);
    }
  };

  const handleFollowBack = async (userId: number) => {
    try {
      setActionLoading(userId);
      await FollowsApi.toggleFollow(userId);

      // Update the followers list to mark as followed back
      setFollowers(prev =>
        prev.map(user =>
          user.user_id === userId ? { ...user, isFollowedBack: true } : user
        )
      );

      // Also add to following list
      const follower = followers.find(u => u.user_id === userId);
      if (follower) {
        setFollowing(prev => [...prev, follower]);
      }

      setToastMessage('Following back successfully');
      setToastColor('success');
      setShowToast(true);
    } catch (error: any) {
      console.error('Failed to follow back:', error);
      setToastMessage('Failed to follow user');
      setToastColor('danger');
      setShowToast(true);
    } finally {
      setActionLoading(null);
    }
  };

  const handleUserClick = (userId: number) => {
    // Navigate to user profile (you'll need to create a ViewProfile route)
    history.push(`/user/${userId}`);
  };

  // Initialize push notifications
  usePushNotifications({
    onTokenReceived: (token) => {
      console.log("[FollowingFollowers] FCM Token received:", token);
    },
    onNotificationReceived: (notification: PushNotificationSchema) => {
      console.log("[FollowingFollowers] Notification received:", notification);
      // Handle new follower notifications
      if (notification.data?.type === 'new_follower') {
        setToastMessage(`${notification.data.username} started following you!`);
        setToastColor('success');
        setShowToast(true);
        setNewFollowersCount(prev => prev + 1);
        // Refresh follow data
        fetchFollowData();
      } else if (notification.data?.type === 'follow_back') {
        setToastMessage(`${notification.data.username} followed you back!`);
        setToastColor('success');
        setShowToast(true);
        fetchFollowData();
      }
    },
    onNotificationActionPerformed: (notification: ActionPerformed) => {
      console.log("[FollowingFollowers] Notification tapped:", notification);
      // Navigate to followers tab when notification is tapped
      if (notification.notification.data?.type === 'new_follower') {
        setTab('followers');
        setNewFollowersCount(0);
      }
    }
  });

  if (!currentUser) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonTitle>Following</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-text-center ion-padding">
          <p>Please log in to view followers and following</p>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/profile" />
          </IonButtons>
          <IonTitle>Following & Followers</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        <IonSegment
          value={tab}
          onIonChange={(e) => {
            setTab(e.detail.value as "following" | "followers");
            if (e.detail.value === "followers") {
              setNewFollowersCount(0);
            }
          }}
        >
          <IonSegmentButton value="following">
            <IonLabel>Following</IonLabel>
          </IonSegmentButton>
          <IonSegmentButton value="followers">
            <IonLabel>
              Followers
              {newFollowersCount > 0 && (
                <IonBadge color="danger" style={{ marginLeft: '8px' }}>
                  {newFollowersCount}
                </IonBadge>
              )}
            </IonLabel>
          </IonSegmentButton>
        </IonSegment>

        {loading ? (
          <div className="ion-text-center ion-padding">
            <IonSpinner name="crescent" />
            <p>Loading...</p>
          </div>
        ) : (
          <>
            {tab === "following" && (
              <>
                <div className="space-between" style={{ margin: "16px 0" }}>
                  <IonLabel>Athletes you follow</IonLabel>
                  <IonLabel>{following.length}</IonLabel>
                </div>

                {following.length === 0 ? (
                  <div className="ion-text-center ion-padding">
                    <p>You are not following anyone yet</p>
                    <IonButton routerLink="/search-runners" size="small">
                      Find Athletes
                    </IonButton>
                  </div>
                ) : (
                  <IonList lines="none">
                    {following.map((user) => (
                      <IonItem key={user.user_id}>
                        <IonAvatar slot="start" onClick={() => handleUserClick(user.user_id)}>
                          <img src={getAvatarUrl(user.profile_picture)} alt={user.name} />
                        </IonAvatar>
                        <IonLabel onClick={() => handleUserClick(user.user_id)}>
                          <h3>{user.name}</h3>
                          <p>@{user.username}</p>
                          {user.location && <p>{user.location}</p>}
                        </IonLabel>
                        <IonButton
                          slot="end"
                          fill="outline"
                          size="small"
                          color="danger"
                          onClick={() => handleUnfollow(user.user_id)}
                          disabled={actionLoading === user.user_id}
                        >
                          {actionLoading === user.user_id ? (
                            <IonSpinner name="crescent" />
                          ) : (
                            'Unfollow'
                          )}
                        </IonButton>
                      </IonItem>
                    ))}
                  </IonList>
                )}
              </>
            )}

            {tab === "followers" && (
              <>
                <div className="space-between" style={{ margin: "16px 0" }}>
                  <IonLabel>People following you</IonLabel>
                  <IonLabel>{followers.length}</IonLabel>
                </div>

                {followers.length === 0 ? (
                  <div className="ion-text-center ion-padding">
                    <p>No followers yet</p>
                  </div>
                ) : (
                  <IonList lines="none">
                    {followers.map((user) => (
                      <IonItem key={user.user_id}>
                        <IonAvatar slot="start" onClick={() => handleUserClick(user.user_id)}>
                          <img src={getAvatarUrl(user.profile_picture)} alt={user.name} />
                        </IonAvatar>
                        <IonLabel onClick={() => handleUserClick(user.user_id)}>
                          <h3>{user.name}</h3>
                          <p>@{user.username}</p>
                          {user.location && <p>{user.location}</p>}
                        </IonLabel>
                        {user.isFollowedBack ? (
                          <IonButton slot="end" fill="solid" size="small" disabled>
                            Following
                          </IonButton>
                        ) : (
                          <IonButton
                            slot="end"
                            fill="outline"
                            size="small"
                            color="primary"
                            onClick={() => handleFollowBack(user.user_id)}
                            disabled={actionLoading === user.user_id}
                          >
                            {actionLoading === user.user_id ? (
                              <IonSpinner name="crescent" />
                            ) : (
                              'Follow Back'
                            )}
                          </IonButton>
                        )}
                      </IonItem>
                    ))}
                  </IonList>
                )}
              </>
            )}
          </>
        )}

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
}
