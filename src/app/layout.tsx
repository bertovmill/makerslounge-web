import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { WelcomeTour } from "@/components/welcome-tour";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Eve Agent Workshop — Makerslounge",
  description:
    "Build your first AI agent with the Eve framework. A hands-on Makerslounge workshop — Build. Connect. Create.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#f7fafd] text-ink">
        <ClerkProvider>
          <WelcomeTour>{children}</WelcomeTour>
        </ClerkProvider>
      </body>
    </html>
  );
}
