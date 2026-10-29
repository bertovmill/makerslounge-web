"use client";

import { useEffect, useState } from "react";
import { CalendarPlus, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { googleCalendarUrl, type PublicEvent } from "@/lib/events/format";

/**
 * The RSVP card on an event page. Name and email, no account.
 *
 * After an RSVP the browser remembers it (localStorage, per event) so a guest
 * who comes back sees "You're going" instead of the form. That's a convenience
 * only: the server dedupes by email whatever the browser thinks.
 */

const storageKey = (eventId: string) => `ml-rsvp:${eventId}`;

export function RsvpPanel({ event, pageUrl, ended }: { event: PublicEvent; pageUrl: string; ended: boolean }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [building, setBuilding] = useState("");
  const [going, setGoing] = useState(event.going);
  const [rsvpedAs, setRsvpedAs] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      setRsvpedAs(localStorage.getItem(storageKey(event.id)));
    } catch {
      // Private mode or blocked storage: just show the form.
    }
  }, [event.id]);

  const full = event.capacity != null && going >= event.capacity;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/events/${event.id}/rsvp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, building }),
      });
      const body = (await res.json().catch(() => ({}))) as { going?: number; detail?: string };
      if (!res.ok) {
        setError(body.detail ?? "Something went wrong. Please try again.");
        return;
      }
      if (typeof body.going === "number") setGoing(body.going);
      const first = name.trim().split(/\s+/)[0];
      setRsvpedAs(first);
      try {
        localStorage.setItem(storageKey(event.id), first);
      } catch {
        // Fine: the RSVP itself is saved server-side.
      }
    } catch {
      setError("Couldn't reach the server. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const calendarLinks = (
    <div className="flex flex-col gap-2">
      <span className="text-xs text-muted-foreground">Add to calendar</span>
      <div className="flex flex-wrap gap-2">
        <Button asChild variant="outline" size="sm" className="rounded-full">
          <a href={googleCalendarUrl(event, pageUrl)} target="_blank" rel="noreferrer">
            <CalendarPlus className="size-3.5" /> Google
          </a>
        </Button>
        <Button asChild variant="outline" size="sm" className="rounded-full">
          <a href={`/events/${event.slug ?? event.id}/calendar.ics`}>
            <CalendarPlus className="size-3.5" /> Apple / Outlook
          </a>
        </Button>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-5 rounded-3xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
      <div className="flex items-baseline justify-between gap-3">
        <span className="font-semibold">
          {ended ? "This event has ended" : "Free · RSVP to join"}
        </span>
        <span className="text-sm text-muted-foreground">
          {going} going{event.capacity != null && ` · ${event.capacity} spots`}
        </span>
      </div>

      {ended ? null : rsvpedAs ? (
        <>
          <div className="flex items-start gap-3">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-foreground text-background">
              <Check className="size-4" />
            </span>
            <div>
              <p className="font-semibold">You&apos;re going{rsvpedAs ? `, ${rsvpedAs}` : ""}.</p>
              <p className="text-sm text-muted-foreground">See you there. Your confirmation email has the details and a cancel link.</p>
            </div>
          </div>
          {calendarLinks}
        </>
      ) : full ? (
        <p className="text-sm text-muted-foreground">This one is full. Check back next week.</p>
      ) : (
        <form onSubmit={submit} className="flex flex-col gap-3">
          <Input
            required
            className="h-11 rounded-full px-4"
            autoComplete="name"
            placeholder="Your name"
            value={name}
            maxLength={120}
            onChange={(e) => setName(e.target.value)}
          />
          <Input
            required
            className="h-11 rounded-full px-4"
            type="email"
            autoComplete="email"
            placeholder="Email"
            value={email}
            maxLength={254}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Textarea
            required
            rows={2}
            className="min-h-0 resize-none rounded-2xl px-4 py-2.5"
            placeholder="What are you building? (a few words is fine)"
            value={building}
            maxLength={280}
            onChange={(e) => setBuilding(e.target.value)}
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" disabled={submitting} className="h-11 w-full rounded-full">
            {submitting ? "Saving…" : "I'm going"}
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            We group intros by what you&apos;re building. Your email is only used for this event.
          </p>
        </form>
      )}

      {!ended && !rsvpedAs && !full && <div className="border-t border-border pt-4">{calendarLinks}</div>}
    </div>
  );
}
