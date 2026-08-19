/**
 * Newsletter subscribers, admin-only, via `/api/email-subscriptions`.
 *
 * The route returns the active count alongside the rows, so a dashboard that only
 * wants the number does not have to download every address to count them — which is
 * what /admin was doing.
 */

export interface Subscriber {
  id: string;
  email: string;
  subscribed_to: string[] | null;
  is_active: boolean | null;
  created_at: string | null;
}

export async function fetchSubscribers(): Promise<{
  data: Subscriber[];
  activeCount: number;
}> {
  try {
    const res = await fetch("/api/email-subscriptions", {
      credentials: "include",
      cache: "no-store",
    });
    if (!res.ok) return { data: [], activeCount: 0 };
    return (await res.json()) as { data: Subscriber[]; activeCount: number };
  } catch (err) {
    console.error("[subscribers] unreachable:", err);
    return { data: [], activeCount: 0 };
  }
}
