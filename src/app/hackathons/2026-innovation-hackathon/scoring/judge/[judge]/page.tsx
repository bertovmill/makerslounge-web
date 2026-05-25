import type { Metadata } from "next";
import JudgeScoringClient from "./JudgeScoringClient";

export const metadata: Metadata = {
  title: "Judge Scoring — 2026 Innovation Hackathon",
};

export default function JudgePage() {
  return <JudgeScoringClient />;
}
