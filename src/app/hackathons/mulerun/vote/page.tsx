import type { Metadata } from "next";
import VoteForm from "./VoteForm";

export const metadata: Metadata = {
  title: "Vote — Mulerun hack night",
  description: "Pick your top 3 demos of the night.",
};

export default function VotePage() {
  return <VoteForm />;
}
