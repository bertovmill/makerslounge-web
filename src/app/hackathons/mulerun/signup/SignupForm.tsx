"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import type { Category } from "../categories";
import { MAX_CATEGORIES, MIN_CATEGORIES } from "../categories";

type Status =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "ok"; name: string }
  | { kind: "error"; message: string };

export default function SignupForm({ categories }: { categories: Category[] }) {
  const [name, setName] = useState("");
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  const toggle = (slug: string) => {
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) {
        next.delete(slug);
        return next;
      }
      if (next.size >= MAX_CATEGORIES) return prev;
      next.add(slug);
      return next;
    });
  };

  const canSubmit =
    name.trim().length > 0 &&
    picked.size >= MIN_CATEGORIES &&
    status.kind !== "submitting";

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setStatus({ kind: "submitting" });
    try {
      const res = await fetch("/api/mulerun/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          categories: Array.from(picked),
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
            <span className="text-foreground">Joined</span>
            <span className="h-px w-8 bg-border" />
            <span>Mulerun</span>
          </div>
          <h1 className="font-serif text-5xl leading-[0.95] tracking-tight">
            You&apos;re in,
            <br />
            {status.name}.
          </h1>
          <p className="text-base text-muted-foreground">
            Hang tight. Berto will project the team matches in a few minutes.
            Keep your phone with you so you can find your group.
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
            <span className="text-foreground">Join</span>
            <span className="h-px w-8 bg-border" />
            <span>Mulerun Hack Night</span>
          </div>
          <h1 className="font-serif text-4xl leading-[0.95] tracking-tight sm:text-5xl">
            Find your team.
          </h1>
          <p className="text-sm text-muted-foreground">
            Two quick things. We&apos;ll match you with people who picked
            similar interests.
          </p>
        </div>

        {/* Name */}
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
            enterKeyHint="done"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="First name is fine"
            maxLength={80}
            required
            className="rounded-lg border border-border bg-card px-4 py-4 text-lg text-foreground placeholder:text-muted-foreground/60 focus:border-foreground focus:outline-none"
          />
        </label>

        {/* Categories */}
        <fieldset className="flex flex-col gap-3">
          <legend className="flex w-full items-center justify-between font-mono text-xs uppercase tracking-[0.18em]">
            <span className="text-foreground">
              What do you want to build?
            </span>
            <span className="text-muted-foreground">
              {picked.size}/{MAX_CATEGORIES}
            </span>
          </legend>
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            Pick 1 to {MAX_CATEGORIES}
          </p>
          <div className="grid grid-cols-1 gap-2">
            {categories.map((c) => {
              const isPicked = picked.has(c.slug);
              const disabled =
                !isPicked && picked.size >= MAX_CATEGORIES;
              return (
                <button
                  type="button"
                  key={c.slug}
                  onClick={() => toggle(c.slug)}
                  disabled={disabled}
                  aria-pressed={isPicked}
                  className={
                    "group flex items-center gap-3 rounded-lg border px-4 py-3.5 text-left transition-colors " +
                    (isPicked
                      ? "border-foreground bg-foreground/[0.04]"
                      : disabled
                        ? "border-border bg-card opacity-40"
                        : "border-border bg-card active:bg-foreground/[0.04]")
                  }
                >
                  <span
                    className={
                      "flex size-5 flex-shrink-0 items-center justify-center rounded-md border transition-colors " +
                      (isPicked
                        ? "border-foreground bg-foreground text-background"
                        : "border-border bg-background")
                    }
                  >
                    {isPicked && <Check className="size-3.5" strokeWidth={3} />}
                  </span>
                  <span className="flex flex-1 flex-col">
                    <span className="font-serif text-lg leading-tight tracking-tight text-foreground">
                      {c.name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {c.examples}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </fieldset>

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
          {status.kind === "submitting" ? "Saving…" : "Join the matching"}
        </button>
      </form>
    </div>
  );
}
