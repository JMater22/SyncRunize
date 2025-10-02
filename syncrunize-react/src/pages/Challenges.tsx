import React from "react";
import {
  IonPage,
  IonContent,
  IonGrid,
  IonRow,
  IonCol,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonImg,
  IonButton,
  IonIcon,
} from "@ionic/react";
 
import Group1 from "../assets/GROUP 1.png";
import Group2 from "../assets/GROUP 2.png";
import Group4 from "../assets/GROUP 4.png";
import "../components/Challenges/Challenge.css";

const Challenges: React.FC = () => {
  return (
    <IonPage>
      <IonContent className="ion-padding challenges-page">
        <IonGrid>
          {/* ✅ Main Challenge Section */}
          <IonRow className="main-challenge-row ion-align-items-center">
            <IonCol size="12" sizeMd="6" sizeLg="3">
              <IonCard className="challenge-card">
                <IonCardHeader>
                  <IonCardTitle className="challenge-title">
                    5K CHALLENGE
                  </IonCardTitle>
                </IonCardHeader> 
                <IonCardContent>
                  <p className="friends-info">2 friends have joined</p>
                  <IonGrid>
                    <IonRow className="challenge-details">
                      <IonCol size="12">
                        <div className="detail-item">
                          <span>Complete a 5km run</span>
                        </div>
                      </IonCol>
                      <IonCol size="12">
                        <div className="detail-item">
                          <span>April 1, 2025 to April 30, 2025</span>
                        </div>
                      </IonCol>
                    </IonRow>
                  </IonGrid>
                    <IonButton expand="block" className="join-challenge-btn">
                      Join Challenge
                    </IonButton>
                </IonCardContent>
              </IonCard>
            </IonCol>

            <IonCol size="12" sizeMd="6" className="challenge-image-col">
              <IonImg src={Group1} alt="Main Challenge Banner" />
            </IonCol>
          </IonRow>

          <div className="suggested-container">
            {/* ✅ Suggested Challenges Section */}
            <IonRow>
              <IonCol size="12">
                <h3 className="suggested-header">Suggested Challenges</h3>
              </IonCol>
            </IonRow>

            {/* Suggested Grid */}
            <IonRow className="suggested-row">
              <IonCol size="12" sizeMd="6" sizeLg="3">
                <IonCard className="suggested-card">
                  <IonImg src={Group1} alt="Elevation Challenge" />
                    <IonCardContent>
                      <h4 className="challenge-subtitle">
                        April Elevation Challenge
                      </h4>
                      <p className="challenge-description">
                        Climb a total of 2,000 m (6,561 ft) in a month.
                      </p>
                      <p className="challenge-date">
                        April 1, 2025 to April 30, 2025
                      </p>
                    </IonCardContent>
                </IonCard>
              </IonCol>

              <IonCol size="12" sizeMd="6" sizeLg="3">
                <IonCard className="suggested-card">
                  <IonImg src={Group2} alt="10K Challenge" />
                  <IonCardContent>
                    <h4 className="challenge-subtitle">April 10K Challenge</h4>
                    <p>Complete a 10 km (6.2 mi) run.</p>
                    <p>April 1, 2025 to April 30, 2025</p>
                  </IonCardContent>
                </IonCard>
              </IonCol>

              <IonCol size="12" sizeMd="6" sizeLg="3">
                <IonCard className="suggested-card">
                  <IonImg src={Group1} alt="300K Challenge" />
                  <IonCardContent>
                    <h4 className="challenge-subtitle">April 300K Challenge</h4>
                    <p>Run a total of 300 km (186.4 mi) in a month.</p>
                    <p>April 1, 2025 to April 30, 2025</p>
                  </IonCardContent>
                </IonCard>
              </IonCol>

              <IonCol size="12" sizeMd="6" sizeLg="3">
                <IonCard className="suggested-card">
                  <IonImg src={Group4} alt="Half Marathon Challenge" />
                  <IonCardContent>
                    <h4 className="challenge-subtitle">
                      April Half Marathon Challenge
                    </h4>
                    <p>Complete a 13.1 mi (21.1 km) run.</p>
                    <p>April 1, 2025 to April 30, 2025</p>
                  </IonCardContent>
                </IonCard>
              </IonCol>

              <IonCol size="12" sizeMd="6" sizeLg="3">
                <IonCard className="suggested-card">
                  <IonImg src={Group1} alt="Elevation Challenge" />
                  <IonCardContent>
                    <h4 className="challenge-subtitle">
                      April Elevation Challenge
                    </h4>
                    <p>Climb a total of 2,000 m (6,561 ft) in a month.</p>
                    <p>April 1, 2025 to April 30, 2025</p>
                  </IonCardContent>
                </IonCard>
              </IonCol>

              <IonCol size="12" sizeMd="6" sizeLg="3">
                <IonCard className="suggested-card">
                  <IonImg src={Group2} alt="10K Challenge" />
                  <IonCardContent>
                    <h4 className="challenge-subtitle">April 10K Challenge</h4>
                    <p>Complete a 10 km (6.2 mi) run.</p>
                    <p>April 1, 2025 to April 30, 2025</p>
                  </IonCardContent>
                </IonCard>
              </IonCol>

              <IonCol size="12" sizeMd="6" sizeLg="3">
                <IonCard className="suggested-card">
                  <IonImg src={Group1} alt="300K Challenge" />
                  <IonCardContent>
                    <h4 className="challenge-subtitle">April 300K Challenge</h4>
                    <p>Run a total of 300 km (186.4 mi) in a month.</p>
                    <p>April 1, 2025 to April 30, 2025</p>
                  </IonCardContent>
                </IonCard>
              </IonCol>

              <IonCol size="12" sizeMd="6" sizeLg="3">
                <IonCard className="suggested-card">
                  <IonImg src={Group4} alt="Half Marathon Challenge" />
                  <IonCardContent>
                    <h4 className="challenge-subtitle">
                      April Half Marathon Challenge
                    </h4>
                    <p>Complete a 13.1 mi (21.1 km) run.</p>
                    <p>April 1, 2025 to April 30, 2025</p>
                  </IonCardContent>
                </IonCard>
              </IonCol>

              <IonCol size="12" sizeMd="6" sizeLg="3">
                <IonCard className="suggested-card">
                  <IonImg src={Group1} alt="Elevation Challenge" />
                  <IonCardContent>
                    <h4 className="challenge-subtitle">
                      April Elevation Challenge
                    </h4>
                    <p>Climb a total of 2,000 m (6,561 ft) in a month.</p>
                    <p>April 1, 2025 to April 30, 2025</p>
                  </IonCardContent>
                </IonCard>
              </IonCol>

              <IonCol size="12" sizeMd="6" sizeLg="3">
                <IonCard className="suggested-card">
                  <IonImg src={Group2} alt="10K Challenge" />
                  <IonCardContent>
                    <h4 className="challenge-subtitle">April 10K Challenge</h4>
                    <p>Complete a 10 km (6.2 mi) run.</p>
                    <p>April 1, 2025 to April 30, 2025</p>
                  </IonCardContent>
                </IonCard>
              </IonCol>

              <IonCol size="12" sizeMd="6" sizeLg="3">
                <IonCard className="suggested-card">
                  <IonImg src={Group1} alt="300K Challenge" />
                  <IonCardContent>
                    <h4 className="challenge-subtitle">April 300K Challenge</h4>
                    <p>Run a total of 300 km (186.4 mi) in a month.</p>
                    <p>April 1, 2025 to April 30, 2025</p>
                  </IonCardContent>
                </IonCard>
              </IonCol>

              <IonCol size="12" sizeMd="6" sizeLg="3">
                <IonCard className="suggested-card">
                  <IonImg src={Group4} alt="Half Marathon Challenge" />
                  <IonCardContent>
                    <h4 className="challenge-subtitle">
                      April Half Marathon Challenge
                    </h4>
                    <p>Complete a 13.1 mi (21.1 km) run.</p>
                    <p>April 1, 2025 to April 30, 2025</p>
                  </IonCardContent>
                </IonCard>
              </IonCol>
            </IonRow>
          </div>
        </IonGrid>
      </IonContent>
    </IonPage>
  );
};

export default Challenges;
