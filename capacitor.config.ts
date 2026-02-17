import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.producttracker.app',
  appName: 'Product Tracker',
  webDir: 'out',
  server: {
    // For local development, use your machine's IP:
    url: 'http://172.20.10.2:3000',
    // For production, replace with your deployed URL:
    // url: 'https://your-app.vercel.app',
    androidScheme: 'https',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#020617',
      showSpinner: false,
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
  },
}

export default config
