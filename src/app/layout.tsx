import type { Metadata } from "next";
import { Space_Grotesk, Syne } from "next/font/google";
import "./globals.css";
import FeedbackButton from "@/components/FeedbackButton";
import Navbar from "@/components/Navbar";
import FooterWrapper from "@/components/FooterWrapper";
import MainWrapper from "@/components/MainWrapper";

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

export const metadata: Metadata = {
  title: "MakersLounge - Toronto's Maker Community",
  description: "Connect with makers, share projects, and grow your network in Toronto's most supportive community for builders.",
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${spaceGrotesk.variable} ${syne.variable} font-sans antialiased bg-background text-foreground min-h-screen flex flex-col`}>
        <Navbar />
        <MainWrapper>{children}</MainWrapper>
        <FooterWrapper />
        <FeedbackButton />
      </body>
    </html>
  );
}
