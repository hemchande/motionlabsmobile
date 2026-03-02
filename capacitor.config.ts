import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.motionlabsai.app',
  appName: 'MotionLabs AI',
  webDir: 'build',
  server: {
    // Allow access to external APIs
    androidScheme: 'https',
    iosScheme: 'https',
    // Clear text traffic for development (remove in production)
    cleartext: true
  },
  ios: {
    contentInset: 'always',
  },
  android: {
    buildOptions: {
      keystorePath: undefined,
      keystoreAlias: undefined,
    }
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#f9fafb',
      showSpinner: false,
      androidSpinnerStyle: 'small',
      iosSpinnerStyle: 'small',
    },
  },
};

export default config;
