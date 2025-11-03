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
  IonActionSheet,
} from "@ionic/react";
import {
  locationOutline,
  pinOutline,
  star,
  starOutline,
  trailSignOutline,
  carOutline,
  warningOutline,
  buildOutline,
  closeCircle,
  camera,
  images,
  close,
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
  const [showActionSheet, setShowActionSheet] = useState<boolean>(false);

  /** 📸 Capture or Pick Photo - Android Platform */
  const selectPhoto = async (source: CameraSource) => {
    try {
      const photo = await Camera.getPhoto({
        resultType: CameraResultType.Uri,
        source: source,
        quality: 90,
        allowEditing: true,
        width: 600,
        height: 600,
      });

      if (photo.webPath) {
        setHazardPhoto(photo.webPath);
        showToastMessage("Photo added successfully!");
      }
    } catch (error) {
      console.error("Camera error:", error);
      showToastMessage("Failed to select photo.");
    }
  };

  const handleAddPhoto = () => {
    setShowActionSheet(true);
  };

  const handleRemovePhoto = () => {
    setHazardPhoto(null);
    showToastMessage("Photo removed.");
  };

  /** 🚀 Submit Logic */
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

    // Simulate redirect
    setTimeout(() => {
      history.push("/run-tracking");
    }, 1000);
  };

  /** 🌍 Location Handling (placeholder logic) */
  const handleUseMyLocation = () => {
    showToastMessage("Using current location...");
    // TODO: Integrate Geolocation plugin here
  };

  const handlePinOnMap = () => {
    showToastMessage("Opening map to pin location...");
    // TODO: Integrate Map Picker plugin here
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

  /** 🔔 Toast Handler */
  const showToastMessage = (message: string) => {
    setToastMessage(message);
    setShowToast(true);
  };

  return (
    <IonPage>
      {/* 🔹 Header */}
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/run-tracking" />
          </IonButtons>
          <IonTitle>Report</IonTitle>
        </IonToolbar>
      </IonHeader>

      {/* 🔹 Main Content */}
      <IonContent fullscreen className="ion-padding">
        <IonText color="dark">
          <h2>Report Hazard</h2>
        </IonText>

        {/* 📷 Image Upload Section - Android Action Sheet */}
        <div className="image-upload-section">
          {!hazardPhoto ? (
            <IonButton expand="block" fill="outline" onClick={handleAddPhoto}>
              <IonIcon slot="start" icon={camera} />
              Add Photo
            </IonButton>
          ) : (
            <div className="preview-container">
              <IonImg
                src={hazardPhoto}
                alt="Hazard Preview"
                className="preview-image"
              />
              <IonButton
                fill="clear"
                className="remove-image-btn"
                onClick={handleRemovePhoto}
              >
                <IonIcon
                  icon={closeCircle}
                  color="light"
                  style={{ fontSize: "32px" }}
                />
              </IonButton>
            </div>
          )}
        </div>

        {/* Android Action Sheet for Photo Selection */}
        <IonActionSheet
          isOpen={showActionSheet}
          onDidDismiss={() => setShowActionSheet(false)}
          buttons={[
            {
              text: "Take Photo",
              icon: camera,
              handler: () => {
                selectPhoto(CameraSource.Camera);
              },
            },
            {
              text: "Choose from Gallery",
              icon: images,
              handler: () => {
                selectPhoto(CameraSource.Photos);
              },
            },
            {
              text: "Cancel",
              icon: close,
              role: "cancel",
            },
          ]}
        />

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