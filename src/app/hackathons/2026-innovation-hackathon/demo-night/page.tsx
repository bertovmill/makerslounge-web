import type { Metadata } from "next";
import DemoNightDeck from "./DemoNightDeck";

export const metadata: Metadata = {
  title: "Demo Night — 2026 Innovation Hackathon",
  description: "Live demos, judging, and winners. May 26, 2026 · 510 Front St W, Toronto.",
};

export default function DemoNightPage() {
  return <DemoNightDeck />;
}
