/**
 * Events from the public MakersLounge calendar on Luma (lu.ma/makerslounge).
 *
 * Luma publishes every calendar as an iCalendar feed with no key, so this reads
 * that instead of the paid API. The feed holds past and future events alike;
 * callers pick what they need with `summarizeEvents`.
 */

export const LUMA_CALENDAR_URL = "https://lu.ma/makerslounge";
const LUMA_ICS_URL = "https://api2.luma.com/ics/get?entity=calendar&id=cal-FGHayLJ6ZAmkYJi";

export interface LumaEvent {
  title: string;
  start: string; // ISO
  end: string | null; // ISO
  url: string;
  venue: string | null;
}

export interface LumaSummary {
  /** The soonest event that hasn't ended yet. */
  next: LumaEvent | null;
  /** The most recent event that has already ended. */
  latest: LumaEvent | null;
  /** Every event on the calendar, past and future. */
  total: number;
  /** ISO start of the earliest event, for "since 2025". */
  since: string | null;
}

// "20250922T213000Z" (UTC) or "20250922" (all-day)
function parseIcsDate(value: string): Date | null {
  const m = value.match(/^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})(Z)?)?$/);
  if (!m) return null;
  const [, y, mo, d, h = "0", mi = "0", s = "0"] = m;
  return new Date(Date.UTC(+y, +mo - 1, +d, +h, +mi, +s));
}

function unescapeIcs(value: string): string {
  return value.replace(/\\n/gi, "\n").replace(/\\([,;\\])/g, "$1").trim();
}

export function parseLumaIcs(ics: string): LumaEvent[] {
  // Long lines are folded onto continuation lines that start with a space.
  const unfolded = ics.replace(/\r?\n[ \t]/g, "");
  const events: LumaEvent[] = [];

  for (const block of unfolded.split("BEGIN:VEVENT").slice(1)) {
    const fields = new Map<string, string>();
    for (const line of block.split(/\r?\n/)) {
      const colon = line.indexOf(":");
      if (colon < 0) continue;
      const key = line.slice(0, colon).split(";")[0];
      if (!fields.has(key)) fields.set(key, line.slice(colon + 1));
    }

    const start = parseIcsDate(fields.get("DTSTART") ?? "");
    const title = unescapeIcs(fields.get("SUMMARY") ?? "");
    if (!start || !title) continue;

    const end = parseIcsDate(fields.get("DTEND") ?? "");
    const description = unescapeIcs(fields.get("DESCRIPTION") ?? "");
    const url = description.match(/https:\/\/(?:lu\.ma|luma\.com)\/[\w-]+/)?.[0] ?? LUMA_CALENDAR_URL;
    const location = unescapeIcs(fields.get("LOCATION") ?? "");

    events.push({
      title,
      start: start.toISOString(),
      end: end?.toISOString() ?? null,
      url,
      // "New Stadium, 83 Walnut Ave, Toronto…" → "New Stadium"; online events carry a URL instead.
      venue: location && !location.startsWith("http") ? location.split(",")[0].trim() : null,
    });
  }

  return events.sort((a, b) => a.start.localeCompare(b.start));
}

export function summarizeEvents(events: LumaEvent[], now = new Date()): LumaSummary {
  const t = now.toISOString();
  const hasEnded = (e: LumaEvent) => (e.end ?? e.start) < t;
  const past = events.filter(hasEnded);
  return {
    next: events.find((e) => !hasEnded(e)) ?? null,
    latest: past.at(-1) ?? null,
    total: events.length,
    since: events[0]?.start ?? null,
  };
}

export async function fetchLumaEvents(): Promise<LumaEvent[]> {
  const res = await fetch(LUMA_ICS_URL, { next: { revalidate: 3600 } });
  if (!res.ok) throw new Error(`Luma feed responded ${res.status}`);
  return parseLumaIcs(await res.text());
}
