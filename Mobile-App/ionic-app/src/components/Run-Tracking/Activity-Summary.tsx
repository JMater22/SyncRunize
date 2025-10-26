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
  IonImg, IonSelect, IonSelectOption
} from '@ionic/react';
import {
  arrowBack,
  earth,
  eye,
  saveOutline
} from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import "../theme/Activity-Summary.css"; // custom styles if needed
import ChallengePic from '../components/assets/istockphoto-143920084-612x612.jpg';
import Map from '../components/assets/map.png';
import Challenge1 from '../components/assets/challenge1.jpg';

const Activity: React.FC = () => {
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

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/run-tracking" />
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

        {/* Activity Description */}
        <IonItem className="activity-description-item">
          <IonTextarea
            value={activityDescription}
            placeholder="How'd it go? Share more about your activity and use @ to tag someone."
            onIonInput={e => setActivityDescription(e.detail.value!)}
            className="activity-description-textarea"
            autoGrow={true}
            rows={3}
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
            <IonRow>
              <IonCol size="6">
                <IonImg
                  src={ChallengePic}
                  alt="Activity Highlight"
                  className="media-item highlight-photo"
                />
              </IonCol>
              <IonCol size="6">
                <IonImg
                  src={Challenge1}
                  alt="Activity Photo"
                  className="media-item activity-photo"
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

        <IonItem className="details-item">
          <IonInput
            value={activityFeel}
            placeholder="How did the activity feel?"
            onIonInput={e => setActivityFeel(e.detail.value!)}
            className="details-input"
          />
        </IonItem>

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
              <IonSelect justify="end"  value="friends" interface="action-sheet">
                          <IonSelectOption value="friends">Friends Only</IonSelectOption>
                          <IonSelectOption value="everyone">Everyone</IonSelectOption>
                          <IonSelectOption value="private">Private</IonSelectOption>
                        </IonSelect>
            </div>
          </IonLabel>
        </IonItem>

        

        {/* Mute Activity Section */}
        <div className="section-header">
          <h2 className="section-heading">Mute Activity</h2>
        </div>

        <div className="mute-activity-container">
          <div className="mute-activity-content">
            <div className="mute-text-container">
              <p className="mute-text">Don't publish to Home or Group feeds</p>
              <p className="mute-subtext">This activity will still be visible on your profile</p>
            </div>
            <IonCheckbox
              checked={isMuted}
              onIonChange={e => setIsMuted(e.detail.checked)}
              className="mute-checkbox"
            />
          </div>
        </div>

        {/* Save Changes Button */}
        <IonButton
          expand="block"
          size="large"
          onClick={handleSaveChanges}
          className="save-changes-btn"
        >
          Save Changes
        </IonButton>
      </IonContent>
    </IonPage>
  );
};

export default Activity;