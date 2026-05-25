import type { Metadata } from "next";
import ResultsClient from "./ResultsClient";

export const metadata: Metadata = {
  title: "Master Results — 2026 Innovation Hackathon",
};

export default function ResultsPage() {
  return <ResultsClient />;
}
