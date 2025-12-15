import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { IonIcon } from '@ionic/react';
import { personCircle } from 'ionicons/icons';
import './HazardListPanel.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

interface Hazard {
  report_id: number;
  user_id?: number; // Optional since API returns user data in nested 'users' object
  incident_type: string;
  description: string;
  lat: number;
  lng: number;
  cached_address?: string | null; // Human-readable address from reverse geocoding
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
  embedded?: boolean; // If true, renders without toggle button and panel wrapper
}

const HazardListPanel: React.FC<HazardListPanelProps> = ({
  hazards,
  mode,
  onRecenter,
  userToken,
  embedded = false,
}) => {
  const [showPanel, setShowPanel] = useState(false);
  const [expandedHazardId, setExpandedHazardId] = useState<number | null>(null);
  const [userConfirmations, setUserConfirmations] = useState<Set<number>>(new Set());
  const [confirmersMap, setConfirmersMap] = useState<Map<number, any[]>>(new Map());
  const [confirmationCounts, setConfirmationCounts] = useState<Map<number, number>>(new Map());

  // Fetch user's confirmations on mount
  useEffect(() => {
    if (userToken) {
      fetchUserConfirmations();
    }
  }, [userToken]);

  // Initialize confirmation counts from hazards data
  useEffect(() => {
    const counts = new Map<number, number>();
    hazards.forEach((hazard) => {
      if (hazard.confirmation_count !== undefined) {
        counts.set(hazard.report_id, hazard.confirmation_count);
      }
    });

    // Only update if counts actually changed
    setConfirmationCounts((prevCounts) => {
      // Check if sizes are different
      if (prevCounts.size !== counts.size) return counts;

      // Check if any values changed
      for (const [id, count] of counts) {
        if (prevCounts.get(id) !== count) return counts;
      }

      // No changes, return previous state to prevent re-render
      return prevCounts;
    });
  }, [hazards]);

  const fetchUserConfirmations = async () => {
    try {
      // Note: This endpoint needs to be implemented in the backend
      // For now, we'll check each hazard individually
      const confirmationSet = new Set<number>();

      const promises = hazards.map(async (hazard) => {
        try {
          const response = await axios.get(
            `${API_URL}/confirmations/${hazard.report_id}/check`,
            {
              headers: { Authorization: `Bearer ${userToken}` },
            }
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

  const fetchHazardConfirmers = async (reportId: number) => {
    try {
      const response = await axios.get(
        `${API_URL}/confirmations/${reportId}`
      );

      setConfirmersMap((prev) => new Map(prev).set(reportId, response.data.confirmations || []));
    } catch (error) {
      console.error(`Error fetching confirmers for hazard ${reportId}:`, error);
    }
  };

  const handleTogglePanel = () => {
    setShowPanel(!showPanel);
  };

  const handleExpandHazard = (reportId: number) => {
    const isExpanding = expandedHazardId !== reportId;
    setExpandedHazardId(isExpanding ? reportId : null);

    if (isExpanding && !confirmersMap.has(reportId)) {
      fetchHazardConfirmers(reportId);
    }
  };

  const handleConfirmToggle = async (reportId: number, event?: React.MouseEvent) => {
    // Stop event propagation to prevent triggering parent click handlers
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
        // Un-confirm
        await axios.delete(
          `${API_URL}/confirmations/${reportId}`,
          {
            headers: { Authorization: `Bearer ${userToken}` },
          }
        );

        setUserConfirmations((prev) => {
          const newSet = new Set(prev);
          newSet.delete(reportId);
          return newSet;
        });

        // Update local count
        setConfirmationCounts((prev) => {
          const newMap = new Map(prev);
          const currentCount = newMap.get(reportId) || 0;
          newMap.set(reportId, Math.max(0, currentCount - 1));
          return newMap;
        });
      } else {
        // Confirm
        await axios.post(
          `${API_URL}/confirmations/${reportId}`,
          {},
          {
            headers: { Authorization: `Bearer ${userToken}` },
          }
        );

        setUserConfirmations((prev) => new Set(prev).add(reportId));

        // Update local count
        setConfirmationCounts((prev) => {
          const newMap = new Map(prev);
          const currentCount = newMap.get(reportId) || 0;
          newMap.set(reportId, currentCount + 1);
          return newMap;
        });
      }

      // Refresh confirmers list
      await fetchHazardConfirmers(reportId);
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
    // Stop event propagation to prevent triggering parent click handlers
    if (event) {
      event.stopPropagation();
    }
    onRecenter({ lat: hazard.lat, lng: hazard.lng });
  };

  const formatTimeAgo = (timestamp: string): string => {
    const now = new Date();
    const then = new Date(timestamp);
    const diffMs = now.getTime() - then.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins} ${diffMins === 1 ? 'minute' : 'minutes'} ago`;
    if (diffHours < 24) return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
    if (diffDays < 7) return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} ${Math.floor(diffDays / 7) === 1 ? 'week' : 'weeks'} ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} ${Math.floor(diffDays / 30) === 1 ? 'month' : 'months'} ago`;
    return `${Math.floor(diffDays / 365)} ${Math.floor(diffDays / 365) === 1 ? 'year' : 'years'} ago`;
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
    if (severity >= 0.7) return 'severity-high';
    if (severity >= 0.4) return 'severity-medium';
    return 'severity-low';
  };

  const renderConfirmerAvatars = (reportId: number) => {
    const confirmers = confirmersMap.get(reportId) || [];
    const displayConfirmers = confirmers.slice(0, 3);
    const remainingCount = Math.max(0, confirmers.length - 3);

    return (
      <div className="confirmer-avatars">
        {displayConfirmers.map((confirmer, index) => (
          confirmer.profile_pic ? (
            <img
              key={confirmer.user_id}
              src={confirmer.profile_pic}
              alt={confirmer.full_name}
              className="confirmer-avatar"
              style={{ zIndex: 10 - index }}
              title={confirmer.full_name}
            />
          ) : (
            <IonIcon
              key={confirmer.user_id}
              icon={personCircle}
              className="confirmer-avatar confirmer-avatar-icon"
              style={{ zIndex: 10 - index }}
              title={confirmer.full_name}
            />
          )
        ))}
        {remainingCount > 0 && (
          <span className="confirmer-more">+{remainingCount} more</span>
        )}
      </div>
    );
  };

  // If embedded mode, render only the hazard list items without wrapper
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
        <div className="no-hazards">
          <p>No hazards found in this area</p>
        </div>
      ) : (
        sortedHazards.map((hazard) => {
                const isExpanded = expandedHazardId === hazard.report_id;
                const isConfirmed = userConfirmations.has(hazard.report_id);
                const confirmCount = confirmationCounts.get(hazard.report_id) || 0;
                const isFading = (hazard.decayed_trust_score || hazard.trust_score) < 0.3;

                return (
                  <div
                    key={hazard.report_id}
                    className={`hazard-item ${isExpanded ? 'expanded' : ''} ${isFading ? 'fading' : ''}`}
                  >
                    {/* Collapsed State */}
                    <div
                      className="hazard-item-header"
                      onClick={() => handleExpandHazard(hazard.report_id)}
                    >
                      {hazard.users?.profile_picture ? (
                        <img
                          src={hazard.users.profile_picture}
                          alt="Reporter"
                          className="reporter-avatar"
                        />
                      ) : (
                        <IonIcon
                          icon={personCircle}
                          className="reporter-avatar reporter-avatar-icon"
                        />
                      )}
                      <span className="hazard-icon-large">
                        {getHazardIcon(hazard.incident_type)}
                      </span>
                      <span className="hazard-type-text">{hazard.incident_type}</span>
                      <span className="expand-icon">{isExpanded ? '▲' : '▼'}</span>
                    </div>

                    {/* Expanded State */}
                    {isExpanded && (
                      <div className="hazard-item-details">
                        <p className="hazard-description">{hazard.description}</p>

                        <div className="hazard-meta">
                          <span className="meta-item" title={`${hazard.lat.toFixed(4)}, ${hazard.lng.toFixed(4)}`}>
                            📍 {hazard.cached_address || `${hazard.lat.toFixed(4)}, ${hazard.lng.toFixed(4)}`}
                          </span>
                          <span className={`severity-badge ${getSeverityColor(hazard.severity_weight)}`}>
                            Severity: {(hazard.severity_weight * 100).toFixed(0)}%
                          </span>
                        </div>

                        {/* Confirmation Section */}
                        <div className="confirmation-section">
                          <div className="confirmation-stats">
                            <span className="confirmation-count">
                              {confirmCount} {confirmCount === 1 ? 'person' : 'people'} confirmed
                            </span>
                            {hazard.last_confirmed_at && (
                              <span className="last-confirmed">
                                Last confirmed {formatTimeAgo(hazard.last_confirmed_at)}
                              </span>
                            )}
                          </div>

                          {confirmCount > 0 && renderConfirmerAvatars(hazard.report_id)}

                          <button
                            className={`confirm-btn ${isConfirmed ? 'confirmed' : ''}`}
                            onClick={(e) => handleConfirmToggle(hazard.report_id, e)}
                          >
                            {isConfirmed ? '✓ Confirmed' : 'Confirm'}
                          </button>
                        </div>

                        {/* Recenter Button */}
                        <button
                          className="recenter-btn"
                          onClick={(e) => handleRecenter(hazard, e)}
                        >
                          Show on map
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
      )
    );
  };

  // Embedded mode: render only the hazard items
  if (embedded) {
    return <>{renderHazardItems()}</>;
  }

  // Standalone mode: render with toggle button and panel wrapper
  return (
    <>
      {/* Toggle Button */}
      <button
        className="hazard-list-toggle-btn"
        onClick={handleTogglePanel}
        aria-label="Toggle hazard list"
      >
        <span className="hazard-icon">📍</span>
        {hazards.length > 0 && (
          <span className="hazard-count-badge">{hazards.length}</span>
        )}
      </button>

      {/* Sidebar Panel */}
      {showPanel && (
        <div className="map-hazard-panel">
          <div className="panel-header">
            <h3>Hazards {mode === 'create-route' ? '(Newest)' : '(Nearest)'}</h3>
            <button className="close-btn" onClick={handleTogglePanel}>
              ✕
            </button>
          </div>

          <div className="hazard-list-container">
            {renderHazardItems()}
          </div>
        </div>
      )}
    </>
  );
};

export default HazardListPanel;
