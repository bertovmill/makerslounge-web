import type { Metadata } from "next";
import SignupForm from "./SignupForm";

export const metadata: Metadata = {
  title: "Find a team — Innovation Hackathon",
  description:
    "Solo builder? Tell us about yourself and we'll match you into a team for the MakersLounge Innovation Hackathon.",
};

export default function SignupPage() {
  return <SignupForm />;
}
