import type { Metadata } from "next";
import SubmissionForm from "../SubmissionForm";

export const metadata: Metadata = {
  title: "Submit your project — 2026 Innovation Hackathon",
  description: "Submit your project for the 2026 Makerslounge Innovation Hackathon.",
};

export default function SubmitPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-2xl px-6 py-16 sm:py-24">
        <header className="mb-12 flex flex-col gap-4">
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
            2026 Innovation Hackathon
          </p>
          <h1 className="font-serif text-[clamp(2.5rem,8vw,5rem)] leading-[0.95] tracking-tight">
            Submit your project.
          </h1>
          <p className="max-w-[55ch] text-base leading-relaxed text-muted-foreground sm:text-lg">
            One link is all that's required. Add a title, a description, a video, files, your team — whatever helps judges understand what you built.
          </p>
          <p className="font-mono text-sm text-muted-foreground">
            Deadline: <span className="text-foreground">Sun May 25, 11:59 PM EDT</span>
          </p>
        </header>
        <SubmissionForm />
      </div>
    </div>
  );
}
