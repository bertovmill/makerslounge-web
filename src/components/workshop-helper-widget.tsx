"use client";

import { useEffect, useRef, useState } from "react";
import { useEveAgent, type EveMessagePart } from "eve/react";
import { Bot, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const SLIDE_LABELS: Record<string, string> = {
  hero: "Welcome",
  itinerary: "Tonight's Itinerary",
  presenters: "Presenters",
  "getting-started": "Getting Started",
  "install-cursor": "Step 0 — Install Cursor",
  "ask-cursor": "Just Ask Cursor",
  "build-ui": "Build a UI",
  "step-1": "Step 1 — Scaffold & Run",
  "step-2": "Step 2 — Connect a Model",
  "step-3": "Step 3 — Project Structure",
  attendees: "Attendees",
  resources: "Resources",
};

type WorkshopHelperWidgetProps = {
  /** Where the attendee is when there are no `[data-slide]` sections — e.g. "attendees". */
  contextId?: string;
  /** Shift left to clear the Q&A button (the slide deck stacks both). */
  stacked?: boolean;
};

type InputRequest = {
  requestId: string;
  prompt: string;
  options?: { id: string; label: string }[];
};

function findInputRequest(parts: readonly EveMessagePart[]): InputRequest | undefined {
  for (const part of parts) {
    if (part.type !== "dynamic-tool") continue;
    const request = part.toolMetadata?.eve?.inputRequest;
    if (request) return request as InputRequest;
  }
  return undefined;
}

function messageText(parts: readonly { type: string; text?: string }[]) {
  return parts
    .filter((part) => part.type === "text")
    .map((part) => part.text ?? "")
    .join("");
}

export function WorkshopHelperWidget({
  contextId = "hero",
  stacked = false,
}: WorkshopHelperWidgetProps = {}) {
  const [open, setOpen] = useState(false);
  const [slideId, setSlideId] = useState(contextId);
  const [draft, setDraft] = useState("");
  const slideIdRef = useRef(contextId);
  const listRef = useRef<HTMLDivElement>(null);

  const agent = useEveAgent({
    // Tell the agent which slide the attendee is looking at, every turn.
    prepareSend: (input) => ({
      ...input,
      clientContext: {
        slide: slideIdRef.current,
        slideLabel: SLIDE_LABELS[slideIdRef.current] ?? slideIdRef.current,
      },
    }),
  });

  const isBusy = agent.status === "submitted" || agent.status === "streaming";

  // The agent can ask a clarifying question mid-turn (eve's `ask_question`),
  // which parks the run until it's answered. Surface the choices as buttons;
  // typing a normal reply resolves it too.
  const lastMessage = agent.data.messages.at(-1);
  const pendingRequest = lastMessage ? findInputRequest(lastMessage.parts) : undefined;

  useEffect(() => {
    const slides = Array.from(document.querySelectorAll<HTMLElement>("[data-slide]"));
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && entry.target.id) {
            slideIdRef.current = entry.target.id;
            setSlideId(entry.target.id);
          }
        }
      },
      { threshold: 0.6 }
    );
    slides.forEach((slide) => observer.observe(slide));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [agent.data.messages]);

  function submit() {
    const message = draft.trim();
    if (!message || isBusy) return;
    setDraft("");
    void agent.send(message);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Workshop helper"
        className={`fixed ${stacked ? "right-20" : "right-5"} bottom-5 z-50 flex size-12 cursor-pointer items-center justify-center rounded-full bg-brand-dark text-white shadow-lg shadow-brand/30 transition-transform hover:scale-105 hover:bg-brand`}
      >
        {open ? <X className="size-5" /> : <Bot className="size-5" />}
      </button>

      {open && (
        <div className="fixed right-5 bottom-20 z-50 flex max-h-[70vh] w-[min(380px,calc(100vw-2.5rem))] flex-col overflow-hidden rounded-2xl border border-[#e3ecf5] bg-white shadow-2xl">
          <div className="shrink-0 border-b border-[#e3ecf5] px-4 py-3">
            <p className="text-[11px] font-bold tracking-[0.1em] text-brand-dark uppercase">
              Workshop Helper
            </p>
            <p className="text-sm font-semibold text-ink">
              {SLIDE_LABELS[slideId] ?? "This slide"}
            </p>
          </div>

          <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
            {agent.data.messages.length === 0 && (
              <p className="text-sm text-ink-muted">
                Stuck on a step? Ask me what to run, or paste the error you&apos;re seeing.
              </p>
            )}

            {agent.data.messages.map((message) => {
              const text = messageText(message.parts);
              if (!text) return null;
              return (
                <div
                  key={message.id}
                  className={
                    message.role === "user"
                      ? "ml-auto w-fit max-w-[85%] rounded-xl bg-brand px-3 py-2 text-sm whitespace-pre-wrap text-white"
                      : "w-fit max-w-[90%] rounded-xl bg-[#f7fafd] px-3 py-2 text-sm whitespace-pre-wrap text-ink"
                  }
                >
                  {text}
                </div>
              );
            })}

            {!isBusy && pendingRequest?.options?.length ? (
              <div className="flex flex-wrap gap-1.5">
                {pendingRequest.options.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() =>
                      void agent.respond([
                        { requestId: pendingRequest.requestId, optionId: option.id },
                      ])
                    }
                    className="cursor-pointer rounded-full border border-brand/30 bg-brand/5 px-3 py-1 text-xs font-medium text-brand-dark transition-colors hover:bg-brand/15"
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            ) : null}

            {isBusy && <p className="text-xs text-ink-muted italic">Thinking…</p>}

            {agent.status === "error" && (
              <p className="text-xs text-red-600">
                {agent.error?.message ?? "Something went wrong. Try again."}
              </p>
            )}
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
              placeholder="Ask about this step…"
              rows={1}
              className="max-h-24 min-h-9 resize-none"
            />
            <Button
              size="icon"
              onClick={submit}
              disabled={isBusy || !draft.trim()}
              className="shrink-0 bg-brand-dark hover:bg-brand"
            >
              <Send className="size-4" />
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
