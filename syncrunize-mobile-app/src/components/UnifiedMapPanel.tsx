import React, { useState } from 'react';
import { IonModal, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonContent, IonIcon } from '@ionic/react';
import { close, chevronDown, chevronUp } from 'ionicons/icons';
import HazardListPanel from './HazardListPanel';
import './UnifiedMapPanel.css';

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

interface UnifiedMapPanelProps {
  hazards: Hazard[];
  mode: 'create-route' | 'run-tracking';
  onRecenter: (coords: { lat: number; lng: number }) => void;
  userToken?: string;
}

const UnifiedMapPanel: React.FC<UnifiedMapPanelProps> = ({
  hazards,
  mode,
  onRecenter,
  userToken,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [legendExpanded, setLegendExpanded] = useState(true);
  const [hazardsExpanded, setHazardsExpanded] = useState(true);

  return (
    <>
      {/* Floating Toggle Button - Mobile Optimized */}
      <button
        className="unified-panel-toggle-btn-mobile"
        onClick={() => setShowModal(true)}
        aria-label="View map information"
      >
        <span className="panel-icon">🗺️</span>
        {hazards.length > 0 && (
          <span className="panel-count-badge-mobile">{hazards.length}</span>
        )}
      </button>

      {/* Modal - Mobile Optimized */}
      <IonModal
        isOpen={showModal}
        onDidDismiss={() => setShowModal(false)}
        initialBreakpoint={0.75}
        breakpoints={[0, 0.5, 0.75, 1]}
        className="unified-map-modal"
      >
        <IonHeader>
          <IonToolbar>
            <IonTitle>Map Information</IonTitle>
            <IonButtons slot="end">
              <IonButton onClick={() => setShowModal(false)}>
                <IonIcon icon={close} />
              </IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>

        <IonContent className="unified-panel-content-mobile">
          {/* Section 1: Map Legend (Collapsible) */}
          <div className="panel-section-mobile">
            <button
              className="section-header-mobile"
              onClick={() => setLegendExpanded(!legendExpanded)}
            >
              <span className="section-title-mobile">Map Legend</span>
              <IonIcon icon={legendExpanded ? chevronUp : chevronDown} />
            </button>

            {legendExpanded && (
              <div className="section-content-mobile">
                {/* User-Reported Hazards */}
                <div className="legend-category-mobile">
                  <h4 className="legend-section-title-mobile">User-Reported Hazards</h4>
                  <div className="legend-items-mobile">
                    <div className="legend-item-mobile">
                      <div className="legend-marker-mobile hazard-marker-legend"></div>
                      <span>Active Hazard (Crimson Red)</span>
                    </div>
                    <div className="legend-item-mobile">
                      <div className="legend-marker-mobile hazard-marker-fading"></div>
                      <span>Fading Hazard (Low Trust Score)</span>
                    </div>
                  </div>
                </div>

                {/* Accident Clusters */}
                <div className="legend-category-mobile">
                  <h4 className="legend-section-title-mobile">Accident Clusters (Historical Data)</h4>
                  <div className="legend-items-mobile">
                    <div className="legend-item-mobile">
                      <div className="legend-marker-mobile cluster-low"></div>
                      <span>Low Severity (Yellow-Orange, &lt; 15 accidents)</span>
                    </div>
                    <div className="legend-item-mobile">
                      <div className="legend-marker-mobile cluster-medium"></div>
                      <span>Medium Severity (Dark Orange, 15-29 accidents)</span>
                    </div>
                    <div className="legend-item-mobile">
                      <div className="legend-marker-mobile cluster-high"></div>
                      <span>High Severity (Vivid Orange, ≥ 30 accidents)</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Section 2: Hazard List (Collapsible) */}
          <div className="panel-section-mobile">
            <button
              className="section-header-mobile"
              onClick={() => setHazardsExpanded(!hazardsExpanded)}
            >
              <span className="section-title-mobile">
                Hazards {mode === 'create-route' ? '(Newest)' : '(Nearest)'}
                <span className="hazard-count-inline-mobile"> • {hazards.length}</span>
              </span>
              <IonIcon icon={hazardsExpanded ? chevronUp : chevronDown} />
            </button>

            {hazardsExpanded && (
              <div className="section-content-mobile hazard-list-section-mobile">
                {hazards.length === 0 ? (
                  <div className="no-hazards-mobile">
                    <p>No hazards found in this area</p>
                  </div>
                ) : (
                  <HazardListPanel
                    hazards={hazards}
                    mode={mode}
                    onRecenter={onRecenter}
                    userToken={userToken}
                    embedded={true}
                  />
                )}
              </div>
            )}
          </div>
        </IonContent>
      </IonModal>
    </>
  );
};

export default UnifiedMapPanel;
