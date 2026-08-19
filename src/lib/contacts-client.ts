/**
 * Community contacts from the browser, via `/api/community-contacts`.
 *
 * Reads return everything for an admin and only `visibility = 'public'` contacts for
 * anyone else, which is what the two SELECT policies did. Writes are admin-only.
 */

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
  source: string[] | null;
  linkedin: string | null;
  twitter: string | null;
  instagram: string | null;
  website: string | null;
  visibility: string | null;
  matched_profile_id: string | null;
  matched_at: string | null;
  /**
   * jsonb. Read as a flat string map — that is what the CSV importers write, and the
   * admin table indexes into it by key.
   */
  metadata: Record<string, string> | null;
  created_at: string | null;
  updated_at: string | null;
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
