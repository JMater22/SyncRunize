import React, { useState, useEffect } from "react";
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
  IonImg,
  IonSpinner,
  IonButton,
  IonModal,
  IonIcon,
} from "@ionic/react";
import { close, checkmark } from "ionicons/icons";
import { useChallenges } from "../contexts/ChallengesContext";
import { useUser } from "../contexts/UserContext";
import "../theme/Badges.css";
import GoldBadge from "../components/assets/badges/Gold Animated-modified.png"
import BronzeBadge from "../components/assets/badges/Bronze Animated-modified.png"
import SilverBadge from "../components/assets/badges/Silver Animated-modified.png"

const Badges: React.FC = () => {
  const { currentUser } = useUser();
  const { badges, loading, error, fetchBadges } = useChallenges();

  // Badge history modal state
  const [isBadgeHistoryModalOpen, setIsBadgeHistoryModalOpen] = useState(false);
  const [selectedBadge, setSelectedBadge] = useState<any | null>(null);

  useEffect(() => {
    if (currentUser && badges.length === 0 && !loading) {
      fetchBadges();
    }
  }, [currentUser]);

  // Map badge tiers to their default images
  const getDefaultBadgeImage = (tier: 'Bronze' | 'Silver' | 'Gold') => {
    switch (tier) {
      case 'Bronze': return BronzeBadge;
      case 'Silver': return SilverBadge;
      case 'Gold': return GoldBadge;
      default: return BronzeBadge;
    }
  };

  // Map badge tiers to colors
  const getBadgeColor = (tier: 'Bronze' | 'Silver' | 'Gold') => {
    switch (tier) {
      case 'Bronze': return "#CD7F32";
      case 'Silver': return "#C0C0C0";
      case 'Gold': return "#FFD700";
      default: return "#CD7F32";
    }
  };

  // Group badges by tier
  console.log('[Badges] Badges from context:', badges);
  console.log('[Badges] Badges length:', badges.length);

  const badgesByTier = {
    Gold: badges.filter(b => b.badge_tier === 'Gold'),
    Silver: badges.filter(b => b.badge_tier === 'Silver'),
    Bronze: badges.filter(b => b.badge_tier === 'Bronze'),
  };

  console.log('[Badges] Badges by tier:', badgesByTier);
  console.log('[Badges] Gold count:', badgesByTier.Gold.length);
  console.log('[Badges] Silver count:', badgesByTier.Silver.length);
  console.log('[Badges] Bronze count:', badgesByTier.Bronze.length);

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
        {loading ? (
          <div style={{ textAlign: 'center', padding: '32px' }}>
            <IonSpinner name="crescent" />
            <p>Loading badges...</p>
          </div>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: '32px' }}>
            <p style={{ color: 'var(--ion-color-danger)' }}>{error}</p>
            <IonButton onClick={() => fetchBadges()} size="small">
              Retry
            </IonButton>
          </div>
        ) : !currentUser ? (
          <div style={{ textAlign: 'center', padding: '32px' }}>
            <p style={{ color: 'var(--ion-color-medium)' }}>
              Please log in to view your badges.
            </p>
          </div>
        ) : badges.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px' }}>
            <p style={{ color: 'var(--ion-color-medium)' }}>
              No badges earned yet. Complete challenges to earn badges!
            </p>
            <IonButton routerLink="/community" size="small">
              View Challenges
            </IonButton>
          </div>
        ) : (
          <>
            {/* Gold Badges */}
            {badgesByTier.Gold.length > 0 && (
              <div style={{ marginBottom: '32px', width: '100%', maxWidth: '800px' }}>
                <h2 className="badge-section-header" style={{ color: '#FFD700' }}>
                  Gold Badges ({badgesByTier.Gold.length})
                </h2>
                <div className="badges-grid">
                  {badgesByTier.Gold.map((badge) => (
                    <IonCard
                      key={badge.badge_id}
                      className="badge-card"
                      onClick={() => {
                        setSelectedBadge(badge);
                        setIsBadgeHistoryModalOpen(true);
                      }}
                      style={{ cursor: 'pointer', position: 'relative' }}
                    >
                      <IonCardContent className="badge-card-content">
                        {/* Count indicator - only show if earned 2 or more times */}
                        {badge.count && badge.count > 1 && (
                          <div style={{
                            position: 'absolute',
                            top: '8px',
                            right: '8px',
                            backgroundColor: 'rgba(146, 198, 40, 0.9)',
                            color: '#000',
                            borderRadius: '12px',
                            padding: '4px 10px',
                            fontSize: '12px',
                            fontWeight: 'bold',
                            zIndex: 10
                          }}>
                            ×{badge.count}
                          </div>
                        )}

                        <div className="badge-circle" style={{ backgroundColor: getBadgeColor('Gold') }}>
                          <IonImg
                            src={badge.badge_image_url || getDefaultBadgeImage('Gold')}
                            alt={badge.badge_name}
                            className="badge-icon"
                          />
                        </div>
                        <h3 className="badge-title">{badge.badge_name}</h3>
                        <p style={{ fontSize: '12px', color: '#999999', marginTop: '4px', textAlign: 'center', lineHeight: '1.4' }}>
                          {badge.badge_description}
                        </p>
                        {badge.count && badge.count > 1 && (
                          <p style={{ fontSize: '11px', color: '#92C628', marginTop: '6px', fontWeight: '600', textAlign: 'center' }}>
                            Earned {badge.count} times
                          </p>
                        )}
                      </IonCardContent>
                    </IonCard>
                  ))}
                </div>
              </div>
            )}

            {/* Silver Badges */}
            {badgesByTier.Silver.length > 0 && (
              <div style={{ marginBottom: '32px', width: '100%', maxWidth: '800px' }}>
                <h2 className="badge-section-header" style={{ color: '#C0C0C0' }}>
                  Silver Badges ({badgesByTier.Silver.length})
                </h2>
                <div className="badges-grid">
                  {badgesByTier.Silver.map((badge) => (
                    <IonCard
                      key={badge.badge_id}
                      className="badge-card"
                      onClick={() => {
                        setSelectedBadge(badge);
                        setIsBadgeHistoryModalOpen(true);
                      }}
                      style={{ cursor: 'pointer', position: 'relative' }}
                    >
                      <IonCardContent className="badge-card-content">
                        {/* Count indicator - only show if earned 2 or more times */}
                        {badge.count && badge.count > 1 && (
                          <div style={{
                            position: 'absolute',
                            top: '8px',
                            right: '8px',
                            backgroundColor: 'rgba(146, 198, 40, 0.9)',
                            color: '#000',
                            borderRadius: '12px',
                            padding: '4px 10px',
                            fontSize: '12px',
                            fontWeight: 'bold',
                            zIndex: 10
                          }}>
                            ×{badge.count}
                          </div>
                        )}

                        <div className="badge-circle" style={{ backgroundColor: getBadgeColor('Silver') }}>
                          <IonImg
                            src={badge.badge_image_url || getDefaultBadgeImage('Silver')}
                            alt={badge.badge_name}
                            className="badge-icon"
                          />
                        </div>
                        <h3 className="badge-title">{badge.badge_name}</h3>
                        <p style={{ fontSize: '12px', color: '#999999', marginTop: '4px', textAlign: 'center', lineHeight: '1.4' }}>
                          {badge.badge_description}
                        </p>
                        {badge.count && badge.count > 1 && (
                          <p style={{ fontSize: '11px', color: '#92C628', marginTop: '6px', fontWeight: '600', textAlign: 'center' }}>
                            Earned {badge.count} times
                          </p>
                        )}
                      </IonCardContent>
                    </IonCard>
                  ))}
                </div>
              </div>
            )}

            {/* Bronze Badges */}
            {badgesByTier.Bronze.length > 0 && (
              <div style={{ marginBottom: '32px', width: '100%', maxWidth: '800px' }}>
                <h2 className="badge-section-header" style={{ color: '#CD7F32' }}>
                  Bronze Badges ({badgesByTier.Bronze.length})
                </h2>
                <div className="badges-grid">
                  {badgesByTier.Bronze.map((badge) => (
                    <IonCard
                      key={badge.badge_id}
                      className="badge-card"
                      onClick={() => {
                        setSelectedBadge(badge);
                        setIsBadgeHistoryModalOpen(true);
                      }}
                      style={{ cursor: 'pointer', position: 'relative' }}
                    >
                      <IonCardContent className="badge-card-content">
                        {/* Count indicator - only show if earned 2 or more times */}
                        {badge.count && badge.count > 1 && (
                          <div style={{
                            position: 'absolute',
                            top: '8px',
                            right: '8px',
                            backgroundColor: 'rgba(146, 198, 40, 0.9)',
                            color: '#000',
                            borderRadius: '12px',
                            padding: '4px 10px',
                            fontSize: '12px',
                            fontWeight: 'bold',
                            zIndex: 10
                          }}>
                            ×{badge.count}
                          </div>
                        )}

                        <div className="badge-circle" style={{ backgroundColor: getBadgeColor('Bronze') }}>
                          <IonImg
                            src={badge.badge_image_url || getDefaultBadgeImage('Bronze')}
                            alt={badge.badge_name}
                            className="badge-icon"
                          />
                        </div>
                        <h3 className="badge-title">{badge.badge_name}</h3>
                        <p style={{ fontSize: '12px', color: '#999999', marginTop: '4px', textAlign: 'center', lineHeight: '1.4' }}>
                          {badge.badge_description}
                        </p>
                        {badge.count && badge.count > 1 && (
                          <p style={{ fontSize: '11px', color: '#92C628', marginTop: '6px', fontWeight: '600', textAlign: 'center' }}>
                            Earned {badge.count} times
                          </p>
                        )}
                      </IonCardContent>
                    </IonCard>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Badge History Modal */}
        <IonModal
          isOpen={isBadgeHistoryModalOpen}
          onDidDismiss={() => {
            setIsBadgeHistoryModalOpen(false);
            setSelectedBadge(null);
          }}
        >
          <IonHeader>
            <IonToolbar>
              <IonTitle>Badge History</IonTitle>
              <IonButtons slot="end">
                <IonButton
                  onClick={() => {
                    setIsBadgeHistoryModalOpen(false);
                    setSelectedBadge(null);
                  }}
                >
                  <IonIcon icon={close} />
                </IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>

          <IonContent>
            {selectedBadge && (
              <div style={{ padding: '20px' }}>
                {/* Badge Details */}
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  padding: '20px',
                  borderBottom: '1px solid #e0e0e0',
                  marginBottom: '20px'
                }}>
                  <IonImg
                    src={selectedBadge.badge_image_url || getDefaultBadgeImage(selectedBadge.badge_tier)}
                    alt={selectedBadge.badge_name}
                    style={{ width: '120px', height: '120px', marginBottom: '15px' }}
                  />
                  <h2 style={{ margin: '0 0 8px 0', fontSize: '22px', fontWeight: 'bold', textAlign: 'center' }}>
                    {selectedBadge.badge_name}
                  </h2>
                  <p style={{ margin: '0', color: '#666', textAlign: 'center', fontSize: '14px' }}>
                    {selectedBadge.badge_description}
                  </p>
                  <p style={{ marginTop: '10px', fontSize: '13px', color: '#999' }}>
                    Earned {selectedBadge.count || 1} {selectedBadge.count === 1 ? 'time' : 'times'}
                  </p>
                </div>

                {/* Challenge History */}
                <div>
                  <h3 style={{ marginBottom: '15px', fontSize: '18px', fontWeight: 'bold' }}>
                    Challenges Completed
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {selectedBadge.challenges?.map((challenge: any, index: number) => (
                      <div
                        key={index}
                        style={{
                          padding: '15px',
                          backgroundColor: '#f5f5f5',
                          borderRadius: '8px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}
                      >
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: '600', fontSize: '15px', marginBottom: '4px' }}>
                            {challenge.challenge_name}
                          </div>
                          <div style={{ fontSize: '13px', color: '#666' }}>
                            Completed: {challenge.completed_date}
                          </div>
                        </div>
                        <IonIcon icon={checkmark} style={{ color: '#4CAF50', fontSize: '28px', marginLeft: '12px' }} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </IonContent>
        </IonModal>
      </IonContent>
    </IonPage>
  );
};

export default Badges;