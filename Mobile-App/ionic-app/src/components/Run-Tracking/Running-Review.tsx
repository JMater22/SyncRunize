

import { useState } from "react"
import {
  IonApp,
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonItem,
  IonLabel,
  IonSelect,
  IonSelectOption,
  IonButton,
  IonButtons,
  IonIcon,
  setupIonicReact, 
} from "@ionic/react"
import { star, starOutline, arrowBack } from "ionicons/icons"
import "../theme/Running-Review.css"; // custom styles if needed




export default function RunningReview() {
  const [selectedHazard, setSelectedHazard] = useState<string>("construction")
  const [rating, setRating] = useState<number>(0)

  const handleStarClick = (starIndex: number) => {
    setRating(starIndex + 1)
  }

  const handleSubmit = () => {
    console.log("Submitted:", { hazard: selectedHazard, rating })
    // Handle submit logic here
  }

  const handleContinue = () => {
    console.log("Continue clicked")
    // Handle continue logic here
  }

  return (
    <IonApp>
      <IonPage className="review-page">
        <IonHeader className="review-header">
          <IonToolbar>
            <IonButtons slot="start">
              <IonButton fill="clear" routerLink="/profile">
                <IonIcon icon={arrowBack} />
              </IonButton>
            </IonButtons>
            <IonTitle>Running Review</IonTitle>
          </IonToolbar>
        </IonHeader>

        <IonContent className="review-content">
          <div className="review-container">
            <p className="description-text ion-margin-bottom">Review submitted hazards and rate their reliability.</p>

            {/* Hazard Selection */}
            <IonItem className="ion-margin-bottom">
              <IonLabel position="stacked">Hazard passed:</IonLabel>
             <IonSelect
  value={selectedHazard}
  onIonChange={(e) => setSelectedHazard(e.detail.value as string)}
  interface="popover"
  placeholder="Select a hazard"
>
  <IonSelectOption value="construction">Construction</IonSelectOption>
  <IonSelectOption value="pothole">Pothole or Road Damage</IonSelectOption>
  <IonSelectOption value="traffic">Heavy Traffic</IonSelectOption>
  <IonSelectOption value="unsafe_area">Unsafe Area</IonSelectOption>
  <IonSelectOption value="other">Other Hazard</IonSelectOption>
</IonSelect>

            </IonItem>

            {/* Accuracy Rating */}
            <div className="rating-section ion-margin-bottom">
              <IonLabel className="rating-label">
                <strong>Was this hazard accurate?</strong>
              </IonLabel>
              <div className="star-rating ion-margin-top">
                {[0, 1, 2, 3, 4].map((starIndex) => (
                  <IonButton
                    key={starIndex}
                    fill="clear"
                    className="star-button"
                    onClick={() => handleStarClick(starIndex)}
                  >
                    <IonIcon
                      icon={starIndex < rating ? star : starOutline}
                      className={`star-icon ${starIndex < rating ? "filled" : "empty"}`}
                    />
                  </IonButton>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="action-buttons ion-margin-top">
              <IonButton expand="block" color="success" className="ion-margin-bottom" onClick={handleSubmit}>
                Submit
              </IonButton>
              <IonButton expand="block" fill="outline" color="success" onClick={handleContinue}>
                Continue
              </IonButton>
            </div>
          </div>
        </IonContent>
      </IonPage>
    </IonApp>
  )
}
