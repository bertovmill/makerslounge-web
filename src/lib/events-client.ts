/**
 * Site events, via `/api/events`.
 *
 * Reads are public; create, update and delete are admin-only, which is what the four
 * policies said. `created_by` is set by the route from the session.
 */

export interface EventRow {
  id: string;
  title: string;
  description: string | null;
  start_time: string;
  end_time: string;
  location: string | null;
  image_url: string | null;
  event_url: string | null;
  is_all_day: boolean | null;
  created_by: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export async function fetchEvents(id?: string): Promise<EventRow[]> {
  const qs = id ? `?id=${encodeURIComponent(id)}` : "";
  try {
    const res = await fetch(`/api/events${qs}`, { credentials: "include", cache: "no-store" });
    if (!res.ok) return [];
    const body = (await res.json()) as { data: EventRow[] };
    return body.data ?? [];
  } catch (err) {
    console.error("[events] unreachable:", err);
    return [];
  }
}

export async function fetchEvent(id: string): Promise<EventRow | null> {
  const rows = await fetchEvents(id);
  return rows[0] ?? null;
}

async function write(method: "POST" | "PATCH", payload: Record<string, unknown>) {
  try {
    const res = await fetch("/api/events", {
      method,
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload),
    });
    const body = (await res.json().catch(() => ({}))) as { error?: string; detail?: string };
    if (!res.ok) return { success: false, error: body.detail || body.error || "failed" };
    return { success: true };
  } catch (err) {
    console.error("[events] write failed:", err);
    return { success: false, error: "failed" };
  }
}

export function createEvent(input: Record<string, unknown>) {
  return write("POST", input);
}

export function updateEvent(id: string, input: Record<string, unknown>) {
  return write("PATCH", { id, ...input });
}

export async function deleteEvent(id: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/events?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
      credentials: "include",
    });
    return res.ok;
  } catch (err) {
    console.error("[events] delete failed:", err);
    return false;
  }
}
