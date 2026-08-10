"use client";

import { useEffect, useRef, useState } from "react";
import { MessageCircleQuestion, X, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type Question = {
  id: string;
  slideId: string;
  question: string;
  answer: string | null;
  askerName: string;
  createdAt: string;
};

const SLIDE_LABELS: Record<string, string> = {
  hero: "Welcome",
  itinerary: "Tonight's Itinerary",
  "thank-you-host": "Thank You, TMU Byte",
  presenters: "Thank You, Presenters",
  "getting-started": "Getting Started",
  "install-cursor": "Install Cursor",
  "pick-your-ai-coding-agent": "Pick Your AI Coding Agent",
  "build-ui": "Build a UI",
  "run-dev-server": "Run the Dev Server",
  "open-localhost": "Open localhost",
  "ai-gateway-api-key": "Step 1 — Add a Vercel API Key",
  "setup-pam": "Setting up PAM",
  "poke-around-the-repo": "Step 2 — Poke around the repo",
};

export function QAWidget() {
  const [slideId, setSlideId] = useState("hero");
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Question[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const slideIdRef = useRef("hero");
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const slides = Array.from(document.querySelectorAll<HTMLElement>("[data-slide]"));
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const id = entry.target.id;
            if (id) {
              slideIdRef.current = id;
              setSlideId(id);
            }
          }
        }
      },
      { threshold: 0.6 }
    );
    slides.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch(`/api/questions?slideId=${encodeURIComponent(slideId)}`);
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) setItems(data.questions ?? []);
      } catch {
        // ignore transient errors, next poll will retry
      }
    };
    load();
    const interval = setInterval(load, 4000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [slideId]);

  useEffect(() => {
    if (open) listRef.current?.scrollTo({ top: 0 });
  }, [open, items.length]);

  async function submit() {
    const question = draft.trim();
    if (!question || sending) return;
    setSending(true);
    setDraft("");
    try {
      const res = await fetch("/api/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slideId: slideIdRef.current, question }),
      });
      if (res.ok) {
        const data = await res.json();
        setItems((prev) => [data.question, ...prev]);
      }
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Ask a question"
        className="fixed right-5 bottom-5 z-50 flex size-12 cursor-pointer items-center justify-center rounded-full bg-brand text-white shadow-lg shadow-brand/30 transition-transform hover:scale-105 hover:bg-brand-dark"
      >
        {open ? <X className="size-5" /> : <MessageCircleQuestion className="size-5" />}
      </button>

      {open && (
        <div className="fixed right-5 bottom-20 z-50 flex max-h-[70vh] w-[min(380px,calc(100vw-2.5rem))] flex-col overflow-hidden rounded-2xl border border-[#e3ecf5] bg-white shadow-2xl">
          <div className="shrink-0 border-b border-[#e3ecf5] px-4 py-3">
            <p className="text-[11px] font-bold tracking-[0.1em] text-brand-dark uppercase">
              Ask Eve
            </p>
            <p className="text-sm font-semibold text-ink">
              {SLIDE_LABELS[slideId] ?? "This slide"}
            </p>
          </div>

          <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
            {items.length === 0 && (
              <p className="text-sm text-ink-muted">
                No questions yet on this slide — be the first to ask.
              </p>
            )}
            {items.map((q) => (
              <div key={q.id} className="rounded-xl bg-[#f7fafd] px-3 py-2.5">
                <p className="text-sm font-semibold text-ink">
                  {q.askerName} <span className="font-normal text-ink-muted">asked</span>
                </p>
                <p className="mb-1.5 text-sm text-ink">{q.question}</p>
                {q.answer ? (
                  <p className="text-sm text-brand-dark">
                    <strong>Eve:</strong> {q.answer}
                  </p>
                ) : (
                  <p className="text-xs text-ink-muted italic">Eve is thinking…</p>
                )}
              </div>
            ))}
          </div>

          <div className="flex shrink-0 items-end gap-2 border-t border-[#e3ecf5] p-3">
            <Textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  submit();
                }
              }}
              placeholder="Ask a question about this slide…"
              rows={1}
              className="max-h-24 min-h-9 resize-none"
            />
            <Button
              size="icon"
              onClick={submit}
              disabled={sending || !draft.trim()}
              className="shrink-0 bg-brand hover:bg-brand-dark"
            >
              <Send className="size-4" />
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
