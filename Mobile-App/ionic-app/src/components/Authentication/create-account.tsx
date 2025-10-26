import React from "react";
import {
  IonPage,
  IonContent,
  IonList,
  IonItem,
  IonLabel,
  IonInput,
  IonButton
} from "@ionic/react";

import '../theme/create-account.css';

const CreateAccount: React.FC = () => {
  return (
    <IonPage>
      <IonContent className="create-account-page">
        <div className="signup-form">
          <h1>
            CREATE
            <br />
            ACCOUNT
          </h1>

          <IonList lines="none">
            <IonItem className="form-item">
              <IonLabel position="stacked">Name:</IonLabel>
              <IonInput type="text" />
            </IonItem>

            <IonItem className="form-item">
              <IonLabel position="stacked">Email or Phone Number:</IonLabel>
              <IonInput type="email" />
            </IonItem>

            <IonItem className="form-item">
              <IonLabel position="stacked">Password:</IonLabel>
              <IonInput type="password" />
            </IonItem>

            <IonItem className="form-item">
              <IonLabel position="stacked">Confirm Password:</IonLabel>
              <IonInput type="password" />
            </IonItem>
          </IonList>

          <IonButton
            expand="block"
            className="signup-btn"
            routerLink="/UserAuthentication/UserA2/index.html"
          >
            SIGN UP
          </IonButton>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default CreateAccount;
