import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonButtons,
  IonBackButton,
  IonTitle,
  IonContent,
  IonSearchbar,
  IonList,
  IonItem,
  IonAvatar,
  IonLabel,
  IonButton
} from "@ionic/react";
import ProfilePic from '../components/assets/close-up-portrait-serious-man-with-curly-hair.jpg';

export default function SearchUsers() {
  return (
    <IonPage>
      {/* Header */}
      <IonHeader>
        <IonToolbar >
          <IonButtons slot="start">
            <IonBackButton defaultHref="/HomeModule/homeM1/index.html" />
          </IonButtons>
          <IonTitle>Search</IonTitle>
        </IonToolbar>
      </IonHeader>

      {/* Content */}
      <IonContent className="ion-padding" >
        
        {/* Search Bar */}
        <IonSearchbar placeholder="Search users..." />

        {/* User List */}
        <IonList lines="none">
          {/* User 1 */}
          <IonItem>
            <IonAvatar slot="start">
              <img src={ProfilePic} alt="Raen Jun" />
            </IonAvatar>
            <IonLabel>
              <h3>Raen Jun</h3>
              <p>Capas</p>
            </IonLabel>
            <IonButton slot="end" size="small" fill="outline" color="success">
              Follow
            </IonButton>
          </IonItem>

          {/* User 2 */}
          <IonItem>
            <IonAvatar slot="start">
              <img src={ProfilePic} alt="Jon Meyu" />
            </IonAvatar>
            <IonLabel>
              <h3>Jon Meyu</h3>
              <p>Tarlac</p>
            </IonLabel>
            <IonButton slot="end" size="small" fill="outline" color="success">
              Follow
            </IonButton>
          </IonItem>

          {/* User 3 */}
          <IonItem>
            <IonAvatar slot="start">
              <img src={ProfilePic} alt="Alma Tars" />
            </IonAvatar>
            <IonLabel>
              <h3>Alma Tars</h3>
              <p>Talaga</p>
            </IonLabel>
            <IonButton slot="end" size="small" fill="outline" color="success">
              Follow
            </IonButton>
          </IonItem>

          {/* User 4 */}
          <IonItem>
            <IonAvatar slot="start">
              <img src={ProfilePic} alt="Ji Anne" />
            </IonAvatar>
            <IonLabel>
              <h3>Ji Anne</h3>
              <p>Capas</p>
            </IonLabel>
            <IonButton slot="end" size="small" fill="outline" color="success">
              Follow
            </IonButton>
          </IonItem>

          {/* User 5 */}
          <IonItem>
            <IonAvatar slot="start">
              <img src={ProfilePic}  alt="Ian" />
            </IonAvatar>
            <IonLabel>
              <h3>Ian</h3>
              <p>Bamban</p>
            </IonLabel>
            <IonButton slot="end" size="small" fill="outline" color="success">
              Follow
            </IonButton>
          </IonItem>

          {/* User 6 */}
          <IonItem>
            <IonAvatar slot="start">
              <img src={ProfilePic}  alt="Jon" />
            </IonAvatar>
            <IonLabel>
              <h3>Jon</h3>
              <p>Burot</p>
            </IonLabel>
            <IonButton slot="end" size="small" fill="outline" color="success">
              Follow
            </IonButton>
          </IonItem>

          {/* User 7 */}
          <IonItem>
            <IonAvatar slot="start">
              <img src={ProfilePic}  alt="Mary" />
            </IonAvatar>
            <IonLabel>
              <h3>Mary</h3>
              <p>San Juan</p>
            </IonLabel>
            <IonButton slot="end" size="small" fill="outline" color="success">
              Follow
            </IonButton>
          </IonItem>

          {/* User 8 */}
          <IonItem>
            <IonAvatar slot="start">
              <img src={ProfilePic}  alt="Arielle" />
            </IonAvatar>
            <IonLabel>
              <h3>Arielle</h3>
              <p>Capas</p>
            </IonLabel>
            <IonButton slot="end" size="small" fill="outline" color="success">
              Follow
            </IonButton>
          </IonItem>

          {/* User 9 */}
          <IonItem>
            <IonAvatar slot="start">
              <img src={ProfilePic}  alt="Ian" />
            </IonAvatar>
            <IonLabel>
              <h3>Ian</h3>
              <p>Burot</p>
            </IonLabel>
            <IonButton slot="end" size="small" fill="outline" color="success">
              Follow
            </IonButton>
          </IonItem>
        </IonList>
      </IonContent>
    </IonPage>
  );
}
