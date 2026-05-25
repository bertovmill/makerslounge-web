"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, CheckCircle2, Download, FileJson, FileSpreadsheet, Paperclip, Pencil, X, ExternalLink, Trophy } from "lucide-react";
import { supabase } from "@/lib/supabase";

const VOTER_NAME_KEY = "hackathon-voter-name";

const TRACK_CRITERIA: Record<string, { key: string; label: string; weight: number }[]> = {
  "Validating a Business Idea": [
    { key: "pipeline_coverage", label: "End-to-end pipeline coverage", weight: 0.25 },
    { key: "scoring_logic", label: "Quality of scoring / triage logic", weight: 0.35 },
    { key: "speed_scalability", label: "Speed & scalability over manual review", weight: 0.25 },
    { key: "demo_clarity", label: "Demo clarity", weight: 0.15 },
  ],
  "Continuous Market Monitoring": [
    { key: "signal_relevance", label: "Signal relevance & accuracy", weight: 0.35 },
    { key: "realtime_capability", label: "Real-time or near-real-time capability", weight: 0.25 },
    { key: "actionability", label: "Actionability of insights surfaced", weight: 0.25 },
    { key: "demo_clarity", label: "Demo clarity", weight: 0.15 },
  ],
  "Synthetic Customers": [
    { key: "feedback_fidelity", label: "Fidelity of synthetic feedback", weight: 0.35 },
    { key: "nonobvious_insights", label: "Non-obvious insight generation", weight: 0.25 },
    { key: "time_cost_savings", label: "Time & cost savings vs. real research", weight: 0.25 },
    { key: "demo_clarity", label: "Demo clarity", weight: 0.15 },
  ],
};

function weightedScore(scores: Record<string, number>, criteria: { key: string; weight: number }[]): number {
  return Math.round(criteria.reduce((s, c) => s + (scores[c.key] ?? 0) * c.weight, 0) * 20);
}

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
  is_finalist: boolean;
  is_round2: boolean;
  created_at: string;
}

const MIN_FINALISTS = 6;
const MAX_FINALISTS = 9;

const PASSWORD = "makers2026";
const SESSION_KEY = "hackathon-admin-password";

function adminHeaders(): HeadersInit {
  const pw = typeof window !== "undefined" ? sessionStorage.getItem(SESSION_KEY) : null;
  return { "Content-Type": "application/json", "x-admin-password": pw ?? "" };
}

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

function TeamVoting({ submissionId, track }: { submissionId: string; track: string | null }) {
  const criteria = track ? (TRACK_CRITERIA[track] ?? []) : [];
  const [voterName, setVoterName] = useState<string | null>(
    () => (typeof window !== "undefined" ? sessionStorage.getItem(VOTER_NAME_KEY) : null),
  );
  const [nameInput, setNameInput] = useState("");
  const [editingName, setEditingName] = useState(false);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [saving, setSaving] = useState<Set<string>>(new Set());
  const [saved, setSaved] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!voterName || criteria.length === 0) return;
    setScores({});
    const params = new URLSearchParams({ submission_id: submissionId, judge_name: voterName });
    fetch(`/api/admin/hackathon-scores?${params}`, { headers: adminHeaders() })
      .then((r) => r.ok ? r.json() : [])
      .then((data: { criterion_key: string; score: number }[]) => {
        const loaded: Record<string, number> = {};
        for (const row of data) loaded[row.criterion_key] = row.score;
        setScores(loaded);
      });
  }, [submissionId, voterName, criteria.length]);

  const saveName = () => {
    const trimmed = nameInput.trim();
    if (!trimmed) return;
    sessionStorage.setItem(VOTER_NAME_KEY, trimmed);
    setVoterName(trimmed);
    setEditingName(false);
    setNameInput("");
  };

  const handleScore = async (key: string, score: number) => {
    if (!voterName) return;
    setScores((prev) => ({ ...prev, [key]: score }));
    setSaving((p) => new Set(p).add(key));
    await fetch("/api/admin/hackathon-scores", {
      method: "POST",
      headers: adminHeaders(),
      body: JSON.stringify({ judge_name: voterName, submission_id: submissionId, criterion_key: key, score }),
    });
    setSaving((p) => { const s = new Set(p); s.delete(key); return s; });
    setSaved((p) => new Set(p).add(key));
    setTimeout(() => setSaved((p) => { const s = new Set(p); s.delete(key); return s; }), 1500);
  };

  if (criteria.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-muted/20 px-4 py-3">
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          No track selected — scoring unavailable
        </p>
      </div>
    );
  }

  // Name prompt
  if (!voterName || editingName) {
    return (
      <div className="overflow-hidden rounded-xl border border-border">
        <div className="border-b border-border bg-muted/30 px-4 py-3">
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            Your vote
          </span>
        </div>
        <div className="flex flex-col gap-3 px-4 py-4">
          <p className="text-sm text-muted-foreground">
            {editingName ? "Change your name:" : "Enter your name to start scoring:"}
          </p>
          <div className="flex gap-2">
            <input
              autoFocus
              type="text"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && saveName()}
              placeholder="Your first name"
              className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground/40 focus:border-foreground/40"
            />
            <button
              onClick={saveName}
              disabled={!nameInput.trim()}
              className="rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-40"
            >
              {editingName ? "Save" : "Start"}
            </button>
            {editingName && (
              <button
                onClick={() => { setEditingName(false); setNameInput(""); }}
                className="rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground hover:bg-muted"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Notes state
  const [notes, setNotes] = useState("");
  const [notesSaving, setNotesSaving] = useState(false);
  const [notesSaved, setNotesSaved] = useState(false);
  const notesSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Custom criteria state
  const [customCriteria, setCustomCriteria] = useState<{ key: string; label: string }[]>([]);
  const [newCriterionInput, setNewCriterionInput] = useState("");

  useEffect(() => {
    if (!voterName) return;
    const params = new URLSearchParams({ submission_id: submissionId, judge_name: voterName });
    fetch(`/api/admin/hackathon-notes?${params}`, { headers: adminHeaders() })
      .then((r) => r.ok ? r.json() : { notes: "" })
      .then((d: { notes: string }) => setNotes(d.notes));
  }, [submissionId, voterName]);

  const saveNotes = (value: string) => {
    if (!voterName) return;
    if (notesSaveTimer.current) clearTimeout(notesSaveTimer.current);
    setNotesSaving(true);
    const t = setTimeout(async () => {
      await fetch("/api/admin/hackathon-notes", {
        method: "POST",
        headers: adminHeaders(),
        body: JSON.stringify({ judge_name: voterName, submission_id: submissionId, notes: value }),
      });
      setNotesSaving(false);
      setNotesSaved(true);
      setTimeout(() => setNotesSaved(false), 1500);
    }, 600);
    notesSaveTimer.current = t;
  };

  const addCustomCriterion = () => {
    const label = newCriterionInput.trim();
    if (!label) return;
    const key = `custom::${label}`;
    if (!customCriteria.find((c) => c.key === key)) {
      setCustomCriteria((prev) => [...prev, { key, label }]);
    }
    setNewCriterionInput("");
  };

  // Derive custom criteria from already-saved scores on load
  useEffect(() => {
    const customKeys = Object.keys(scores).filter((k) => k.startsWith("custom::"));
    if (customKeys.length > 0) {
      setCustomCriteria(customKeys.map((k) => ({ key: k, label: k.replace("custom::", "") })));
    }
  }, [scores]);

  const total = weightedScore(scores, criteria);
  const allScored = criteria.every((c) => scores[c.key] != null);

  const ScoreRow = ({ criterionKey, label, badge }: { criterionKey: string; label: string; badge?: string }) => {
    const current = scores[criterionKey] ?? null;
    return (
      <div className="border-b border-border/60 last:border-b-0 px-4 py-4">
        <div className="mb-3 flex items-center justify-between gap-2">
          <span className="text-sm font-medium leading-snug">{label}</span>
          <div className="flex shrink-0 items-center gap-2">
            {saving.has(criterionKey) && (
              <span className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground animate-pulse">Saving</span>
            )}
            {saved.has(criterionKey) && !saving.has(criterionKey) && (
              <CheckCircle2 className="size-3 text-green-500" />
            )}
            {badge && (
              <span className="rounded-full bg-muted px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
                {badge}
              </span>
            )}
          </div>
        </div>
        <div className="grid grid-cols-5 gap-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              onClick={() => handleScore(criterionKey, n)}
              className={`h-10 rounded-lg font-mono text-base font-semibold transition-all active:scale-95 ${
                current === n
                  ? "bg-foreground text-background shadow-sm"
                  : "border border-border/60 bg-muted/30 text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-0 overflow-hidden rounded-xl border border-border">
      {/* Header row */}
      <div className="flex items-center justify-between border-b border-border bg-muted/30 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            {voterName}&apos;s vote
          </span>
          <button
            onClick={() => { setEditingName(true); setNameInput(voterName); }}
            className="rounded p-0.5 text-muted-foreground/40 transition-colors hover:text-muted-foreground"
            title="Change name"
          >
            <Pencil className="size-2.5" />
          </button>
        </div>
        <span className={`font-mono text-lg font-semibold tabular-nums leading-none ${allScored ? "text-foreground" : "text-muted-foreground/30"}`}>
          {total > 0 ? total : "—"}
          <span className="ml-0.5 font-mono text-[10px] font-normal text-muted-foreground">/100</span>
        </span>
      </div>

      {/* Rubric criteria */}
      {criteria.map((c) => (
        <ScoreRow key={c.key} criterionKey={c.key} label={c.label} badge={`${Math.round(c.weight * 100)}%`} />
      ))}

      {/* Overall impression */}
      <div className="border-t-2 border-border/80">
        <ScoreRow criterionKey="__overall__" label="Overall impression" />
      </div>

      {/* Custom criteria */}
      {customCriteria.map((c) => (
        <ScoreRow key={c.key} criterionKey={c.key} label={c.label} />
      ))}

      {/* Add custom criterion */}
      <div className="border-b border-border/60 px-4 py-3">
        <div className="flex gap-2">
          <input
            type="text"
            value={newCriterionInput}
            onChange={(e) => setNewCriterionInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addCustomCriterion()}
            placeholder="Add your own criterion…"
            className="flex-1 rounded-lg border border-dashed border-border bg-transparent px-3 py-1.5 text-sm outline-none transition-colors placeholder:text-muted-foreground/30 focus:border-foreground/30"
          />
          <button
            onClick={addCustomCriterion}
            disabled={!newCriterionInput.trim()}
            className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-30"
          >
            Add
          </button>
        </div>
      </div>

      {/* Notes */}
      <div className="px-4 py-4">
        <div className="mb-2 flex items-center justify-between">
          <span className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">Your notes</span>
          <div className="flex items-center gap-1.5">
            {notesSaving && <span className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground animate-pulse">Saving</span>}
            {notesSaved && !notesSaving && <CheckCircle2 className="size-3 text-green-500" />}
          </div>
        </div>
        <textarea
          value={notes}
          onChange={(e) => { setNotes(e.target.value); saveNotes(e.target.value); }}
          placeholder="Write your thoughts, concerns, or anything that stood out…"
          rows={3}
          className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm leading-relaxed outline-none transition-colors placeholder:text-muted-foreground/30 focus:border-foreground/30"
        />
      </div>
    </div>
  );
}

function DetailPanel({
  submission,
  isFinalist,
  onToggleFinalist,
  isRound2,
  onToggleRound2,
  onClose,
}: {
  submission: Submission;
  isFinalist: boolean;
  onToggleFinalist: () => void;
  isRound2: boolean;
  onToggleRound2: () => void;
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
          {/* Round 2 + Finalist toggles */}
          <div className="flex gap-2">
            <button
              onClick={onToggleRound2}
              className={`inline-flex flex-1 items-center justify-center gap-2 rounded-lg border py-2.5 text-sm font-medium transition-colors ${
                isRound2
                  ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 dark:text-emerald-400"
                  : "border-border bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {isRound2 ? "✓ Round 2" : "Round 2?"}
            </button>
            <button
              onClick={onToggleFinalist}
              className={`inline-flex flex-1 items-center justify-center gap-2 rounded-lg border py-2.5 text-sm font-medium transition-colors ${
                isFinalist
                  ? "border-amber-500/40 bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 dark:text-amber-400"
                  : "border-border bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <Trophy className="size-4" />
              {isFinalist ? "★ Finalist" : "Finalist?"}
            </button>
          </div>

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

          {/* Berto's voting */}
          <div className="border-t border-border pt-6">
            <TeamVoting submissionId={submission.id} track={submission.challenge_track} />
          </div>
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
  const [isAuthed, setIsAuthed] = useState<boolean>(
    () => typeof window !== "undefined" && sessionStorage.getItem(SESSION_KEY) === PASSWORD,
  );
  const [password, setPassword] = useState("");
  const [pwError, setPwError] = useState(false);

  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [selected, setSelected] = useState<Submission | null>(null);
  const [finalistIds, setFinalistIds] = useState<Set<string>>(new Set());
  const [round2Ids, setRound2Ids] = useState<Set<string>>(new Set());

  const submitPassword = () => {
    if (password === PASSWORD) {
      sessionStorage.setItem(SESSION_KEY, PASSWORD);
      setIsAuthed(true);
    } else {
      setPwError(true);
      setPassword("");
    }
  };

  useEffect(() => {
    if (!isAuthed) return;
    const load = async () => {
      setLoading(true);
      const res = await fetch("/api/admin/hackathon-submissions", { headers: adminHeaders() });
      if (res.ok) {
        const rows = (await res.json()) as Submission[];
        setSubmissions(rows);
        setFinalistIds(new Set(rows.filter((r) => r.is_finalist).map((r) => r.id)));
        setRound2Ids(new Set(rows.filter((r) => r.is_round2).map((r) => r.id)));
      }
      setLoading(false);
    };
    load();
  }, [isAuthed]);

  const trackCounts = submissions.reduce<Record<string, number>>((acc, s) => {
    const t = s.challenge_track ?? "—";
    acc[t] = (acc[t] ?? 0) + 1;
    return acc;
  }, {});

  const filtered = filter === "all"
    ? submissions
    : filter === "round2"
    ? submissions.filter((s) => round2Ids.has(s.id))
    : submissions.filter((s) => s.challenge_track === filter);

  const toggleFinalist = (id: string) => {
    setFinalistIds((prev) => {
      const wasSelected = prev.has(id);
      const next = new Set(prev);
      if (wasSelected) next.delete(id); else next.add(id);
      fetch("/api/admin/hackathon-submissions", {
        method: "PATCH",
        headers: adminHeaders(),
        body: JSON.stringify({ id, is_finalist: !wasSelected }),
      });
      return next;
    });
  };

  const toggleRound2 = (id: string) => {
    setRound2Ids((prev) => {
      const was = prev.has(id);
      const next = new Set(prev);
      if (was) next.delete(id); else next.add(id);
      fetch("/api/admin/hackathon-submissions", {
        method: "PATCH",
        headers: adminHeaders(),
        body: JSON.stringify({ id, is_round2: !was }),
      });
      return next;
    });
  };

  const finalists = submissions.filter((s) => finalistIds.has(s.id));

  const exportCsv = () => download(`hackathon-submissions_${timestampForFilename()}.csv`, "text/csv;charset=utf-8", buildCsv(filtered));
  const exportJson = () => download(`hackathon-submissions_${timestampForFilename()}.json`, "application/json", JSON.stringify(filtered, null, 2));
  const exportFinalistsCsv = () => download(`hackathon-finalists_${timestampForFilename()}.csv`, "text/csv;charset=utf-8", buildCsv(finalists));
  const exportFinalistsJson = () => download(`hackathon-finalists_${timestampForFilename()}.json`, "application/json", JSON.stringify(finalists, null, 2));

  if (!isAuthed) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background px-5">
        <div className="w-full max-w-sm flex flex-col gap-8">
          <div>
            <p className="font-mono text-[0.6rem] uppercase tracking-[0.2em] text-muted-foreground mb-2">
              2026 Innovation Hackathon · Admin
            </p>
            <h1 className="text-2xl font-semibold tracking-tight">Submissions</h1>
          </div>
          <div className="flex flex-col gap-3">
            <label className="font-mono text-[0.6rem] uppercase tracking-[0.18em] text-muted-foreground">
              Password
            </label>
            <input
              type="password"
              autoFocus
              value={password}
              onChange={(e) => { setPassword(e.target.value); setPwError(false); }}
              onKeyDown={(e) => e.key === "Enter" && submitPassword()}
              placeholder="Enter password"
              className={`w-full rounded-lg border bg-card px-4 py-3 text-sm outline-none transition-colors placeholder:text-muted-foreground/40 ${
                pwError ? "border-red-500/60" : "border-border focus:border-foreground/40"
              }`}
            />
            {pwError && (
              <p className="font-mono text-[0.6rem] uppercase tracking-[0.15em] text-red-400">
                Incorrect password
              </p>
            )}
            <button
              onClick={submitPassword}
              className="w-full rounded-lg bg-foreground px-4 py-3 text-sm font-medium text-background hover:opacity-90 transition-opacity"
            >
              Continue
            </button>
          </div>
        </div>
      </div>
    );
  }

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
        <div className="flex flex-col items-start gap-3 sm:items-end">
          <div className="flex items-center gap-4">
            <span className="font-mono text-xs uppercase tracking-[0.12em] text-muted-foreground">
              Total{" "}
              <span className="ml-1 text-base font-medium tabular-nums text-foreground">
                {submissions.length}
              </span>
            </span>
            <span className="h-3 w-px bg-border" />
            <span className="font-mono text-xs uppercase tracking-[0.12em] text-muted-foreground">
              Finalists{" "}
              <span className={`ml-1 text-base font-medium tabular-nums ${
                finalistIds.size === 0 ? "text-muted-foreground"
                : finalistIds.size >= MIN_FINALISTS && finalistIds.size <= MAX_FINALISTS ? "text-green-600 dark:text-green-400"
                : finalistIds.size > MAX_FINALISTS ? "text-red-500"
                : "text-amber-500"
              }`}>
                {finalistIds.size}
              </span>
              <span className="ml-0.5 text-muted-foreground/60">/{MAX_FINALISTS}</span>
            </span>
          </div>

          {finalistIds.size > 0 && (
            <div className="flex items-center gap-1.5">
              <Trophy className="size-3 text-amber-500" />
              <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-amber-500">
                {finalistIds.size < MIN_FINALISTS ? `${MIN_FINALISTS - finalistIds.size} more to go`
                  : finalistIds.size > MAX_FINALISTS ? `${finalistIds.size - MAX_FINALISTS} over limit`
                  : "Good range"}
              </span>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            {finalistIds.size > 0 && (
              <>
                <button type="button" onClick={exportFinalistsCsv}
                  className="inline-flex items-center gap-1.5 rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-1.5 text-xs font-medium text-amber-600 transition-colors hover:bg-amber-500/20 dark:text-amber-400">
                  <FileSpreadsheet className="size-3.5" />Finalists CSV
                </button>
                <button type="button" onClick={exportFinalistsJson}
                  className="inline-flex items-center gap-1.5 rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-1.5 text-xs font-medium text-amber-600 transition-colors hover:bg-amber-500/20 dark:text-amber-400">
                  <FileJson className="size-3.5" />Finalists JSON
                </button>
              </>
            )}
            <button type="button" onClick={exportCsv} disabled={filtered.length === 0}
              className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-40">
              <FileSpreadsheet className="size-3.5" />All CSV
            </button>
            <button type="button" onClick={exportJson} disabled={filtered.length === 0}
              className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-40">
              <FileJson className="size-3.5" />All JSON
            </button>
          </div>
        </div>
      </header>

      {/* Filter pills */}
      {submissions.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          <button
            onClick={() => setFilter("all")}
            className={`rounded-full border px-3 py-1 font-mono text-[10px] uppercase tracking-[0.15em] transition-colors ${filter === "all" ? "border-foreground bg-foreground text-background" : "border-border text-muted-foreground hover:border-foreground/50"}`}
          >
            All ({submissions.length})
          </button>
          <button
            onClick={() => setFilter(filter === "round2" ? "all" : "round2")}
            className={`rounded-full border px-3 py-1 font-mono text-[10px] uppercase tracking-[0.15em] transition-colors ${filter === "round2" ? "border-emerald-500 bg-emerald-500 text-white" : "border-emerald-500/40 text-emerald-600 dark:text-emerald-400 hover:border-emerald-500/70"}`}
          >
            Round 2 ({round2Ids.size})
          </button>
          <span className="self-center w-px h-3 bg-border" />
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
                  <th className="w-10 px-4 py-3" />
                  <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-[0.18em] text-emerald-600 dark:text-emerald-400 whitespace-nowrap">R2</th>
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
                {filtered.map((s, i) => {
                  const isFinalist = finalistIds.has(s.id);
                  const isRound2 = round2Ids.has(s.id);
                  return (
                  <tr
                    key={s.id}
                    onClick={() => setSelected(s)}
                    className={
                      "cursor-pointer border-b border-border last:border-b-0 align-top transition-colors " +
                      (isFinalist ? "bg-amber-500/8 hover:bg-amber-500/12"
                        : isRound2 ? "bg-emerald-500/8 hover:bg-emerald-500/12"
                        : i % 2 === 0 ? "bg-transparent hover:bg-muted/40"
                        : "bg-muted/10 hover:bg-muted/40")
                    }
                  >
                    <td className="px-4 py-4">
                      <input
                        type="checkbox"
                        checked={isFinalist}
                        onChange={() => toggleFinalist(s.id)}
                        onClick={(e) => e.stopPropagation()}
                        className="size-4 cursor-pointer rounded accent-amber-500"
                      />
                    </td>
                    <td className="px-4 py-4">
                      <input
                        type="checkbox"
                        checked={isRound2}
                        onChange={() => toggleRound2(s.id)}
                        onClick={(e) => e.stopPropagation()}
                        className="size-4 cursor-pointer rounded accent-emerald-500"
                      />
                    </td>
                    <Td className="min-w-[16rem] max-w-[22rem]">
                      <div className="flex flex-col gap-1">
                        <span className="flex items-center gap-1.5 font-medium text-foreground">
                          {isFinalist && <Trophy className="size-3 shrink-0 text-amber-500" />}
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
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selected && (
        <DetailPanel
          submission={selected}
          isFinalist={finalistIds.has(selected.id)}
          onToggleFinalist={() => toggleFinalist(selected.id)}
          isRound2={round2Ids.has(selected.id)}
          onToggleRound2={() => toggleRound2(selected.id)}
          onClose={() => setSelected(null)}
        />
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
