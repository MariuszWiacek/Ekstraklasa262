import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.alex.ekstrabet',     // Your App ID
  appName: 'EkstraBet',            // App name
  webDir: 'build',                 // React build folder
  server: {
    url: 'https://ekstrabet.vercel.app', // Your live website
    cleartext: false
  }
};

export default config;