/**
 * Saved meetup rosters, via `/api/meetups`.
 *
 * Owner-scoped by the route. The client's list query had no owner filter at all and
 * relied on RLS to narrow it, so the intent was invisible in the code.
 */

export interface SavedMeetupRow {
  id: string;
  name: string;
  participants: unknown;
  custom_field_names: unknown;
  created_at: string;
  updated_at: string;
}

export async function fetchMeetups(): Promise<SavedMeetupRow[]> {
  try {
    const res = await fetch("/api/meetups", { credentials: "include", cache: "no-store" });
    if (!res.ok) return [];
    const body = (await res.json()) as { data: SavedMeetupRow[] };
    return body.data ?? [];
  } catch (err) {
    console.error("[meetups] unreachable:", err);
    return [];
  }
}

async function write(
  method: "POST" | "PATCH",
  payload: Record<string, unknown>,
): Promise<SavedMeetupRow | null> {
  try {
    const res = await fetch("/api/meetups", {
      method,
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload),
    });
    if (!res.ok) return null;
    const body = (await res.json()) as { data: SavedMeetupRow };
    return body.data;
  } catch (err) {
    console.error("[meetups] write failed:", err);
    return null;
  }
}

export function createMeetup(input: {
  name: string;
  participants: unknown;
  customFieldNames: unknown;
}) {
  return write("POST", input);
}

export function updateMeetup(
  id: string,
  input: { name?: string; participants?: unknown; customFieldNames?: unknown },
) {
  return write("PATCH", { id, ...input });
}

export async function deleteMeetup(id: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/meetups?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
      credentials: "include",
    });
    return res.ok;
  } catch (err) {
    console.error("[meetups] delete failed:", err);
    return false;
  }
}
