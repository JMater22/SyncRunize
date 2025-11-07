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
} from "@ionic/react";
import { useChallenges } from "../contexts/ChallengesContext";
import { useUser } from "../contexts/UserContext";
import "../theme/Badges.css";
import GoldBadge from "../components/assets/badges/Gold Animated-modified.png"
import BronzeBadge from "../components/assets/badges/Bronze Animated-modified.png"
import SilverBadge from "../components/assets/badges/Silver Animated-modified.png"

const Badges: React.FC = () => {
  const { currentUser } = useUser();
  const { badges, loading, error, fetchBadges } = useChallenges();

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
  const badgesByTier = {
    Gold: badges.filter(b => b.badge_tier === 'Gold'),
    Silver: badges.filter(b => b.badge_tier === 'Silver'),
    Bronze: badges.filter(b => b.badge_tier === 'Bronze'),
  };

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
              <div style={{ marginBottom: '24px' }}>
                <h2 style={{ padding: '0 16px', fontSize: '20px', fontWeight: 'bold', color: '#FFD700' }}>
                  Gold Badges ({badgesByTier.Gold.length})
                </h2>
                <div className="badges-grid">
                  {badgesByTier.Gold.map((badge) => (
                    <IonCard key={badge.badge_id} className="badge-card">
                      <IonCardContent className="badge-card-content">
                        <div className="badge-circle" style={{ backgroundColor: getBadgeColor('Gold') }}>
                          <IonImg
                            src={badge.badge_image_url || getDefaultBadgeImage('Gold')}
                            alt={badge.badge_name}
                            className="badge-icon"
                          />
                        </div>
                        <h3 className="badge-title">{badge.badge_name}</h3>
                        <p style={{ fontSize: '12px', color: 'var(--ion-color-medium)', marginTop: '4px' }}>
                          {badge.badge_description}
                        </p>
                      </IonCardContent>
                    </IonCard>
                  ))}
                </div>
              </div>
            )}

            {/* Silver Badges */}
            {badgesByTier.Silver.length > 0 && (
              <div style={{ marginBottom: '24px' }}>
                <h2 style={{ padding: '0 16px', fontSize: '20px', fontWeight: 'bold', color: '#C0C0C0' }}>
                  Silver Badges ({badgesByTier.Silver.length})
                </h2>
                <div className="badges-grid">
                  {badgesByTier.Silver.map((badge) => (
                    <IonCard key={badge.badge_id} className="badge-card">
                      <IonCardContent className="badge-card-content">
                        <div className="badge-circle" style={{ backgroundColor: getBadgeColor('Silver') }}>
                          <IonImg
                            src={badge.badge_image_url || getDefaultBadgeImage('Silver')}
                            alt={badge.badge_name}
                            className="badge-icon"
                          />
                        </div>
                        <h3 className="badge-title">{badge.badge_name}</h3>
                        <p style={{ fontSize: '12px', color: 'var(--ion-color-medium)', marginTop: '4px' }}>
                          {badge.badge_description}
                        </p>
                      </IonCardContent>
                    </IonCard>
                  ))}
                </div>
              </div>
            )}

            {/* Bronze Badges */}
            {badgesByTier.Bronze.length > 0 && (
              <div style={{ marginBottom: '24px' }}>
                <h2 style={{ padding: '0 16px', fontSize: '20px', fontWeight: 'bold', color: '#CD7F32' }}>
                  Bronze Badges ({badgesByTier.Bronze.length})
                </h2>
                <div className="badges-grid">
                  {badgesByTier.Bronze.map((badge) => (
                    <IonCard key={badge.badge_id} className="badge-card">
                      <IonCardContent className="badge-card-content">
                        <div className="badge-circle" style={{ backgroundColor: getBadgeColor('Bronze') }}>
                          <IonImg
                            src={badge.badge_image_url || getDefaultBadgeImage('Bronze')}
                            alt={badge.badge_name}
                            className="badge-icon"
                          />
                        </div>
                        <h3 className="badge-title">{badge.badge_name}</h3>
                        <p style={{ fontSize: '12px', color: 'var(--ion-color-medium)', marginTop: '4px' }}>
                          {badge.badge_description}
                        </p>
                      </IonCardContent>
                    </IonCard>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </IonContent>
    </IonPage>
  );
};

export default Badges;