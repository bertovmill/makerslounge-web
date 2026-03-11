"use client";

import { AssistantRuntimeProvider } from "@assistant-ui/react";
import {
  useChatRuntime,
  AssistantChatTransport,
} from "@assistant-ui/react-ai-sdk";
import { Thread } from "@/components/assistant-ui/thread";

const transport = new AssistantChatTransport({
  api: "/api/matcher-chat",
});

export default function MatcherPage() {
  const runtime = useChatRuntime({ transport });

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <div className="h-[calc(100dvh-64px)]">
        <Thread />
      </div>
    </AssistantRuntimeProvider>
  );
}
