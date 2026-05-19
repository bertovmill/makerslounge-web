"use client";

import { useState } from "react";
import { ChevronDown, ExternalLink, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

export interface Submission {
  id: string;
  project_link: string;
  title: string | null;
  description: string | null;
  video_url: string | null;
  file_urls: string[] | null;
  team_name: string | null;
  builder_emails: string[] | null;
  challenge_track: string | null;
  status: "new" | "reviewed" | "finalist" | "winner" | "spam";
  created_at: string;
  reviewed_at: string | null;
}

const STATUS_ORDER: Submission["status"][] = [
  "new",
  "reviewed",
  "finalist",
  "winner",
  "spam",
];

export default function SubmissionsTable({
  submissions,
}: {
  submissions: Submission[];
}) {
  const [filter, setFilter] = useState<Submission["status"] | "all">("all");
  const [rows, setRows] = useState(submissions);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const filtered =
    filter === "all" ? rows : rows.filter((r) => r.status === filter);

  async function updateStatus(id: string, status: Submission["status"]) {
    setUpdatingId(id);
    const { error } = await supabase
      .from("hackathon_submissions")
      .update({ status, reviewed_at: new Date().toISOString() })
      .eq("id", id);
    setUpdatingId(null);
    if (error) {
      alert(`Update failed: ${error.message}`);
      return;
    }
    setRows((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, status, reviewed_at: new Date().toISOString() } : r,
      ),
    );
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2 font-mono text-xs uppercase tracking-[0.12em]">
        <span className="text-muted-foreground">Filter:</span>
        <button
          onClick={() => setFilter("all")}
          className={pill(filter === "all")}
        >
          All
        </button>
        {STATUS_ORDER.map((s) => (
          <button key={s} onClick={() => setFilter(s)} className={pill(filter === s)}>
            {s}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-md border border-dashed border-border px-6 py-12 text-center text-sm text-muted-foreground">
          No submissions yet.
        </div>
      ) : (
        <ul className="divide-y divide-border border-y border-border">
          {filtered.map((s) => {
            const expanded = expandedId === s.id;
            return (
              <li key={s.id}>
                <button
                  onClick={() => setExpandedId(expanded ? null : s.id)}
                  className="grid w-full grid-cols-[auto_1fr_auto_auto] items-center gap-4 py-4 text-left transition-colors hover:bg-muted/40 sm:gap-6"
                >
                  <span className="font-mono text-xs uppercase tracking-[0.12em] text-muted-foreground">
                    {formatDate(s.created_at)}
                  </span>
                  <span className="flex flex-col gap-0.5">
                    <span className="font-medium">
                      {s.title || s.team_name || s.project_link}
                    </span>
                    {(s.title || s.team_name) && (
                      <span className="truncate text-xs text-muted-foreground">
                        {s.project_link}
                      </span>
                    )}
                  </span>
                  <StatusBadge status={s.status} />
                  <ChevronDown
                    className={
                      "size-4 text-muted-foreground transition-transform " +
                      (expanded ? "rotate-180" : "")
                    }
                  />
                </button>
                {expanded && (
                  <div className="grid gap-5 bg-muted/30 px-3 pb-6 pt-2 sm:grid-cols-2 sm:px-6">
                    <Detail label="Project link">
                      <a
                        href={s.project_link}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 break-all text-primary hover:underline"
                      >
                        {s.project_link}
                        <ExternalLink className="size-3.5 shrink-0" />
                      </a>
                    </Detail>
                    {s.video_url && (
                      <Detail label="Video">
                        <a
                          href={s.video_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 break-all text-primary hover:underline"
                        >
                          {s.video_url}
                          <ExternalLink className="size-3.5 shrink-0" />
                        </a>
                      </Detail>
                    )}
                    {s.team_name && <Detail label="Team">{s.team_name}</Detail>}
                    {s.challenge_track && (
                      <Detail label="Track">{s.challenge_track}</Detail>
                    )}
                    {s.description && (
                      <Detail label="Description" wide>
                        <p className="whitespace-pre-wrap leading-relaxed">
                          {s.description}
                        </p>
                      </Detail>
                    )}
                    {s.builder_emails && s.builder_emails.length > 0 && (
                      <Detail label="Builders" wide>
                        <ul className="flex flex-wrap gap-x-4 gap-y-1">
                          {s.builder_emails.map((email) => (
                            <li key={email}>
                              <a
                                href={`mailto:${email}`}
                                className="text-primary hover:underline"
                              >
                                {email}
                              </a>
                            </li>
                          ))}
                        </ul>
                      </Detail>
                    )}
                    {s.file_urls && s.file_urls.length > 0 && (
                      <Detail label="Files" wide>
                        <FileList paths={s.file_urls} />
                      </Detail>
                    )}
                    <Detail label="Status">
                      <div className="flex flex-wrap gap-1.5">
                        {STATUS_ORDER.map((opt) => (
                          <button
                            key={opt}
                            onClick={() => updateStatus(s.id, opt)}
                            disabled={updatingId === s.id || s.status === opt}
                            className={
                              "rounded border px-2.5 py-1 font-mono text-xs uppercase tracking-[0.1em] transition-colors " +
                              (s.status === opt
                                ? "border-foreground bg-foreground text-background"
                                : "border-border hover:border-foreground/60")
                            }
                          >
                            {updatingId === s.id && s.status !== opt ? (
                              <Loader2 className="size-3 animate-spin" />
                            ) : (
                              opt
                            )}
                          </button>
                        ))}
                      </div>
                    </Detail>
                    <Detail label="Submission ID">
                      <code className="select-all break-all text-xs text-muted-foreground">
                        {s.id}
                      </code>
                    </Detail>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function pill(active: boolean) {
  return (
    "rounded-full border px-3 py-1 transition-colors " +
    (active
      ? "border-foreground bg-foreground text-background"
      : "border-border text-muted-foreground hover:border-foreground/60 hover:text-foreground")
  );
}

function StatusBadge({ status }: { status: Submission["status"] }) {
  const styles: Record<Submission["status"], string> = {
    new: "border-foreground/60 text-foreground",
    reviewed: "border-border text-muted-foreground",
    finalist: "border-primary text-primary",
    winner: "border-foreground bg-foreground text-background",
    spam: "border-destructive/40 text-destructive",
  };
  return (
    <span
      className={
        "inline-flex items-center rounded-full border px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.18em] " +
        styles[status]
      }
    >
      {status}
    </span>
  );
}

function Detail({
  label,
  children,
  wide,
}: {
  label: string;
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <div className={"flex flex-col gap-1.5 " + (wide ? "sm:col-span-2" : "")}>
      <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </span>
      <div className="text-sm text-foreground">{children}</div>
    </div>
  );
}

function FileList({ paths }: { paths: string[] }) {
  const [busy, setBusy] = useState<string | null>(null);

  async function open(path: string) {
    setBusy(path);
    const { data, error } = await supabase.storage
      .from("hackathon-submissions")
      .createSignedUrl(path, 600);
    setBusy(null);
    if (error || !data?.signedUrl) {
      alert(`Could not generate link: ${error?.message ?? "unknown error"}`);
      return;
    }
    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  }

  return (
    <ul className="flex flex-col gap-1.5">
      {paths.map((path) => {
        const name = path.split("/").pop() ?? path;
        return (
          <li key={path} className="flex items-center gap-2">
            <button
              onClick={() => open(path)}
              disabled={busy === path}
              className="inline-flex items-center gap-1 text-primary hover:underline disabled:opacity-50"
            >
              {busy === path && <Loader2 className="size-3.5 animate-spin" />}
              {name}
              <ExternalLink className="size-3.5" />
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("en-CA", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
