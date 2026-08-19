/**
 * Private notes about another member, via `/api/profile-notes`.
 *
 * Scoped to the caller's own notes by the route — the underlying policies key on
 * `created_by`, not on whose profile the note is about.
 */

export interface ProfileEventNote {
  id: string;
  profile_id: string;
  meetup_id: string | null;
  meetup_name: string;
  notes: string | null;
  created_at: string;
}

export async function fetchProfileNotes(profileId?: string): Promise<ProfileEventNote[]> {
  const qs = profileId ? `?profileId=${encodeURIComponent(profileId)}` : "";
  try {
    const res = await fetch(`/api/profile-notes${qs}`, {
      credentials: "include",
      cache: "no-store",
    });
    if (!res.ok) return [];
    const body = (await res.json()) as { data: ProfileEventNote[] };
    return body.data ?? [];
  } catch (err) {
    console.error("[profile-notes] unreachable:", err);
    return [];
  }
}

export async function createProfileNote(input: {
  profileId: string;
  meetupId?: string | null;
  meetupName: string;
  notes?: string | null;
}): Promise<boolean> {
  try {
    const res = await fetch("/api/profile-notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(input),
    });
    return res.ok;
  } catch (err) {
    console.error("[profile-notes] create failed:", err);
    return false;
  }
}

/**
 * Upsert a batch of notes, keyed on (profile_id, meetup_id).
 *
 * Used by the meetup matcher to save a note per registered participant. `created_by`
 * is the session's, so a note cannot be filed under another member's name.
 */
export async function syncProfileNotes(
  rows: { profileId: string; meetupId: string | null; meetupName: string; notes?: string | null }[],
): Promise<boolean> {
  if (rows.length === 0) return true;
  try {
    const res = await fetch("/api/profile-notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(rows),
    });
    return res.ok;
  } catch (err) {
    console.error("[profile-notes] sync failed:", err);
    return false;
  }
}
