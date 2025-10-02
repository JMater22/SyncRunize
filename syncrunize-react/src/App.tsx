import { Redirect, Route } from 'react-router-dom';
import {
  IonApp,
  IonPage,
  IonLabel,
  IonRouterOutlet,
  IonTabBar,
  IonTabButton,
  IonTabs,
  IonMenu,
  IonHeader, 
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonMenuButton,
  IonList,
  IonItem,
  IonFooter,
  setupIonicReact
} from '@ionic/react';

import { IonReactRouter } from '@ionic/react-router';

import Home from './pages/Home';
import Community from './pages/Community';
import Challenges from './pages/Challenges';
import RunTracking from './pages/RunTracking';
import RoutesPage from './pages/RoutesPage';
import Activities from './pages/Activities'; 
import RecentlyDeleted from './pages/RecentlyDeleted';
import Profile from './pages/Profile';
import CreateGroup from "./components/Community/CreateGroup";
import GroupFeed from "./components/Community/GroupFeed";
import Leaderboard from "./components/Community/Leaderboard";
import GetStarted from "./components/UserAuth/GetStarted";
import Login from "./components/UserAuth/LoginForm";

import '@ionic/react/css/core.css';
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css'; 
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';
import '@ionic/react/css/palettes/dark.system.css';

import './theme/variables.css';
import './theme/tabs.css';
import './theme/footer.css';

setupIonicReact();

const App: React.FC = () => (
<IonApp>
  <IonReactRouter>
    {/* Side Menu - Only visible on mobile */}
    <IonMenu side="start" contentId="main-content" menuId="main-menu">
      <IonHeader>
        <IonToolbar color="primary">
          <IonTitle>SyncRunize</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <IonList>
          <IonItem button routerLink="/home" routerDirection="none">
            <IonLabel>Home</IonLabel>
          </IonItem>
          <IonItem button routerLink="/routes" routerDirection="none">
            <IonLabel>Routes</IonLabel>
          </IonItem>
          <IonItem button routerLink="/run-tracking" routerDirection="none">
            <IonLabel>Run Tracking</IonLabel>
          </IonItem>
          <IonItem button routerLink="/activities" routerDirection="none">
            <IonLabel>Activities</IonLabel>
          </IonItem>
          <IonItem button routerLink="/community" routerDirection="none">
            <IonLabel>Community</IonLabel>
          </IonItem>
          <IonItem button routerLink="/challenges" routerDirection="none">
            <IonLabel>Challenges</IonLabel>
          </IonItem>
          <IonItem button routerLink="/profile" routerDirection="none">
            <IonLabel>Profile</IonLabel>
          </IonItem>
        </IonList>
      </IonContent>
    </IonMenu>

    {/* Main Content */}
    <IonPage id="main-content">
      {/* Mobile Header with Menu Button - Only visible on mobile */}
      <IonHeader className="mobile-header">
        <IonToolbar color="">
          <IonButtons slot="start">
            <IonMenuButton menu="main-menu" autoHide={false}></IonMenuButton>
          </IonButtons>
          <IonTitle>SYNCRUNIZE</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonTabs>
        <IonRouterOutlet>
          <Route exact path="/home" component={Home} />
          <Route exact path="/community" component={Community} />
          <Route exact path="/challenges" component={Challenges} />
          <Route exact path="/run-tracking" component={RunTracking} />
          <Route exact path="/routes" component={RoutesPage} />
          <Route exact path="/activities" component={Activities} />
          <Route exact path="/profile" component={Profile} />
          <Route exact path="/recently-deleted" component={RecentlyDeleted} />
          <Route exact path="/create-group" component={CreateGroup} />
          <Route exact path="/group-feed" component={GroupFeed} />
          <Route exact path="/leaderboard" component={Leaderboard} />
          <Route exact path="/get-started" component={GetStarted} />
          <Route exact path="/login" component={Login} />

          <Route exact path="/">
            <Redirect to="/home" />
          </Route>
        </IonRouterOutlet>

        {/* Desktop Header with Title + Tabs - Only visible on desktop */}
        <IonHeader className="desktop-header">
          <div className="desktop-tabs">
            <div className="tab-title-container">
              <IonTitle className="tab-title">SYNCRUNIZE</IonTitle>
            </div>
            <IonTabBar slot="top" className="tab-buttons-container">
              <IonTabButton tab="home" href="/home">
                <IonLabel>Home</IonLabel>
              </IonTabButton>
              <IonTabButton tab="routes" href="/routes">
                <IonLabel>Routes</IonLabel>
              </IonTabButton>
              <IonTabButton tab="run-tracking" href="/run-tracking">
                <IonLabel>Run Tracking</IonLabel>
              </IonTabButton>
              <IonTabButton tab="activities" href="/activities">
                <IonLabel>Activities</IonLabel>
              </IonTabButton>
              <IonTabButton tab="community" href="/community">
                <IonLabel>Community</IonLabel>
              </IonTabButton>
              <IonTabButton tab="challenges" href="/challenges">
                <IonLabel>Challenges</IonLabel>
              </IonTabButton>
              <IonTabButton tab="profile" href="/profile">
                <IonLabel>Profile</IonLabel>
              </IonTabButton>
            </IonTabBar>
          </div>
        </IonHeader>
      </IonTabs>

      {/* Mobile Footer - Only visible on mobile */}
      <IonFooter className="mobile-footer">
        <IonToolbar color="">
          <IonTitle className="ion-text-center">SYNCRUNIZE</IonTitle>
        </IonToolbar>
      </IonFooter>
    </IonPage>
  </IonReactRouter>
</IonApp>
);

export default App;