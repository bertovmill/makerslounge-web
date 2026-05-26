import type { Metadata } from "next";
import ScoringContent from "../ScoringContent";

export const metadata: Metadata = {
  title: "Judge Scoring — 2026 Innovation Hackathon",
};

export default async function JudgePage({ params }: { params: Promise<{ judge: string }> }) {
  const { judge } = await params;
  return <ScoringContent judgeSlug={judge} />;
}
