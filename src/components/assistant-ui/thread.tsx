import { MarkdownText } from "@/components/assistant-ui/markdown-text";
import { TooltipIconButton } from "@/components/assistant-ui/tooltip-icon-button";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  ActionBarPrimitive,
  AuiIf,
  ChainOfThoughtPrimitive,
  ComposerPrimitive,
  ErrorPrimitive,
  MessagePrimitive,
  ThreadPrimitive,
} from "@assistant-ui/react";
import type { ToolCallMessagePartComponent } from "@assistant-ui/react";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  CheckIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  CopyIcon,
  RefreshCwIcon,
  SearchIcon,
  SquareIcon,
} from "lucide-react";
import type { FC } from "react";

export const Thread: FC = () => {
  return (
    <ThreadPrimitive.Root
      className="aui-root aui-thread-root @container flex h-full flex-col bg-background"
      style={{
        ["--thread-max-width" as string]: "100%",
      }}
    >
      <ThreadPrimitive.Viewport
        turnAnchor="top"
        className="aui-thread-viewport relative flex flex-1 flex-col overflow-x-auto overflow-y-scroll scroll-smooth px-4 pt-4"
      >
        <AuiIf condition={(s) => s.thread.isEmpty}>
          <ThreadWelcome />
        </AuiIf>

        <ThreadPrimitive.Messages
          components={{
            UserMessage,
            AssistantMessage,
          }}
        />

        <ThreadPrimitive.ViewportFooter className="aui-thread-viewport-footer sticky bottom-0 mx-auto mt-auto flex w-full max-w-(--thread-max-width) flex-col gap-3 overflow-hidden rounded-t-2xl bg-background px-2 pb-3 md:pb-4">
          <ThreadScrollToBottom />
          <Composer />
          <p className="text-[11px] text-muted-foreground/50 text-center">
            AI matches are based on community profiles and may not be perfect.
          </p>
        </ThreadPrimitive.ViewportFooter>
      </ThreadPrimitive.Viewport>
    </ThreadPrimitive.Root>
  );
};

const ThreadScrollToBottom: FC = () => {
  return (
    <ThreadPrimitive.ScrollToBottom asChild>
      <TooltipIconButton
        tooltip="Scroll to bottom"
        variant="outline"
        className="absolute -top-12 z-10 self-center rounded-full p-4 disabled:invisible dark:bg-background dark:hover:bg-accent"
      >
        <ArrowDownIcon />
      </TooltipIconButton>
    </ThreadPrimitive.ScrollToBottom>
  );
};

const ThreadWelcome: FC = () => {
  return (
    <div className="mx-auto my-auto flex w-full max-w-(--thread-max-width) grow flex-col">
      <div className="flex w-full grow flex-col items-center justify-center">
        <div className="flex size-full flex-col justify-center px-4">
          <h1 className="fade-in slide-in-from-bottom-1 animate-in fill-mode-both font-semibold text-2xl duration-200">
            Find Your Match
          </h1>
          <p className="fade-in slide-in-from-bottom-1 animate-in fill-mode-both text-muted-foreground text-lg delay-75 duration-200">
            Describe what you&apos;re looking for and I&apos;ll connect you with the right people.
          </p>
        </div>
      </div>
      <ThreadSuggestions />
    </div>
  );
};

const SUGGESTIONS = [
  "I need a technical co-founder for my startup",
  "Who has design skills in the community?",
  "I'm looking for someone to collaborate on an AI project",
  "Who should I talk to about marketing?",
];

const ThreadSuggestions: FC = () => {
  return (
    <div className="flex flex-col gap-2 pb-4 px-4">
      {SUGGESTIONS.map((prompt) => (
        <ThreadPrimitive.Suggestion
          key={prompt}
          prompt={prompt}
          method="replace"
          autoSend
          asChild
        >
          <Button
            variant="ghost"
            className="h-auto w-full items-start justify-start rounded-xl border px-3 py-2.5 text-left transition-colors hover:bg-muted whitespace-normal"
          >
            <span className="text-muted-foreground text-xs leading-snug">{prompt}</span>
          </Button>
        </ThreadPrimitive.Suggestion>
      ))}
    </div>
  );
};

const Composer: FC = () => {
  return (
    <ComposerPrimitive.Root className="relative flex w-full flex-col">
      <div className="flex w-full flex-col rounded-2xl border border-input bg-background px-1 pt-2 outline-none transition-shadow has-[textarea:focus-visible]:border-ring has-[textarea:focus-visible]:ring-2 has-[textarea:focus-visible]:ring-ring/20">
        <ComposerPrimitive.Input
          placeholder="What are you looking for?"
          className="mb-1 max-h-32 min-h-14 w-full resize-none bg-transparent px-4 pt-2 pb-3 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-0"
          rows={1}
          autoFocus
          aria-label="Message input"
        />
        <ComposerAction />
      </div>
    </ComposerPrimitive.Root>
  );
};

const ComposerAction: FC = () => {
  return (
    <div className="relative mx-2 mb-2 flex items-center justify-end">
      <AuiIf condition={(s) => !s.thread.isRunning}>
        <ComposerPrimitive.Send asChild>
          <TooltipIconButton
            tooltip="Send message"
            side="bottom"
            type="submit"
            variant="default"
            size="icon"
            className="size-8 rounded-full"
            aria-label="Send message"
          >
            <ArrowUpIcon className="size-4" />
          </TooltipIconButton>
        </ComposerPrimitive.Send>
      </AuiIf>
      <AuiIf condition={(s) => s.thread.isRunning}>
        <ComposerPrimitive.Cancel asChild>
          <Button
            type="button"
            variant="default"
            size="icon"
            className="size-8 rounded-full"
            aria-label="Stop generating"
          >
            <SquareIcon className="size-3 fill-current" />
          </Button>
        </ComposerPrimitive.Cancel>
      </AuiIf>
    </div>
  );
};

const TOOL_LABELS: Record<string, string> = {
  search_people: "Searching community",
  filter_by_skills: "Filtering by skills",
  get_profile_details: "Looking up profile",
  find_looking_for: "Finding matches",
  browse_community: "Browsing community",
};

const ToolFallback: ToolCallMessagePartComponent = ({ toolName, args, result }) => {
  const label = TOOL_LABELS[toolName] || "Working";

  // Build a detail string from the tool args
  let detail = "";
  if (args) {
    const a = args as Record<string, unknown>;
    if (a.query) detail = `"${a.query}"`;
    else if (a.skills && Array.isArray(a.skills)) detail = (a.skills as string[]).join(", ");
    else if (a.name_or_username) detail = `"${a.name_or_username}"`;
  }

  // Show result count if available
  let resultInfo = "";
  if (result) {
    const r = result as Record<string, unknown>;
    if (typeof r.count === "number") resultInfo = `${r.count} found`;
    else if (r.total_members) resultInfo = `${r.total_members} members`;
  }

  return (
    <div className="flex items-center gap-2 px-4 py-1.5 text-muted-foreground text-sm">
      <SearchIcon className="size-3.5 shrink-0" />
      <span>{label}</span>
      {detail && <span className="text-foreground/70 font-medium">{detail}</span>}
      {resultInfo && <span className="ml-auto text-xs opacity-60">{resultInfo}</span>}
    </div>
  );
};

const Reasoning: FC<{ text: string }> = ({ text }) => {
  return (
    <p className="whitespace-pre-wrap px-4 py-2 text-muted-foreground text-sm italic">
      {text}
    </p>
  );
};

const ChainOfThought: FC = () => {
  return (
    <ChainOfThoughtPrimitive.Root className="my-2 rounded-lg border border-border/50">
      <ChainOfThoughtPrimitive.AccordionTrigger className="flex w-full cursor-pointer items-center gap-2 px-4 py-2 font-medium text-sm text-muted-foreground hover:bg-muted/50 transition-colors rounded-lg">
        <AuiIf condition={(s) => s.chainOfThought.collapsed}>
          <ChevronRightIcon className="size-4" />
        </AuiIf>
        <AuiIf condition={(s) => !s.chainOfThought.collapsed}>
          <ChevronDownIcon className="size-4" />
        </AuiIf>
        <SearchIcon className="size-3.5" />
        Searching
      </ChainOfThoughtPrimitive.AccordionTrigger>
      <AuiIf condition={(s) => !s.chainOfThought.collapsed}>
        <ChainOfThoughtPrimitive.Parts
          components={{ Reasoning, tools: { Fallback: ToolFallback } }}
        />
      </AuiIf>
    </ChainOfThoughtPrimitive.Root>
  );
};

const AssistantMessage: FC = () => {
  return (
    <MessagePrimitive.Root
      className="fade-in slide-in-from-bottom-1 relative mx-auto w-full max-w-(--thread-max-width) animate-in py-3 duration-150"
      data-role="assistant"
    >
      <div className="wrap-break-word px-2 text-foreground leading-relaxed">
        <MessagePrimitive.Parts
          components={{
            Text: MarkdownText,
            ChainOfThought,
          }}
        />
        <MessageError />
      </div>

      <div className="mt-1 ml-2 flex">
        <AssistantActionBar />
      </div>
    </MessagePrimitive.Root>
  );
};

const MessageError: FC = () => {
  return (
    <MessagePrimitive.Error>
      <ErrorPrimitive.Root className="mt-2 rounded-md border border-destructive bg-destructive/10 p-3 text-destructive text-sm">
        <ErrorPrimitive.Message className="line-clamp-2" />
      </ErrorPrimitive.Root>
    </MessagePrimitive.Error>
  );
};

const AssistantActionBar: FC = () => {
  return (
    <ActionBarPrimitive.Root
      hideWhenRunning
      autohide="not-last"
      autohideFloat="single-branch"
      className="col-start-3 row-start-2 -ml-1 flex gap-1 text-muted-foreground data-floating:absolute data-floating:rounded-md data-floating:border data-floating:bg-background data-floating:p-1 data-floating:shadow-sm"
    >
      <ActionBarPrimitive.Copy asChild>
        <TooltipIconButton tooltip="Copy">
          <AuiIf condition={(s) => s.message.isCopied}>
            <CheckIcon />
          </AuiIf>
          <AuiIf condition={(s) => !s.message.isCopied}>
            <CopyIcon />
          </AuiIf>
        </TooltipIconButton>
      </ActionBarPrimitive.Copy>
      <ActionBarPrimitive.Reload asChild>
        <TooltipIconButton tooltip="Refresh">
          <RefreshCwIcon />
        </TooltipIconButton>
      </ActionBarPrimitive.Reload>
    </ActionBarPrimitive.Root>
  );
};

const UserMessage: FC = () => {
  return (
    <MessagePrimitive.Root
      className={cn(
        "fade-in slide-in-from-bottom-1 mx-auto grid w-full max-w-(--thread-max-width) animate-in auto-rows-auto grid-cols-[minmax(72px,1fr)_auto] content-start gap-y-2 px-2 py-3 duration-150 [&>*]:col-start-2",
      )}
      data-role="user"
    >
      <div className="relative col-start-2 min-w-0">
        <div className="wrap-break-word rounded-2xl bg-muted px-4 py-2.5 text-foreground">
          <MessagePrimitive.Parts />
        </div>
      </div>
    </MessagePrimitive.Root>
  );
};
