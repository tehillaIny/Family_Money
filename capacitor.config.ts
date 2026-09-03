import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.familymoney.app',
  appName: 'family money',
  webDir: 'dist',

  server: {
    url: 'http://10.209.195.205:5173/',
    cleartext: true
  }

};

export default config;
