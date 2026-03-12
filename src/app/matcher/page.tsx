"use client";

import { useEffect, useMemo, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { AssistantRuntimeProvider } from "@assistant-ui/react";
import {
  useChatRuntime,
  AssistantChatTransport,
} from "@assistant-ui/react-ai-sdk";
import { Thread } from "@/components/assistant-ui/thread";
import { DeepgramDictationAdapter } from "@/lib/deepgram-dictation-adapter";
import { Suspense } from "react";

function MatcherInner() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const transport = useMemo(
    () =>
      new AssistantChatTransport({
        api: "/api/matcher-chat",
        body: { userId: user?.id },
      }),
    [user?.id],
  );

  const adapters = useMemo(
    () => ({
      dictation: new DeepgramDictationAdapter(),
    }),
    [],
  );

  const runtime = useChatRuntime({ transport, adapters });
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q");
  const sentRef = useRef(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/");
    }
  }, [user, loading, router]);

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

  if (loading || !user) return null;

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
