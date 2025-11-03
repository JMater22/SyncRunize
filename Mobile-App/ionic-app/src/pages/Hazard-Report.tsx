import React, { useState } from "react";
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonButton,
  IonItem,
  IonLabel,
  IonRadioGroup,
  IonRadio,
  IonInput,
  IonIcon,
  IonBackButton,
  IonButtons,
  IonGrid,
  IonRow,
  IonCol,
  IonText,
  IonImg,
  IonToast,
} from "@ionic/react";
import {
  cameraOutline,
  locationOutline,
  pinOutline,
  star,
  starOutline,
  trailSignOutline,
  carOutline,
  warningOutline,
  buildOutline,
  closeCircle, imageOutline
} from "ionicons/icons";
import { useHistory } from "react-router-dom";
import { Camera, CameraResultType, CameraSource } from "@capacitor/camera";


import "../theme/Hazard-Report.css";

const ReportHazard: React.FC = () => {
  const history = useHistory();

  const [selectedHazard, setSelectedHazard] = useState<string>("pothole");
  const [otherHazardText, setOtherHazardText] = useState<string>("");
  const [confidenceRating, setConfidenceRating] = useState<number>(4);
  const [hazardPhoto, setHazardPhoto] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string>("");
  const [showToast, setShowToast] = useState<boolean>(false);
    const [image, setImage] = useState<string | null>(null);

  /** 📸 Add Photo (Camera or Gallery) - Integrated from CreatePost */
  const handleAddPhoto = async () => {
    try {
      const photo = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Prompt, // Allows choosing camera or gallery
      });

      if (photo?.dataUrl) {
        setHazardPhoto(photo.dataUrl);
        showToastMessage("Photo added successfully!");
      }
    } catch (error: any) {
      // Silently ignore if user cancels
      if (error?.message?.includes("cancel") || error?.message?.includes("User cancelled")) {
        return;
      }
      console.error("Camera error:", error);
      showToastMessage("Failed to select photo.");
    }
  };

  /** 🗑️ Remove photo */
  const handleRemovePhoto = () => {
    setHazardPhoto(null);
    showToastMessage("Photo removed");
  };

  /** 🚀 Submit logic */
  const handleSubmit = () => {
    if (!hazardPhoto) {
      showToastMessage("Please add a photo of the hazard");
      return;
    }

    if (selectedHazard === "other" && !otherHazardText.trim()) {
      showToastMessage("Please describe the hazard");
      return;
    }

    console.log("Submitting hazard report:", {
      hazardType: selectedHazard,
      otherHazard: otherHazardText,
      confidence: confidenceRating,
      photo: hazardPhoto,
    });

    showToastMessage("Hazard report submitted!");

    setTimeout(() => {
      history.push("/run-tracking");
    }, 800);
  };

  const handleUseMyLocation = () => {
    showToastMessage("Using current location...");
    // TODO: implement geolocation
  };

  const handlePinOnMap = () => {
    showToastMessage("Opening map to pin location...");
    // TODO: implement map picker
  };

  /** ⭐ Confidence Rating Stars */
  const renderStars = () =>
    Array.from({ length: 5 }, (_, index) => (
      <IonIcon
        key={index}
        icon={index < confidenceRating ? star : starOutline}
        style={{
          fontSize: "24px",
          color: index < confidenceRating ? "#ffd700" : "#ccc",
          cursor: "pointer",
          margin: "0 2px",
        }}
        onClick={() => setConfidenceRating(index + 1)}
      />
    ));

  /** 🔔 Toast handler */
  const showToastMessage = (message: string) => {
    setToastMessage(message);
    setShowToast(true);
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/run-tracking" />
          </IonButtons>
          <IonTitle>Report</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen className="ion-padding">
        <IonText color="dark">
          <h2>Report Hazard</h2>
        </IonText>

       {/* Image Upload Section */}
               <div className="image-upload-section">
                 {!image ? (
                   <IonButton expand="block" fill="outline" onClick={handleAddPhoto}>
                     <IonIcon slot="start" icon={imageOutline} />
                     Add Image
                   </IonButton>
                 ) : (
                   <div className="preview-container">
                     <IonImg src={image} alt="Preview" className="preview-image" />
                     <IonButton
                       fill="clear"
                       className="remove-image-btn"
                       onClick={handleRemovePhoto}
                     >
                       <IonIcon icon={closeCircle} color="light" style={{ fontSize: "32px" }} />
                     </IonButton>
                   </div>
                 )}
               </div>

        {/* 🚧 Hazard Type */}
        <IonText color="medium">
          <h3 style={{ margin: "20px 0 16px 0" }}>
            Select the type of hazard you'd like to report:
          </h3>
        </IonText>

        <IonRadioGroup
          value={selectedHazard}
          onIonChange={(e) => setSelectedHazard(e.detail.value)}
        >
          <IonItem>
            <IonIcon icon={trailSignOutline} slot="start" color="warning" />
            <IonLabel>Pothole or Road Damage</IonLabel>
            <IonRadio slot="end" value="pothole" />
          </IonItem>

          <IonItem>
            <IonIcon icon={carOutline} slot="start" color="danger" />
            <IonLabel>Heavy Traffic</IonLabel>
            <IonRadio slot="end" value="heavy_traffic" />
          </IonItem>

          <IonItem>
            <IonIcon icon={warningOutline} slot="start" color="warning" />
            <IonLabel>Unsafe Area</IonLabel>
            <IonRadio slot="end" value="unsafe_area" />
          </IonItem>

          <IonItem>
            <IonIcon icon={buildOutline} slot="start" color="medium" />
            <IonLabel>Construction</IonLabel>
            <IonRadio slot="end" value="construction" />
          </IonItem>

          <IonItem>
            <IonIcon icon={warningOutline} slot="start" color="warning" />
            <IonLabel>Other Hazard</IonLabel>
            <IonRadio slot="end" value="other" />
          </IonItem>
        </IonRadioGroup>

        {selectedHazard === "other" && (
          <IonItem style={{ marginTop: "8px" }}>
            <IonInput
              value={otherHazardText}
              placeholder="Enter and describe the hazard"
              onIonInput={(e) => setOtherHazardText(e.detail.value ?? "")}
            />
          </IonItem>
        )}

        {/* 📍 Location */}
        <IonText color="medium">
          <h3 style={{ margin: "24px 0 16px 0" }}>Select Location Method</h3>
        </IonText>

        <IonGrid>
          <IonRow>
            <IonCol size="6">
              <IonButton
                expand="block"
                fill="outline"
                onClick={handleUseMyLocation}
                style={{ height: "60px" }}
              >
                <IonIcon icon={locationOutline} slot="start" />
                Use My Location
              </IonButton>
            </IonCol>
            <IonCol size="6">
              <IonButton
                expand="block"
                fill="outline"
                onClick={handlePinOnMap}
                style={{ height: "60px" }}
              >
                <IonIcon icon={pinOutline} slot="start" />
                Pin on Map
              </IonButton>
            </IonCol>
          </IonRow>
        </IonGrid>

        {/* ⭐ Confidence */}
        <IonText color="medium">
          <h3 style={{ margin: "24px 0 16px 0" }}>
            How confident are you about this report?
          </h3>
        </IonText>

        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            marginBottom: "32px",
          }}
        >
          {renderStars()}
        </div>

        {/* 🚀 Submit */}
        <IonButton expand="block" size="large" onClick={handleSubmit}>
          Submit
        </IonButton>

        <IonToast
          isOpen={showToast}
          message={toastMessage}
          duration={2000}
          onDidDismiss={() => setShowToast(false)}
        />
      </IonContent>
    </IonPage>
  );
};

export default ReportHazard;