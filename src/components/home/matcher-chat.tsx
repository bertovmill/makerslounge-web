"use client";

import Image from "next/image";
import { Client, type MessageStreamEvent } from "eve/client";
import { useEveAgent } from "eve/react";
import { AlertCircleIcon, LoaderIcon, MicIcon, SquareIcon, Sparkles } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import {
  PromptInput,
  PromptInputBody,
  PromptInputButton,
  PromptInputFooter,
  type PromptInputMessage,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
} from "@/components/ai-elements/prompt-input";
import { Suggestion, Suggestions } from "@/components/ai-elements/suggestion";
import { AgentMessage } from "@/components/home/agent-message";
import { useDictation } from "@/lib/use-dictation";
import { cn } from "@/lib/utils";

const SUGGESTIONS = [
  "Find me a technical co-founder",
  "Who has design skills?",
  "Collaborate on an AI project",
  "Help with marketing",
];

type CancellationState = "idle" | "requested" | "cancelling";

type Cancellation = {
  requested: boolean;
  sentTurnId?: string;
  turnId?: string;
};

export function MatcherChat({ initialQuery }: { initialQuery?: string | null }) {
  const [client] = useState(() => new Client({ host: "" }));
  const sessionIdRef = useRef<string | undefined>(undefined);
  const cancellationRef = useRef<Cancellation>({ requested: false });
  const [cancellationError, setCancellationError] = useState<string>();
  const [cancellationState, setCancellationState] = useState<CancellationState>("idle");
  const [draft, setDraft] = useState("");

  /**
   * Stopping means cancelling the *turn*, not just detaching the stream.
   * eve turns are durable: `agent.stop()` would drop the client's connection
   * while the run kept going — and kept billing — on the server. So we hold the
   * session id, wait for the `turn.started` event that names the running turn,
   * and cancel that turn by id. The id guard makes a late click a no-op rather
   * than a cancellation of the *next* turn.
   */
  const cancelTurn = useCallback(
    (turnId: string) => {
      const cancellation = cancellationRef.current;
      if (!cancellation.requested || cancellation.sentTurnId === turnId) return;

      cancellation.sentTurnId = turnId;
      setCancellationState("cancelling");

      const sessionId = sessionIdRef.current;
      if (sessionId === undefined) return;

      void client.sessions
        .attach(sessionId)
        .cancel({ turnId })
        .catch((error: unknown) => {
          if (cancellationRef.current !== cancellation) return;
          cancellation.requested = false;
          cancellation.sentTurnId = undefined;
          setCancellationError(
            error instanceof Error ? error.message : "Unable to stop the response.",
          );
          setCancellationState("idle");
        });
    },
    [client],
  );

  const handleEvent = useCallback(
    (event: MessageStreamEvent) => {
      if (event.type !== "turn.started") return;
      cancellationRef.current.turnId = event.data.turnId;
      cancelTurn(event.data.turnId);
    },
    [cancelTurn],
  );

  const agent = useEveAgent({
    // Named because this app mounts two eve agents; see `next.config.ts`.
    agent: "community",
    onEvent: handleEvent,
    onSessionChange(session) {
      sessionIdRef.current = session?.sessionId;
    },
  });

  const isBusy = agent.status === "submitted" || agent.status === "streaming";
  const isEmpty = agent.data.messages.length === 0;
  const errorMessage = cancellationError ?? agent.error?.message;
  const submitStatus = isBusy && cancellationState !== "idle" ? "submitted" : agent.status;

  const prepareTurn = useCallback(() => {
    cancellationRef.current = { requested: false };
    setCancellationError(undefined);
    setCancellationState("idle");
  }, []);

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (trimmed.length === 0 || isBusy) return;
      prepareTurn();
      setDraft("");
      await agent.send(trimmed);
    },
    [agent, isBusy, prepareTurn],
  );

  const requestCancellation = () => {
    if (!isBusy || cancellationState !== "idle") return;
    const cancellation = cancellationRef.current;
    cancellation.requested = true;
    setCancellationError(undefined);
    setCancellationState("requested");
    if (cancellation.turnId !== undefined) cancelTurn(cancellation.turnId);
  };

  const dictation = useDictation((text) =>
    setDraft((current) => (current ? `${current} ${text}` : text)),
  );

  // `/home?q=...` sends the query straight through, so the landing page's search
  // box can hand a question to the agent without the user retyping it.
  const sentRef = useRef(false);
  useEffect(() => {
    if (!initialQuery || sentRef.current) return;
    sentRef.current = true;
    // Deferred a tick: `send` sets state, and doing that synchronously in an
    // effect body triggers the cascading render that
    // `react-hooks/set-state-in-effect` flags.
    const timer = setTimeout(() => void send(initialQuery), 0);
    return () => clearTimeout(timer);
  }, [initialQuery, send]);

  const handleSubmit = (message: PromptInputMessage) => {
    void send(message.text);
  };

  const composer = (
    <PromptInput onSubmit={handleSubmit}>
      <PromptInputBody>
        <PromptInputTextarea
          onChange={(event) => setDraft(event.target.value)}
          placeholder="What are you looking for?"
          value={draft}
        />
        <PromptInputFooter>
          <PromptInputTools>
            <PromptInputButton
              disabled={dictation.status === "transcribing"}
              onClick={() =>
                dictation.status === "recording" ? dictation.stop() : void dictation.start()
              }
              variant={dictation.status === "recording" ? "default" : "ghost"}
            >
              {dictation.status === "transcribing" ? (
                <LoaderIcon className="size-4 animate-spin" />
              ) : dictation.status === "recording" ? (
                <SquareIcon className="size-4" />
              ) : (
                <MicIcon className="size-4" />
              )}
              <span className="sr-only">
                {dictation.status === "recording" ? "Stop dictation" : "Dictate"}
              </span>
            </PromptInputButton>
          </PromptInputTools>
          <PromptInputSubmit onStop={requestCancellation} status={submitStatus} />
        </PromptInputFooter>
      </PromptInputBody>
    </PromptInput>
  );

  const disclaimer = (
    <p className="select-none text-center text-[11px] text-muted-foreground/40">
      AI matches are based on community profiles and may not be perfect.
    </p>
  );

  return (
    <div className="relative flex h-full flex-col overflow-x-hidden bg-background">
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-32 bg-gradient-to-b from-blue-500/[0.06] to-transparent" />

      {errorMessage ? (
        <div className="mx-auto w-full max-w-2xl shrink-0 px-4 pt-2">
          <div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-sm">
            <AlertCircleIcon className="mt-0.5 size-4 shrink-0 text-destructive" />
            <div>
              <p className="font-medium">Something went wrong</p>
              <p className="mt-0.5 text-muted-foreground">{errorMessage}</p>
            </div>
          </div>
        </div>
      ) : null}

      {isEmpty ? (
        <div className="mx-auto flex w-full max-w-2xl grow flex-col justify-center gap-6 px-4">
          <div className="mb-2 flex flex-col items-center px-4 text-center">
            <div className="relative mb-4 flex size-14 items-center justify-center">
              <Image
                alt="MakersLounge"
                className="drop-shadow-sm"
                height={40}
                src="/logos/logo-blue.png"
                width={40}
              />
              <Sparkles className="-top-1 -right-1 absolute size-4 text-blue-400/70" />
              <Sparkles className="-bottom-0.5 -left-1.5 absolute size-3 text-blue-300/50" />
            </div>
            <h1 className="fade-in slide-in-from-bottom-2 animate-in fill-mode-both font-semibold text-3xl tracking-tight duration-300">
              Find your match
            </h1>
            <p className="fade-in slide-in-from-bottom-2 mt-2 max-w-sm animate-in fill-mode-both text-muted-foreground delay-75 duration-300">
              Tell me what you&apos;re looking for and I&apos;ll connect you with the right
              makers.
            </p>
          </div>

          <Suggestions className="fade-in slide-in-from-bottom-2 animate-in fill-mode-both delay-150 duration-300">
            {SUGGESTIONS.map((suggestion) => (
              <Suggestion
                key={suggestion}
                onClick={() => void send(suggestion)}
                suggestion={suggestion}
              />
            ))}
          </Suggestions>

          <div className="flex flex-col gap-2">
            {composer}
            {disclaimer}
          </div>
        </div>
      ) : (
        <>
          <Conversation className="min-h-0 flex-1">
            <ConversationContent className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 pt-8 pb-6">
              {agent.data.messages.map((message, index) => (
                <AgentMessage
                  canRespond={!isBusy}
                  isStreaming={
                    agent.status === "streaming" && index === agent.data.messages.length - 1
                  }
                  key={message.id}
                  message={message}
                  onInputResponses={(responses) => {
                    prepareTurn();
                    return agent.respond(responses);
                  }}
                />
              ))}
            </ConversationContent>
            <ConversationScrollButton />
          </Conversation>

          <div
            className={cn(
              "mx-auto flex w-full max-w-2xl shrink-0 flex-col gap-2 px-4 pb-4",
            )}
          >
            {composer}
            {disclaimer}
          </div>
        </>
      )}

      {dictation.error ? (
        <p className="pb-2 text-center text-[11px] text-destructive">{dictation.error}</p>
      ) : null}
    </div>
  );
}
