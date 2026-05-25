import type { Metadata } from "next";
import ScoringContent from "../ScoringContent";

export const metadata: Metadata = {
  title: "Judge Scoring — 2026 Innovation Hackathon",
  description: "Score finalist demos for the 2026 Innovation Hackathon.",
};

export default function JudgePage() {
  return <ScoringContent defaultMode="scoring" />;
}
