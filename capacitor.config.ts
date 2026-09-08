type CapacitorConfig = {
  appId: string;
  appName: string;
  webDir: string;
  server?: { androidScheme: string };
  android?: { allowMixedContent: boolean };
  plugins?: Record<string, Record<string, unknown>>;
};

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
