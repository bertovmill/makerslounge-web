import { notFound, redirect } from "next/navigation";
import { getServerAppUser } from "@/lib/clerk-server";
import Link from "next/link";
import { desc } from "drizzle-orm";
import { getSiteDb } from "@/db/site";
import { hackathonSubmissions } from "@/db/site/schema";
import SubmissionsTable, { type Submission } from "./SubmissionsTable";

export const metadata = {
  title: "Hackathon submissions — Admin",
};

const ADMIN_EMAIL = "bertmill19@gmail.com";

export default async function HackathonAdminPage() {
  const user = await getServerAppUser();

  if (!user) {
    redirect("/auth?next=/hackathons/2026-innovation-hackathon/admin");
  }

  if (user.email !== ADMIN_EMAIL) {
    notFound();
  }

  // Drizzle throws on a query failure rather than returning an error alongside
  // the data, so the previous inline error branch is gone — an unexpected failure
  // now surfaces through the route's error boundary instead of being rendered as
  // body text on an otherwise-normal admin page.
  const submissions = await getSiteDb()
    .select({
      id: hackathonSubmissions.id,
      project_link: hackathonSubmissions.projectLink,
      title: hackathonSubmissions.title,
      description: hackathonSubmissions.description,
      video_url: hackathonSubmissions.videoUrl,
      file_urls: hackathonSubmissions.fileUrls,
      team_name: hackathonSubmissions.teamName,
      builder_emails: hackathonSubmissions.builderEmails,
      challenge_track: hackathonSubmissions.challengeTrack,
      status: hackathonSubmissions.status,
      created_at: hackathonSubmissions.createdAt,
      reviewed_at: hackathonSubmissions.reviewedAt,
    })
    .from(hackathonSubmissions)
    .orderBy(desc(hackathonSubmissions.createdAt));

  const counts = submissions.reduce(
    (acc, s) => {
      acc[s.status] = (acc[s.status] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <header className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
            2026 Innovation Hackathon · Admin
          </p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">
            Submissions
          </h1>
        </div>
        <div className="flex flex-wrap gap-4 font-mono text-xs uppercase tracking-[0.12em] text-muted-foreground">
          <Stat label="Total" value={(submissions?.length ?? 0).toString()} />
          <Stat label="New" value={(counts.new ?? 0).toString()} />
          <Stat label="Reviewed" value={(counts.reviewed ?? 0).toString()} />
          <Stat label="Finalists" value={(counts.finalist ?? 0).toString()} />
          <Stat label="Winners" value={(counts.winner ?? 0).toString()} />
          <Link
            href="/admin/hackathon-signups"
            className="self-center border-b border-border pb-0.5 text-foreground hover:border-foreground"
          >
            Signups →
          </Link>
          <Link
            href="/hackathons/2026-innovation-hackathon"
            className="self-center border-b border-border pb-0.5 text-foreground hover:border-foreground"
          >
            View deck →
          </Link>
        </div>
      </header>

      <SubmissionsTable submissions={(submissions ?? []) as Submission[]} />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span>{label}</span>
      <span className="text-base font-medium tabular-nums text-foreground">
        {value}
      </span>
    </div>
  );
}
