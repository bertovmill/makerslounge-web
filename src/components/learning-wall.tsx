"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { MessagesSquare, X, Send, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type Goal = {
  id: string;
  text: string;
  createdAt: string;
  mine: boolean;
};

const MAX_LENGTH = 280;
const POLL_MS = 6000;

export const OPEN_LEARNING_WALL = "open-learning-wall";

function timeAgo(iso: string) {
  const seconds = Math.round((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

export function LearningWall() {
  const [open, setOpen] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [signedOut, setSignedOut] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/learning-goals");
      // The deck itself is public, so a signed-out viewer can reach this panel.
      if (res.status === 401) {
        setSignedOut(true);
        return;
      }
      if (!res.ok) return;
      const data = await res.json();
      setSignedOut(false);
      setGoals(data.goals ?? []);
    } catch {
      // Offline or mid-deploy — keep whatever is already on screen.
    }
  }, []);

  // Deep link from the QR code: /?wall=open opens the panel straight away.
  // Deferred a frame so the panel slides in rather than appearing pre-opened,
  // and so hydration matches the server-rendered (closed) markup.
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      if (new URLSearchParams(window.location.search).get("wall") === "open") {
        setOpen(true);
      }
    });
    return () => cancelAnimationFrame(id);
  }, []);

  // Let anything on the page (e.g. the CTA on the attendees slide) open the panel.
  useEffect(() => {
    const onOpen = () => setOpen(true);
    window.addEventListener(OPEN_LEARNING_WALL, onOpen);
    return () => window.removeEventListener(OPEN_LEARNING_WALL, onOpen);
  }, []);

  // Keep the count on the toggle fresh, and poll faster while the panel is open.
  useEffect(() => {
    const first = setTimeout(load, 0);
    const poll = setInterval(load, open ? POLL_MS : POLL_MS * 5);
    return () => {
      clearTimeout(first);
      clearInterval(poll);
    };
  }, [load, open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  async function submit() {
    const text = draft.trim();
    if (!text || sending) return;
    setSending(true);
    setError(null);
    try {
      const res = await fetch("/api/learning-goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error ?? "Couldn't post that — try again.");
        return;
      }
      setDraft("");
      setGoals((prev) => [data.goal, ...prev]);
      listRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setError("Couldn't post that — check your connection.");
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open the what are you here to learn wall"
          className="fixed top-5 right-5 z-50 flex cursor-pointer items-center gap-2 rounded-full border border-white/15 bg-ink/70 px-4 py-2.5 text-sm font-medium text-white shadow-lg backdrop-blur-md transition hover:border-white/30 hover:bg-ink/90"
        >
          <MessagesSquare className="size-4 shrink-0" />
          <span className="hidden sm:inline">What are you here to learn?</span>
          {goals.length > 0 && (
            <span className="rounded-full bg-brand px-2 py-0.5 text-xs font-semibold">
              {goals.length}
            </span>
          )}
        </button>
      )}

      <aside
        aria-hidden={!open}
        className={`fixed top-0 right-0 z-60 flex h-dvh w-[min(400px,100vw)] flex-col border-l border-[#e3ecf5] bg-white shadow-2xl transition-transform duration-300 ease-out ${
          open ? "translate-x-0" : "pointer-events-none translate-x-full"
        }`}
      >
        <header className="flex items-start justify-between gap-3 border-b border-[#e3ecf5] px-5 py-4">
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-ink">What are you here to learn?</h2>
            <p className="mt-0.5 text-xs text-ink-muted">
              Posted anonymously — no names attached.
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={() => setShowQr((v) => !v)}
              aria-label={showQr ? "Hide QR code" : "Show QR code"}
              aria-pressed={showQr}
              className={`flex size-8 cursor-pointer items-center justify-center rounded-lg transition ${
                showQr ? "bg-brand/10 text-brand-dark" : "text-ink-muted hover:bg-[#f1f6fb]"
              }`}
            >
              <QrCode className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close panel"
              className="flex size-8 cursor-pointer items-center justify-center rounded-lg text-ink-muted transition hover:bg-[#f1f6fb]"
            >
              <X className="size-4" />
            </button>
          </div>
        </header>

        {showQr && (
          <div className="flex flex-col items-center gap-2 border-b border-[#e3ecf5] bg-[#f7fafd] px-5 py-5">
            <Image
              src="/images/learning-wall-qr.svg"
              alt="QR code linking to this wall"
              width={168}
              height={168}
              className="rounded-xl bg-white p-2 shadow-sm"
              unoptimized
            />
            <p className="text-center text-xs text-ink-muted">
              Scan to add yours from your phone
            </p>
          </div>
        )}

        <div ref={listRef} className="flex-1 overflow-y-auto px-5 py-4">
          {signedOut ? (
            <div className="py-10 text-center">
              <p className="text-sm text-ink-muted">Sign in to see and post to the wall.</p>
              <Link
                href="/sign-in"
                className="mt-3 inline-flex items-center rounded-full bg-brand px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-dark"
              >
                Sign in
              </Link>
            </div>
          ) : goals.length === 0 ? (
            <p className="py-10 text-center text-sm text-ink-muted">
              Nothing yet — be the first to say what you&apos;re here to learn.
            </p>
          ) : (
            <ul className="space-y-2.5">
              {goals.map((goal) => (
                <li
                  key={goal.id}
                  className={`rounded-xl border px-4 py-3 ${
                    goal.mine ? "border-brand/30 bg-brand/5" : "border-[#e3ecf5] bg-[#f7fafd]"
                  }`}
                >
                  <p className="text-sm leading-snug text-ink">{goal.text}</p>
                  <p className="mt-1.5 text-xs text-ink-muted">
                    {goal.mine ? "You" : "Anonymous"} · {timeAgo(goal.createdAt)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className={`border-t border-[#e3ecf5] px-5 py-4 ${signedOut ? "hidden" : ""}`}>
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value.slice(0, MAX_LENGTH))}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
            }}
            placeholder="I'm here to learn…"
            rows={2}
            className="resize-none text-sm"
          />
          {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
          <div className="mt-2 flex items-center justify-between gap-3">
            <span className="text-xs text-ink-muted">
              {draft.length}/{MAX_LENGTH} · Enter to post
            </span>
            <Button
              type="button"
              size="sm"
              onClick={submit}
              disabled={!draft.trim() || sending}
              className="gap-1.5 rounded-full bg-brand hover:bg-brand-dark"
            >
              <Send className="size-3.5" />
              {sending ? "Posting…" : "Post"}
            </Button>
          </div>
        </div>
      </aside>
    </>
  );
}
