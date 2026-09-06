"use client";

import type { FileUIPart } from "ai";
import type { EveDynamicToolPart, EveMessage, EveMessagePart } from "eve/react";
import {
  BrainIcon,
  CheckCircleIcon,
  CheckIcon,
  CopyIcon,
  ExternalLinkIcon,
  FileSearchIcon,
  GlobeIcon,
  KeyRoundIcon,
  MicIcon,
  NewspaperIcon,
  RefreshCwIcon,
  SendIcon,
  ThumbsDownIcon,
  ThumbsUpIcon,
  UserIcon,
  UsersIcon,
  WrenchIcon,
  XCircleIcon,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ComponentProps } from "react";
import { useMemo, useState } from "react";
import {
  Attachment,
  AttachmentInfo,
  AttachmentPreview,
  Attachments,
} from "@/components/ai-elements/attachments";
import {
  ChainOfThought,
  ChainOfThoughtContent,
  ChainOfThoughtHeader,
  ChainOfThoughtSearchResult,
  ChainOfThoughtSearchResults,
  ChainOfThoughtStep,
} from "@/components/ai-elements/chain-of-thought";
import {
  Confirmation,
  ConfirmationAccepted,
  ConfirmationAction,
  ConfirmationActions,
  ConfirmationRejected,
  ConfirmationRequest,
  ConfirmationTitle,
} from "@/components/ai-elements/confirmation";
import {
  InlineCitation,
  InlineCitationCard,
  InlineCitationCardBody,
  InlineCitationCardTrigger,
  InlineCitationCarousel,
  InlineCitationCarouselContent,
  InlineCitationCarouselHeader,
  InlineCitationCarouselIndex,
  InlineCitationCarouselItem,
  InlineCitationCarouselNext,
  InlineCitationCarouselPrev,
  InlineCitationQuote,
  InlineCitationSource,
  InlineCitationText,
} from "@/components/ai-elements/inline-citation";
import {
  Message,
  MessageAction,
  MessageActions,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { Source, Sources, SourcesContent, SourcesTrigger } from "@/components/ai-elements/sources";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type AgentInputResponse = {
  readonly optionId?: string;
  readonly requestId: string;
  readonly text?: string;
};

/** A citable web page, pulled out of a `web_search` result. */
export type WebSource = {
  readonly description?: string;
  readonly title: string;
  readonly url: string;
};

/** Human-facing names for the agent's tools; the raw slugs read like internals. */
const TOOL_LABELS: Record<string, string> = {
  browse_community: "Browsing the community",
  filter_by_skills: "Filtering by skills",
  find_looking_for: "Finding people who need this",
  get_maker_profile: "Reading a profile",
  search_makers: "Searching makers",
  search_podcasts: "Searching podcasts",
  search_posts: "Searching posts",
  send_intro_message: "Sending an intro",
  web_fetch: "Reading a page",
  web_search: "Searching the web",
};

const TOOL_ICONS: Record<string, LucideIcon> = {
  browse_community: UsersIcon,
  filter_by_skills: UsersIcon,
  find_looking_for: UsersIcon,
  get_maker_profile: UserIcon,
  search_makers: UsersIcon,
  search_podcasts: MicIcon,
  search_posts: NewspaperIcon,
  send_intro_message: SendIcon,
  web_fetch: FileSearchIcon,
  web_search: GlobeIcon,
};

type Feedback = "up" | "down";

export function AgentMessage({
  canRespond,
  citations,
  isStreaming,
  message,
  onInputResponses,
  onRetry,
}: {
  readonly canRespond: boolean;
  /** Every web source seen so far in the conversation, keyed by URL. */
  readonly citations: ReadonlyMap<string, WebSource>;
  readonly isStreaming: boolean;
  readonly message: EveMessage;
  readonly onInputResponses: (responses: readonly AgentInputResponse[]) => void | Promise<void>;
  /** Present on the latest assistant reply only: re-asks the question that produced it. */
  readonly onRetry?: () => void;
}) {
  const isAssistant = message.role === "assistant";

  // Parts are regrouped rather than rendered in stream order: every tool call,
  // reasoning run, and authorization becomes one step of a single chain of
  // thought, and the prose follows it. The old UI stacked a full Tool card per
  // call, which pushed May's actual answer below the fold on a busy turn.
  const steps = message.parts.filter(isStepPart);
  const texts = message.parts.filter((part) => part.type === "text");
  const files = message.parts.filter((part) => part.type === "file");
  const lastTextIndex = texts.length - 1;
  const hasText = texts.some((part) => part.text.trim().length > 0);
  const failed = message.metadata?.status === "failed";

  const responseComponents = useMemo(() => citationComponents(citations), [citations]);

  return (
    <Message from={message.role}>
      <MessageContent className={cn(failed && "border border-destructive/40")}>
        {files.length > 0 ? <MessageAttachments files={files} /> : null}

        {isAssistant && steps.length > 0 ? (
          <StepChain
            canRespond={canRespond}
            hasText={hasText}
            isStreaming={isStreaming}
            onInputResponses={onInputResponses}
            steps={steps}
          />
        ) : null}

        {texts.map((part, index) => (
          <MessageResponse
            caret="block"
            components={isAssistant ? responseComponents : undefined}
            isAnimating={isStreaming && isAssistant && index === lastTextIndex}
            key={`text:${index}`}
          >
            {part.text}
          </MessageResponse>
        ))}

        {failed ? (
          <p className="flex items-center gap-1.5 text-destructive text-xs">
            <XCircleIcon className="size-3.5" />
            This message didn&apos;t send.
          </p>
        ) : null}
      </MessageContent>

      {isAssistant && !isStreaming && hasText ? (
        <AssistantActions canRetry={canRespond && onRetry !== undefined} message={message} onRetry={onRetry} />
      ) : null}
    </Message>
  );
}

type StepPart = Extract<EveMessagePart, { type: "reasoning" | "dynamic-tool" | "authorization" }>;

function isStepPart(part: EveMessagePart): part is StepPart {
  return part.type === "reasoning" || part.type === "dynamic-tool" || part.type === "authorization";
}

function StepChain({
  canRespond,
  hasText,
  isStreaming,
  onInputResponses,
  steps,
}: {
  readonly canRespond: boolean;
  readonly hasText: boolean;
  readonly isStreaming: boolean;
  readonly onInputResponses: (responses: readonly AgentInputResponse[]) => void | Promise<void>;
  readonly steps: readonly StepPart[];
}) {
  const [userOpen, setUserOpen] = useState<boolean>();

  // Something in the chain is waiting on the member — an approval button or a
  // sign-in link — so it must not be hidden behind a collapsed header.
  const needsAttention = steps.some(
    (step) =>
      (step.type === "dynamic-tool" && step.state === "approval-requested") ||
      (step.type === "authorization" && step.state === "required"),
  );
  const working = isStreaming && !hasText;
  const open = needsAttention || (userOpen ?? working);

  const sources = steps.flatMap((step) =>
    step.type === "dynamic-tool" ? extractSources(step) : [],
  );

  return (
    <>
      <ChainOfThought onOpenChange={setUserOpen} open={open}>
        <ChainOfThoughtHeader>
          {working ? <Shimmer>Working on it…</Shimmer> : describeSteps(steps)}
        </ChainOfThoughtHeader>
        <ChainOfThoughtContent>
          {steps.map((step, index) => (
            <StepView
              canRespond={canRespond}
              key={stepKey(step, index)}
              onInputResponses={onInputResponses}
              step={step}
            />
          ))}
        </ChainOfThoughtContent>
      </ChainOfThought>

      {sources.length > 0 ? (
        <Sources>
          <SourcesTrigger count={sources.length} />
          <SourcesContent>
            {dedupeSources(sources).map((source) => (
              <Source href={source.url} key={source.url} title={source.title} />
            ))}
          </SourcesContent>
        </Sources>
      ) : null}
    </>
  );
}

/** "Searched makers, searched the web, read a page" — a header for a settled chain. */
function describeSteps(steps: readonly StepPart[]): string {
  const labels: string[] = [];
  for (const step of steps) {
    const label =
      step.type === "reasoning"
        ? "thought it through"
        : step.type === "authorization"
          ? `connected ${step.displayName}`
          : (TOOL_LABELS[step.toolName] ?? step.toolName).toLowerCase();
    if (!labels.includes(label)) labels.push(label);
  }
  const shown = labels.slice(0, 3);
  const rest = labels.length - shown.length;
  const text = shown.join(", ") + (rest > 0 ? ` +${rest} more` : "");
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function StepView({
  canRespond,
  onInputResponses,
  step,
}: {
  readonly canRespond: boolean;
  readonly onInputResponses: (responses: readonly AgentInputResponse[]) => void | Promise<void>;
  readonly step: StepPart;
}) {
  switch (step.type) {
    case "reasoning":
      return (
        <ChainOfThoughtStep
          icon={BrainIcon}
          label="Thinking"
          status={step.state === "streaming" ? "active" : "complete"}
        >
          {step.text.trim() ? (
            <p className="max-h-48 overflow-y-auto whitespace-pre-wrap text-muted-foreground text-xs leading-relaxed">
              {step.text}
            </p>
          ) : null}
        </ChainOfThoughtStep>
      );

    case "authorization":
      return (
        <ChainOfThoughtStep
          icon={KeyRoundIcon}
          label={
            step.state === "required"
              ? `Connect ${step.displayName}`
              : step.outcome === "authorized"
                ? `${step.displayName} connected`
                : `${step.displayName} authorization ${step.outcome}`
          }
          status={step.state === "required" ? "active" : "complete"}
        >
          <AuthorizationPrompt part={step} />
        </ChainOfThoughtStep>
      );

    case "dynamic-tool":
      return (
        <ToolStep canRespond={canRespond} onInputResponses={onInputResponses} part={step} />
      );
  }
}

function ToolStep({
  canRespond,
  onInputResponses,
  part,
}: {
  readonly canRespond: boolean;
  readonly onInputResponses: (responses: readonly AgentInputResponse[]) => void | Promise<void>;
  readonly part: EveDynamicToolPart;
}) {
  const inputRequest = part.toolMetadata?.eve?.inputRequest;
  const sources = part.toolName === "web_search" ? dedupeSources(extractSources(part)) : [];
  const settled =
    part.state === "output-available" ||
    part.state === "output-error" ||
    part.state === "output-denied";

  return (
    <ChainOfThoughtStep
      description={summarizeInput(part.input)}
      icon={
        part.state === "output-error"
          ? XCircleIcon
          : part.state === "output-denied"
            ? XCircleIcon
            : (TOOL_ICONS[part.toolName] ?? WrenchIcon)
      }
      label={TOOL_LABELS[part.toolName] ?? part.toolName}
      status={settled ? "complete" : "active"}
    >
      {sources.length > 0 ? (
        <ChainOfThoughtSearchResults>
          {sources.slice(0, 6).map((source) => (
            <ChainOfThoughtSearchResult asChild key={source.url}>
              <a href={source.url} rel="noreferrer" target="_blank">
                <GlobeIcon className="size-3" />
                {hostnameOf(source.url)}
              </a>
            </ChainOfThoughtSearchResult>
          ))}
        </ChainOfThoughtSearchResults>
      ) : null}

      {part.state === "output-error" && part.errorText ? (
        <p className="text-destructive text-xs">{part.errorText}</p>
      ) : null}

      {part.state === "output-denied" ? (
        <p className="text-muted-foreground text-xs">Skipped — you declined this.</p>
      ) : null}

      {inputRequest ? (
        <Confirmation approval={toConfirmationApproval(part.approval)} state={part.state}>
          <ConfirmationTitle>{inputRequest.prompt}</ConfirmationTitle>
          <ConfirmationRequest>
            <ConfirmationActions>
              {inputRequest.options?.map((option) => (
                <ConfirmationAction
                  disabled={!canRespond}
                  key={option.id}
                  onClick={() => {
                    void onInputResponses([
                      { optionId: option.id, requestId: inputRequest.requestId },
                    ]);
                  }}
                  variant={option.style === "danger" ? "destructive" : "default"}
                >
                  {option.label}
                </ConfirmationAction>
              ))}
            </ConfirmationActions>
          </ConfirmationRequest>
          <ConfirmationAccepted>
            <ConfirmationTitle>You approved this.</ConfirmationTitle>
          </ConfirmationAccepted>
          <ConfirmationRejected>
            <ConfirmationTitle>You declined this.</ConfirmationTitle>
          </ConfirmationRejected>
        </Confirmation>
      ) : null}
    </ChainOfThoughtStep>
  );
}

/**
 * One line of what the tool was asked, for the step's description. Tool inputs
 * are the model's, so this only trusts the handful of fields that read well and
 * falls back to nothing rather than dumping JSON into the timeline.
 */
function summarizeInput(input: unknown): string | undefined {
  if (!isRecord(input)) return undefined;
  for (const key of ["query", "q", "url", "username", "name", "skill", "skills", "looking_for", "message"]) {
    const value = input[key];
    if (typeof value === "string" && value.trim()) return truncate(value, 120);
    if (Array.isArray(value) && value.every((item) => typeof item === "string") && value.length) {
      return truncate(value.join(", "), 120);
    }
  }
  return undefined;
}

function truncate(text: string, max: number): string {
  const trimmed = text.trim().replace(/\s+/g, " ");
  return trimmed.length > max ? `${trimmed.slice(0, max - 1)}…` : trimmed;
}

function hostnameOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function stepKey(step: StepPart, index: number): string {
  switch (step.type) {
    case "authorization":
      return `authorization:${step.turnId}:${step.stepIndex}:${step.name}`;
    case "dynamic-tool":
      return step.toolCallId;
    default:
      return `${step.type}:${index}`;
  }
}

/**
 * eve types `approved` as an optional boolean; ai-elements' `Confirmation`
 * wants a union where the flag is either absent or definitely present. Same
 * data, narrower type — so restate it rather than cast.
 */
function toConfirmationApproval(approval: EveDynamicToolPart["approval"]) {
  if (!approval) return undefined;
  if (approval.approved === undefined) return { id: approval.id };
  return { approved: approval.approved, id: approval.id, reason: approval.reason };
}

/**
 * Pull citable links out of a `web_search` result.
 *
 * The tool is provider-managed, so its output shape is the provider's rather
 * than ours and is not guaranteed stable across Exa/Parallel. This reads
 * defensively and returns nothing it can't recognise — a missing sources strip
 * is a far better failure than a thrown render.
 */
export function extractSources(part: EveDynamicToolPart): WebSource[] {
  if (part.state !== "output-available") return [];

  const output = part.output as unknown;
  const candidates: unknown[] = Array.isArray(output)
    ? output
    : isRecord(output) && Array.isArray(output.results)
      ? output.results
      : [];

  const sources: WebSource[] = [];
  for (const candidate of candidates) {
    if (!isRecord(candidate)) continue;
    const url = typeof candidate.url === "string" ? candidate.url : undefined;
    if (!url) continue;
    const description = firstString(
      candidate.snippet,
      candidate.description,
      candidate.text,
      candidate.summary,
      Array.isArray(candidate.highlights) ? candidate.highlights[0] : undefined,
    );
    sources.push({
      description: description ? truncate(description, 280) : undefined,
      title: typeof candidate.title === "string" && candidate.title ? candidate.title : url,
      url,
    });
  }
  return sources;
}

function dedupeSources(sources: readonly WebSource[]): WebSource[] {
  const seen = new Set<string>();
  return sources.filter((source) => {
    if (seen.has(source.url)) return false;
    seen.add(source.url);
    return true;
  });
}

function firstString(...values: unknown[]): string | undefined {
  return values.find((value): value is string => typeof value === "string" && value.trim().length > 0);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

/** Normalise a URL enough that May's link and the search result match. */
export function citationKey(url: string): string {
  try {
    const parsed = new URL(url);
    parsed.hash = "";
    return parsed.toString().replace(/\/$/, "");
  } catch {
    return url;
  }
}

/**
 * Streamdown component overrides that turn May's inline web links into
 * hover-card citations. Her instructions already have her link the source URL
 * next to any claim from the open web; this recognises those links against the
 * search results that produced them and hangs the title and snippet off each.
 * Links to anything not in the index (profiles, podcasts, unknown sites) stay
 * plain anchors.
 */
function citationComponents(
  citations: ReadonlyMap<string, WebSource>,
): ComponentProps<typeof MessageResponse>["components"] {
  return {
    a: ({ href, children, node, ...props }) => {
      void node; // the hast node is not a DOM prop
      const source = href ? citations.get(citationKey(href)) : undefined;
      const external = href?.startsWith("http") ?? false;
      const anchor = (
        <a
          href={href}
          rel={external ? "noreferrer" : undefined}
          target={external ? "_blank" : undefined}
          {...props}
        >
          {children}
        </a>
      );
      if (!source) return anchor;
      return (
        <InlineCitation>
          <InlineCitationText>{anchor}</InlineCitationText>
          <InlineCitationCard>
            <InlineCitationCardTrigger sources={[source.url]} />
            <InlineCitationCardBody>
              <InlineCitationCarousel>
                <InlineCitationCarouselHeader>
                  <InlineCitationCarouselPrev />
                  <InlineCitationCarouselNext />
                  <InlineCitationCarouselIndex />
                </InlineCitationCarouselHeader>
                <InlineCitationCarouselContent>
                  <InlineCitationCarouselItem>
                    <InlineCitationSource title={source.title} url={source.url} />
                    {source.description ? (
                      <InlineCitationQuote>{source.description}</InlineCitationQuote>
                    ) : null}
                  </InlineCitationCarouselItem>
                </InlineCitationCarouselContent>
              </InlineCitationCarousel>
            </InlineCitationCardBody>
          </InlineCitationCard>
        </InlineCitation>
      );
    },
  };
}

function MessageAttachments({
  files,
}: {
  readonly files: readonly Extract<EveMessagePart, { type: "file" }>[];
}) {
  const data: (FileUIPart & { id: string })[] = files.map((file, index) => ({
    filename: file.filename,
    id: `${file.url ?? file.filename ?? index}`,
    mediaType: file.mediaType,
    type: "file",
    url: file.url ?? "",
  }));
  const images = data.filter((file) => file.mediaType.startsWith("image/") && file.url);
  const others = data.filter((file) => !images.includes(file));

  return (
    <>
      {images.length > 0 ? (
        <Attachments variant="grid">
          {images.map((file) => (
            <Attachment data={file} key={file.id}>
              <AttachmentPreview />
            </Attachment>
          ))}
        </Attachments>
      ) : null}
      {others.length > 0 ? (
        <Attachments variant="inline">
          {others.map((file) => (
            <Attachment data={file} key={file.id}>
              <AttachmentPreview />
              <AttachmentInfo />
            </Attachment>
          ))}
        </Attachments>
      ) : null}
    </>
  );
}

function AssistantActions({
  canRetry,
  message,
  onRetry,
}: {
  readonly canRetry: boolean;
  readonly message: EveMessage;
  readonly onRetry?: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>();

  const text = message.parts
    .filter((part) => part.type === "text")
    .map((part) => part.text)
    .join("\n\n");

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard access is a permission the browser may withhold; nothing to
      // do but leave the icon alone.
    }
  };

  // Ratings land in the same feedback queue the sidebar's Feedback button
  // feeds, so a bad match reaches whoever triages it with the reply attached.
  const rate = (value: Feedback) => {
    const next = feedback === value ? undefined : value;
    setFeedback(next);
    if (next === undefined) return;
    void fetch("/api/feedback", {
      body: JSON.stringify({
        message: `May reply rated ${next === "up" ? "👍" : "👎"}\n\n${truncate(text, 600)}`,
      }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    }).catch(() => undefined);
  };

  return (
    <MessageActions className="-ml-1">
      <MessageAction label="Copy reply" onClick={() => void copy()} tooltip={copied ? "Copied" : "Copy"}>
        {copied ? <CheckIcon className="size-4" /> : <CopyIcon className="size-4" />}
      </MessageAction>
      {onRetry ? (
        <MessageAction disabled={!canRetry} label="Ask again" onClick={onRetry} tooltip="Ask again">
          <RefreshCwIcon className="size-4" />
        </MessageAction>
      ) : null}
      <MessageAction
        className={cn(feedback === "up" && "text-foreground")}
        label="Good match"
        onClick={() => rate("up")}
        tooltip="Good match"
      >
        <ThumbsUpIcon className={cn("size-4", feedback === "up" && "fill-current")} />
      </MessageAction>
      <MessageAction
        className={cn(feedback === "down" && "text-foreground")}
        label="Not helpful"
        onClick={() => rate("down")}
        tooltip="Not helpful"
      >
        <ThumbsDownIcon className={cn("size-4", feedback === "down" && "fill-current")} />
      </MessageAction>
    </MessageActions>
  );
}

function AuthorizationPrompt({
  part,
}: {
  readonly part: Extract<EveMessagePart, { type: "authorization" }>;
}) {
  const isCompleted = part.state === "completed";
  const isAuthorized = isCompleted && part.outcome === "authorized";
  const Icon = isAuthorized ? CheckCircleIcon : isCompleted ? XCircleIcon : KeyRoundIcon;

  if (part.state !== "required") {
    return (
      <p className="flex items-center gap-1.5 text-muted-foreground text-xs">
        <Icon className="size-3.5" />
        {isAuthorized ? "Connected." : `Authorization ${part.outcome}.`}
      </p>
    );
  }

  return (
    <div className="space-y-2 rounded-md border border-blue-500/30 bg-blue-500/5 p-3">
      <p className="text-muted-foreground text-sm">{part.description}</p>
      {part.authorization?.url ? (
        <Button asChild size="sm">
          <a href={part.authorization.url} rel="noreferrer" target="_blank">
            <ExternalLinkIcon className="size-4" />
            Sign in with {part.displayName}
          </a>
        </Button>
      ) : null}
    </div>
  );
}
