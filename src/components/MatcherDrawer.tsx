"use client";

import { AssistantRuntimeProvider } from "@assistant-ui/react";
import {
  useChatRuntime,
  AssistantChatTransport,
} from "@assistant-ui/react-ai-sdk";
import { Thread } from "@/components/assistant-ui/thread";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

const transport = new AssistantChatTransport({
  api: "/api/matcher-chat",
});

interface MatcherDrawerProps {
  open: boolean;
  onClose: () => void;
}

export default function MatcherDrawer({ open, onClose }: MatcherDrawerProps) {
  const runtime = useChatRuntime({ transport });

  return (
    <>
      {/* Mobile: backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/30 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Panel — on desktop it's inline (flex sibling), on mobile it's a fixed overlay */}
      <div
        className={cn(
          // Mobile: fixed full-screen slide-up
          "fixed inset-0 z-50 bg-background transition-transform duration-300 ease-in-out md:relative md:inset-auto md:z-auto",
          // Desktop: inline panel with fixed width, border
          "md:w-[420px] md:shrink-0 md:border-l md:border-border md:bg-background",
          // Desktop transition: collapse width when closed
          "md:transition-[width,opacity] md:duration-300",
          // Open/close states
          open
            ? "translate-y-0 md:translate-y-0 md:w-[420px] md:opacity-100"
            : "translate-y-full md:translate-y-0 md:w-0 md:opacity-0 md:overflow-hidden md:border-l-0"
        )}
      >
        <div className="flex flex-col h-full md:h-[calc(100dvh-3.5rem)] md:sticky md:top-14 w-full md:w-[420px]">
          {/* Header */}
          <div className="flex items-center justify-between h-14 px-4 border-b border-border shrink-0">
            <h2 className="text-sm font-semibold">AI Matcher</h2>
            <button
              onClick={onClose}
              className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              aria-label="Close matcher"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Thread */}
          <div className="flex-1 min-h-0">
            <AssistantRuntimeProvider runtime={runtime}>
              <Thread />
            </AssistantRuntimeProvider>
          </div>
        </div>
      </div>
    </>
  );
}
