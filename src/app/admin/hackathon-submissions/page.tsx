"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpRight, Download, FileJson, FileSpreadsheet, Paperclip, X, ExternalLink } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface Submission {
  id: string;
  project_link: string;
  title: string | null;
  description: string | null;
  video_url: string | null;
  file_urls: string[];
  team_name: string | null;
  builder_emails: string[];
  challenge_track: string | null;
  status: string;
  created_at: string;
}

const ADMIN_EMAIL = "bertmill19@gmail.com";

const STATUS_COLORS: Record<string, string> = {
  new: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  reviewed: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
  accepted: "bg-green-500/10 text-green-600 dark:text-green-400",
  rejected: "bg-red-500/10 text-red-600 dark:text-red-400",
};

function csvEscape(value: string): string {
  if (value == null) return "";
  const needsQuoting = /[",\n\r]/.test(value);
  const escaped = value.replace(/"/g, '""');
  return needsQuoting ? `"${escaped}"` : escaped;
}

function buildCsv(rows: Submission[]): string {
  const header = [
    "id", "title", "project_link", "team_name", "builder_emails",
    "challenge_track", "description", "video_url", "file_count", "status", "created_at",
  ];
  const lines = [header.join(",")];
  for (const r of rows) {
    lines.push([
      csvEscape(r.id),
      csvEscape(r.title ?? ""),
      csvEscape(r.project_link),
      csvEscape(r.team_name ?? ""),
      csvEscape((r.builder_emails ?? []).join("; ")),
      csvEscape(r.challenge_track ?? ""),
      csvEscape(r.description ?? ""),
      csvEscape(r.video_url ?? ""),
      csvEscape(String((r.file_urls ?? []).length)),
      csvEscape(r.status),
      csvEscape(r.created_at),
    ].join(","));
  }
  return lines.join("\n");
}

function download(filename: string, mime: string, body: string) {
  const blob = new Blob([body], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function timestampForFilename(): string {
  const d = new Date();
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}`;
}

function fileName(path: string): string {
  return path.split("/").pop() ?? path;
}

function DetailPanel({
  submission,
  onClose,
}: {
  submission: Submission;
  onClose: () => void;
}) {
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});
  const [loadingFiles, setLoadingFiles] = useState(false);

  useEffect(() => {
    const paths = submission.file_urls ?? [];
    if (paths.length === 0) return;
    setLoadingFiles(true);
    Promise.all(
      paths.map(async (path) => {
        const { data } = await supabase.storage
          .from("hackathon-submissions")
          .createSignedUrl(path, 3600);
        return { path, url: data?.signedUrl ?? null };
      }),
    ).then((results) => {
      const map: Record<string, string> = {};
      for (const r of results) {
        if (r.url) map[r.path] = r.url;
      }
      setSignedUrls(map);
      setLoadingFiles(false);
    });
  }, [submission]);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-background/60 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* Panel */}
      <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-xl flex-col overflow-y-auto border-l border-border bg-card shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-border px-6 py-5">
          <div className="min-w-0 flex-1">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              {submission.challenge_track ?? "No track"}
            </p>
            <h2 className="mt-1 truncate text-xl font-semibold">
              {submission.title ?? <span className="italic text-muted-foreground">Untitled</span>}
            </h2>
            <p className="mt-0.5 font-mono text-[10px] text-muted-foreground">
              {submission.id}
            </p>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="flex flex-col gap-6 px-6 py-6">
          {/* Status */}
          <Row label="Status">
            <span className={`inline-block rounded-full px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] ${STATUS_COLORS[submission.status] ?? "bg-muted text-muted-foreground"}`}>
              {submission.status}
            </span>
          </Row>

          {/* Submitted */}
          <Row label="Submitted">
            <span className="font-mono text-xs text-muted-foreground">
              {new Date(submission.created_at).toLocaleString("en-CA", {
                weekday: "short",
                month: "short",
                day: "numeric",
                hour: "numeric",
                minute: "2-digit",
              })}
            </span>
          </Row>

          {/* Project link */}
          <Row label="Project link">
            <a
              href={submission.project_link}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 font-mono text-xs text-primary hover:underline"
            >
              {submission.project_link.replace(/^https?:\/\//, "")}
              <ExternalLink className="size-3 shrink-0" />
            </a>
          </Row>

          {/* Team */}
          {submission.team_name && (
            <Row label="Team">
              <span className="text-sm">{submission.team_name}</span>
            </Row>
          )}

          {/* Builders */}
          {(submission.builder_emails ?? []).length > 0 && (
            <Row label="Builders">
              <ul className="flex flex-col gap-1">
                {submission.builder_emails.map((e) => (
                  <li key={e} className="font-mono text-xs text-muted-foreground">
                    {e}
                  </li>
                ))}
              </ul>
            </Row>
          )}

          {/* Description */}
          {submission.description && (
            <Row label="Description">
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                {submission.description}
              </p>
            </Row>
          )}

          {/* Video */}
          {submission.video_url && (
            <Row label="Demo video">
              <a
                href={submission.video_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 font-mono text-xs text-primary hover:underline"
              >
                {submission.video_url.replace(/^https?:\/\//, "").slice(0, 50)}
                <ExternalLink className="size-3 shrink-0" />
              </a>
            </Row>
          )}

          {/* Files */}
          <Row label={`Files (${(submission.file_urls ?? []).length})`}>
            {(submission.file_urls ?? []).length === 0 ? (
              <span className="text-xs italic text-muted-foreground/50">None uploaded</span>
            ) : loadingFiles ? (
              <span className="font-mono text-xs text-muted-foreground">Generating links…</span>
            ) : (
              <ul className="flex flex-col gap-2">
                {(submission.file_urls ?? []).map((path) => (
                  <li key={path} className="flex items-center gap-2">
                    <Paperclip className="size-3 shrink-0 text-muted-foreground" />
                    {signedUrls[path] ? (
                      <a
                        href={signedUrls[path]}
                        target="_blank"
                        rel="noreferrer"
                        className="truncate font-mono text-xs text-primary hover:underline"
                        title={fileName(path)}
                      >
                        {fileName(path)}
                      </a>
                    ) : (
                      <span className="truncate font-mono text-xs text-muted-foreground" title={path}>
                        {fileName(path)}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </Row>
        </div>
      </div>
    </>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </span>
      <div>{children}</div>
    </div>
  );
}

export default function HackathonSubmissionsAdmin() {
  const router = useRouter();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [filter, setFilter] = useState<string>("all");
  const [selected, setSelected] = useState<Submission | null>(null);

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || user.email !== ADMIN_EMAIL) {
        router.push("/home");
        return;
      }
      setIsAdmin(true);
    };
    init();
  }, [router]);

  useEffect(() => {
    if (!isAdmin) return;
    const load = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("hackathon_submissions")
        .select("id, project_link, title, description, video_url, file_urls, team_name, builder_emails, challenge_track, status, created_at")
        .order("created_at", { ascending: false });
      if (!error) setSubmissions((data ?? []) as Submission[]);
      setLoading(false);
    };
    load();
  }, [isAdmin]);

  const trackCounts = submissions.reduce<Record<string, number>>((acc, s) => {
    const t = s.challenge_track ?? "—";
    acc[t] = (acc[t] ?? 0) + 1;
    return acc;
  }, {});

  const filtered = filter === "all" ? submissions : submissions.filter((s) => s.challenge_track === filter);

  const exportCsv = () => download(`hackathon-submissions_${timestampForFilename()}.csv`, "text/csv;charset=utf-8", buildCsv(filtered));
  const exportJson = () => download(`hackathon-submissions_${timestampForFilename()}.json`, "application/json", JSON.stringify(filtered, null, 2));

  if (!isAdmin) return null;

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
            2026 Innovation Hackathon
          </p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">
            Project submissions
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Submitted via{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 text-xs text-foreground">
              /hackathons/2026-innovation-hackathon/submit
            </code>
            {" "}— click any row to view details and files.
          </p>
        </div>
        <div className="flex flex-col items-start gap-2 sm:items-end">
          <div className="font-mono text-xs uppercase tracking-[0.12em] text-muted-foreground">
            Total{" "}
            <span className="ml-1 text-base font-medium tabular-nums text-foreground">
              {submissions.length}
            </span>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={exportCsv}
              disabled={filtered.length === 0}
              className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-40"
            >
              <FileSpreadsheet className="size-3.5" />
              Export CSV
            </button>
            <button
              type="button"
              onClick={exportJson}
              disabled={filtered.length === 0}
              className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-40"
            >
              <FileJson className="size-3.5" />
              Export JSON
            </button>
          </div>
        </div>
      </header>

      {/* Track filter pills */}
      {submissions.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          <button
            onClick={() => setFilter("all")}
            className={`rounded-full border px-3 py-1 font-mono text-[10px] uppercase tracking-[0.15em] transition-colors ${filter === "all" ? "border-foreground bg-foreground text-background" : "border-border text-muted-foreground hover:border-foreground/50"}`}
          >
            All ({submissions.length})
          </button>
          {Object.entries(trackCounts).map(([track, count]) => (
            <button
              key={track}
              onClick={() => setFilter(filter === track ? "all" : track)}
              className={`rounded-full border px-3 py-1 font-mono text-[10px] uppercase tracking-[0.15em] transition-colors ${filter === track ? "border-foreground bg-foreground text-background" : "border-border text-muted-foreground hover:border-foreground/50"}`}
            >
              {track} ({count})
            </button>
          ))}
        </div>
      )}

      <div className="overflow-hidden rounded-lg border border-border bg-card/40">
        {loading ? (
          <div className="px-6 py-12 text-center text-sm text-muted-foreground">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-6 py-12 text-center">
            <Download className="size-5 text-muted-foreground" />
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
              No submissions yet
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead className="border-b border-border bg-muted/30 text-left">
                <tr>
                  <Th>Project</Th>
                  <Th>Team</Th>
                  <Th>Track</Th>
                  <Th>Builders</Th>
                  <Th>Files</Th>
                  <Th>Status</Th>
                  <Th className="whitespace-nowrap">Submitted</Th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s, i) => (
                  <tr
                    key={s.id}
                    onClick={() => setSelected(s)}
                    className={
                      "cursor-pointer border-b border-border last:border-b-0 align-top transition-colors hover:bg-muted/40 " +
                      (i % 2 === 0 ? "bg-transparent" : "bg-muted/10")
                    }
                  >
                    <Td className="min-w-[16rem] max-w-[22rem]">
                      <div className="flex flex-col gap-1">
                        <span className="font-medium text-foreground">
                          {s.title ?? <span className="italic text-muted-foreground">Untitled</span>}
                        </span>
                        <a
                          href={s.project_link}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1 truncate font-mono text-[10px] text-primary hover:underline"
                        >
                          {s.project_link.replace(/^https?:\/\//, "")}
                          <ArrowUpRight className="size-3 shrink-0" />
                        </a>
                        {s.description && (
                          <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                            {s.description}
                          </p>
                        )}
                        {s.video_url && (
                          <a
                            href={s.video_url}
                            target="_blank"
                            rel="noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1 font-mono text-[10px] text-muted-foreground hover:text-foreground"
                          >
                            Video <ArrowUpRight className="size-3" />
                          </a>
                        )}
                      </div>
                    </Td>
                    <Td className="whitespace-nowrap text-muted-foreground">
                      {s.team_name ?? <span className="italic text-muted-foreground/50">—</span>}
                    </Td>
                    <Td className="whitespace-nowrap">
                      <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                        {s.challenge_track ?? "—"}
                      </span>
                    </Td>
                    <Td className="min-w-[12rem]">
                      {(s.builder_emails ?? []).length > 0 ? (
                        <ul className="flex flex-col gap-0.5">
                          {s.builder_emails.map((e) => (
                            <li key={e} className="font-mono text-[10px] text-muted-foreground">
                              {e}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <span className="italic text-muted-foreground/50">—</span>
                      )}
                    </Td>
                    <Td className="whitespace-nowrap">
                      {(s.file_urls ?? []).length > 0 ? (
                        <span className="inline-flex items-center gap-1 font-mono text-[10px] text-muted-foreground">
                          <Paperclip className="size-3" />
                          {s.file_urls.length}
                        </span>
                      ) : (
                        <span className="italic text-muted-foreground/30 text-xs">—</span>
                      )}
                    </Td>
                    <Td>
                      <span className={`inline-block rounded-full px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] ${STATUS_COLORS[s.status] ?? "bg-muted text-muted-foreground"}`}>
                        {s.status}
                      </span>
                    </Td>
                    <Td className="whitespace-nowrap font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                      {new Date(s.created_at).toLocaleString("en-CA", {
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selected && (
        <DetailPanel submission={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}

function Th({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <th className={"px-4 py-3 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground " + className}>
      {children}
    </th>
  );
}

function Td({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <td className={"px-4 py-4 leading-relaxed " + className}>{children}</td>;
}
