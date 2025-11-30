import React, { useState } from 'react';
import HazardListPanel from './HazardListPanel';
import './UnifiedMapPanel.css';

interface Hazard {
  report_id: number;
  user_id: number;
  incident_type: string;
  description: string;
  lat: number;
  lng: number;
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
    profile_picture?: string;
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
  const [showPanel, setShowPanel] = useState(false);
  const [legendExpanded, setLegendExpanded] = useState(true);
  const [hazardsExpanded, setHazardsExpanded] = useState(true);

  return (
    <>
      {/* Toggle Button */}
      <button
        className="unified-panel-toggle-btn"
        onClick={() => setShowPanel(!showPanel)}
        aria-label="Toggle map panel"
      >
        <span className="panel-icon">🗺️</span>
        {hazards.length > 0 && (
          <span className="panel-count-badge">{hazards.length}</span>
        )}
      </button>

      {/* Unified Panel */}
      {showPanel && (
        <div className="unified-map-panel">
          {/* Panel Header */}
          <div className="unified-panel-header">
            <h3>Map Information</h3>
            <button className="close-btn" onClick={() => setShowPanel(false)}>
              ✕
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="unified-panel-content">

            {/* Section 1: Map Legend (Collapsible) */}
            <div className="panel-section">
              <button
                className="section-header"
                onClick={() => setLegendExpanded(!legendExpanded)}
              >
                <span className="section-title">Map Legend</span>
                <span className="section-icon">{legendExpanded ? '▲' : '▼'}</span>
              </button>

              {legendExpanded && (
                <div className="section-content">
                  {/* User-Reported Hazards */}
                  <div className="legend-category">
                    <h4 className="legend-section-title">User-Reported Hazards</h4>
                    <div className="legend-items">
                      <div className="legend-item">
                        <div className="legend-marker hazard-marker-legend"></div>
                        <span>Active Hazard (Crimson Red)</span>
                      </div>
                      <div className="legend-item">
                        <div className="legend-marker hazard-marker-fading"></div>
                        <span>Fading Hazard (Low Trust Score)</span>
                      </div>
                    </div>
                  </div>

                  {/* Accident Clusters */}
                  <div className="legend-category">
                    <h4 className="legend-section-title">Accident Clusters (Historical Data)</h4>
                    <div className="legend-items">
                      <div className="legend-item">
                        <div className="legend-marker cluster-low"></div>
                        <span>Low Severity (Yellow-Orange, &lt; 15 accidents)</span>
                      </div>
                      <div className="legend-item">
                        <div className="legend-marker cluster-medium"></div>
                        <span>Medium Severity (Dark Orange, 15-29 accidents)</span>
                      </div>
                      <div className="legend-item">
                        <div className="legend-marker cluster-high"></div>
                        <span>High Severity (Vivid Orange, ≥ 30 accidents)</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Section 2: Hazard List (Collapsible) */}
            <div className="panel-section">
              <button
                className="section-header"
                onClick={() => setHazardsExpanded(!hazardsExpanded)}
              >
                <span className="section-title">
                  Hazards {mode === 'create-route' ? '(Newest)' : '(Nearest)'}
                  <span className="hazard-count-inline">• {hazards.length}</span>
                </span>
                <span className="section-icon">{hazardsExpanded ? '▲' : '▼'}</span>
              </button>

              {hazardsExpanded && (
                <div className="section-content hazard-list-section">
                  {hazards.length === 0 ? (
                    <div className="no-hazards">
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
          </div>
        </div>
      )}
    </>
  );
};

export default UnifiedMapPanel;
