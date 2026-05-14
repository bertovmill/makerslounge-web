import type { Metadata } from "next";
import MatchView from "./MatchView";

export const metadata: Metadata = {
  title: "Mulerun — Team matches",
};

export default function MatchPage() {
  return <MatchView />;
}
