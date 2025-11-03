import React, { useState } from 'react';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonButton,
  IonItem,
  IonLabel,
  IonInput,
  IonTextarea,
  IonIcon,
  IonBackButton,
  IonButtons,
  IonGrid,
  IonRow,
  IonCol,
  IonText,
  IonCheckbox,
  IonImg, 
  IonSelect, 
  IonSelectOption
} from '@ionic/react';
import {
  arrowBack,
  earth,
  eye,
  saveOutline
} from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import "../theme/Activity-Summary.css";
import ChallengePic from '../components/assets/istockphoto-143920084-612x612.jpg';
import Map from '../components/assets/map.png';
import Challenge1 from '../components/assets/challenge1.jpg';
import { useHideTabBar } from "../hooks/useHideTabBar";

const Activity: React.FC = () => {
  // Hide the tab bar on this page
  useHideTabBar();

  const history = useHistory();
  const [activityTitle, setActivityTitle] = useState<string>('Morning Run');
  const [activityDescription, setActivityDescription] = useState<string>('');
  const [activityFeel, setActivityFeel] = useState<string>('');
  const [privateNotes, setPrivateNotes] = useState<string>('');
  const [isMuted, setIsMuted] = useState<boolean>(false);

  const handleSave = () => {
    console.log('Saving activity:', {
      title: activityTitle,
      description: activityDescription,
      feel: activityFeel,
      privateNotes,
      isMuted
    });
    // Navigate back or to next page
    history.push('/run-tracking');
  };

  const handleSaveChanges = () => {
    console.log('Saving changes and navigating...');
    // Navigate to next page (you can change this path)
    history.push('/activity-summary');
  };

  const handleChangeMapType = () => {
    console.log('Changing map type...');
    // Handle map type change logic
  };

  const handleVisibilityChange = (type: string) => {
    console.log(`Changing ${type} visibility`);
    // Handle visibility changes
  };
  
  const handleDiscardActivity = () => {
    console.log('Activity discarded');
    history.push('/run-tracking');
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/run-tracking" text={''}/>
          </IonButtons>
          <IonTitle>Activity</IonTitle>
          <IonButtons slot="end">
            <IonButton fill="clear" onClick={handleSave} className="save-header-btn">
              Save
            </IonButton>
          </IonButtons>
        </IonToolbar> 
      </IonHeader>

      <IonContent fullscreen className="ion-padding">
        {/* Activity Title */}
        <IonItem className="activity-title-item">
          <IonInput
            value={activityTitle}
            onIonInput={e => setActivityTitle(e.detail.value!)}
            className="activity-title-input"
          />
        </IonItem>

        {/* Media Section */}
        <div className="media-section">
          <IonGrid className="media-grid">
            <IonRow>
              <IonCol size="12" className="map-col">
                <IonImg
                  src={Map}
                  alt="Activity Map"
                  className="media-item map-preview"
                />
              </IonCol>
            </IonRow>
            
          </IonGrid>
          <IonButton
            expand="block"
            fill="outline"
            onClick={handleChangeMapType}
            className="change-map-type-btn"
          >
            Change Map Type
          </IonButton>
        </div>

        {/* Details Section */}
        <IonText color="dark">
          <h2 className="section-heading">Details</h2>
        </IonText>

        <IonItem className="private-notes-item">
          <IonTextarea
            value={privateNotes}
            placeholder="Jot down private notes here. Only you can see these."
            onIonInput={e => setPrivateNotes(e.detail.value!)}
            className="private-notes-textarea"
            autoGrow={true}
            rows={3}
          />
        </IonItem>

        {/* Visibility Section */}
        <IonText color="dark">
          <h2 className="section-heading">Visibility</h2>
        </IonText>

        <IonItem button onClick={() => handleVisibilityChange('who-can-see')} className="visibility-option">
          <IonIcon icon={earth} slot="start" color="medium" />
          <IonLabel>
            <div className="visibility-content">
              <span className="option-label" slot='start'>Who can see</span>
              <IonSelect justify="end" value="friends" interface="action-sheet">
                <IonSelectOption value="friends">Friends Only</IonSelectOption>
                <IonSelectOption value="everyone">Everyone</IonSelectOption>
                <IonSelectOption value="private">Private</IonSelectOption>
              </IonSelect>
            </div>
          </IonLabel>
        </IonItem>

        {/* Discard Activity Button */}
        <IonButton
          expand="block"
          size="large"
          onClick={handleDiscardActivity}
          className="discard-activity-btn"
        >
          Discard activity
        </IonButton>
      </IonContent>
    </IonPage>
  );
};

export default Activity;