"use client";

import { useState } from "react";

const MIN_FREEFORM = 20;
const MAX_FREEFORM = 600;

type Status =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "ok"; name: string }
  | { kind: "error"; message: string };

export default function SignupForm() {
  const [name, setName] = useState("");
  const [background, setBackground] = useState("");
  const [lookingFor, setLookingFor] = useState("");
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  const bgLen = background.trim().length;
  const lfLen = lookingFor.trim().length;

  const canSubmit =
    name.trim().length > 0 &&
    bgLen >= MIN_FREEFORM &&
    lfLen >= MIN_FREEFORM &&
    status.kind !== "submitting";

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setStatus({ kind: "submitting" });
    try {
      const res = await fetch("/api/hackathon/find-team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          background: background.trim(),
          looking_for: lookingFor.trim(),
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
      <div className="flex flex-col gap-4 rounded-lg border border-foreground/20 bg-foreground/[0.04] p-5">
        <div className="flex items-center gap-3 font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
          <span className="text-foreground">Submitted</span>
          <span className="h-px w-8 bg-border" />
          <span>Innovation Hackathon</span>
        </div>
        <h2 className="font-serif text-3xl leading-tight tracking-tight">
          You&apos;re in, {status.name}.
        </h2>
        <p className="text-sm text-muted-foreground">
          We&apos;ll match you into a team once enough builders sign up.
          Watch your email and the Discord for next steps.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={submit}
      className="flex flex-col gap-6"
      noValidate
    >
      <label className="flex flex-col gap-2">
          <span className="font-mono text-xs uppercase tracking-[0.18em] text-foreground">
            Your name
          </span>
          <input
            type="text"
            inputMode="text"
            autoComplete="given-name"
            autoCapitalize="words"
            autoCorrect="off"
            spellCheck={false}
            enterKeyHint="next"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="First name is fine"
            maxLength={80}
            required
            className="rounded-lg border border-border bg-card px-4 py-4 text-lg text-foreground placeholder:text-muted-foreground/60 focus:border-foreground focus:outline-none"
          />
        </label>

        <FreeformField
          label="Your background"
          helper="Engineer, designer, PM? What have you built? What are you good at?"
          value={background}
          setValue={setBackground}
          length={bgLen}
        />

        <FreeformField
          label="Who you're looking for"
          helper="What skills, vibes, or interests are you hoping your teammates bring?"
          value={lookingFor}
          setValue={setLookingFor}
          length={lfLen}
        />

        {status.kind === "error" && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {status.message}
          </div>
        )}

      <button
        type="submit"
        disabled={!canSubmit}
        className="mt-2 rounded-lg bg-foreground px-6 py-4 font-mono text-sm uppercase tracking-[0.18em] text-background transition-opacity disabled:opacity-40"
      >
        {status.kind === "submitting" ? "Saving…" : "Submit"}
      </button>
    </form>
  );
}

function FreeformField({
  label,
  helper,
  value,
  setValue,
  length,
}: {
  label: string;
  helper: string;
  value: string;
  setValue: (v: string) => void;
  length: number;
}) {
  const tooShort = length > 0 && length < MIN_FREEFORM;
  const ok = length >= MIN_FREEFORM;
  return (
    <label className="flex flex-col gap-2">
      <div className="flex w-full items-baseline justify-between font-mono text-xs uppercase tracking-[0.18em]">
        <span className="text-foreground">{label}</span>
        <span
          className={
            ok
              ? "text-foreground"
              : tooShort
                ? "text-destructive"
                : "text-muted-foreground"
          }
        >
          {length}/{MIN_FREEFORM}+
        </span>
      </div>
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={helper}
        maxLength={MAX_FREEFORM}
        rows={4}
        required
        className="min-h-[120px] resize-y rounded-lg border border-border bg-card px-4 py-3 text-base leading-relaxed text-foreground placeholder:text-muted-foreground/60 focus:border-foreground focus:outline-none"
      />
    </label>
  );
}
