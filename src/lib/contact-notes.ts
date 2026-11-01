/**
 * Conversation notes on a community contact, table `makerslounge.contact_notes`,
 * shown as the timeline on `/admin/contacts/<id>`.
 *
 * Shared by the API routes and the page: the wire shape, input validation and
 * the newest-first order, so the page re-sorts after an add exactly as the
 * server would.
 */

export type ContactNote = {
  id: string;
  contact_id: string;
  /** `YYYY-MM-DD`, the day of the conversation, with no time or zone. */
  happened_on: string;
  /** Where it happened, as typed: "LinkedIn", "Coffee", "Call", an event name. */
  channel: string | null;
  body: string;
  created_at: string;
  updated_at: string;
};

export type ContactNoteInput = {
  happened_on?: string;
  channel?: string | null;
  body?: string;
};

/** Quick picks in the Add note dialog. `channel` stays free text. */
export const NOTE_CHANNELS = ["Event", "LinkedIn", "Coffee", "Call", "Email"] as const;

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Validate a create or update body. Only keys present in `body` come back, so a
 * PATCH that sends `{ channel: "Call" }` touches nothing else. Throws with a
 * message the caller can show.
 */
export function parseNoteInput(body: unknown, { requireBody }: { requireBody: boolean }): ContactNoteInput {
  if (!body || typeof body !== "object") throw new Error("body must be an object");
  const raw = body as Record<string, unknown>;
  const out: ContactNoteInput = {};

  if ("body" in raw || requireBody) {
    const text = typeof raw.body === "string" ? raw.body.trim() : "";
    if (!text) throw new Error("body is required");
    if (text.length > 10000) throw new Error("body is longer than 10000 characters");
    out.body = text;
  }
  if ("channel" in raw) {
    const c = raw.channel;
    if (c === null || c === undefined) out.channel = null;
    else if (typeof c !== "string") throw new Error("channel must be a string");
    else if (c.trim().length > 100) throw new Error("channel is longer than 100 characters");
    else out.channel = c.trim() || null;
  }
  if ("happened_on" in raw && raw.happened_on !== undefined && raw.happened_on !== null && raw.happened_on !== "") {
    const d = raw.happened_on;
    if (typeof d !== "string" || !DATE_RE.test(d) || Number.isNaN(Date.parse(d))) {
      throw new Error("happened_on must be YYYY-MM-DD");
    }
    out.happened_on = d;
  }
  return out;
}

/** Newest conversation first; same day, the one written last first. */
export function compareNotes(a: ContactNote, b: ContactNote): number {
  if (a.happened_on !== b.happened_on) return a.happened_on < b.happened_on ? 1 : -1;
  return a.created_at < b.created_at ? 1 : a.created_at > b.created_at ? -1 : 0;
}

/** Today in Toronto as `YYYY-MM-DD`, the default date for a new note. */
export function todayInToronto(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Toronto" }).format(new Date());
}
