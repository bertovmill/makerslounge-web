"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Check, Copy, Search, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { fetchEvent, type EventRow } from "@/lib/events-client";
import { eventPath, formatEventDay, formatEventTimes } from "@/lib/events/format";

interface Guest {
  id: string;
  name: string;
  email: string | null;
  building: string | null;
  needs_help: string | null;
  can_help: string | null;
  profile_id: string | null;
  created_at: string;
  checked_in_at: string | null;
  walk_in: boolean;
}

/**
 * An event's guest list, and the door on the day: check guests in, add
 * walk-ins. Admin-only, enforced by `/api/events/[id]/rsvps`.
 */
export default function EventGuestsPage() {
  const { id } = useParams<{ id: string }>();
  const [event, setEvent] = useState<EventRow | null>(null);
  const [guests, setGuests] = useState<Guest[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [walkIn, setWalkIn] = useState({ open: false, name: "", email: "", building: "", error: "" });

  // Bumped after a removal or walk-in to refetch.
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

  const checkedIn = guests?.filter((g) => g.checked_in_at).length ?? 0;

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!guests || !q) return guests ?? [];
    return guests.filter((g) => g.name.toLowerCase().includes(q) || g.email?.toLowerCase().includes(q));
  }, [guests, query]);

  const toggleCheckIn = async (guest: Guest) => {
    setBusy(guest.id);
    const res = await fetch(`/api/events/${id}/rsvps`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rsvpId: guest.id, checkedIn: !guest.checked_in_at }),
    });
    if (res.ok) {
      const { data } = (await res.json()) as { data: { checked_in_at: string | null } };
      setGuests((gs) => gs?.map((g) => (g.id === guest.id ? { ...g, checked_in_at: data.checked_in_at } : g)) ?? null);
    }
    setBusy(null);
  };

  const addWalkIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy("walk-in");
    const res = await fetch(`/api/events/${id}/rsvps`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: walkIn.name, email: walkIn.email, building: walkIn.building }),
    });
    setBusy(null);
    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { detail?: string };
      setWalkIn((w) => ({ ...w, error: body.detail ?? "Couldn't add them." }));
      return;
    }
    setWalkIn({ open: false, name: "", email: "", building: "", error: "" });
    setQuery("");
    setVersion((v) => v + 1);
  };

  const remove = async (guest: Guest) => {
    if (!confirm(`Remove ${guest.name} from the guest list?`)) return;
    const res = await fetch(`/api/events/${id}/rsvps?rsvpId=${guest.id}`, { method: "DELETE", credentials: "include" });
    if (res.ok) setVersion((v) => v + 1);
  };

  const copyEmails = () => {
    navigator.clipboard.writeText((guests ?? []).flatMap((g) => (g.email ? [g.email] : [])).join(", "));
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
        <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-xl font-semibold">
            {guests === null ? "Loading…" : `${guests.length} going`}
            {event?.capacity != null && <span className="text-muted-foreground font-normal"> of {event.capacity}</span>}
          </h2>
          {!!guests?.length && (
            <p id="checked-in-count" className="text-sm font-medium">
              {checkedIn} checked in
            </p>
          )}
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}

        {guests && !error && (
          <div id="door-check-in" className="mb-4 flex flex-col gap-3">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Find a guest by name or email"
                  className="pl-9"
                />
              </div>
              <Button
                variant="outline"
                onClick={() => setWalkIn((w) => ({ ...w, open: !w.open, name: w.name || query, error: "" }))}
              >
                <UserPlus className="size-4" /> Walk-in
              </Button>
            </div>

            {walkIn.open && (
              <form id="add-walk-in" onSubmit={addWalkIn} className="flex flex-col gap-2 rounded-lg border border-border p-4">
                <p className="text-sm text-muted-foreground">Adds them checked in. Walk-ins are never emailed.</p>
                <Input
                  required
                  autoFocus
                  value={walkIn.name}
                  onChange={(e) => setWalkIn((w) => ({ ...w, name: e.target.value }))}
                  placeholder="Name"
                />
                <Input
                  type="email"
                  value={walkIn.email}
                  onChange={(e) => setWalkIn((w) => ({ ...w, email: e.target.value }))}
                  placeholder="Email (optional)"
                />
                <Input
                  value={walkIn.building}
                  onChange={(e) => setWalkIn((w) => ({ ...w, building: e.target.value }))}
                  placeholder="What they're building (optional)"
                />
                {walkIn.error && <p className="text-sm text-destructive">{walkIn.error}</p>}
                <Button type="submit" disabled={busy === "walk-in" || !walkIn.name.trim()}>
                  Add and check in
                </Button>
              </form>
            )}
          </div>
        )}

        {guests?.length === 0 && !error && <p className="text-sm text-muted-foreground">No RSVPs yet.</p>}
        {!!guests?.length && shown.length === 0 && (
          <p className="text-sm text-muted-foreground">No guest matches &ldquo;{query}&rdquo;. Add them as a walk-in?</p>
        )}
        {!!shown.length && (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="py-2 pr-4 font-semibold">Name</th>
                <th className="hidden py-2 pr-4 font-semibold sm:table-cell">Email</th>
                <th className="hidden py-2 pr-4 font-semibold md:table-cell">Building</th>
                <th className="hidden py-2 pr-4 font-semibold sm:table-cell">RSVP&apos;d</th>
                <th className="py-2 pr-4 font-semibold">Door</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {shown.map((guest) => (
                <tr key={guest.id} className="border-b border-border/50">
                  <td className="py-3 pr-4">
                    {guest.profile_id ? <Link href={`/profile/${guest.profile_id}`} className="hover:underline">{guest.name}</Link> : guest.name}
                    {guest.walk_in && <span className="ml-2 text-xs text-muted-foreground">walk-in</span>}
                  </td>
                  <td className="hidden py-3 pr-4 text-muted-foreground sm:table-cell">{guest.email ?? "—"}</td>
                  <td className="hidden py-3 pr-4 md:table-cell">
                    {guest.building ?? "—"}
                    {guest.needs_help && (
                      <p className="mt-1 text-xs text-muted-foreground">Needs: {guest.needs_help}</p>
                    )}
                    {guest.can_help && (
                      <p className="mt-1 text-xs text-muted-foreground">Can help: {guest.can_help}</p>
                    )}
                  </td>
                  <td className="hidden py-3 pr-4 text-muted-foreground sm:table-cell">
                    {new Date(guest.created_at).toLocaleDateString("en-CA", { month: "short", day: "numeric" })}
                  </td>
                  <td className="py-3 pr-4">
                    <Button
                      size="sm"
                      variant={guest.checked_in_at ? "default" : "outline"}
                      disabled={busy === guest.id}
                      onClick={() => toggleCheckIn(guest)}
                      title={guest.checked_in_at ? "Checked in. Tap to undo." : undefined}
                    >
                      {guest.checked_in_at ? (
                        <>
                          <Check className="size-4" />
                          {new Date(guest.checked_in_at).toLocaleTimeString("en-CA", {
                            hour: "numeric",
                            minute: "2-digit",
                            timeZone: "America/Toronto",
                          })}
                        </>
                      ) : (
                        "Check in"
                      )}
                    </Button>
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
