"use client";

import { useEffect, useRef, useState } from "react";
import { useEveAgent, type EveMessagePart } from "eve/react";
import { Bot, X } from "lucide-react";
import { TooltipProvider } from "@/components/ui/tooltip";
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import {
  Message,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputBody,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
  type PromptInputMessage,
} from "@/components/ai-elements/prompt-input";
import { Suggestion, Suggestions } from "@/components/ai-elements/suggestion";
import {
  Tool,
  ToolContent,
  ToolHeader,
  ToolInput,
  ToolOutput,
} from "@/components/ai-elements/tool";

const SLIDE_LABELS: Record<string, string> = {
  hero: "Welcome",
  itinerary: "Tonight's Itinerary",
  presenters: "Presenters",
  objectives: "Objectives",
  "getting-started": "Getting Started",
  "install-cursor": "Step 0 — Install Cursor",
  "ask-cursor": "Just Ask Cursor",
  "build-ui": "Build a UI",
  "run-dev-server": "Run the Dev Server",
  "step-1": "Step 1 — Scaffold & Run",
  "step-2": "Step 2 — Connect a Model",
  "step-3": "Step 3 — Project Structure",
  attendees: "Attendees",
  resources: "Resources",
};

const STARTERS = [
  "What am I supposed to do on this slide?",
  "npm run dev failed — help",
  "How do I connect a model?",
  "What goes in agent/tools/?",
];

type InputRequest = {
  requestId: string;
  prompt: string;
  options?: { id: string; label: string }[];
};

type DynamicToolPart = Extract<EveMessagePart, { type: "dynamic-tool" }>;

function findInputRequest(parts: readonly EveMessagePart[]): InputRequest | undefined {
  for (const part of parts) {
    if (part.type !== "dynamic-tool") continue;
    const request = part.toolMetadata?.eve?.inputRequest;
    if (request) return request as InputRequest;
  }
  return undefined;
}

export type WorkshopHelperWidgetProps = {
  /**
   * Names the page when it has no `[data-slide]` sections (Attendees,
   * Resources). Sent to the agent as context instead of a slide id.
   */
  contextId?: string;
  /** Lift the launcher clear of other fixed bottom-right UI. */
  stacked?: boolean;
};

export function WorkshopHelperWidget({ contextId, stacked }: WorkshopHelperWidgetProps = {}) {
  const [open, setOpen] = useState(false);
  const [slideId, setSlideId] = useState(contextId ?? "hero");
  const slideIdRef = useRef(contextId ?? "hero");

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
  const isEmpty = agent.data.messages.length === 0;

  // The agent can ask a clarifying question mid-turn (eve's `ask_question`),
  // which parks the run until it's answered. Offer the choices as suggestions;
  // typing a normal reply resolves it too.
  const lastMessage = agent.data.messages.at(-1);
  const pendingRequest = lastMessage ? findInputRequest(lastMessage.parts) : undefined;

  useEffect(() => {
    // Pages that pass a contextId have no slides to track.
    if (contextId) return;

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
  }, [contextId]);

  function handleSubmit(message: PromptInputMessage) {
    const text = message.text.trim();
    if (!text || isBusy) return;
    void agent.send(text);
  }

  return (
    <TooltipProvider>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close workshop helper" : "Open workshop helper"}
        className={`fixed right-6 z-50 flex size-16 cursor-pointer items-center justify-center rounded-full bg-gradient-to-br from-brand to-brand-dark text-white shadow-xl shadow-brand/40 ring-4 ring-white/60 transition-transform duration-200 hover:scale-110 active:scale-95 ${
          stacked ? "bottom-24" : "bottom-6"
        }`}
      >
        {open ? <X className="size-7" /> : <Bot className="size-7" />}
      </button>

      {open && (
        <div
          className={`fixed right-6 z-50 flex max-h-[76vh] w-[min(440px,calc(100vw-3rem))] flex-col overflow-hidden rounded-2xl border border-[#e3ecf5] bg-white shadow-2xl ${
            stacked ? "bottom-44" : "bottom-26"
          }`}
        >
          <div className="flex shrink-0 items-center justify-between border-b border-[#e3ecf5] px-4 py-3">
            <div>
              <p className="text-[11px] font-bold tracking-[0.1em] text-brand-dark uppercase">
                Workshop Helper
              </p>
              <p className="text-sm font-semibold text-ink">
                {SLIDE_LABELS[slideId] ?? "This slide"}
              </p>
            </div>
            {!isEmpty && (
              <button
                type="button"
                onClick={() => agent.reset()}
                className="cursor-pointer text-xs font-medium text-ink-muted transition-colors hover:text-brand-dark"
              >
                New chat
              </button>
            )}
          </div>

          <Conversation className="min-h-0">
            <ConversationContent className="gap-5 p-4">
              {isEmpty ? (
                <ConversationEmptyState
                  icon={<Bot className="size-8 text-brand" />}
                  title="Stuck on a step?"
                  description="Ask what to run, or paste the error you're seeing."
                />
              ) : (
                agent.data.messages.map((message) => (
                  <Message from={message.role} key={message.id}>
                    <MessageContent>
                      {message.parts.map((part, index) => {
                        if (part.type === "text") {
                          return (
                            <MessageResponse key={index}>{part.text}</MessageResponse>
                          );
                        }

                        // `ask_question` renders as suggestion chips below instead.
                        if (part.type === "dynamic-tool" && part.toolName !== "ask_question") {
                          const tool = part as DynamicToolPart;
                          return (
                            <Tool key={index}>
                              <ToolHeader
                                state={tool.state}
                                toolName={tool.toolName}
                                type="dynamic-tool"
                              />
                              <ToolContent>
                                <ToolInput input={tool.input} />
                                <ToolOutput
                                  errorText={tool.errorText}
                                  output={tool.output}
                                />
                              </ToolContent>
                            </Tool>
                          );
                        }

                        return null;
                      })}
                    </MessageContent>
                  </Message>
                ))
              )}

              {agent.status === "error" && (
                <p className="text-xs text-red-600">
                  {agent.error?.message ?? "Something went wrong. Try again."}
                </p>
              )}
            </ConversationContent>
            <ConversationScrollButton />
          </Conversation>

          {(isEmpty || (!isBusy && pendingRequest?.options?.length)) && (
            <div className="shrink-0 px-4 pb-2">
              <Suggestions>
                {pendingRequest?.options?.length
                  ? pendingRequest.options.map((option) => (
                      <Suggestion
                        key={option.id}
                        onClick={() =>
                          void agent.respond([
                            { requestId: pendingRequest.requestId, optionId: option.id },
                          ])
                        }
                        suggestion={option.label}
                      />
                    ))
                  : STARTERS.map((starter) => (
                      <Suggestion
                        key={starter}
                        onClick={(text) => void agent.send(text)}
                        suggestion={starter}
                      />
                    ))}
              </Suggestions>
            </div>
          )}

          <PromptInput className="shrink-0 rounded-none border-x-0 border-b-0" onSubmit={handleSubmit}>
            <PromptInputBody>
              <PromptInputTextarea placeholder="Ask about this step…" />
              <PromptInputFooter>
                <span className="text-[11px] text-ink-muted">
                  Answers come from the workshop steps
                </span>
                <PromptInputSubmit onStop={() => agent.stop()} status={agent.status} />
              </PromptInputFooter>
            </PromptInputBody>
          </PromptInput>
        </div>
      )}
    </TooltipProvider>
  );
}
