import { NextResponse } from "next/server";
import { fetchLumaEvents, summarizeEvents } from "@/lib/luma-events";
import { handleApiError } from "@/lib/api/respond";

/**
 * The landing page's event card: the next event on the MakersLounge Luma
 * calendar, or the latest one when nothing is scheduled, plus a running total.
 *
 * Public, and only what Luma already publishes. Cached for an hour at the CDN,
 * which is also as often as Luma refreshes the feed.
 */
export const revalidate = 3600;

export async function GET() {
  try {
    const summary = summarizeEvents(await fetchLumaEvents());
    return NextResponse.json(summary, {
      headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" },
    });
  } catch (err) {
    return handleApiError(err, "luma-events");
  }
}
