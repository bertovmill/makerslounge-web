/**
 * Shared shape and normalisation for the private tags + note a member keeps about
 * another member. No database or fetch import, so both the API route and client
 * components can use it.
 */

export interface ProfileAnnotation {
  profile_id: string;
  tags: string[];
  note: string | null;
  updated_at: string;
}

export const MAX_TAGS = 20;
export const MAX_TAG_LENGTH = 32;
export const MAX_NOTE_LENGTH = 2000;

/**
 * Trim, collapse inner whitespace, drop empties, cap length, and de-duplicate
 * case-insensitively while keeping the first spelling. Tags keep their case so
 * "AI" stays "AI", but "ai" is treated as the same tag when filtering.
 */
export function normalizeTags(input: readonly string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of input) {
    const tag = raw.replace(/\s+/g, " ").trim().slice(0, MAX_TAG_LENGTH).trim();
    if (!tag) continue;
    const key = tag.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(tag);
    if (out.length >= MAX_TAGS) break;
  }
  return out;
}

/** Empty or whitespace-only notes are stored as null, not "". */
export function normalizeNote(input: string | null | undefined): string | null {
  const note = (input ?? "").trim();
  if (!note) return null;
  return note.slice(0, MAX_NOTE_LENGTH);
}

export function tagsMatch(a: string, b: string): boolean {
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

/** Every distinct tag across a set of annotations, most-used first, ties by name. */
export function collectTags(annotations: Iterable<Pick<ProfileAnnotation, "tags">>): string[] {
  const counts = new Map<string, { label: string; n: number }>();
  for (const a of annotations) {
    for (const tag of a.tags) {
      const key = tag.toLowerCase();
      const cur = counts.get(key);
      if (cur) cur.n += 1;
      else counts.set(key, { label: tag, n: 1 });
    }
  }
  return Array.from(counts.values())
    .sort((x, y) => y.n - x.n || x.label.localeCompare(y.label))
    .map((t) => t.label);
}
