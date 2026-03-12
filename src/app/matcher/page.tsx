"use client";

import { AssistantRuntimeProvider } from "@assistant-ui/react";
import { WebSpeechDictationAdapter } from "@assistant-ui/react";
import {
  useChatRuntime,
  AssistantChatTransport,
} from "@assistant-ui/react-ai-sdk";
import { Thread } from "@/components/assistant-ui/thread";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useMemo } from "react";

const transport = new AssistantChatTransport({
  api: "/api/matcher-chat",
});

function MatcherInner() {
  const adapters = useMemo(
    () => ({
      dictation: new WebSpeechDictationAdapter(),
    }),
    [],
  );

  const runtime = useChatRuntime({ transport, adapters });
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q");
  const sentRef = useRef(false);

  useEffect(() => {
    if (initialQuery && !sentRef.current) {
      sentRef.current = true;
      const timer = setTimeout(() => {
        runtime.thread.append({
          role: "user",
          content: [{ type: "text", text: initialQuery }],
        });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [initialQuery, runtime]);

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <div className="max-md:h-[calc(100dvh-2.75rem-50px)] md:h-dvh overflow-hidden">
        <Thread />
      </div>
    </AssistantRuntimeProvider>
  );
}

export default function MatcherPage() {
  return (
    <Suspense>
      <MatcherInner />
    </Suspense>
  );
}
