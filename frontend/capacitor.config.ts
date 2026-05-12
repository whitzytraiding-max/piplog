import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.piplog.app',
  appName: 'PipLog',
  webDir: 'dist',
  ios: {
    contentInset: 'always',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 0,
    },
    GoogleAuth: {
      scopes: ['profile', 'email'],
      iosClientId: '1092973927823-miiiril4gm8a5hobqogassd2vq80h3vb.apps.googleusercontent.com',
      serverClientId: '1092973927823-733nq0amtqrrcgrs8qnep39aeqnng3k1.apps.googleusercontent.com',
      forceCodeForRefreshToken: false,
    },
  },
};

export default config;
