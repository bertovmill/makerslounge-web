import type { Metadata } from "next";
import SignupForm from "./SignupForm";
import { CATEGORIES } from "../categories";

export const metadata: Metadata = {
  title: "Join the Mulerun Hack Night",
  description:
    "Pick what you want to build and we'll match you into a team for tonight.",
};

export default function SignupPage() {
  return <SignupForm categories={CATEGORIES} />;
}
