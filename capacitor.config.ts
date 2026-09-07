import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'tech.heniza.oficia',
  appName: 'OficIA HENIZA',
  webDir: 'dist',
  server: { androidScheme: 'https' },
  android: { allowMixedContent: false },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1200,
      backgroundColor: '#030712',
      showSpinner: false,
    },
  },
};

export default config;
