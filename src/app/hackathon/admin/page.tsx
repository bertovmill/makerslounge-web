import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase-server";
import SubmissionsTable, { type Submission } from "./SubmissionsTable";

export const metadata = {
  title: "Hackathon submissions — Admin",
};

const ADMIN_EMAIL = "bertmill19@gmail.com";

export default async function HackathonAdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth?next=/hackathon/admin");
  }

  if (user.email !== ADMIN_EMAIL) {
    notFound();
  }

  const { data: submissions, error } = await supabase
    .from("hackathon_submissions")
    .select(
      "id, project_link, title, description, video_url, file_urls, team_name, builder_emails, challenge_track, status, created_at, reviewed_at",
    )
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <div className="mx-auto max-w-5xl px-6 py-10">
        <h1 className="text-2xl font-semibold">Hackathon submissions</h1>
        <p className="mt-4 text-destructive">
          Failed to load submissions: {error.message}
        </p>
      </div>
    );
  }

  const counts = (submissions ?? []).reduce(
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
            Innovation Hackathon · Admin
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
            href="/hackathon"
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
