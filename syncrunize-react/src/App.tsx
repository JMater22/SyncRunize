import { Redirect, Route } from "react-router-dom";
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
  setupIonicReact,
} from "@ionic/react";
import { IonReactRouter } from "@ionic/react-router";

import Home from "./pages/Home";
import Community from "./pages/Community";
import Challenges from "./pages/Challenges";
import RunTracking from "./pages/RunTracking";
import RoutesPage from "./pages/RoutesPage";
import SavedRoutesPage from "./components/Routes/SavedRoutesPage";
import Activities from "./pages/Activities";
import RecentlyDeleted from "./pages/RecentlyDeleted";
import Profile from "./pages/Profile";
import CreateGroup from "./components/Community/CreateGroup";
import GroupFeed from "./components/Community/GroupFeed";
import GetStarted from "./components/UserAuth/GetStarted";
import Login from "./components/UserAuth/LoginForm";
import CreateRouteMap from "./components/Routes/CreateRouteMap";

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

import "./theme/variables.css";
import "./theme/tabs.css";
import { supabase } from "./supabaseClient"; 
import React, { useEffect, useState } from "react";
setupIonicReact();

const App: React.FC = () => {
  const [session, setSession] = useState<any>(null);
    const [userData, setUserData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      // Fetch current session
      supabase.auth.getSession().then(async ({ data }) => {
        const currentSession = data.session;
        setSession(currentSession);

        if (currentSession?.user) {
          // Fetch matching user record from your custom table
          const { data: userRecord } = await supabase
            .from("users")
            .select("*")
            .eq("auth_id", currentSession.user.id)
            .single();

          setUserData(userRecord);
        }

        setLoading(false);
      });

      // Listen for auth state changes
      const { data: listener } = supabase.auth.onAuthStateChange(
        (_event, session) => {
          setSession(session);
        }
      );

      return () => {
        listener.subscription.unsubscribe();
      };
    }, []);

    if (loading) return null; // or a loading spinner


  return (
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
            <IonToolbar>
              <IonButtons slot="start">
                <IonMenuButton menu="main-menu" autoHide={false} />
              </IonButtons>
              <IonTitle>SYNCRUNIZE</IonTitle>
            </IonToolbar>
          </IonHeader>

          <IonTabs>
            <IonRouterOutlet>
              <Route
                exact
                path="/"
                render={() => session ? <Redirect to="/home" /> : <Redirect to="/login" />}
              />
              <Route
                exact
                path="/home"
                render={(props) =>
                      //{...props} userData={userData}
                      session ? <Home/> : <Redirect to="/login" />
                    }
                  />
              <Route 
                exact 
                path="/get-started" 
                component={GetStarted} />
              <Route 
                exact 
                path="/login" 
                component={Login} />
              <Route 
                exact 
                path="/community" 
                render = { () =>
                session ? <Community/> : <Redirect to="/login" />
                } />
              <Route 
                exact 
                path="/challenges" 
                render = { () =>
                session ? <Challenges/> : <Redirect to="/login" />
                } />
              <Route 
                exact 
                path="/run-tracking" 
                render = { () => session ? <RunTracking/> : <Redirect to="/login" />
                } />
              <Route exact 
                path="/routes" 
                render = { () => session ? <RoutesPage/> : <Redirect to="/login" />
                } />
              <Route 
                exact 
                path="/saved-routes" 
                render = { () =>
                session ? <SavedRoutesPage/> : <Redirect to="/login" />
                } />
              <Route
                exact
                path="/activities"
                render={() => (session ? <Activities /> : <Redirect to="/login" />)}
              />
              <Route
                exact
                path="/profile"
                render={() => (session ? <Profile /> : <Redirect to="/login" />)}
              />
              <Route
                exact
                path="/recently-deleted"
                render={() => (session ? <RecentlyDeleted /> : <Redirect to="/login" />)}
              />
              <Route
                exact
                path="/create-group"
                render={() => (session ? <CreateGroup /> : <Redirect to="/login" />)}
              />
              <Route
                exact
                path="/group-feed"
                render={() => (session ? <GroupFeed /> : <Redirect to="/login" />)}
              />
              <Route
                exact
                path="/create-route"
                render={() => (session ? <CreateRouteMap /> : <Redirect to="/login" />)}
              />

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
        </IonPage>
      </IonReactRouter>
    </IonApp>
  );
};

export default App;
