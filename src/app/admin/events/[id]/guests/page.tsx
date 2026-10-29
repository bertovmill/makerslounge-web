"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { fetchEvent, type EventRow } from "@/lib/events-client";
import { eventPath, formatEventDay, formatEventTimes } from "@/lib/events/format";

interface Guest {
  id: string;
  name: string;
  email: string;
  building: string | null;
  profile_id: string | null;
  created_at: string;
}

/** An event's guest list. Admin-only, enforced by `/api/events/[id]/rsvps`. */
export default function EventGuestsPage() {
  const { id } = useParams<{ id: string }>();
  const [event, setEvent] = useState<EventRow | null>(null);
  const [guests, setGuests] = useState<Guest[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Bumped after a removal to refetch.
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let alive = true;
    Promise.all([
      fetchEvent(id),
      fetch(`/api/events/${id}/rsvps`, { credentials: "include", cache: "no-store" }),
    ]).then(async ([ev, res]) => {
      const body = res.ok ? ((await res.json()) as { data: Guest[] }) : null;
      if (!alive) return;
      setEvent(ev);
      setGuests(body?.data ?? []);
      setError(body ? null : res.status === 403 || res.status === 401 ? "Admins only." : "Couldn't load guests.");
    });
    return () => {
      alive = false;
    };
  }, [id, version]);

  const remove = async (guest: Guest) => {
    if (!confirm(`Remove ${guest.name} from the guest list?`)) return;
    const res = await fetch(`/api/events/${id}/rsvps?rsvpId=${guest.id}`, { method: "DELETE", credentials: "include" });
    if (res.ok) setVersion((v) => v + 1);
  };

  const copyEmails = () => {
    navigator.clipboard.writeText((guests ?? []).map((g) => g.email).join(", "));
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <Link href="/admin/events" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> All events
      </Link>

      <div className="mt-6 mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">{event?.title ?? "Guests"}</h1>
          {event && (
            <p className="text-muted-foreground">
              {formatEventDay(event.start_time)}, {formatEventTimes(event.start_time, event.end_time)}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          {event && (
            <Button asChild variant="outline">
              <Link href={eventPath(event)}>View page</Link>
            </Button>
          )}
          <Button variant="outline" onClick={copyEmails} disabled={!guests?.length}>
            <Copy className="size-4" /> Copy emails
          </Button>
        </div>
      </div>

      <Card className="p-6">
        <h2 className="mb-4 text-xl font-semibold">
          {guests === null ? "Loading…" : `${guests.length} going`}
          {event?.capacity != null && <span className="text-muted-foreground font-normal"> of {event.capacity}</span>}
        </h2>
        {error && <p className="text-sm text-destructive">{error}</p>}
        {guests?.length === 0 && !error && <p className="text-sm text-muted-foreground">No RSVPs yet.</p>}
        {!!guests?.length && (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="py-2 pr-4 font-semibold">Name</th>
                <th className="py-2 pr-4 font-semibold">Email</th>
                <th className="py-2 pr-4 font-semibold">Building</th>
                <th className="py-2 pr-4 font-semibold">RSVP&apos;d</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {guests.map((guest) => (
                <tr key={guest.id} className="border-b border-border/50">
                  <td className="py-3 pr-4">
                    {guest.profile_id ? <Link href={`/profile/${guest.profile_id}`} className="hover:underline">{guest.name}</Link> : guest.name}
                  </td>
                  <td className="py-3 pr-4 text-muted-foreground">{guest.email}</td>
                  <td className="py-3 pr-4">{guest.building ?? "—"}</td>
                  <td className="py-3 pr-4 text-muted-foreground">
                    {new Date(guest.created_at).toLocaleDateString("en-CA", { month: "short", day: "numeric" })}
                  </td>
                  <td className="py-3 text-right">
                    <Button variant="ghost" size="sm" onClick={() => remove(guest)}>Remove</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
