import { Redirect, Route } from "react-router-dom";
import {
  IonApp,
  IonRouterOutlet,
  IonTabBar,
  IonTabButton,
  IonTabs,
  IonIcon,
  setupIonicReact,
} from "@ionic/react";
import { personOutline } from "ionicons/icons";
import { IonReactRouter } from "@ionic/react-router";
import { useSupabaseSession } from "./lib/useSession";
import { UserProvider } from "./contexts/UserContext";
import { PostsProvider } from "./contexts/PostsContext";
import { NotificationProvider } from "./contexts/NotificationContext";
import { ChallengesProvider } from "./contexts/ChallengesContext";

import Home from "./pages/Home";
import Community from "./pages/Community";
import RunTracking from "./pages/RunTracking";
import RoutesPage from "./pages/RoutesPage";
import UserProfile from "./pages/UserProfile";
import OtherUserProfile from "./pages/OtherUserProfile";
import MyChallenges from "./pages/MyChallenges";
import Settings from "./pages/Settings";
import Notification from "./pages/notification";
import EditProfile from "./pages/Edit-Profile";
import Notice from "./pages/Notice";
import CreateRoute from "./pages/create-route";
import Following from "./pages/Following";
import SearchRunners from "./pages/Search-Runners";
import SavedRoutes from "./pages/saved-routes";
import EstimatedTime from "./pages/Estimated-Time";
import TrafficNotice from "./pages/Traffic-Notice";
import HazardReport from "./pages/Hazard-Report";
import Information from "./pages/Profile-Information";
import PasswordSecurity from "./pages/Password-Security";
import CreateAccount from "./pages/create-account";
import LogIn from "./pages/log-in";
import Authentication from "./pages/user-authentication";
import GroupFeed from "./pages/Group-feed";
import ViewPost from "./pages/View-Posts";
import ViewActivity from "./pages/View-Activity";
import Badges from "./pages/Badges";
import CreatePost from "./pages/Create-Post";
import ForgotPassword from "./pages/forgot-password";
import ResetPassword from "./pages/reset-password";
import PrePostPage from "./pages/PrePostPage";

import HomeIcon from "./components/assets/icons/home.svg";
import RouteIcon from "./components/assets/icons/conversion_path.svg";
import RunIcon from "./components/assets/icons/open_run.svg";
import GroupsIcon from "./components/assets/icons/groups.svg";

/* Ionic Core & CSS */
import "@ionic/react/css/core.css";
import "@ionic/react/css/normalize.css";
import "@ionic/react/css/structure.css";
import "@ionic/react/css/typography.css";
import "@ionic/react/css/padding.css";
import "@ionic/react/css/float-elements.css";
import "@ionic/react/css/text-alignment.css";
import "@ionic/react/css/text-transformation.css";
import "@ionic/react/css/flex-utils.css";
import "@ionic/react/css/display.css";
import "@ionic/react/css/palettes/dark.system.css";

/* Theme Variables */
import "./theme/variables.css";
import "./theme/global.css";
import { RunTrackerProvider } from "./state/runTrackerContext";
import { RunTrackerController } from "./hooks/useRunTracker";
import { PushNotificationInitializer } from "./components/PushNotificationInitializer";
import { DeepLinkHandler } from "./hooks/useDeepLinks";

setupIonicReact();

// Load Google Fonts once for the entire app
const fontLink = document.createElement('link');
fontLink.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Poppins:wght@600;700;800&display=swap';
fontLink.rel = 'stylesheet';
if (!document.head.querySelector(`link[href="${fontLink.href}"]`)) {
  document.head.appendChild(fontLink);
}

const App: React.FC = () => {
  const { session, loading } = useSupabaseSession();

  if (loading) {
    return (
      <IonApp>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
          <span>Loading...</span>
        </div>
      </IonApp>
    );
  }

  // Unauthenticated: allow only create-account/authentication/forgot/reset; root -> /authentication
  if (!session) {
    return (
      <IonApp>
        <DeepLinkHandler />
        <IonReactRouter>
          <IonRouterOutlet>
            <Route exact path="/log-in" component={LogIn} />
            <Route exact path="/authentication" component={Authentication} />
            <Route exact path="/create-account" component={CreateAccount} />
            <Route exact path="/forgot-password" component={ForgotPassword} />
            <Route exact path="/reset-password" component={ResetPassword} />
            <Route>
              <Redirect to="/authentication" />
            </Route>
          </IonRouterOutlet>
        </IonReactRouter>
      </IonApp>
    );
  }

  return (
  <IonApp>
    <UserProvider>
      <PostsProvider>
        <NotificationProvider>
          <ChallengesProvider>
            <RunTrackerProvider>
              <RunTrackerController />
              <PushNotificationInitializer />
              <DeepLinkHandler />
              <IonReactRouter>
              <IonTabs>
                <IonRouterOutlet>
                  <Route exact path="/home" component={Home} />
                  <Route exact path="/community" component={Community} />
                  <Route exact path="/run-tracking" component={RunTracking} />
                  <Route exact path="/routes" component={RoutesPage} />
                  <Route exact path="/profile" component={UserProfile} />
                  <Route exact path="/other-profile" component={OtherUserProfile} />
                  <Route exact path="/my-challenges" component={MyChallenges} />
                  <Route exact path="/settings" component={Settings} />
                  <Route exact path="/notification" component={Notification} />
                  <Route exact path="/edit-profile" component={EditProfile} />
                  <Route exact path="/notice" component={Notice} />
                  <Route exact path="/create-route" component={CreateRoute} />
                  <Route exact path="/following" component={Following} />
                  <Route exact path="/search-runners" component={SearchRunners} />
                  <Route exact path="/saved-routes" component={SavedRoutes} />
                  <Route exact path="/estimated-time" component={EstimatedTime} />
                  <Route exact path="/traffic-notice" component={TrafficNotice} />
                  <Route exact path="/hazard-report" component={HazardReport} />
                  <Route exact path="/profile-info" component={Information} />
                  <Route exact path="/security" component={PasswordSecurity} />
                  {/* Auth screens remain accessible but are redundant when logged in */}
                  <Route exact path="/create-account" component={CreateAccount} />
                  <Route exact path="/log-in" component={LogIn} />
                  <Route exact path="/authentication" component={Authentication} />
                  <Route exact path="/group-feed/:groupId" component={GroupFeed} />
                  <Route exact path="/posts" component={ViewPost} />
                  <Route exact path="/activities" component={ViewActivity} />
                  <Route exact path="/badges" component={Badges} />
                  <Route exact path="/create-post" component={CreatePost} />
                  <Route exact path="/run-pre-post" component={PrePostPage} />

                  <Route exact path="/">
                    <Redirect to="/home" />
                  </Route>
                </IonRouterOutlet>

                {/* ✅ SVG Icon Tab Bar */}
                <IonTabBar slot="bottom">
                  <IonTabButton tab="home" href="/home">
                    <img src={HomeIcon} alt="Home" className="nav-icon" />
                    Home
                  </IonTabButton>

                  <IonTabButton tab="routes" href="/routes">
                    <img src={RouteIcon} alt="Routes" className="nav-icon" />
                    Route
                  </IonTabButton>

                  <IonTabButton tab="run-tracking" href="/run-tracking">
                    <img src={RunIcon} alt="Run Tracking" className="nav-icon" />
                    Run
                  </IonTabButton>

                  <IonTabButton tab="community" href="/community">
                    <img src={GroupsIcon} alt="Community" className="nav-icon" />
                    Community
                  </IonTabButton>

                  <IonTabButton tab="profile" href="/profile">
                    <IonIcon icon={personOutline} />
                    Profile
                  </IonTabButton>
                </IonTabBar>
              </IonTabs>
            </IonReactRouter>
            </RunTrackerProvider>
          </ChallengesProvider>
        </NotificationProvider>
      </PostsProvider>
    </UserProvider>
  </IonApp>
  );
};

export default App;
