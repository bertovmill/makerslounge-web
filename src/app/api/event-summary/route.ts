import { NextResponse } from "next/server";
import { fetchLumaEvents, summarizeEvents, type LumaEvent } from "@/lib/luma-events";
import { eventPath } from "@/lib/events/format";
import { listAllEvents } from "@/lib/events/server";

/**
 * The landing page's event card: the next MakersLounge event, or the latest one
 * when nothing is scheduled, plus a running total.
 *
 * Merges two sources. Our own events (`/events/<slug>`, RSVP on the site) are
 * where new events live now; the public Luma calendar still holds the history
 * that the "N events since 2025" total counts. Either source failing just
 * leaves it out. Public, cached for ten minutes at the CDN so a new RSVP-able
 * event shows up quickly.
 */
export const revalidate = 600;

async function inHouseEvents(): Promise<LumaEvent[]> {
  const rows = await listAllEvents();
  return rows.map((e) => ({
    title: e.title,
    start: new Date(e.start_time).toISOString(),
    end: new Date(e.end_time).toISOString(),
    url: eventPath(e),
    venue: e.location ? e.location.split(",")[0].trim() : null,
  }));
}

export async function GET() {
  const [luma, ours] = await Promise.all([
    fetchLumaEvents().catch((err) => {
      console.error("[event-summary] Luma feed failed:", err);
      return [] as LumaEvent[];
    }),
    inHouseEvents().catch((err) => {
      console.error("[event-summary] in-house events failed:", err);
      return [] as LumaEvent[];
    }),
  ]);

  const all = [...luma, ...ours].sort((a, b) => a.start.localeCompare(b.start));
  return NextResponse.json(summarizeEvents(all), {
    headers: { "Cache-Control": "public, s-maxage=600, stale-while-revalidate=86400" },
  });
}
