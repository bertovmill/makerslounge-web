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
  useMessage,
} from "@assistant-ui/react";
import type { ToolCallMessagePartComponent } from "@assistant-ui/react";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  CheckIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  CopyIcon,
  MicIcon,
  RefreshCwIcon,
  SearchIcon,
  SquareIcon,
  Volume2Icon,
  LoaderIcon,
  Sparkles,
} from "lucide-react";
import { type FC, useState, useCallback, useRef } from "react";

export const Thread: FC = () => {
  return (
    <ThreadPrimitive.Root
      className="aui-root aui-thread-root @container flex h-full flex-col bg-background"
      style={{
        ["--thread-max-width" as string]: "42rem",
      }}
    >
      <ThreadPrimitive.Viewport
        turnAnchor="top"
        className="aui-thread-viewport relative flex flex-1 flex-col overflow-y-auto scroll-smooth px-4 pt-8"
      >
        <AuiIf condition={(s) => s.thread.isEmpty}>
          <ThreadWelcome />
        </AuiIf>

        <AuiIf condition={(s) => !s.thread.isEmpty}>
          <div className="min-h-8 grow" />
        </AuiIf>
        <ThreadPrimitive.Messages
          components={{
            UserMessage,
            AssistantMessage,
          }}
        />
      </ThreadPrimitive.Viewport>

      <div className="relative mx-auto flex w-full max-w-(--thread-max-width) flex-col gap-2 px-4 pb-4">
        <ThreadScrollToBottom />
        <Composer />
        <p className="text-[11px] text-muted-foreground/40 text-center select-none">
          AI matches are based on community profiles and may not be perfect.
        </p>
      </div>
    </ThreadPrimitive.Root>
  );
};

const ThreadScrollToBottom: FC = () => {
  return (
    <ThreadPrimitive.ScrollToBottom asChild>
      <TooltipIconButton
        tooltip="Scroll to bottom"
        variant="outline"
        className="absolute -top-10 z-10 self-center rounded-full size-8 border-border/50 bg-background shadow-sm disabled:invisible"
      >
        <ArrowDownIcon className="size-3.5" />
      </TooltipIconButton>
    </ThreadPrimitive.ScrollToBottom>
  );
};

const ThreadWelcome: FC = () => {
  return (
    <div className="mx-auto flex w-full max-w-(--thread-max-width) grow flex-col justify-center">
      <div className="flex flex-col items-center text-center mb-8 px-4">
        <div className="flex items-center justify-center size-12 rounded-2xl bg-foreground/5 mb-4">
          <Sparkles className="size-6 text-foreground/60" />
        </div>
        <h1 className="fade-in slide-in-from-bottom-2 animate-in fill-mode-both font-semibold text-3xl tracking-tight duration-300">
          Find your match
        </h1>
        <p className="fade-in slide-in-from-bottom-2 animate-in fill-mode-both text-muted-foreground mt-2 max-w-sm delay-75 duration-300">
          Tell me what you&apos;re looking for and I&apos;ll connect you with the right makers.
        </p>
      </div>
      <ThreadSuggestions />
    </div>
  );
};

const SUGGESTIONS = [
  { text: "Find me a technical co-founder", icon: "rocket" },
  { text: "Who has design skills?", icon: "palette" },
  { text: "Collaborate on an AI project", icon: "brain" },
  { text: "Help with marketing", icon: "megaphone" },
];

const ThreadSuggestions: FC = () => {
  return (
    <div className="fade-in slide-in-from-bottom-2 animate-in fill-mode-both delay-150 duration-300 grid grid-cols-2 gap-2 px-4 max-w-(--thread-max-width) mx-auto w-full">
      {SUGGESTIONS.map((suggestion) => (
        <ThreadPrimitive.Suggestion
          key={suggestion.text}
          prompt={suggestion.text}
          method="replace"
          autoSend
          asChild
        >
          <button className="group flex items-start gap-2.5 rounded-xl border border-border/60 bg-background px-3.5 py-3 text-left text-sm transition-all hover:bg-muted/50 hover:border-border cursor-pointer">
            <span className="text-muted-foreground group-hover:text-foreground transition-colors leading-snug">
              {suggestion.text}
            </span>
          </button>
        </ThreadPrimitive.Suggestion>
      ))}
    </div>
  );
};

const Composer: FC = () => {
  return (
    <ComposerPrimitive.Root className="relative flex w-full flex-col">
      <div className="flex w-full flex-col rounded-2xl border border-border/60 bg-background shadow-sm transition-all has-[textarea:focus-visible]:border-foreground/20 has-[textarea:focus-visible]:shadow-md">
        <ComposerPrimitive.Input
          placeholder="What are you looking for?"
          className="max-h-40 min-h-12 w-full resize-none bg-transparent px-4 pt-3 pb-2 text-sm outline-none placeholder:text-muted-foreground/60 focus-visible:ring-0"
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
    <div className="flex items-center justify-between px-2 pb-2">
      <div className="flex items-center">
        <ComposerPrimitive.Dictate asChild>
          <TooltipIconButton
            tooltip="Voice input"
            side="top"
            variant="ghost"
            size="icon"
            className="size-8 rounded-lg text-muted-foreground/60 hover:text-foreground hover:bg-muted/50"
            aria-label="Start voice input"
          >
            <MicIcon className="size-4" />
          </TooltipIconButton>
        </ComposerPrimitive.Dictate>
        <ComposerPrimitive.StopDictation asChild>
          <TooltipIconButton
            tooltip="Stop listening"
            side="top"
            variant="ghost"
            size="icon"
            className="size-8 rounded-lg text-red-500 animate-pulse"
            aria-label="Stop voice input"
          >
            <div className="size-3 rounded-sm bg-red-500" />
          </TooltipIconButton>
        </ComposerPrimitive.StopDictation>
      </div>

      <div className="flex items-center">
        <AuiIf condition={(s) => !s.thread.isRunning}>
          <ComposerPrimitive.Send asChild>
            <Button
              type="submit"
              size="icon"
              className="size-8 rounded-lg bg-foreground text-background hover:bg-foreground/90"
              aria-label="Send message"
            >
              <ArrowUpIcon className="size-4" />
            </Button>
          </ComposerPrimitive.Send>
        </AuiIf>
        <AuiIf condition={(s) => s.thread.isRunning}>
          <ComposerPrimitive.Cancel asChild>
            <Button
              type="button"
              size="icon"
              variant="outline"
              className="size-8 rounded-lg"
              aria-label="Stop generating"
            >
              <SquareIcon className="size-3 fill-current" />
            </Button>
          </ComposerPrimitive.Cancel>
        </AuiIf>
      </div>
    </div>
  );
};

const TOOL_LABELS: Record<string, string> = {
  search_makers: "Searching community",
  filter_by_skills: "Filtering by skills",
  get_maker_profile: "Looking up profile",
  find_looking_for: "Finding matches",
  browse_community: "Browsing community",
  send_intro_message: "Sending intro",
};

const TOOL_ICONS: Record<string, FC<{ className?: string }>> = {
  search_makers: SearchIcon,
  filter_by_skills: SearchIcon,
  get_maker_profile: SearchIcon,
  find_looking_for: SearchIcon,
  browse_community: SearchIcon,
  send_intro_message: SearchIcon,
};

const ToolFallback: ToolCallMessagePartComponent = ({ toolName, args, result, status }) => {
  const [expanded, setExpanded] = useState(false);
  const label = TOOL_LABELS[toolName] || toolName;
  const isRunning = status.type === "running";
  const Icon = TOOL_ICONS[toolName] || SearchIcon;

  let summary = "";
  if (args) {
    const a = args as Record<string, unknown>;
    if (a.query) summary = `"${a.query}"`;
    else if (a.skills && Array.isArray(a.skills)) summary = (a.skills as string[]).join(", ");
    else if (a.name_or_username) summary = `"${a.name_or_username}"`;
  }

  let resultCount = "";
  if (result) {
    const r = result as Record<string, unknown>;
    if (typeof r.count === "number") resultCount = `${r.count} found`;
    else if (r.total_members) resultCount = `${r.total_members} members`;
    else if (Array.isArray(r.results)) resultCount = `${r.results.length} found`;
    else if (Array.isArray(r.profiles)) resultCount = `${r.profiles.length} found`;
  }

  return (
    <div className="my-1.5 text-sm">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 rounded-lg px-2 py-1 -mx-2 hover:bg-muted/50 transition-colors text-left group"
      >
        {isRunning ? (
          <LoaderIcon className="size-3.5 shrink-0 text-muted-foreground/60 animate-spin" />
        ) : (
          <Icon className="size-3.5 shrink-0 text-muted-foreground/60" />
        )}
        <span className="text-muted-foreground/80 text-xs">
          {label}
          {summary && <span className="text-muted-foreground/50"> {summary}</span>}
        </span>
        {resultCount && !isRunning && (
          <span className="text-[11px] text-muted-foreground/40 tabular-nums">{resultCount}</span>
        )}
        <ChevronRightIcon className={cn(
          "size-3 shrink-0 text-muted-foreground/30 transition-transform",
          expanded && "rotate-90",
        )} />
      </button>

      {expanded && (
        <div className="mt-1 ml-5 space-y-2 border-l-2 border-border/30 pl-3">
          {args && Object.keys(args as object).length > 0 && (
            <pre className="text-[11px] text-muted-foreground/60 bg-muted/30 rounded-md px-2.5 py-2 overflow-x-auto">
              {JSON.stringify(args, null, 2)}
            </pre>
          )}
          {result && !isRunning && (
            <pre className="text-[11px] text-muted-foreground/60 bg-muted/30 rounded-md px-2.5 py-2 overflow-x-auto max-h-48 overflow-y-auto">
              {JSON.stringify(result, null, 2)}
            </pre>
          )}
          {isRunning && (
            <p className="text-xs text-muted-foreground/50 italic">Running...</p>
          )}
        </div>
      )}
    </div>
  );
};

const Reasoning: FC<{ text: string }> = ({ text }) => {
  return (
    <p className="whitespace-pre-wrap py-1.5 text-muted-foreground/60 text-sm italic leading-relaxed">
      {text}
    </p>
  );
};

const ChainOfThought: FC = () => {
  return (
    <ChainOfThoughtPrimitive.Root className="my-1">
      <ChainOfThoughtPrimitive.AccordionTrigger className="flex w-full cursor-pointer items-center gap-2 py-1.5 text-xs text-muted-foreground/50 hover:text-muted-foreground/70 transition-colors">
        <AuiIf condition={(s) => s.chainOfThought.collapsed}>
          <ChevronRightIcon className="size-3" />
        </AuiIf>
        <AuiIf condition={(s) => !s.chainOfThought.collapsed}>
          <ChevronDownIcon className="size-3" />
        </AuiIf>
        <Sparkles className="size-3" />
        <span>Thinking</span>
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
      className="fade-in slide-in-from-bottom-1 relative mx-auto w-full max-w-(--thread-max-width) animate-in py-4 duration-200"
      data-role="assistant"
    >
      <div className="wrap-break-word text-foreground leading-relaxed text-[15px]">
        <MessagePrimitive.Parts
          components={{
            Text: MarkdownText,
            ChainOfThought,
          }}
        />
        <MessageError />
      </div>

      <div className="mt-2 flex">
        <AssistantActionBar />
      </div>
    </MessagePrimitive.Root>
  );
};

const MessageError: FC = () => {
  return (
    <MessagePrimitive.Error>
      <ErrorPrimitive.Root className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3 text-red-700 text-sm dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-400">
        <ErrorPrimitive.Message className="line-clamp-2" />
      </ErrorPrimitive.Root>
    </MessagePrimitive.Error>
  );
};

const SpeakButton: FC = () => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const message = useMessage();

  const speak = useCallback(async () => {
    if (isSpeaking) {
      audioRef.current?.pause();
      audioRef.current = null;
      setIsSpeaking(false);
      return;
    }

    const textParts = message.content
      .filter((p): p is { type: "text"; text: string } => p.type === "text")
      .map((p) => p.text)
      .join("\n");

    if (!textParts.trim()) return;

    setIsSpeaking(true);
    try {
      const res = await fetch("/api/tts/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: textParts.slice(0, 5000),
          voice_id: "21m00Tcm4TlvDq8ikWAM",
        }),
      });

      if (!res.ok) throw new Error("TTS failed");

      const audioBlob = await res.blob();
      const url = URL.createObjectURL(audioBlob);
      const audio = new Audio(url);
      audioRef.current = audio;

      audio.onended = () => {
        setIsSpeaking(false);
        URL.revokeObjectURL(url);
        audioRef.current = null;
      };

      audio.onerror = () => {
        setIsSpeaking(false);
        URL.revokeObjectURL(url);
        audioRef.current = null;
      };

      await audio.play();
    } catch (error) {
      console.error("TTS error:", error);
      setIsSpeaking(false);
    }
  }, [isSpeaking, message.content]);

  return (
    <TooltipIconButton
      tooltip={isSpeaking ? "Stop" : "Listen"}
      onClick={speak}
      className="text-muted-foreground/40 hover:text-muted-foreground"
    >
      {isSpeaking ? (
        <LoaderIcon className="size-3.5 animate-spin" />
      ) : (
        <Volume2Icon className="size-3.5" />
      )}
    </TooltipIconButton>
  );
};

const AssistantActionBar: FC = () => {
  return (
    <ActionBarPrimitive.Root
      hideWhenRunning
      autohide="not-last"
      autohideFloat="single-branch"
      className="-ml-1 flex gap-0.5 text-muted-foreground data-floating:absolute data-floating:rounded-lg data-floating:border data-floating:border-border/50 data-floating:bg-background data-floating:p-0.5 data-floating:shadow-sm"
    >
      <ActionBarPrimitive.Copy asChild>
        <TooltipIconButton
          tooltip="Copy"
          className="text-muted-foreground/40 hover:text-muted-foreground"
        >
          <AuiIf condition={(s) => s.message.isCopied}>
            <CheckIcon className="size-3.5" />
          </AuiIf>
          <AuiIf condition={(s) => !s.message.isCopied}>
            <CopyIcon className="size-3.5" />
          </AuiIf>
        </TooltipIconButton>
      </ActionBarPrimitive.Copy>
      <SpeakButton />
      <ActionBarPrimitive.Reload asChild>
        <TooltipIconButton
          tooltip="Retry"
          className="text-muted-foreground/40 hover:text-muted-foreground"
        >
          <RefreshCwIcon className="size-3.5" />
        </TooltipIconButton>
      </ActionBarPrimitive.Reload>
    </ActionBarPrimitive.Root>
  );
};

const UserMessage: FC = () => {
  return (
    <MessagePrimitive.Root
      className="fade-in slide-in-from-bottom-1 mx-auto flex w-full max-w-(--thread-max-width) animate-in justify-end py-4 duration-200"
      data-role="user"
    >
      <div className="max-w-[85%]">
        <div className="wrap-break-word rounded-2xl bg-foreground/[0.04] px-4 py-2.5 text-foreground text-[15px]">
          <MessagePrimitive.Parts />
        </div>
      </div>
    </MessagePrimitive.Root>
  );
};
