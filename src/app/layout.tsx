import type { Metadata, Viewport } from "next";
import { Space_Grotesk, Syne, Playfair_Display } from "next/font/google";
import "./globals.css";
import FeedbackButton from "@/components/FeedbackButton";
import Navbar from "@/components/Navbar";
import FooterWrapper from "@/components/FooterWrapper";
import MainWrapper from "@/components/MainWrapper";
import ServiceWorkerRegistration from "@/components/ServiceWorkerRegistration";
import { SidebarProvider } from "@/context/SidebarContext";
import { FeedbackProvider } from "@/context/FeedbackContext";
import { AuthProvider } from "@/context/AuthContext";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const syne = Syne({
  variable: "--font-heading",
  subsets: ["latin"],
  display: "swap",
});

const playfair = Playfair_Display({
  variable: "--font-serif",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "MakersLounge - Toronto's Maker Community",
  description: "Connect with makers, share projects, and grow your network in Toronto's most supportive community for builders.",
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "MakersLounge",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#1d1b2e" },
    { media: "(prefers-color-scheme: dark)", color: "#1d1b2e" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${spaceGrotesk.variable} ${syne.variable} ${playfair.variable} font-sans antialiased bg-background text-foreground min-h-screen flex flex-col`}>
        <AuthProvider>
          <SidebarProvider>
            <FeedbackProvider>
              <Navbar />
              <MainWrapper>{children}</MainWrapper>
              <FooterWrapper />
              <FeedbackButton />
            </FeedbackProvider>
          </SidebarProvider>
        </AuthProvider>
        <ServiceWorkerRegistration />
      </body>
    </html>
  );
}
