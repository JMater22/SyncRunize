import {
  IonApp,
  IonPage,
  IonHeader,
  IonToolbar,
  IonButtons,
  IonButton,
  IonIcon,
  IonTitle,
  IonContent,
  IonList,
  IonItem,
  IonAvatar,
  IonLabel,
  IonInput
} from "@ionic/react";
import { arrowBack, search } from "ionicons/icons";
import ProfilePic from '../components/assets/close-up-portrait-serious-man-with-curly-hair.jpg';

export default function SearchUsers() {
  const users = [
    { name: "Raen Jun", location: "Capas" },
    { name: "Jon Meyu", location: "Tarlac" },
    { name: "Alma Tars", location: "Talaga" },
    { name: "Ji Anne", location: "Capas" },
    { name: "Ian", location: "Bamban" },
    { name: "Jon", location: "Burot" },
    { name: "Mary", location: "San Juan" },
    { name: "Arielle", location: "Capas" },
    { name: "Ian", location: "Burot" }
  ];

  return (
    <IonApp>
      <IonPage>
        {/* Header */}
        <IonHeader>
          <IonToolbar>
            <IonButtons slot="start">
              <IonButton fill="clear" routerLink="/home" routerDirection="back">
                <IonIcon icon={arrowBack} />
              </IonButton>
            </IonButtons>
            <IonTitle>Search</IonTitle>
          </IonToolbar>
        </IonHeader>

        {/* Content */}
        <IonContent className="ion-padding">
          {/* Search bar */}
          <div className="search-section" style={{ marginBottom: "16px" }}>
            <IonItem>
              <IonIcon icon={search} slot="start" />
              <IonInput placeholder="Search users..." />
            </IonItem>
          </div>

          {/* User list */}
          <IonList>
            {users.map((user, index) => (
              <IonItem key={index}>
                <IonAvatar slot="start">
                  <img
                    src={ProfilePic}
                    alt={user.name}
                  />
                </IonAvatar>
                <IonLabel>
                  <h3>{user.name}</h3>
                  <p>{user.location}</p>
                </IonLabel>
                <IonButton slot="end" fill="outline" size="small">
                  Follow
                </IonButton>
              </IonItem>
            ))}
          </IonList>
        </IonContent>
      </IonPage>
    </IonApp>
  );
}
