/**
 * Display and calendar helpers for in-house events. Safe on client and server.
 *
 * Every time is rendered in the community's timezone rather than the viewer's,
 * so "Saturday 11:30" reads the same for someone checking from another city.
 */

export const EVENT_TIMEZONE = "America/Toronto";

/** The public shape of an event: what `/api/events` returns and pages render. */
export interface PublicEvent {
  id: string;
  slug: string | null;
  title: string;
  description: string | null;
  start_time: string;
  end_time: string;
  location: string | null;
  image_url: string | null;
  event_url: string | null;
  is_all_day: boolean | null;
  capacity: number | null;
  series_id: string | null;
  going: number;
}

function fmt(iso: string, options: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: EVENT_TIMEZONE, ...options }).format(new Date(iso));
}

/** "Saturday, November 7" */
export function formatEventDay(iso: string) {
  return fmt(iso, { weekday: "long", month: "long", day: "numeric" });
}

/** "Sat Nov 7" */
export function formatEventDayShort(iso: string) {
  return fmt(iso, { weekday: "short", month: "short", day: "numeric" }).replace(/\./g, "").replace(",", "");
}

/** "11:30 a.m. to 3:00 p.m." in en-CA, normalised to "11:30 AM to 3:00 PM". */
export function formatEventTimes(startIso: string, endIso: string) {
  const time = (iso: string) =>
    fmt(iso, { hour: "numeric", minute: "2-digit" }).replace(/a\.m\./i, "AM").replace(/p\.m\./i, "PM");
  return `${time(startIso)} to ${time(endIso)}`;
}

/** The URL path for an event. Falls back to the id for events made before slugs. */
export function eventPath(event: Pick<PublicEvent, "id" | "slug">) {
  return `/events/${event.slug ?? event.id}`;
}

/** "Saturdays at Waterworks!" -> "saturdays-at-waterworks" */
export function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

/** YYYY-MM-DD of an instant, in the community timezone. */
export function localDate(iso: string) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: EVENT_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(iso));
}

/** Slug for a one-off event: title plus its local date, e.g. "build-night-2026-11-12". */
export function eventSlug(title: string, startIso: string) {
  return `${slugify(title) || "event"}-${localDate(startIso)}`;
}

function icsStamp(iso: string) {
  return new Date(iso).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

/** Google Calendar "add event" link. */
export function googleCalendarUrl(event: PublicEvent, pageUrl: string) {
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.title,
    dates: `${icsStamp(event.start_time)}/${icsStamp(event.end_time)}`,
    details: `RSVP and details: ${pageUrl}`,
    location: event.location ?? "",
  });
  return `https://calendar.google.com/calendar/render?${params}`;
}

function icsEscape(text: string) {
  return text.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
}

/** A single-event .ics file, for Apple Calendar, Outlook and anything else. */
export function eventIcs(event: PublicEvent, pageUrl: string) {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//MakersLounge//Events//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${event.id}@makerslounge.ca`,
    `DTSTAMP:${icsStamp(new Date().toISOString())}`,
    `DTSTART:${icsStamp(event.start_time)}`,
    `DTEND:${icsStamp(event.end_time)}`,
    `SUMMARY:${icsEscape(event.title)}`,
    `DESCRIPTION:${icsEscape(`RSVP and details: ${pageUrl}`)}`,
    event.location ? `LOCATION:${icsEscape(event.location)}` : null,
    `URL:${pageUrl}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter(Boolean);
  return lines.join("\r\n") + "\r\n";
}
