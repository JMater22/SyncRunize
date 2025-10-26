import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonButtons,
  IonBackButton,
  IonTitle,
  IonContent,
  IonList,
  IonItem,
  IonLabel,
  IonSelect,
  IonSelectOption,
  IonToggle,
  IonButton,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
} from "@ionic/react";

<IonCard>
  <IonCardHeader>
    <IonCardTitle>Account Settings</IonCardTitle>
  </IonCardHeader>
  <IonCardContent>
    <IonList>
      <IonItem button routerLink="/Settings/settings2/index.html">
        <IonLabel>
          <h2>Profile Information</h2>
          <p>Name, email, and personal details</p>
        </IonLabel>
      </IonItem>

      <IonItem button routerLink="/Settings/settings3/index.html">
        <IonLabel>
          <h2>Password & Security</h2>
          <p>Update password and security settings</p>
        </IonLabel>
      </IonItem>
    </IonList>
  </IonCardContent>
</IonCard>