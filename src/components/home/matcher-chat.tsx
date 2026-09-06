"use client";

import type { UIMessage, UserContent } from "ai";
import { Client, type MessageStreamEvent } from "eve/client";
import { type EveMessage, useEveAgent } from "eve/react";
import { AlertCircleIcon, DownloadIcon, PaperclipIcon, PlusIcon } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Attachment,
  AttachmentPreview,
  AttachmentRemove,
  Attachments,
} from "@/components/ai-elements/attachments";
import {
  Conversation,
  ConversationContent,
  ConversationDownload,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Message, MessageContent } from "@/components/ai-elements/message";
import { Persona, type PersonaState } from "@/components/ai-elements/persona";
import {
  PromptInput,
  PromptInputBody,
  PromptInputButton,
  PromptInputFooter,
  PromptInputHeader,
  type PromptInputMessage,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
  usePromptInputAttachments,
} from "@/components/ai-elements/prompt-input";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { SpeechInput } from "@/components/ai-elements/speech-input";
import { Suggestion, Suggestions } from "@/components/ai-elements/suggestion";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  AgentMessage,
  citationKey,
  extractSources,
  type WebSource,
} from "@/components/home/agent-message";
import { cn } from "@/lib/utils";

const SUGGESTIONS = [
  "Find me a technical co-founder",
  "Who has design skills?",
  "Collaborate on an AI project",
  "Help with marketing",
];

/**
 * What a member can hand May alongside a question: a screenshot of what they
 * are building, a deck, a résumé. Anything else has no reader on the other end.
 */
const ACCEPTED_FILES = "image/*,application/pdf,text/plain,text/markdown";
const MAX_FILES = 4;
const MAX_FILE_SIZE = 10 * 1024 * 1024;

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
  const [listening, setListening] = useState(false);
  const [composerError, setComposerError] = useState<string>();

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

  const messages = agent.data.messages;
  const isBusy = agent.status === "submitted" || agent.status === "streaming";
  const isEmpty = messages.length === 0;
  const errorMessage = cancellationError ?? composerError ?? agent.error?.message;
  const submitStatus = isBusy && cancellationState !== "idle" ? "submitted" : agent.status;

  const lastMessage = messages[messages.length - 1];
  const lastAssistant = lastMessage?.role === "assistant" ? lastMessage : undefined;
  const assistantHasStreamingText =
    lastAssistant?.parts.some((part) => part.type === "text" && part.state === "streaming") ??
    false;
  const assistantHasAnything = (lastAssistant?.parts.length ?? 0) > 0;
  // A turn was sent and nothing has come back yet — the gap the old UI left
  // blank, which read as "did that send?".
  const awaitingReply = isBusy && !assistantHasAnything;

  const personaState: PersonaState = listening
    ? "listening"
    : assistantHasStreamingText
      ? "speaking"
      : isBusy
        ? "thinking"
        : "idle";

  // Every web source the conversation has seen, so a link May writes in a later
  // turn still resolves to the search result that produced it.
  const citations = useMemo(() => {
    const index = new Map<string, WebSource>();
    for (const message of messages) {
      for (const part of message.parts) {
        if (part.type !== "dynamic-tool" || part.toolName !== "web_search") continue;
        for (const source of extractSources(part)) {
          const key = citationKey(source.url);
          if (!index.has(key)) index.set(key, source);
        }
      }
    }
    return index;
  }, [messages]);

  const prepareTurn = useCallback(() => {
    cancellationRef.current = { requested: false };
    setCancellationError(undefined);
    setComposerError(undefined);
    setCancellationState("idle");
  }, []);

  const send = useCallback(
    async (text: string, files: PromptInputMessage["files"] = []) => {
      const trimmed = text.trim();
      if ((trimmed.length === 0 && files.length === 0) || isBusy) return;
      prepareTurn();
      setDraft("");
      await agent.send(toUserContent(trimmed, files));
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

  // The question that produced the latest reply, so "Ask again" can re-send it.
  const retryText = useMemo(() => {
    if (!lastAssistant) return undefined;
    for (let index = messages.length - 2; index >= 0; index -= 1) {
      const message = messages[index];
      if (message.role !== "user") continue;
      const text = textOf(message);
      return text.length > 0 ? text : undefined;
    }
    return undefined;
  }, [lastAssistant, messages]);

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

  const handleSubmit = (message: PromptInputMessage) => send(message.text, message.files);

  const composer = (
    <PromptInput
      accept={ACCEPTED_FILES}
      maxFileSize={MAX_FILE_SIZE}
      maxFiles={MAX_FILES}
      multiple
      onError={(error) => setComposerError(error.message)}
      onSubmit={handleSubmit}
    >
      <PromptInputHeader>
        <ComposerAttachments />
      </PromptInputHeader>
      <PromptInputBody>
        <PromptInputTextarea
          onChange={(event) => setDraft(event.target.value)}
          placeholder="What are you looking for?"
          value={draft}
        />
        <PromptInputFooter>
          <PromptInputTools>
            <AttachButton />
            <SpeechInput
              className={cn(
                "size-8",
                !listening &&
                  "bg-transparent text-muted-foreground shadow-none hover:bg-accent hover:text-foreground",
              )}
              onAudioRecorded={transcribe}
              onListeningChange={setListening}
              onTranscriptionChange={(text) =>
                setDraft((current) => (current ? `${current} ${text}` : text))
              }
              preferAudioRecording
              size="icon-sm"
              title={listening ? "Stop dictating" : "Dictate"}
              variant="ghost"
            />
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
            <Persona className="mb-2 size-24" state={personaState} variant="halo" />
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
          <header className="relative z-20 mx-auto flex w-full max-w-2xl shrink-0 items-center gap-3 px-4 pt-3">
            <Persona className="size-9" state={personaState} variant="halo" />
            <div className="min-w-0 flex-1 leading-tight">
              <p className="font-medium text-sm">May</p>
              <p className="truncate text-muted-foreground text-xs">
                {personaState === "listening"
                  ? "Listening…"
                  : personaState === "thinking"
                    ? "Thinking…"
                    : personaState === "speaking"
                      ? "Replying…"
                      : "Community matcher"}
              </p>
            </div>
            <ConversationDownload
              className="text-muted-foreground"
              filename="may-chat.md"
              formatMessage={formatForDownload}
              messages={messages.map(toUIMessage)}
              size="icon-sm"
              title="Download this chat"
              variant="ghost"
            >
              <DownloadIcon className="size-4" />
            </ConversationDownload>
            <Button
              className="text-muted-foreground"
              disabled={isBusy}
              onClick={() => {
                prepareTurn();
                agent.reset();
              }}
              size="sm"
              title="Start a new chat"
              variant="ghost"
            >
              <PlusIcon className="size-4" />
              New chat
            </Button>
          </header>

          <Conversation className="min-h-0 flex-1">
            <ConversationContent className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 pt-6 pb-6">
              {messages.map((message, index) => (
                <AgentMessage
                  canRespond={!isBusy}
                  citations={citations}
                  isStreaming={agent.status === "streaming" && index === messages.length - 1}
                  key={message.id}
                  message={message}
                  onInputResponses={(responses) => {
                    prepareTurn();
                    return agent.respond(responses);
                  }}
                  onRetry={
                    message === lastAssistant && retryText !== undefined
                      ? () => void send(retryText)
                      : undefined
                  }
                />
              ))}

              {awaitingReply ? (
                <Message from="assistant">
                  <MessageContent>
                    <div className="flex items-center gap-2 text-sm">
                      <Spinner className="size-4 text-muted-foreground" />
                      <Shimmer>May is thinking…</Shimmer>
                    </div>
                  </MessageContent>
                </Message>
              ) : null}
            </ConversationContent>
            <ConversationScrollButton />
          </Conversation>

          <div className="mx-auto flex w-full max-w-2xl shrink-0 flex-col gap-2 px-4 pb-4">
            {composer}
            {disclaimer}
          </div>
        </>
      )}
    </div>
  );
}

/** The paperclip: opens the composer's own file picker. Drag-and-drop works too. */
function AttachButton() {
  const attachments = usePromptInputAttachments();
  return (
    <PromptInputButton
      disabled={attachments.files.length >= MAX_FILES}
      onClick={() => attachments.openFileDialog()}
      title="Attach a file"
      variant="ghost"
    >
      <PaperclipIcon className="size-4" />
      <span className="sr-only">Attach a file</span>
    </PromptInputButton>
  );
}

/** Pending attachments, shown above the textarea until they are sent. */
function ComposerAttachments() {
  const attachments = usePromptInputAttachments();
  if (attachments.files.length === 0) return null;
  return (
    <Attachments variant="inline">
      {attachments.files.map((file) => (
        <Attachment data={file} key={file.id} onRemove={() => attachments.remove(file.id)}>
          <AttachmentPreview />
          <AttachmentRemove />
        </Attachment>
      ))}
    </Attachments>
  );
}

/**
 * Dictation goes through `/api/voice/transcribe` (Deepgram) on every browser.
 * `SpeechInput` would otherwise use Chrome's built-in recogniser, which ships
 * the audio to Google and returns unpunctuated text.
 */
async function transcribe(audio: Blob): Promise<string> {
  const body = new FormData();
  body.append("audio", audio, "recording.webm");
  const response = await fetch("/api/voice/transcribe", { body, method: "POST" });
  if (!response.ok) throw new Error("Transcription failed");
  const data = (await response.json()) as { text?: string };
  return data.text ?? "";
}

/**
 * A plain string turn when there is nothing attached; otherwise the AI SDK's
 * multi-part user content. `PromptInput` has already turned each attachment
 * into a `data:` URL, which is what eve's own `createDataUrlFilePart` sends.
 */
function toUserContent(text: string, files: PromptInputMessage["files"]): UserContent {
  if (files.length === 0) return text;
  return [
    { text: text || "Here's what I'm working on.", type: "text" },
    ...files.map((file) => ({
      data: file.url,
      filename: file.filename,
      mediaType: file.mediaType,
      type: "file" as const,
    })),
  ];
}

function textOf(message: EveMessage): string {
  return message.parts
    .filter((part) => part.type === "text")
    .map((part) => part.text)
    .join("\n\n")
    .trim();
}

/**
 * `ConversationDownload` wants AI SDK messages. eve's parts are a superset
 * (authorization, dynamic tools), so hand it only the prose — that is all the
 * markdown export prints anyway.
 */
function toUIMessage(message: EveMessage): UIMessage {
  return {
    id: message.id,
    parts: [{ text: textOf(message), type: "text" }],
    role: message.role,
  };
}

function formatForDownload(message: UIMessage): string {
  const who = message.role === "user" ? "You" : "May";
  const text = message.parts
    .filter((part) => part.type === "text")
    .map((part) => part.text)
    .join("\n\n");
  return `**${who}:** ${text}`;
}
