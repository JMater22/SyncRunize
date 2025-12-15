import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { IonIcon, IonButton, IonChip } from '@ionic/react';
import { personCircle, locationOutline, checkmarkCircle, checkmarkCircleOutline, trashOutline } from 'ionicons/icons';
import './HazardListPanel.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

interface Hazard {
  report_id: number;
  user_id?: number;
  incident_type: string;
  description: string;
  lat: number;
  lng: number;
  cached_address?: string | null;
  reported_at: string;
  effective_reported_at?: string;
  trust_score: number;
  decayed_trust_score?: number;
  severity_weight: number;
  confirmation_count?: number;
  last_confirmed_at?: string;
  distance_km?: number;
  users?: {
    username: string;
    profile_picture?: string | null;
  };
}

interface HazardListPanelProps {
  hazards: Hazard[];
  mode: 'create-route' | 'run-tracking';
  onRecenter: (coords: { lat: number; lng: number }) => void;
  userToken?: string;
  embedded?: boolean;
}

const HazardListPanel: React.FC<HazardListPanelProps> = ({
  hazards,
  mode,
  onRecenter,
  userToken,
  embedded = false,
}) => {
  const [expandedHazardId, setExpandedHazardId] = useState<number | null>(null);
  const [userConfirmations, setUserConfirmations] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (userToken) {
      fetchUserConfirmations();
    }
  }, [userToken]);

  const fetchUserConfirmations = async () => {
    try {
      const confirmationSet = new Set<number>();
      const promises = hazards.map(async (hazard) => {
        try {
          const response = await axios.get(
            `${API_URL}/confirmations/${hazard.report_id}/check`,
            { headers: { Authorization: `Bearer ${userToken}` } }
          );
          if (response.data.confirmed) {
            confirmationSet.add(hazard.report_id);
          }
        } catch (error) {
          console.error(`Error checking confirmation for hazard ${hazard.report_id}:`, error);
        }
      });

      await Promise.all(promises);
      setUserConfirmations(confirmationSet);
    } catch (error) {
      console.error('Error fetching user confirmations:', error);
    }
  };

  const handleExpandHazard = (reportId: number) => {
    const isExpanding = expandedHazardId !== reportId;
    setExpandedHazardId(isExpanding ? reportId : null);
  };

  const handleConfirmToggle = async (reportId: number, event?: React.MouseEvent) => {
    if (event) {
      event.stopPropagation();
    }

    if (!userToken) {
      alert('Please log in to confirm hazards');
      return;
    }

    const isConfirmed = userConfirmations.has(reportId);

    try {
      if (isConfirmed) {
        await axios.delete(`${API_URL}/confirmations/${reportId}`, {
          headers: { Authorization: `Bearer ${userToken}` },
        });

        setUserConfirmations((prev) => {
          const newSet = new Set(prev);
          newSet.delete(reportId);
          return newSet;
        });
      } else {
        await axios.post(`${API_URL}/confirmations/${reportId}`, {}, {
          headers: { Authorization: `Bearer ${userToken}` },
        });

        setUserConfirmations((prev) => new Set(prev).add(reportId));
      }
    } catch (error: any) {
      console.error('Error toggling confirmation:', error);
      if (error.response?.status === 409) {
        alert('You have already confirmed this hazard');
      } else {
        alert('Failed to update confirmation. Please try again.');
      }
    }
  };

  const handleRecenter = (hazard: Hazard, event?: React.MouseEvent) => {
    if (event) {
      event.stopPropagation();
    }
    onRecenter({ lat: hazard.lat, lng: hazard.lng });
  };

  const handleRemoveHazard = async (reportId: number, event?: React.MouseEvent) => {
    if (event) {
      event.stopPropagation();
    }

    if (!userToken) {
      alert('Please log in to remove hazards');
      return;
    }

    if (!confirm('Are you sure you want to mark this hazard as resolved?')) {
      return;
    }

    try {
      await axios.patch(
        `${API_URL}/hazards/${reportId}`,
        { status: 'resolved' },
        {
          headers: { Authorization: `Bearer ${userToken}` }
        }
      );

      // Trigger parent component to refresh hazards list
      alert('Hazard marked as resolved');
      window.location.reload(); // Simple refresh for now
    } catch (error: any) {
      console.error('[HazardListPanel] Failed to remove hazard:', error);
      const errorMsg = error.response?.data?.error || 'Failed to remove hazard';
      alert(`Error: ${errorMsg}`);
    }
  };

  const formatTimeAgo = (timestamp: string): string => {
    const now = new Date();
    const then = new Date(timestamp);
    const diffMs = now.getTime() - then.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo ago`;
    return `${Math.floor(diffDays / 365)}y ago`;
  };

  const getHazardIcon = (incidentType: string): string => {
    const icons: Record<string, string> = {
      'Pothole': '🕳️',
      'Uneven Surface': '⚠️',
      'Slippery Surface': '🧊',
      'Obstruction': '🚧',
      'Poor Lighting': '💡',
      'Stray Animal': '🐕',
      'Traffic': '🚗',
      'Construction': '🏗️',
      'Flooding': '💧',
      'Other': '⚠️',
    };
    return icons[incidentType] || '⚠️';
  };

  const getSeverityColor = (severity: number): string => {
    if (severity >= 0.7) return 'danger';
    if (severity >= 0.4) return 'warning';
    return 'success';
  };

  const renderHazardItems = () => {
    // Sort hazards based on mode
    const sortedHazards = [...hazards].sort((a, b) => {
      if (mode === 'create-route') {
        // Sort by newest first (reported_at descending)
        const dateA = new Date(a.effective_reported_at || a.reported_at).getTime();
        const dateB = new Date(b.effective_reported_at || b.reported_at).getTime();
        return dateB - dateA; // Newest first
      } else {
        // Sort by nearest first (distance ascending)
        return (a.distance_km || 0) - (b.distance_km || 0);
      }
    });

    return (
      sortedHazards.length === 0 ? (
        <div className="no-hazards-mobile">
          <p>No hazards found in this area</p>
        </div>
      ) : (
        sortedHazards.map((hazard) => {
        const isExpanded = expandedHazardId === hazard.report_id;
        const isConfirmed = userConfirmations.has(hazard.report_id);
        const isFading = (hazard.decayed_trust_score || hazard.trust_score) < 0.3;

        return (
          <div
            key={hazard.report_id}
            className={`hazard-item-mobile ${isExpanded ? 'expanded' : ''} ${isFading ? 'fading' : ''}`}
          >
            {/* Header - Always visible */}
            <div
              className="hazard-item-header-mobile"
              onClick={() => handleExpandHazard(hazard.report_id)}
            >
              <div className="hazard-header-left">
                {hazard.users?.profile_picture ? (
                  <img
                    src={hazard.users.profile_picture}
                    alt="Reporter"
                    className="reporter-avatar-mobile"
                  />
                ) : (
                  <IonIcon
                    icon={personCircle}
                    className="reporter-avatar-mobile reporter-avatar-icon-mobile"
                  />
                )}
                <div className="hazard-header-info">
                  <div className="hazard-type-row">
                    <span className="hazard-icon-mobile">{getHazardIcon(hazard.incident_type)}</span>
                    <span className="hazard-type-text-mobile">{hazard.incident_type}</span>
                  </div>
                  <span className="hazard-time-mobile">{formatTimeAgo(hazard.reported_at)}</span>
                </div>
              </div>
              <IonChip color={getSeverityColor(hazard.severity_weight)} className="severity-chip-mobile">
                {(hazard.severity_weight * 100).toFixed(0)}%
              </IonChip>
            </div>

            {/* Expanded Details */}
            {isExpanded && (
              <div className="hazard-item-details-mobile">
                <p className="hazard-description-mobile">{hazard.description}</p>

                <div className="hazard-location-mobile">
                  <IonIcon icon={locationOutline} />
                  <span>{hazard.cached_address || `${hazard.lat.toFixed(4)}, ${hazard.lng.toFixed(4)}`}</span>
                </div>

                {/* Action Buttons */}
                <div className="hazard-actions-mobile">
                  <IonButton
                    expand="block"
                    fill={isConfirmed ? 'solid' : 'outline'}
                    color={isConfirmed ? 'success' : 'primary'}
                    onClick={(e) => handleConfirmToggle(hazard.report_id, e)}
                    className="confirm-btn-mobile"
                  >
                    <IonIcon
                      slot="start"
                      icon={isConfirmed ? checkmarkCircle : checkmarkCircleOutline}
                    />
                    {isConfirmed ? 'Confirmed' : 'Confirm'}
                  </IonButton>

                  <IonButton
                    expand="block"
                    fill="outline"
                    color="danger"
                    onClick={(e) => handleRemoveHazard(hazard.report_id, e)}
                    className="remove-btn-mobile"
                  >
                    <IonIcon slot="start" icon={trashOutline} />
                    Remove Hazard
                  </IonButton>

                  <IonButton
                    expand="block"
                    fill="clear"
                    onClick={(e) => handleRecenter(hazard, e)}
                    className="recenter-btn-mobile"
                  >
                    <IonIcon slot="start" icon={locationOutline} />
                    Show on Map
                  </IonButton>
                </div>
              </div>
            )}
          </div>
        );
      })
    )
    );
  };

  return <>{renderHazardItems()}</>;
};

export default HazardListPanel;
