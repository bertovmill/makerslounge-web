import type { Metadata } from "next";
import HackathonDeck from "./HackathonDeck";

export const metadata: Metadata = {
  title: "2026 Innovation Hackathon — MakersLounge × Toronto Tech Week",
  description:
    "100 builders. One week. Live demos May 26 at Toronto Tech Week. Build something that matters.",
  openGraph: {
    title: "2026 Innovation Hackathon — MakersLounge × Toronto Tech Week",
    description:
      "100 builders. One week. Live demos May 26 at Toronto Tech Week.",
    type: "website",
  },
};

export default function HackathonPage() {
  return <HackathonDeck />;
}
