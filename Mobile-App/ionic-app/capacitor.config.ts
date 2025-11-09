import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.app.syncrunize',
  appName: 'ionic-app',
  webDir: 'dist', // same as Vite's outDir
  // Use http scheme on Android so XHR to http://10.0.2.2 isn't blocked as mixed content
  server: {
    androidScheme: 'http',
  },
};

export default config;
