"use client";

import { useState } from "react";

type Status =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "ok"; name: string }
  | { kind: "error"; message: string };

export default function DemoSignupForm() {
  const [teamName, setTeamName] = useState("");
  const [name, setName] = useState("");
  const [project, setProject] = useState("");
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  const canSubmit =
    teamName.trim().length > 0 &&
    name.trim().length > 0 &&
    project.trim().length > 0 &&
    status.kind !== "submitting";

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setStatus({ kind: "submitting" });
    try {
      const res = await fetch("/api/mulerun/demos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          team_name: teamName.trim(),
          name: name.trim(),
          project: project.trim(),
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setStatus({
          kind: "error",
          message: body?.error ?? "Couldn't save. Try again.",
        });
        return;
      }
      setStatus({ kind: "ok", name: name.trim() });
    } catch {
      setStatus({
        kind: "error",
        message: "Network error. Check your connection and try again.",
      });
    }
  };

  if (status.kind === "ok") {
    return (
      <div className="min-h-svh bg-background px-5 pt-[max(2rem,env(safe-area-inset-top))] pb-[max(2rem,env(safe-area-inset-bottom))]">
        <div className="mx-auto flex max-w-md flex-col gap-6 pt-16">
          <div className="flex items-center gap-3 font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
            <span className="text-foreground">In the lineup</span>
            <span className="h-px w-8 bg-border" />
            <span>Mulerun</span>
          </div>
          <h1 className="font-serif text-5xl leading-[0.95] tracking-tight">
            You&apos;re in,
            <br />
            {status.name}.
          </h1>
          <p className="text-base text-muted-foreground">
            We&apos;ll call you up when it&apos;s your turn. Keep your laptop
            charged and your demo ready to run.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-svh bg-background px-5 pt-[max(2rem,env(safe-area-inset-top))] pb-[max(2rem,env(safe-area-inset-bottom))]">
      <form
        onSubmit={submit}
        className="mx-auto flex max-w-md flex-col gap-7 pt-8"
        noValidate
      >
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3 font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
            <span className="text-foreground">Submit</span>
            <span className="h-px w-8 bg-border" />
            <span>Mulerun demo</span>
          </div>
          <h1 className="font-serif text-4xl leading-[0.95] tracking-tight sm:text-5xl">
            Throw your hat in.
          </h1>
          <p className="text-sm text-muted-foreground">
            Three fields. We&apos;ll add you to the lineup. Berto calls teams
            up at random.
          </p>
        </div>

        {/* Team name */}
        <label className="flex flex-col gap-2">
          <span className="font-mono text-xs uppercase tracking-[0.18em] text-foreground">
            Team name
          </span>
          <input
            type="text"
            inputMode="text"
            autoComplete="off"
            autoCapitalize="words"
            autoCorrect="off"
            spellCheck={false}
            enterKeyHint="next"
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            placeholder="MoodMakers"
            maxLength={80}
            required
            className="rounded-lg border border-border bg-card px-4 py-4 text-lg text-foreground placeholder:text-muted-foreground/60 focus:border-foreground focus:outline-none"
          />
        </label>

        {/* Member names */}
        <label className="flex flex-col gap-2">
          <span className="font-mono text-xs uppercase tracking-[0.18em] text-foreground">
            Member names
          </span>
          <input
            type="text"
            inputMode="text"
            autoComplete="off"
            autoCapitalize="words"
            autoCorrect="off"
            spellCheck={false}
            enterKeyHint="next"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Alice & Bob"
            maxLength={120}
            required
            className="rounded-lg border border-border bg-card px-4 py-4 text-lg text-foreground placeholder:text-muted-foreground/60 focus:border-foreground focus:outline-none"
          />
        </label>

        {/* Project */}
        <label className="flex flex-col gap-2">
          <span className="font-mono text-xs uppercase tracking-[0.18em] text-foreground">
            What you built
          </span>
          <textarea
            inputMode="text"
            autoCapitalize="sentences"
            autoCorrect="on"
            enterKeyHint="done"
            value={project}
            onChange={(e) => setProject(e.target.value)}
            placeholder="One sentence. e.g. An agent that books restaurants by text."
            maxLength={200}
            required
            rows={3}
            className="resize-none rounded-lg border border-border bg-card px-4 py-3 text-base text-foreground placeholder:text-muted-foreground/60 focus:border-foreground focus:outline-none"
          />
          <span className="self-end font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            {project.length}/200
          </span>
        </label>

        {status.kind === "error" && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {status.message}
          </div>
        )}

        <button
          type="submit"
          disabled={!canSubmit}
          className="sticky bottom-4 mt-2 rounded-lg bg-foreground px-6 py-4 font-mono text-sm uppercase tracking-[0.18em] text-background transition-opacity disabled:opacity-40"
        >
          {status.kind === "submitting" ? "Submitting…" : "Add me to the lineup"}
        </button>
      </form>
    </div>
  );
}
