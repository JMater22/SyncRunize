import { Redirect, Route } from 'react-router-dom';
import {
  IonApp,
  IonIcon,
  IonLabel,
  IonRouterOutlet,
  IonTabBar,
  IonTabButton,
  IonTabs,
  setupIonicReact
} from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import {  homeOutline, mapOutline, peopleOutline, analyticsOutline, walk, logIn } from 'ionicons/icons';
import Home from './pages/Home';
import Community from './pages/Community';
import RunTracking from './pages/RunTracking';
import RoutesPage from './pages/RoutesPage';
import Analytics from './pages/Analytics';
import UserProfile from './pages/UserProfile';
import Settings from './pages/Settings';
import Leaderboards from './pages/leaderboards';
import Notification from './pages/notification';
import EditProfile from './pages/Edit-Profile';
import Notice from './pages/Notice';
import PausedRun from './pages/Paused-Run';
import CreateRoute from './pages/create-route';
import Following from './pages/Following';
import SearchRunners from './pages/Search-Runners';
import SavedRoutes from './pages/saved-routes';
import EstimatedTime from './pages/Estimated-Time';
import TrafficNotice from './pages/Traffic-Notice';
import HazardNotice from './pages/Hazard-Notice';
import HazardReport from './pages/Hazard-Report';
import ActivitySummary from './pages/Activity-Summary';
import Information from './pages/Profile-Information';
import PasswordSecurity from './pages/Password-Security';
import CreateAccount from './pages/create-account';
import LogIn from './pages/log-in';
import Authentication from './pages/user-authentication';
import GroupFeed from './pages/Group-feed';
import ViewPost from './pages/View-Posts';
import ViewActivity from './pages/View-Activity';
import Badges from './pages/Badges';



/* Core CSS required for Ionic components to work properly */
import '@ionic/react/css/core.css';
import './theme/variables.css'

/* Basic CSS for apps built with Ionic */
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';

/* Optional CSS utils that can be commented out */
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';

/**
 * Ionic Dark Mode
 * -----------------------------------------------------
 * For more info, please see:
 * https://ionicframework.com/docs/theming/dark-mode
 */

/* import '@ionic/react/css/palettes/dark.always.css'; */
/* import '@ionic/react/css/palettes/dark.class.css'; */
import '@ionic/react/css/palettes/dark.system.css';

/* Theme variables */
import './theme/variables.css';
import Profile from './pages/UserProfile';
import ProfileInfo from './pages/Profile-Information';

setupIonicReact();

const App: React.FC = () => (
  <IonApp>
    <IonReactRouter>
      <IonTabs>
        <IonRouterOutlet>
          <Route exact path="/home" component={Home} />
          <Route exact path="/community" component={Community} />
          <Route exact path="/run-tracking" component={RunTracking} />
          <Route exact path="/routes" component={RoutesPage} />
          <Route exact path="/analytics" component={Analytics} />
          <Route exact path="/profile" component={UserProfile} />
          <Route exact path="/settings" component={Settings} />
          <Route exact path="/leaderboards" component={Leaderboards} />
          <Route exact path="/notification" component={Notification} />
           <Route exact path="/edit-profile" component={EditProfile} />
            <Route exact path="/paused" component={PausedRun} />
           <Route exact path="/notice" component={Notice} />
          <Route exact path="/create-route" component={CreateRoute} />
          <Route exact path="/following" component={Following} />
          <Route exact path="/search-runners" component={SearchRunners} />
          <Route exact path="/saved-routes" component={SavedRoutes} />
          <Route exact path="/estimated-time" component={EstimatedTime} />
          <Route exact path="/traffic-notice" component={TrafficNotice} />
          <Route exact path="/hazard-notice" component={HazardNotice} />
          <Route exact path="/hazard-report" component={HazardReport} />
          <Route exact path="/activity-summary" component={ActivitySummary} />
          <Route exact path="/profile-info" component={Information} />
          <Route exact path="/security" component={PasswordSecurity} />
          <Route exact path="/create-account" component={CreateAccount} />
          <Route exact path="/log-in" component={LogIn} />
           <Route exact path="/authentication" component={Authentication} />
           <Route exact path="/group-feed" component={GroupFeed} />
           <Route exact path="/posts" component={ViewPost} />
           <Route exact path="/activities" component={ViewActivity} />
           <Route exact path="/badges" component={Badges} />
          
          <Route exact path="/">
            <Redirect to="/home" />
          </Route>
        </IonRouterOutlet>

        {/* ✅ Corrected IonTabBar */}
        <IonTabBar slot="bottom">
          <IonTabButton tab="home" href="/home">
           <IonIcon className='nav-icon' icon={homeOutline} />
          </IonTabButton>

          <IonTabButton tab="routes" href="/routes">
          <IonIcon className='nav-icon' icon={mapOutline}/>
            
          </IonTabButton>

          <IonTabButton tab="run-tracking" href="/run-tracking">
            <IonIcon className='nav-icon' icon={walk}/>
          </IonTabButton>

      

          <IonTabButton tab="community" href="/community">
          <IonIcon className='nav-icon' icon={peopleOutline}/>
            
          </IonTabButton>


          <IonTabButton tab="analytics" href="/analytics">
          <IonIcon className='nav-icon' icon={analyticsOutline}/>
            
          </IonTabButton>
        </IonTabBar>
      </IonTabs>
    </IonReactRouter>
  </IonApp>
);

export default App;
