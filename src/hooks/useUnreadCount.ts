"use client";

import { useEffect, useState } from "react";
import { fetchUnreadCount, POLL_INTERVAL_MS } from "@/lib/messages-client";

/**
 * Unread message count, polled.
 *
 * Navbar and Sidebar each held their own Supabase Realtime channel on the whole
 * `messages` table, re-counting on every insert anywhere in the system. Neon has no
 * realtime, so both now share this hook.
 *
 * Polling is paused while the tab is hidden — a background tab does not need a live
 * badge, and this is the difference between one request every 15 seconds per open
 * tab and one per 15 seconds per *visible* tab.
 */
export function useUnreadCount(enabled: boolean): number {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!enabled) {
      setCount(0);
      return;
    }

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const tick = async () => {
      if (document.visibilityState === "visible") {
        const next = await fetchUnreadCount();
        if (cancelled) return;
        setCount(next);
      }
      timer = setTimeout(tick, POLL_INTERVAL_MS);
    };

    tick();

    // Refresh immediately on becoming visible, rather than waiting out whatever
    // remained of the interval.
    const onVisible = () => {
      if (document.visibilityState === "visible") {
        fetchUnreadCount().then((n) => {
          if (!cancelled) setCount(n);
        });
      }
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [enabled]);

  return count;
}
