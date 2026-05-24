import type { Metadata } from "next";
import ScoringContent from "./ScoringContent";

export const metadata: Metadata = {
  title: "Judging Rubric — 2026 Innovation Hackathon",
  description: "Scoring criteria and weights for the 2026 Innovation Hackathon. Three tracks, four criteria each.",
};

export default function ScoringPage() {
  return <ScoringContent />;
}
