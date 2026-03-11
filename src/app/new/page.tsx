"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { AssistantRuntimeProvider } from "@assistant-ui/react";
import {
  useChatRuntime,
  AssistantChatTransport,
} from "@assistant-ui/react-ai-sdk";
import { MayThread } from "@/components/assistant-ui/may-thread";

export default function NewTaskPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const transport = useMemo(
    () =>
      new AssistantChatTransport({
        api: "/api/may-chat",
        body: { userId: user?.id },
      }),
    [user?.id]
  );

  const runtime = useChatRuntime({ transport });

  useEffect(() => {
    if (!loading && !user) {
      router.push("/");
    }
  }, [user, loading, router]);

  if (loading || !user) return null;

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <div className="h-[calc(100dvh-3rem)] md:h-dvh">
        <MayThread />
      </div>
    </AssistantRuntimeProvider>
  );
}
