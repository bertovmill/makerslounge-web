"use client";

import { useEffect, useMemo, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { AssistantRuntimeProvider } from "@assistant-ui/react";
import {
  useChatRuntime,
  AssistantChatTransport,
} from "@assistant-ui/react-ai-sdk";
import { Thread } from "@/components/assistant-ui/thread";
import { DeepgramDictationAdapter } from "@/lib/deepgram-dictation-adapter";

function HomeContent() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // No `body` here any more. It used to send `{ userId, isAdmin }`, which the
  // route trusted — so `isAdmin: true` from any client unlocked search over the
  // private community_contacts table, and `userId` decided who a message was sent
  // as. Both now come from the Clerk session server-side.
  const transport = useMemo(
    () => new AssistantChatTransport({ api: "/api/matcher-chat" }),
    [],
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
      <div className="max-md:h-[calc(100dvh-2.75rem-50px-env(safe-area-inset-top,0px)-env(safe-area-inset-bottom,0px))] md:h-dvh overflow-hidden">
        <Thread />
      </div>
    </AssistantRuntimeProvider>
  );
}

export default function HomePage() {
  return (
    <Suspense>
      <HomeContent />
    </Suspense>
  );
}
