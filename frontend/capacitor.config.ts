import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.piplog.app',
  appName: 'PipLog',
  webDir: 'dist',
  server: {
    url: 'https://frontend-whitzy.vercel.app',
    cleartext: false,
  },
  ios: {
    contentInset: 'always',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 0,
    },
  },
};

export default config;
