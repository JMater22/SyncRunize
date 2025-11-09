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
  IonRefresherContent,
  IonSegment,
  IonSegmentButton,
  IonSpinner,
  IonBackButton
} from "@ionic/react";
import {
  arrowBack,
  trophyOutline,
  arrowUpOutline,
  arrowDownOutline
} from "ionicons/icons";
import { RefresherEventDetail } from '@ionic/core';
import { useParams } from "react-router-dom";
import '../theme/leaderboards.css';
import ProfilePic from '../components/assets/close-up-portrait-serious-man-with-curly-hair.jpg';
import { usePushNotifications } from "../components/push-notification";
import { PushNotificationSchema, ActionPerformed } from '@capacitor/push-notifications';
import { GroupsApi, LeaderboardEntry } from "../services/groups";
import { getAvatarUrl } from "../lib/utils";

interface LeaderboardUser {
  rank: number;
  name: string;
  weekly: string;
  total: string;
  previousRank?: number;
  isNew?: boolean;
}

const Leaderboard: React.FC = () => {
  const { groupId } = useParams<{ groupId: string }>();

  // Backend state
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [weekFilter, setWeekFilter] = useState<'current' | 'last'>('current');
  const [groupName, setGroupName] = useState<string>('Group');

  // Legacy state for backward compatibility
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);

  // UI state
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastColor, setToastColor] = useState<string | "success" | "danger" | "primary">("primary");
  const [updatesCount, setUpdatesCount] = useState(0);
  const [highlightedRank, setHighlightedRank] = useState<number | null>(null);

  // Fetch leaderboard data on mount and when week filter changes
  useEffect(() => {
    if (groupId) {
      fetchLeaderboard();
      fetchGroupInfo();
    }
  }, [groupId, weekFilter]);

  const fetchGroupInfo = async () => {
    if (!groupId) return;

    try {
      const group = await GroupsApi.getGroup(parseInt(groupId));
      setGroupName(group.name);
    } catch (err: any) {
      console.error('Failed to fetch group info:', err);
    }
  };

  const fetchLeaderboard = async () => {
    if (!groupId) return;

    try {
      setLoading(true);
      setError(null);

      const data = await GroupsApi.getLeaderboard(parseInt(groupId), weekFilter);
      setLeaderboardData(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('Failed to fetch leaderboard:', err);
      setError(err.message || 'Failed to load leaderboard');
      setLeaderboardData([]);
    } finally {
      setLoading(false);
    }
  };

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

  const handleRefresh = async (event: CustomEvent<RefresherEventDetail>) => {
    console.log("Refreshing leaderboard...");

    await fetchLeaderboard();

    // Clear new flags
    setLeaderboard(prev => prev.map(user => ({ ...user, isNew: false, previousRank: undefined })));
    setUpdatesCount(0);
    event.detail.complete();

    setToastMessage("Leaderboard updated!");
    setToastColor("success");
    setShowToast(true);
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

  // Separate top 3 from the rest
  const top3 = leaderboardData.slice(0, 3);
  const restOfLeaderboard = leaderboardData.slice(3);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref={`/group-feed/${groupId}`} />
          </IonButtons>
          <IonTitle>
            {groupName}
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

        {/* Week Filter Segment */}
        <IonSegment value={weekFilter} onIonChange={(e) => setWeekFilter(e.detail.value as 'current' | 'last')}>
          <IonSegmentButton value="current">
            <IonLabel>This Week</IonLabel>
          </IonSegmentButton>
          <IonSegmentButton value="last">
            <IonLabel>Last Week</IonLabel>
          </IonSegmentButton>
        </IonSegment>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '32px' }}>
            <IonSpinner name="crescent" />
            <p>Loading leaderboard...</p>
          </div>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: '32px' }}>
            <p style={{ color: 'var(--ion-color-danger)' }}>{error}</p>
            <IonButton onClick={() => fetchLeaderboard()} size="small">
              Retry
            </IonButton>
          </div>
        ) : leaderboardData.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px' }}>
            <p style={{ color: 'var(--ion-color-medium)' }}>
              No leaderboard data available yet.
            </p>
          </div>
        ) : (
          <>
            {/* Top 3 Hero Display */}
            {top3.length > 0 && (
              <div style={{ padding: '16px', background: 'linear-gradient(180deg, rgba(255,215,0,0.1) 0%, transparent 100%)' }}>
                <h2 className="section-title" style={{ textAlign: 'center', marginBottom: '16px' }}>
                  🏆 Top Performers
                </h2>
                <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'flex-end', marginBottom: '16px' }}>
                  {/* 2nd Place */}
                  {top3[1] && (
                    <div style={{ textAlign: 'center', flex: 1 }}>
                      <div style={{
                        width: '60px',
                        height: '60px',
                        borderRadius: '50%',
                        border: '3px solid #C0C0C0',
                        margin: '0 auto 8px',
                        overflow: 'hidden'
                      }}>
                        <img src={top3[1].avatar || getAvatarUrl(top3[1].name)} alt={top3[1].name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                      <IonBadge color="medium" style={{ marginBottom: '4px' }}>2nd</IonBadge>
                      <p style={{ fontSize: '14px', fontWeight: 'bold', margin: '4px 0' }}>{top3[1].name}</p>
                      <p style={{ fontSize: '12px', color: 'var(--ion-color-medium)' }}>{top3[1].distance}</p>
                    </div>
                  )}

                  {/* 1st Place */}
                  {top3[0] && (
                    <div style={{ textAlign: 'center', flex: 1 }}>
                      <IonIcon icon={trophyOutline} style={{ fontSize: '24px', color: '#FFD700', marginBottom: '4px' }} />
                      <div style={{
                        width: '80px',
                        height: '80px',
                        borderRadius: '50%',
                        border: '4px solid #FFD700',
                        margin: '0 auto 8px',
                        overflow: 'hidden'
                      }}>
                        <img src={top3[0].avatar || getAvatarUrl(top3[0].name)} alt={top3[0].name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                      <IonBadge color="warning" style={{ marginBottom: '4px' }}>1st</IonBadge>
                      <p style={{ fontSize: '16px', fontWeight: 'bold', margin: '4px 0' }}>{top3[0].name}</p>
                      <p style={{ fontSize: '14px', color: 'var(--ion-color-medium)' }}>{top3[0].distance}</p>
                    </div>
                  )}

                  {/* 3rd Place */}
                  {top3[2] && (
                    <div style={{ textAlign: 'center', flex: 1 }}>
                      <div style={{
                        width: '60px',
                        height: '60px',
                        borderRadius: '50%',
                        border: '3px solid #CD7F32',
                        margin: '0 auto 8px',
                        overflow: 'hidden'
                      }}>
                        <img src={top3[2].avatar || getAvatarUrl(top3[2].name)} alt={top3[2].name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                      <IonBadge style={{ backgroundColor: '#CD7F32', marginBottom: '4px' }}>3rd</IonBadge>
                      <p style={{ fontSize: '14px', fontWeight: 'bold', margin: '4px 0' }}>{top3[2].name}</p>
                      <p style={{ fontSize: '12px', color: 'var(--ion-color-medium)' }}>{top3[2].distance}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Full Leaderboard List */}
            <h2 className="section-title">Rankings</h2>
            <IonList>
              {leaderboardData.map((entry) => (
                <IonItem
                  key={`${entry.rank}-${entry.user_id}`}
                  lines="none"
                  style={{
                    backgroundColor: highlightedRank === entry.rank
                      ? 'rgba(255, 193, 7, 0.2)'
                      : 'transparent',
                    transition: 'background-color 0.3s ease'
                  }}
                >
                  <div className={`rank-circle rank-${entry.rank}`}>
                    {entry.rank}
                    {entry.rank <= 3 && (
                      <IonIcon
                        icon={trophyOutline}
                        style={{
                          position: 'absolute',
                          top: '-5px',
                          right: '-5px',
                          fontSize: '12px',
                          color: entry.rank === 1 ? '#FFD700' : entry.rank === 2 ? '#C0C0C0' : '#CD7F32'
                        }}
                      />
                    )}
                  </div>
                  <IonAvatar slot="start">
                    <img src={entry.avatar || getAvatarUrl(entry.name)} alt={entry.name} />
                  </IonAvatar>
                  <IonLabel>
                    <h2>{entry.name}</h2>
                    <p>{entry.runs} runs • {entry.longest} longest</p>
                    {entry.total_time && <p style={{ fontSize: '12px', color: 'var(--ion-color-medium)' }}>Total time: {entry.total_time}</p>}
                  </IonLabel>
                  <div className="total-distance" slot="end">
                    {entry.distance}
                  </div>
                </IonItem>
              ))}
            </IonList>
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
};

export default Leaderboard;