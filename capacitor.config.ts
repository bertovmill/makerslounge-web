import type { CapacitorConfig } from "@capacitor/cli";

const isDev = process.env.CAPACITOR_ENV !== "production";

const config: CapacitorConfig = {
  appId: "com.makerslounge.app",
  appName: "MakersLounge",
  webDir: "out",
  server: {
    url: isDev
      ? "https://dev.makerslounge.ca"
      : "https://makerslounge.vercel.app",
    cleartext: false,
  },
  ios: {
    contentInset: "automatic",
    allowsLinkPreview: false,
    scrollEnabled: true,
    preferredContentMode: "mobile",
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: true,
      launchShowDuration: 1500,
      backgroundColor: "#faf9f7",
      showSpinner: false,
    },
    Keyboard: {
      resize: "body",
      style: "light",
    },
    StatusBar: {
      style: "light",
    },
  },
};

export default config;
