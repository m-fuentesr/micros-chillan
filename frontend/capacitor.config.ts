import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.micros.chillan',
  appName: 'Micros Chillan',
  webDir: 'dist/frontend/browser',
  server: {
    androidScheme: 'http' // Cambiado a http para desarrollo local
  }
};

export default config;

