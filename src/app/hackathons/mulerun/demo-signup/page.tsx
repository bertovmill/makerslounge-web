import type { Metadata } from "next";
import DemoSignupForm from "./DemoSignupForm";

export const metadata: Metadata = {
  title: "Submit your Mulerun demo",
  description: "Throw your team in the demo lineup.",
};

export default function DemoSignupPage() {
  return <DemoSignupForm />;
}
