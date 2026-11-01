/**
 * Community contacts from the browser, via `/api/community-contacts`.
 *
 * Reads return everything for an admin and only `visibility = 'public'` contacts for
 * anyone else, which is what the two SELECT policies did. Writes are admin-only.
 */

import type { ContactNote, ContactNoteInput } from "@/lib/contact-notes";

export interface CommunityContact {
  id: string;
  name: string | null;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  summary: string | null;
  notes: string | null;
  skills: string[] | null;
  company: string | null;
  role: string | null;
  location: string | null;
  source: string[] | null;
  linkedin: string | null;
  twitter: string | null;
  instagram: string | null;
  website: string | null;
  visibility: string | null;
  matched_profile_id: string | null;
  matched_at: string | null;
  /**
   * jsonb. Mostly a flat string map (the CSV importers' extra columns), plus one
   * object under `intel` from the Luma import (`ContactIntel`). Check a value is a
   * string before rendering it.
   */
  metadata: (Record<string, unknown> & { intel?: ContactIntel }) | null;
  created_at: string | null;
  updated_at: string | null;
  /** Luma event history. Only on a single-contact read by an admin. */
  events?: ContactEvent[];
}

/** What `scripts/import-luma-guests.mts` and `structure-people-intel.mts` write. */
export interface ContactIntel {
  phase?: string;
  industry?: string;
  city?: string;
  country?: string;
  how_heard?: string[];
  last_event_at?: string;
  structured?: {
    summary: string;
    roles: string[];
    skills: string[];
    can_help_with: string[];
    needs_help_with: string[];
    projects: { name: string; description: string; url: string | null; stage: string | null }[];
    domains: string[];
    tools: string[];
    model: string;
    structured_at: string;
  };
}

export interface ContactEvent {
  name: string;
  starts_at: string | null;
  luma_url: string;
  status: "approved" | "invited" | "waitlist" | "pending_approval" | "declined" | string;
  registered_at: string | null;
  checked_in_at: string | null;
  answers: Record<string, string>;
}

export async function fetchContacts(
  opts: { id?: string; q?: string } = {},
): Promise<CommunityContact[]> {
  const params = new URLSearchParams();
  if (opts.id) params.set("id", opts.id);
  if (opts.q) params.set("q", opts.q);
  const qs = params.toString();

  try {
    const res = await fetch(`/api/community-contacts${qs ? `?${qs}` : ""}`, {
      credentials: "include",
      cache: "no-store",
    });
    if (!res.ok) return [];
    const body = (await res.json()) as { data: CommunityContact[] };
    return body.data ?? [];
  } catch (err) {
    console.error("[contacts] unreachable:", err);
    return [];
  }
}

export async function fetchContact(id: string): Promise<CommunityContact | null> {
  const rows = await fetchContacts({ id });
  return rows[0] ?? null;
}

export interface ContactMutationResult {
  success: boolean;
  data?: CommunityContact;
  error?: string;
}

async function mutate(
  method: "POST" | "PATCH",
  payload: Record<string, unknown>,
): Promise<ContactMutationResult> {
  try {
    const res = await fetch("/api/community-contacts", {
      method,
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload),
    });
    const body = (await res.json().catch(() => ({}))) as {
      data?: CommunityContact;
      error?: string;
      detail?: string;
    };
    if (!res.ok) return { success: false, error: body.detail || body.error || "failed" };
    return { success: true, data: body.data };
  } catch (err) {
    console.error("[contacts] mutation failed:", err);
    return { success: false, error: "failed" };
  }
}

export function createContact(input: Record<string, unknown>) {
  return mutate("POST", input);
}

export function updateContact(id: string, updates: Record<string, unknown>) {
  return mutate("PATCH", { id, ...updates });
}

export async function deleteContact(id: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/community-contacts?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
      credentials: "include",
    });
    return res.ok;
  } catch (err) {
    console.error("[contacts] delete failed:", err);
    return false;
  }
}

/** Delete several contacts at once. */
export async function deleteContacts(ids: string[]): Promise<boolean> {
  if (ids.length === 0) return true;
  try {
    const res = await fetch(`/api/community-contacts?ids=${ids.map(encodeURIComponent).join(",")}`, {
      method: "DELETE",
      credentials: "include",
    });
    return res.ok;
  } catch (err) {
    console.error("[contacts] bulk delete failed:", err);
    return false;
  }
}

/**
 * Bulk-import contacts, upserting on email.
 *
 * The route unions `source` arrays rather than replacing them, and preserves any
 * column the import doesn't carry — so re-importing a partial list cannot blank out
 * phone numbers or employers already on file.
 */
export async function importContacts(
  rows: Record<string, unknown>[],
): Promise<{ success: boolean; upserted?: number; error?: string }> {
  try {
    const res = await fetch("/api/community-contacts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(rows),
    });
    const body = (await res.json().catch(() => ({}))) as {
      upserted?: number;
      error?: string;
      detail?: string;
    };
    if (!res.ok) return { success: false, error: body.detail || body.error || "import_failed" };
    return { success: true, upserted: body.upserted };
  } catch (err) {
    console.error("[contacts] import failed:", err);
    return { success: false, error: "import_failed" };
  }
}

/**
 * Conversation notes on one contact, via `/api/admin/contacts/<id>/notes`
 * (admin-only). Types and validation live in `@/lib/contact-notes`.
 */
export async function fetchContactNotes(contactId: string): Promise<ContactNote[]> {
  try {
    const res = await fetch(`/api/admin/contacts/${encodeURIComponent(contactId)}/notes`, {
      credentials: "include",
      cache: "no-store",
    });
    if (!res.ok) return [];
    const body = (await res.json()) as { data: ContactNote[] };
    return body.data ?? [];
  } catch (err) {
    console.error("[contacts] notes unreachable:", err);
    return [];
  }
}

/** Add a note (no `noteId`), edit one (`noteId` + fields), or delete one (`noteId`, `null`). */
export async function saveContactNote(
  contactId: string,
  noteId: string | null,
  input: ContactNoteInput | null,
): Promise<{ success: boolean; data?: ContactNote; error?: string }> {
  const base = `/api/admin/contacts/${encodeURIComponent(contactId)}/notes`;
  try {
    const res = await fetch(noteId ? `${base}/${encodeURIComponent(noteId)}` : base, {
      method: !noteId ? "POST" : input ? "PATCH" : "DELETE",
      headers: input ? { "Content-Type": "application/json" } : undefined,
      credentials: "include",
      body: input ? JSON.stringify(input) : undefined,
    });
    const body = (await res.json().catch(() => ({}))) as { data?: ContactNote; error?: string; detail?: string };
    if (!res.ok) return { success: false, error: body.detail || body.error || "failed" };
    return { success: true, data: body.data };
  } catch (err) {
    console.error("[contacts] note save failed:", err);
    return { success: false, error: "failed" };
  }
}
