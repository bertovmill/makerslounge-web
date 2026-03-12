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
import type { ToolCallMessagePartProps } from "@assistant-ui/react";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  CheckIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  CopyIcon,
  RefreshCwIcon,
  SquareIcon,
  Sparkles,
  Search,
  Users,
  UserCheck,
  Globe,
  Send,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import type { FC } from "react";

/* ─── Tool display config ─── */

const TOOL_META: Record<string, { label: string; icon: FC<{ className?: string }> }> = {
  search_makers: { label: "Searching makers", icon: Search },
  filter_by_skills: { label: "Filtering by skills", icon: Users },
  find_looking_for: { label: "Finding skill matches", icon: UserCheck },
  get_maker_profile: { label: "Looking up profile", icon: Users },
  browse_community: { label: "Browsing community", icon: Globe },
  send_intro_message: { label: "Sending introduction", icon: Send },
};

/* ─── Tool call fallback (shown inside chain of thought) ─── */

const ToolCallFallback: FC<ToolCallMessagePartProps> = ({ toolName, status }) => {
  const meta = TOOL_META[toolName] || { label: toolName, icon: Search };
  const Icon = meta.icon;
  const isRunning = status.type === "running" || status.type === "requires-action";

  return (
    <div className="flex items-center gap-2.5 py-1.5 px-3 rounded-md text-sm">
      {isRunning ? (
        <Loader2 className="w-3.5 h-3.5 text-primary animate-spin flex-shrink-0" />
      ) : (
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500/70 flex-shrink-0" />
      )}
      <Icon className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
      <span className={cn("text-[13px]", isRunning ? "text-foreground" : "text-muted-foreground")}>
        {meta.label}
        {isRunning && "..."}
      </span>
    </div>
  );
};

/* ─── Reasoning text (shown inside chain of thought) ─── */

const Reasoning: FC<{ text: string }> = ({ text }) => {
  return (
    <p className="whitespace-pre-wrap px-3 py-1.5 text-muted-foreground text-[13px] italic">
      {text}
    </p>
  );
};

/* ─── Chain of Thought accordion ─── */

const ChainOfThought: FC = () => {
  return (
    <ChainOfThoughtPrimitive.Root className="my-2 rounded-xl border border-border/60 bg-secondary/30 overflow-hidden">
      <ChainOfThoughtPrimitive.AccordionTrigger className="flex w-full cursor-pointer items-center gap-2 px-3 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors">
        <AuiIf condition={(s) => s.chainOfThought.collapsed}>
          <ChevronRightIcon className="w-4 h-4 flex-shrink-0" />
        </AuiIf>
        <AuiIf condition={(s) => !s.chainOfThought.collapsed}>
          <ChevronDownIcon className="w-4 h-4 flex-shrink-0" />
        </AuiIf>
        <Sparkles className="w-3.5 h-3.5 flex-shrink-0" />
        <span>Thinking</span>
      </ChainOfThoughtPrimitive.AccordionTrigger>
      <AuiIf condition={(s) => !s.chainOfThought.collapsed}>
        <div className="border-t border-border/40 py-1">
          <ChainOfThoughtPrimitive.Parts
            components={{
              Reasoning,
              tools: { Fallback: ToolCallFallback },
            }}
          />
        </div>
      </AuiIf>
    </ChainOfThoughtPrimitive.Root>
  );
};

/* ─── Main thread ─── */

export const MayThread: FC = () => {
  return (
    <ThreadPrimitive.Root
      className="aui-root aui-thread-root @container flex h-full flex-col bg-background"
      style={{
        ["--thread-max-width" as string]: "42rem",
      }}
    >
      <ThreadPrimitive.Viewport
        className="aui-thread-viewport relative flex flex-1 flex-col overflow-y-auto scroll-smooth px-4 pt-4"
      >
        <AuiIf condition={(s) => s.thread.isEmpty}>
          <MayWelcome />
        </AuiIf>

        <AuiIf condition={(s) => !s.thread.isEmpty}>
          <div className="min-h-8 grow" />
          <ThreadPrimitive.Messages
            components={{
              UserMessage,
              AssistantMessage,
            }}
          />
        </AuiIf>
      </ThreadPrimitive.Viewport>

      <AuiIf condition={(s) => !s.thread.isEmpty}>
        <div className="relative mx-auto flex w-full max-w-(--thread-max-width) flex-col gap-3 px-4 pb-3 md:pb-4">
          <ThreadScrollToBottom />
          <ConversationComposer />
        </div>
      </AuiIf>
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

/* ─── Welcome screen (Manus-style) ─── */

const MayWelcome: FC = () => {
  return (
    <div className="mx-auto flex w-full max-w-[640px] grow flex-col items-center justify-center px-4 pb-24">
      <h1 className="fade-in slide-in-from-bottom-2 animate-in fill-mode-both text-4xl sm:text-5xl tracking-tight leading-[1.15] text-center mb-10 duration-300">
        How can May help you
        <br />
        today?
      </h1>

      <div className="w-full mb-5">
        <ComposerPrimitive.Root className="relative flex w-full flex-col">
          <div className="flex w-full flex-col rounded-2xl border border-border bg-card shadow-[var(--shadow-card)] overflow-hidden transition-shadow focus-within:shadow-[var(--shadow-card-hover)] focus-within:border-border">
            <ComposerPrimitive.Input
              placeholder="Describe who you're looking for..."
              className="min-h-[72px] max-h-40 w-full resize-none bg-transparent px-5 pt-4 pb-12 text-[15px] outline-none placeholder:text-muted-foreground/50 focus-visible:ring-0"
              rows={2}
              autoFocus
              aria-label="Message input"
            />
            <div className="absolute bottom-3 right-3 flex items-center gap-2">
              <AuiIf condition={(s) => s.thread.isRunning}>
                <ComposerPrimitive.Cancel asChild>
                  <button
                    type="button"
                    className="w-8 h-8 rounded-full bg-foreground text-background flex items-center justify-center hover:opacity-80 transition-opacity"
                    aria-label="Stop generating"
                  >
                    <SquareIcon className="w-3 h-3 fill-current" />
                  </button>
                </ComposerPrimitive.Cancel>
              </AuiIf>
              <AuiIf condition={(s) => !s.thread.isRunning}>
                <ComposerPrimitive.Send asChild>
                  <button
                    type="submit"
                    className="w-8 h-8 rounded-full bg-foreground text-background flex items-center justify-center hover:opacity-80 transition-opacity disabled:opacity-30"
                    aria-label="Send message"
                  >
                    <ArrowUpIcon className="w-4 h-4" />
                  </button>
                </ComposerPrimitive.Send>
              </AuiIf>
            </div>
          </div>
        </ComposerPrimitive.Root>
      </div>

      <MaySuggestions />
    </div>
  );
};

const SUGGESTIONS = [
  "Find me a co-founder",
  "Who's building with AI?",
  "Product designers",
  "Toronto founders",
  "Who's in the community?",
];

const MaySuggestions: FC = () => {
  return (
    <div className="fade-in slide-in-from-bottom-1 animate-in fill-mode-both delay-150 duration-300 flex flex-wrap items-center justify-center gap-2">
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
            className="h-auto rounded-full border border-border px-4 py-2 text-left transition-colors hover:bg-secondary/50"
          >
            <span className="text-muted-foreground text-sm">{prompt}</span>
          </Button>
        </ThreadPrimitive.Suggestion>
      ))}
    </div>
  );
};

/* ─── Conversation composer (after first message) ─── */

const ConversationComposer: FC = () => {
  return (
    <ComposerPrimitive.Root className="relative flex w-full flex-col">
      <div className="flex w-full flex-col rounded-2xl border border-input bg-background px-1 pt-2 outline-none transition-shadow has-[textarea:focus-visible]:border-ring has-[textarea:focus-visible]:ring-2 has-[textarea:focus-visible]:ring-ring/20">
        <ComposerPrimitive.Input
          placeholder="Ask May anything..."
          className="mb-1 max-h-32 min-h-14 w-full resize-none bg-transparent px-4 pt-2 pb-3 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-0"
          rows={1}
          autoFocus
          aria-label="Message input"
        />
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
      </div>
    </ComposerPrimitive.Root>
  );
};

/* ─── Messages ─── */

const AssistantMessage: FC = () => {
  return (
    <MessagePrimitive.Root
      className="fade-in slide-in-from-bottom-1 relative mx-auto w-full max-w-(--thread-max-width) animate-in py-3 duration-150"
      data-role="assistant"
    >
      <div className="flex items-start gap-3">
        <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
          <Sparkles className="w-3.5 h-3.5 text-primary" />
        </div>
        <div className="wrap-break-word flex-1 min-w-0 text-foreground leading-relaxed">
          <MessagePrimitive.Parts
            components={{
              Text: MarkdownText,
              ChainOfThought,
            }}
          />
          <MessageError />
        </div>
      </div>

      <div className="mt-1 ml-10 flex">
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
        "fade-in slide-in-from-bottom-1 mx-auto grid w-full max-w-(--thread-max-width) animate-in auto-rows-auto grid-cols-[minmax(72px,1fr)_auto] content-start gap-y-2 px-2 py-3 duration-150 [&>*]:col-start-2"
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
