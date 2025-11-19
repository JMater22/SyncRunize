import { Redirect, Route, useLocation } from "react-router-dom";
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
  IonFooter
} from "@ionic/react";
import { IonReactRouter } from "@ionic/react-router";

import Home from "./pages/Home";
import Community from "./pages/Community";
import Challenges from "./pages/Challenges";
import RunTracking from "./pages/RunTracking";
import RoutesPage from "./pages/RoutesPage";
import SavedRoutesPage from "./components/Routes/SavedRoutesPage";
import Profile from "./pages/Profile";
import ViewProfile from "./pages/ViewProfile";
import ViewPost from "./pages/ViewPost";
import CreateGroup from "./components/Community/CreateGroup";
import GroupFeed from "./components/Community/GroupFeed";
import GetStarted from "./components/UserAuth/GetStarted";
import Login from "./components/UserAuth/LoginForm";
import ForgotPassword from "./components/UserAuth/ForgotPassword";
import ResetPassword from "./components/UserAuth/ResetPassword";
import AuthRedirect from "./pages/AuthRedirect";
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
import { NotificationProvider } from "./contexts/NotificationContext";
import React, { useEffect, useState } from "react";
setupIonicReact();

// Inner component that uses useLocation (must be inside Router)
const AppLayout: React.FC<{ session: any }> = ({ session }) => {
  const location = useLocation();

  // Auth pages where header/footer should be hidden
  const authPages = ['/login', '/get-started', '/forgot-password', '/reset-password', '/auth-redirect'];
  const isAuthPage = authPages.includes(location.pathname);

  return (
    <>
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
        {/* Mobile Header with Menu Button - Only visible on mobile and NOT on auth pages */}
        {!isAuthPage && (
          <IonHeader className="mobile-header">
            <IonToolbar>
              <IonButtons slot="start">
                <IonMenuButton menu="main-menu" autoHide={false} />
              </IonButtons>
              <IonTitle>SYNCRUNIZE</IonTitle>
            </IonToolbar>
          </IonHeader>
        )}

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
                session ? <Home /> : <Redirect to="/login" />
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
              path="/forgot-password"
              component={ForgotPassword} />
            <Route
              exact
              path="/reset-password"
              component={ResetPassword} />
            <Route
              exact
              path="/auth-redirect"
              component={AuthRedirect} />
            <Route
              exact
              path="/community"
              render={() =>
                session ? <Community /> : <Redirect to="/login" />
              } />
            <Route
              exact
              path="/challenges"
              render={() =>
                session ? <Challenges /> : <Redirect to="/login" />
              } />
            <Route
              exact
              path="/run-tracking"
              render={() => session ? <RunTracking /> : <Redirect to="/login" />
              } />
            <Route exact
              path="/routes"
              render={() => session ? <RoutesPage /> : <Redirect to="/login" />
              } />
            <Route
              exact
              path="/saved-routes"
              render={() =>
                session ? <SavedRoutesPage /> : <Redirect to="/login" />
              } />
            <Route
              exact
              path="/profile"
              render={() => (session ? <Profile /> : <Redirect to="/login" />)}
            />
            <Route
              exact
              path="/user/:userId"
              render={() => (session ? <ViewProfile /> : <Redirect to="/login" />)}
            />
            <Route
              exact
              path="/create-group"
              render={() => (session ? <CreateGroup /> : <Redirect to="/login" />)}
            />
            <Route
              exact
              path="/group/:groupId"
              render={() => (session ? <GroupFeed /> : <Redirect to="/login" />)}
            />
            <Route
              exact
              path="/post/:postId"
              render={() => (session ? <ViewPost /> : <Redirect to="/login" />)}
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

        {/* Footer - visible on both mobile and desktop but NOT on auth pages */}
        {!isAuthPage && (
          <IonFooter className="app-footer">
            <IonToolbar>
              <div className="footer-content">
                <p>© 2025 SyncRunize. All rights reserved.</p>
              </div>
            </IonToolbar>
          </IonFooter>
        )}
      </IonPage>
    </>
  );
};

const AppContent: React.FC<{ session: any; userData: any; loading: boolean }> = ({ session, userData, loading }) => {
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: '#f5f5f5'
      }}>
        <div style={{ textAlign: 'center' }}>
          <h2>Loading SyncRunize...</h2>
        </div>
      </div>
    );
  }

  return (
    <IonReactRouter>
      <AppLayout session={session} />
    </IonReactRouter>
  );
};

const App: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    let isMounted = true;
    let initialized = false;

    // Fetch current session
    const initializeAuth = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          console.error('❌ App: Error getting session:', error);
          if (isMounted) {
            setSession(null);
            setUserData(null);
            setLoading(false);
            setIsInitialized(true);
          }
          initialized = true;
          return;
        }

        const currentSession = data.session;

        if (!isMounted) return;

        setSession(currentSession);

        if (currentSession?.user) {
          // Fetch matching user record from your custom table
          const { data: userRecord, error: userError } = await supabase
            .from("users")
            .select("*")
            .eq("auth_id", currentSession.user.id)
            .single();

          if (!isMounted) return;

          if (userError) {
            console.error('❌ App: Error fetching user record:', userError);
            setUserData(null);
          } else {
            console.log('✅ App: User record loaded');
            setUserData(userRecord);
          }
        } else {
          // Clear userData if no session
          setUserData(null);
        }

        if (isMounted) {
          setLoading(false);
          setIsInitialized(true);
        }
        initialized = true;
      } catch (err) {
        console.error('❌ App: Unexpected error in getSession:', err);
        if (isMounted) {
          setSession(null);
          setUserData(null);
          setLoading(false);
          setIsInitialized(true);
        }
        initialized = true;
      }
    };

    initializeAuth();

    // Listen for auth state changes
    const { data: listener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return;

        console.log('🔔 App: Auth event:', event);

        // Ignore INITIAL_SESSION and first SIGNED_IN during initialization
        if (event === 'INITIAL_SESSION' || (!initialized && event === 'SIGNED_IN')) {
          console.log('⏭️ App: Skipping initial auth event, already handled');
          return;
        }

        // Only handle meaningful events to avoid unnecessary re-renders
        if (event === 'SIGNED_OUT') {
          console.log('🔄 App: User signed out');
          setSession(null);
          setUserData(null);
        } else if (event === 'SIGNED_IN' && session?.user) {
          console.log('🔄 App: User signed in');
          setSession(session);

          try {
            // Fetch new user data when logging in
            const { data: userRecord, error } = await supabase
              .from("users")
              .select("*")
              .eq("auth_id", session.user.id)
              .single();

            if (!isMounted) return;

            if (error) {
              console.error('❌ App: Error fetching user record on sign in:', error);
              setUserData(null);
            } else {
              console.log('✅ App: User record loaded on sign in');
              setUserData(userRecord);
            }
          } catch (error) {
            console.error('❌ App: Error in auth state change:', error);
            if (isMounted) setUserData(null);
          }
        } else if (event === 'TOKEN_REFRESHED') {
          console.log('🔄 App: Token refreshed');
          // Update session but don't refetch user data
          setSession(session);
        } else if (event === 'USER_UPDATED') {
          console.log('🔄 App: User updated');
          setSession(session);
        }
      }
    );

    return () => {
      isMounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  return (
    <IonApp>
      <NotificationProvider>
        <AppContent session={session} userData={userData} loading={loading} />
      </NotificationProvider>
    </IonApp>
  );
};

export default App;