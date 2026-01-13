/// <reference types="@capacitor/push-notifications" />
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.app.syncrunize',
  appName: 'SyncRunize',
  webDir: 'dist', // same as Vite's outDir
  // Use http scheme on Android so XHR to http://10.0.2.2 isn't blocked as mixed content
  server: {
    androidScheme: 'http',
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"],
    },
    GoogleAuth: {
      scopes: ['profile', 'email'],
      serverClientId: '92219394673-4v48s4lbe6vei99rmo9gu73ag991chj7.apps.googleusercontent.com',
      forceCodeForRefreshToken: true,
    },
  },
};

export default config;
