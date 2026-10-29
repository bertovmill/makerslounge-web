"use client";

import { useState } from "react";
import Link from "next/link";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * The confirm button on the cancel page. On success it also forgets the RSVP
 * this browser remembered (see `RsvpPanel`), so the event page offers the form
 * again instead of still saying "You're going".
 */
export function CancelRsvpButton({ eventId, token, eventHref }: { eventId: string; token: string; eventHref: string }) {
  const [state, setState] = useState<"idle" | "cancelling" | "cancelled">("idle");
  const [error, setError] = useState<string | null>(null);

  const cancel = async () => {
    setState("cancelling");
    setError(null);
    try {
      const res = await fetch(`/api/events/${eventId}/rsvp`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      // 404 means it was already gone, which is the outcome the guest wanted.
      if (!res.ok && res.status !== 404) {
        const body = (await res.json().catch(() => ({}))) as { detail?: string };
        setError(body.detail ?? "Something went wrong. Please try again.");
        setState("idle");
        return;
      }
      try {
        localStorage.removeItem(`ml-rsvp:${eventId}`);
      } catch {
        // Blocked storage: nothing was remembered, so nothing to forget.
      }
      setState("cancelled");
    } catch {
      setError("Couldn't reach the server. Please try again.");
      setState("idle");
    }
  };

  if (state === "cancelled") {
    return (
      <div className="flex flex-col gap-3">
        <div className="flex items-start gap-3">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-foreground text-background">
            <Check className="size-4" />
          </span>
          <div>
            <p className="font-semibold">Your RSVP is cancelled.</p>
            <p className="text-sm text-muted-foreground">Thanks for letting us know. Hope to see you another time.</p>
          </div>
        </div>
        <Link href={eventHref} className="text-sm font-medium underline underline-offset-4">
          Changed your mind? RSVP again
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button onClick={cancel} disabled={state === "cancelling"} variant="destructive" className="h-11 w-full rounded-full">
        {state === "cancelling" ? "Cancelling…" : "Cancel my RSVP"}
      </Button>
      <Link href={eventHref} className="text-center text-sm text-muted-foreground underline-offset-4 hover:underline">
        Keep my spot
      </Link>
    </div>
  );
}
