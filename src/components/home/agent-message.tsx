"use client";

import type { EveDynamicToolPart, EveMessage, EveMessagePart } from "eve/react";
import { CheckCircleIcon, ExternalLinkIcon, KeyRoundIcon, XCircleIcon } from "lucide-react";
import {
  Confirmation,
  ConfirmationAccepted,
  ConfirmationAction,
  ConfirmationActions,
  ConfirmationRejected,
  ConfirmationRequest,
  ConfirmationTitle,
} from "@/components/ai-elements/confirmation";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import {
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
} from "@/components/ai-elements/reasoning";
import { Source, Sources, SourcesContent, SourcesTrigger } from "@/components/ai-elements/sources";
import { Tool, ToolContent, ToolHeader, ToolInput, ToolOutput } from "@/components/ai-elements/tool";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type AgentInputResponse = {
  readonly optionId?: string;
  readonly requestId: string;
  readonly text?: string;
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

export function AgentMessage({
  canRespond,
  isStreaming,
  message,
  onInputResponses,
}: {
  readonly canRespond: boolean;
  readonly isStreaming: boolean;
  readonly message: EveMessage;
  readonly onInputResponses: (responses: readonly AgentInputResponse[]) => void | Promise<void>;
}) {
  // Only the final text part gets the streaming caret, so a message with a tool
  // call after its prose doesn't leave a caret stranded mid-message.
  const lastTextIndex = message.parts.reduce(
    (last, part, index) => (part.type === "text" ? index : last),
    -1,
  );

  return (
    <Message from={message.role}>
      <MessageContent>
        {message.parts.map((part, index) => (
          <AgentMessagePart
            canRespond={canRespond}
            key={partKey(part, index)}
            onInputResponses={onInputResponses}
            part={part}
            showCaret={isStreaming && message.role === "assistant" && index === lastTextIndex}
          />
        ))}
      </MessageContent>
    </Message>
  );
}

function AgentMessagePart({
  canRespond,
  onInputResponses,
  part,
  showCaret,
}: {
  readonly canRespond: boolean;
  readonly onInputResponses: (responses: readonly AgentInputResponse[]) => void | Promise<void>;
  readonly part: EveMessagePart;
  readonly showCaret: boolean;
}) {
  switch (part.type) {
    case "step-start":
      return null;

    case "text":
      return (
        <MessageResponse caret="block" isAnimating={showCaret}>
          {part.text}
        </MessageResponse>
      );

    case "reasoning":
      // Collapsed by default. The old UI rendered a bare "Thinking" row that
      // expanded to nothing useful; this one holds the actual reasoning text.
      return (
        <Reasoning isStreaming={part.state === "streaming"}>
          <ReasoningTrigger />
          <ReasoningContent>{part.text}</ReasoningContent>
        </Reasoning>
      );

    case "authorization":
      return <AuthorizationPrompt part={part} />;

    case "dynamic-tool":
      return (
        <ToolPart canRespond={canRespond} onInputResponses={onInputResponses} part={part} />
      );

    default:
      return null;
  }
}

function ToolPart({
  canRespond,
  onInputResponses,
  part,
}: {
  readonly canRespond: boolean;
  readonly onInputResponses: (responses: readonly AgentInputResponse[]) => void | Promise<void>;
  readonly part: EveDynamicToolPart;
}) {
  const inputRequest = part.toolMetadata?.eve?.inputRequest;
  const sources = part.toolName === "web_search" ? extractSources(part) : [];

  return (
    <>
      <Tool
        defaultOpen={part.state === "approval-requested" || part.state === "output-error"}
      >
        <ToolHeader
          state={part.state}
          title={TOOL_LABELS[part.toolName] ?? part.toolName}
          toolName={part.toolName}
          type="dynamic-tool"
        />
        <ToolContent>
          <ToolInput input={part.input} />
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
          <ToolOutput errorText={part.errorText} output={part.output} />
        </ToolContent>
      </Tool>
      {sources.length > 0 ? (
        <Sources>
          <SourcesTrigger count={sources.length} />
          <SourcesContent>
            {sources.map((source) => (
              <Source href={source.url} key={source.url} title={source.title} />
            ))}
          </SourcesContent>
        </Sources>
      ) : null}
    </>
  );
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
function extractSources(part: EveDynamicToolPart): { title: string; url: string }[] {
  if (part.state !== "output-available") return [];

  const output = part.output as unknown;
  const candidates: unknown[] = Array.isArray(output)
    ? output
    : isRecord(output) && Array.isArray(output.results)
      ? output.results
      : [];

  const seen = new Set<string>();
  const sources: { title: string; url: string }[] = [];

  for (const candidate of candidates) {
    if (!isRecord(candidate)) continue;
    const url = typeof candidate.url === "string" ? candidate.url : undefined;
    if (!url || seen.has(url)) continue;
    seen.add(url);
    sources.push({
      title: typeof candidate.title === "string" && candidate.title ? candidate.title : url,
      url,
    });
  }

  return sources;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function AuthorizationPrompt({
  part,
}: {
  readonly part: Extract<EveMessagePart, { type: "authorization" }>;
}) {
  const isCompleted = part.state === "completed";
  const isAuthorized = isCompleted && part.outcome === "authorized";
  const Icon = isAuthorized ? CheckCircleIcon : isCompleted ? XCircleIcon : KeyRoundIcon;

  return (
    <div
      className={cn(
        "space-y-3 rounded-md border p-3",
        isAuthorized
          ? "border-emerald-500/30 bg-emerald-500/5"
          : isCompleted
            ? "border-destructive/30 bg-destructive/5"
            : "border-blue-500/30 bg-blue-500/5",
      )}
    >
      <div className="flex items-start gap-3">
        <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
        <div className="min-w-0 flex-1 space-y-2">
          <p className="font-medium text-sm">
            {part.state === "required"
              ? `Connect ${part.displayName}`
              : isAuthorized
                ? `${part.displayName} connected`
                : `${part.displayName} authorization ${part.outcome}`}
          </p>
          {part.state === "required" ? (
            <p className="text-muted-foreground text-sm">{part.description}</p>
          ) : null}
          {part.state === "required" && part.authorization?.url ? (
            <Button asChild size="sm">
              <a href={part.authorization.url} rel="noreferrer" target="_blank">
                <ExternalLinkIcon className="size-4" />
                Sign in with {part.displayName}
              </a>
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function partKey(part: EveMessagePart, index: number): string {
  switch (part.type) {
    case "authorization":
      return `authorization:${part.turnId}:${part.stepIndex}:${part.name}`;
    case "dynamic-tool":
      return part.toolCallId;
    default:
      return `${part.type}:${index}`;
  }
}
