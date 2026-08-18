/**
 * Profile reads and writes from the browser, via `/api/profiles`.
 *
 * These replace `supabase.from("profiles")` calls in client components. Neon is
 * only reachable from the server, so every one of them becomes a fetch to a route
 * that does its own authorization — see `src/app/api/profiles/`.
 *
 * The shape returned is the full public profile (`publicProfileColumns`), snake_cased,
 * which is what the components were already selecting piecemeal. Callers keep
 * reading the fields they care about.
 */

export interface PublicProfile {
  id: string;
  username: string | null;
  name: string | null;
  first_name: string | null;
  last_name: string | null;
  photo_url: string | null;
  cover_image: string | null;
  bio: string | null;
  skills: string[] | null;
  looking_for_skills: string[] | null;
  looking_for_help: string | null;
  currently_building: string | null;
  linkedin: string | null;
  twitter: string | null;
  instagram: string | null;
  youtube: string | null;
  tiktok: string | null;
  website: string | null;
  avatar_style: string | null;
  theme_config: unknown;
  whiteboard_data: unknown;
  show_whiteboard: boolean | null;
  has_completed_onboarding: boolean | null;
  application_status: string | null;
  linkedin_data: unknown;
  linkedin_data_updated_at: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface ProfileQuery {
  ids?: string[];
  username?: string;
  q?: string;
  skills?: string[];
  /** Only profiles that have a name, i.e. that finished onboarding. */
  named?: boolean;
  sort?: "created" | "name";
  limit?: number;
}

function toParams(query: ProfileQuery): string {
  const p = new URLSearchParams();
  if (query.ids?.length) p.set("ids", query.ids.join(","));
  if (query.username) p.set("username", query.username);
  if (query.q) p.set("q", query.q);
  if (query.skills?.length) p.set("skills", query.skills.join(","));
  if (query.named) p.set("named", "1");
  if (query.sort) p.set("sort", query.sort);
  if (query.limit) p.set("limit", String(query.limit));
  const s = p.toString();
  return s ? `?${s}` : "";
}

/** List or search profiles. Returns [] on failure rather than throwing. */
export async function fetchProfiles(query: ProfileQuery = {}): Promise<PublicProfile[]> {
  // An explicit empty id list means "nothing", not "everything" — don't call.
  if (query.ids && query.ids.length === 0) return [];

  try {
    const res = await fetch(`/api/profiles${toParams(query)}`, { cache: "no-store" });
    if (!res.ok) {
      console.error("[profiles] list failed:", res.status);
      return [];
    }
    const body = (await res.json()) as { data: PublicProfile[] };
    return body.data ?? [];
  } catch (err) {
    console.error("[profiles] list unreachable:", err);
    return [];
  }
}

export async function fetchProfile(id: string): Promise<PublicProfile | null> {
  try {
    const res = await fetch(`/api/profiles/${id}`, { cache: "no-store" });
    if (!res.ok) return null;
    const body = (await res.json()) as { data: PublicProfile };
    return body.data;
  } catch (err) {
    console.error("[profiles] fetch unreachable:", err);
    return null;
  }
}

export async function fetchProfileByUsername(username: string): Promise<PublicProfile | null> {
  const rows = await fetchProfiles({ username, limit: 1 });
  return rows[0] ?? null;
}

/** The signed-in member's own profile. */
export async function fetchMyProfile(): Promise<PublicProfile | null> {
  try {
    const res = await fetch("/api/profiles/me", {
      credentials: "include",
      cache: "no-store",
    });
    if (!res.ok) return null;
    const body = (await res.json()) as { data: PublicProfile };
    return body.data;
  } catch (err) {
    console.error("[profiles] me unreachable:", err);
    return null;
  }
}

export interface UpdateProfileResult {
  success: boolean;
  data?: PublicProfile;
  /** `username_taken` is worth showing the user; other codes are internal. */
  error?: string;
}

/**
 * Update the signed-in member's profile.
 *
 * Only the fields in the route's whitelist are applied; anything else in `updates`
 * is ignored rather than rejected, so callers can pass a whole profile object.
 */
export async function updateMyProfile(
  updates: Partial<Record<string, unknown>>,
): Promise<UpdateProfileResult> {
  try {
    const res = await fetch("/api/profiles/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(updates),
    });
    const body = (await res.json().catch(() => ({}))) as {
      data?: PublicProfile;
      error?: string;
      detail?: string;
    };
    if (!res.ok) return { success: false, error: body.detail || body.error || "update_failed" };
    return { success: true, data: body.data };
  } catch (err) {
    console.error("[profiles] update unreachable:", err);
    return { success: false, error: "update_failed" };
  }
}
