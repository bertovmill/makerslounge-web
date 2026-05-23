"use client";

import { useRef, useState } from "react";
import { Check, Loader2, Paperclip, X } from "lucide-react";
import { supabase } from "@/lib/supabase";

const CHALLENGE_TRACKS = [
  "Validating a Business Idea",
  "Continuous Market Monitoring",
  "Synthetic Customers",
];

const MAX_FILE_BYTES = 100 * 1024 * 1024;
const MAX_FILES = 10;

type Status = "idle" | "uploading" | "submitting" | "done" | "error";

interface FormState {
  projectLink: string;
  title: string;
  description: string;
  videoUrl: string;
  teamName: string;
  builderEmails: string;
  challengeTrack: string;
}

const initialState: FormState = {
  projectLink: "",
  title: "",
  description: "",
  videoUrl: "",
  teamName: "",
  builderEmails: "",
  challengeTrack: "",
};

export default function SubmissionForm() {
  const [form, setForm] = useState<FormState>(initialState);
  const [files, setFiles] = useState<File[]>([]);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [submissionId, setSubmissionId] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function addFiles(newFiles: FileList | File[]) {
    const incoming = Array.from(newFiles);
    const total = files.length + incoming.length;
    if (total > MAX_FILES) {
      setError(`Up to ${MAX_FILES} files. Remove some first.`);
      return;
    }
    const oversize = incoming.find((f) => f.size > MAX_FILE_BYTES);
    if (oversize) {
      setError(`${oversize.name} is over 100 MB. Link a hosted file instead.`);
      return;
    }
    setError(null);
    setFiles((prev) => [...prev, ...incoming]);
  }

  function removeFile(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }

  function validate(): string | null {
    const link = form.projectLink.trim();
    if (!link) return "Project link is required.";
    try {
      const url = new URL(link);
      if (!/^https?:/.test(url.protocol)) return "Project link must start with http or https.";
    } catch {
      return "Project link is not a valid URL.";
    }
    if (form.videoUrl.trim()) {
      try {
        new URL(form.videoUrl.trim());
      } catch {
        return "Video URL is not a valid URL.";
      }
    }
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);

    const tempId = crypto.randomUUID();
    let uploadedPaths: string[] = [];

    try {
      if (files.length > 0) {
        setStatus("uploading");
        for (const file of files) {
          const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
          const path = `pending/${tempId}/${safeName}`;
          const { error: uploadErr } = await supabase.storage
            .from("hackathon-submissions")
            .upload(path, file, { upsert: false, contentType: file.type || undefined });
          if (uploadErr) throw new Error(`Upload failed: ${uploadErr.message}`);
          uploadedPaths.push(path);
        }
      }

      setStatus("submitting");
      const builderEmails = form.builderEmails
        .split(/[\s,]+/)
        .map((e) => e.trim())
        .filter(Boolean);

      const res = await fetch("/api/hackathon/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project_link: form.projectLink.trim(),
          title: form.title.trim() || null,
          description: form.description.trim() || null,
          video_url: form.videoUrl.trim() || null,
          file_urls: uploadedPaths,
          team_name: form.teamName.trim() || null,
          builder_emails: builderEmails,
          challenge_track: form.challengeTrack || null,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `Submission failed (${res.status})`);
      }

      const body = await res.json();
      setSubmissionId(body.id);
      setStatus("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Try again.");
      setStatus("error");
    }
  }

  if (status === "done") {
    return (
      <div className="flex flex-col gap-8">
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
            Status
          </span>
          <span className="inline-flex items-center gap-2 font-mono text-sm uppercase tracking-[0.18em] text-foreground">
            <Check className="size-4" />
            Received
          </span>
        </div>
        <p className="font-serif text-[clamp(2.5rem,7vw,6rem)] leading-[0.95] tracking-tight">
          Got it. See you May 26.
        </p>
        <div className="flex flex-col gap-2 font-mono text-sm text-muted-foreground">
          <span>Submission ID</span>
          <code className="select-all text-foreground">{submissionId}</code>
        </div>
        <p className="max-w-[55ch] text-base text-muted-foreground sm:text-lg">
          We confirmed your submission. Keep this ID for your records. Demo night runs Tuesday May 26, 5:30 to 8:30 PM, at 510 Front St W, Suite 200.
        </p>
      </div>
    );
  }

  const submitting = status === "uploading" || status === "submitting";
  const submitLabel =
    status === "uploading"
      ? "Uploading files…"
      : status === "submitting"
        ? "Submitting…"
        : "Submit project";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-7 max-w-[58ch]">
      <Field
        label="Project link"
        required
        hint="Required. GitHub, Loom, deployed app, demo URL."
      >
        <input
          type="url"
          required
          placeholder="https://"
          value={form.projectLink}
          onChange={(e) => update("projectLink", e.target.value)}
          className={fieldInput}
        />
      </Field>

      <Field label="Title" hint="Optional. What's your project called?">
        <input
          type="text"
          value={form.title}
          onChange={(e) => update("title", e.target.value)}
          className={fieldInput}
        />
      </Field>

      <Field label="Description" hint="Optional. What did you build, and why does it matter?">
        <textarea
          rows={4}
          value={form.description}
          onChange={(e) => update("description", e.target.value)}
          className={`${fieldInput} resize-y min-h-[7rem]`}
        />
      </Field>

      <Field label="Demo video" hint="Optional. YouTube, Loom, or Vimeo URL.">
        <input
          type="url"
          placeholder="https://"
          value={form.videoUrl}
          onChange={(e) => update("videoUrl", e.target.value)}
          className={fieldInput}
        />
      </Field>

      <Field
        label="Files"
        hint={`Optional. Up to ${MAX_FILES} files, 100 MB each. Decks, screenshots, demo clips.`}
      >
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files);
          }}
          onClick={() => fileInputRef.current?.click()}
          className={
            "flex cursor-pointer flex-col items-start gap-3 rounded-md border border-dashed px-5 py-6 transition-colors " +
            (dragOver
              ? "border-primary bg-primary/5"
              : "border-border hover:border-foreground/40")
          }
        >
          <div className="flex items-center gap-2 font-mono text-sm text-foreground">
            <Paperclip className="size-4" />
            <span>{dragOver ? "Drop to attach" : "Click or drop files here"}</span>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.length) addFiles(e.target.files);
              e.target.value = "";
            }}
          />
        </div>
        {files.length > 0 && (
          <ul className="mt-3 flex flex-col gap-1.5 font-mono text-xs">
            {files.map((f, i) => (
              <li
                key={`${f.name}-${i}`}
                className="flex items-center justify-between gap-3 border-b border-border/60 pb-1.5"
              >
                <span className="truncate text-foreground">{f.name}</span>
                <div className="flex items-center gap-3 text-muted-foreground">
                  <span>{formatBytes(f.size)}</span>
                  <button
                    type="button"
                    onClick={() => removeFile(i)}
                    className="rounded text-muted-foreground hover:text-foreground"
                    aria-label={`Remove ${f.name}`}
                  >
                    <X className="size-3.5" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Field>

      <Field label="Team name" hint="Optional.">
        <input
          type="text"
          value={form.teamName}
          onChange={(e) => update("teamName", e.target.value)}
          className={fieldInput}
        />
      </Field>

      <Field
        label="Builder emails"
        hint="Optional. One or more, comma or newline separated."
      >
        <textarea
          rows={2}
          value={form.builderEmails}
          onChange={(e) => update("builderEmails", e.target.value)}
          className={`${fieldInput} resize-y min-h-[3.5rem]`}
          placeholder="alex@example.com, jordan@example.com"
        />
      </Field>

      {CHALLENGE_TRACKS.length > 0 && (
        <Field label="Challenge track" hint="Optional.">
          <select
            value={form.challengeTrack}
            onChange={(e) => update("challengeTrack", e.target.value)}
            className={fieldInput}
          >
            <option value="">—</option>
            {CHALLENGE_TRACKS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </Field>
      )}

      {error && (
        <div className="border border-destructive/40 bg-destructive/5 px-4 py-3 font-mono text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center gap-2 bg-foreground px-6 py-3 font-mono text-sm uppercase tracking-[0.18em] text-background transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting && <Loader2 className="size-4 animate-spin" />}
          {submitLabel}
        </button>
        <span className="font-mono text-xs text-muted-foreground">
          Deadline: Sun May 24, 11:59 PM EDT
        </span>
      </div>
    </form>
  );
}

function Field({
  label,
  hint,
  required,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-2">
      <span className="flex items-baseline gap-2 font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
        <span className="text-foreground">{label}</span>
        {required && <span className="text-primary">required</span>}
      </span>
      {children}
      {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
    </label>
  );
}

const fieldInput =
  "w-full bg-transparent border-b border-border px-0 py-2 text-base text-foreground placeholder:text-muted-foreground focus:border-foreground focus:outline-none transition-colors";

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
}
