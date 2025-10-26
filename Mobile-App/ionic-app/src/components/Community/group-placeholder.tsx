import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonButton,
  IonInput,
  IonCard,
  IonCardContent,
  IonImg,
  IonTabBar,
  IonTabButton,
  IonLabel,
  IonIcon
} from "@ionic/react";
import {
  chatboxEllipses,
  peopleCircle,
  barChart,
} from "ionicons/icons";
import '../theme/groups.css';
import ProfilePic from '../components/assets/close-up-portrait-serious-man-with-curly-hair.jpg';
import ChallengePic from '../components/assets/istockphoto-143920084-612x612.jpg';

export default function Community() {
  return (
    <IonPage>
      {/* Top Header */}
      <IonHeader>
        <IonToolbar>
          <IonTitle>
            <span role="img" aria-label="community">👥</span> Community
          </IonTitle>
        </IonToolbar>
      </IonHeader>

      {/* Tabs Navigation */}
      <IonTabBar slot="top">
        <IonTabButton tab="challenges" href="/Community/comm1">
          <IonIcon size="large" color="success" icon={barChart} />
          <IonLabel>Challenges</IonLabel>
        </IonTabButton>
        <IonTabButton tab="feed" href="/Community/comm2">
          <IonIcon size="large" color="success" icon={chatboxEllipses} />
          <IonLabel>Feed</IonLabel>
        </IonTabButton>
        <IonTabButton tab="group" href="/Community/comm4">
          <IonIcon size="large" color="success" icon={peopleCircle} />
          <IonLabel>Group</IonLabel>
        </IonTabButton>
      </IonTabBar>

      {/* Main Content */}
      <IonContent fullscreen className="ion-padding">

        {/* Group Search/Creation */}
        <div className="group-action-bar">
          <IonButton color="success">Find Groups</IonButton>
          <IonInput placeholder="Search groups..." className="group-search-input"></IonInput>
        </div>

        {/* Suggested Groups */}
        <section className="groups-section">
          <h2 className="section-title">Suggested Groups</h2>
          <div className="group-list">
            {/* Group 1 */}
            <IonCard className="group-card">
              <IonImg src={ChallengePic} alt="Trail Runners Group" />
              <IonCardContent className="group-overlay">
                <span className="group-name">Trail Runners</span>
                <IonButton size="small" color="success">Join</IonButton>
              </IonCardContent>
            </IonCard>

            {/* Group 2 */}
            <IonCard className="group-card">
              <IonImg src={ChallengePic} alt="Sprint Team Group" />
              <IonCardContent className="group-overlay">
                <span className="group-name">Sprint Team</span>
                <IonButton size="small" color="success">Join</IonButton>
              </IonCardContent>
            </IonCard>

            {/* Group 3 */}
            <IonCard className="group-card">
              <IonImg src={ChallengePic} alt="Yoga Enthusiasts Group" />
              <IonCardContent className="group-overlay">
                <span className="group-name">Yoga Enthusiasts</span>
                <IonButton size="small" color="success">Join</IonButton>
              </IonCardContent>
            </IonCard>
          </div>
        </section>

        {/* Your Group */}
        <section className="groups-section your-group-section">
          <h2 className="section-title">Your Group</h2>
          <div className="group-list">
            <IonCard className="group-card">
              <IonImg src={ChallengePic} alt="City Runners Group" />
              <IonCardContent className="group-overlay">
                <span className="group-name">City Runners</span>
              </IonCardContent>
            </IonCard>
          </div>
        </section>
      </IonContent>
    </IonPage>
  );
}
