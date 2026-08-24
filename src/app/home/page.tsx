"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { MatcherChat } from "@/components/home/matcher-chat";

function HomeContent() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const initialQuery = useSearchParams().get("q");

  useEffect(() => {
    if (!loading && !user) {
      router.push("/");
    }
  }, [user, loading, router]);

  if (loading || !user) return null;

  // The agent is `community-agent/`, an eve app mounted by `withEve` in
  // `next.config.ts`. There is no `body` to send: the caller's identity and admin
  // status are resolved server-side from the Clerk cookie in the agent's own
  // `channels/eve.ts`, never from anything this component could pass.
  return (
    <div className="max-md:h-[calc(100dvh-2.75rem-50px-env(safe-area-inset-top,0px)-env(safe-area-inset-bottom,0px))] md:h-dvh overflow-hidden">
      <MatcherChat initialQuery={initialQuery} />
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense>
      <HomeContent />
    </Suspense>
  );
}
