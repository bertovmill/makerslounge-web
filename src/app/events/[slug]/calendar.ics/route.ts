import { NextResponse } from "next/server";
import { eventIcs } from "@/lib/events/format";
import { getEventBySlugOrId } from "@/lib/events/server";

/** `/events/<slug>/calendar.ics`: one event as a calendar file. */

const SITE_URL = "https://makerslounge.ca";

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const event = await getEventBySlugOrId(slug);
  if (!event) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const fileSlug = event.slug ?? event.id;
  return new NextResponse(eventIcs(event, `${SITE_URL}/events/${fileSlug}`), {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${fileSlug}.ics"`,
    },
  });
}
