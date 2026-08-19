import { and, desc, eq } from "drizzle-orm";
import { getSiteDb } from "@/db/site";
import { talkContent, talks } from "@/db/site/schema";

/**
 * Recorded guest talks, gated behind an account.
 *
 * Two tables, split along the line the gate draws: `talks` holds the public
 * teaser, `talk_content` holds the video id and transcript that signing up buys.
 *
 * The gate used to be RLS — `talk_content` was readable only by the
 * `authenticated` role, so a signed-out request silently came back empty and the
 * page rendered the signup prompt. Neon has no equivalent, so `fetchTalkContent`
 * now takes the caller's identity and refuses without one. That check is the gate;
 * there is no longer a second line of defence in the database behind it, which is
 * why it lives in this module rather than in each page.
 *
 * Both tables are new to the database: `supabase-migration-talks.sql` was written
 * but never applied, so `/talks` had been rendering "No talks yet" in production
 * the whole time. See neon-migrations/0001_talks.sql.
 */

export interface Talk {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  speaker_name: string | null;
  speaker_title: string | null;
  speaker_company: string | null;
  speaker_photo_url: string | null;
  thumbnail_url: string | null;
  duration_seconds: number | null;
  recorded_at: string | null;
  is_published: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

/** The gated half of a talk: everything a signed-out visitor must not see. */
export interface TalkContent {
  talk_id: string;
  provider: string;
  video_id: string;
  transcript: string | null;
}

// Snake-cased to match the shape the components already render.
const talkColumns = {
  id: talks.id,
  title: talks.title,
  slug: talks.slug,
  description: talks.description,
  speaker_name: talks.speakerName,
  speaker_title: talks.speakerTitle,
  speaker_company: talks.speakerCompany,
  speaker_photo_url: talks.speakerPhotoUrl,
  thumbnail_url: talks.thumbnailUrl,
  duration_seconds: talks.durationSeconds,
  recorded_at: talks.recordedAt,
  is_published: talks.isPublished,
  published_at: talks.publishedAt,
  created_at: talks.createdAt,
  updated_at: talks.updatedAt,
  created_by: talks.createdBy,
};

/** Metadata only — safe for signed-out visitors, who see the teaser. */
export async function fetchPublishedTalks(): Promise<Talk[]> {
  const rows = await getSiteDb()
    .select(talkColumns)
    .from(talks)
    .where(eq(talks.isPublished, true))
    .orderBy(desc(talks.publishedAt));

  return rows as Talk[];
}

export async function fetchTalkBySlug(slug: string): Promise<Talk | null> {
  const [row] = await getSiteDb()
    .select(talkColumns)
    .from(talks)
    .where(and(eq(talks.slug, slug), eq(talks.isPublished, true)))
    .limit(1);

  return (row as Talk) ?? null;
}

/**
 * The gate. Returns null for signed-out visitors so the caller renders the
 * signup prompt.
 *
 * `viewerId` is required rather than optional on purpose: an optional parameter
 * that defaults to "allowed" is exactly the mistake that leaks the video id, and
 * a missing argument should be a type error, not an open door. The published check
 * is kept too — an unpublished talk's content stays unreachable even for a
 * signed-in member, as the original policy specified.
 */
export async function fetchTalkContent(
  talkId: string,
  viewerId: string | null,
): Promise<TalkContent | null> {
  if (!viewerId) return null;

  const [row] = await getSiteDb()
    .select({
      talk_id: talkContent.talkId,
      provider: talkContent.provider,
      video_id: talkContent.videoId,
      transcript: talkContent.transcript,
    })
    .from(talkContent)
    .innerJoin(talks, eq(talks.id, talkContent.talkId))
    .where(and(eq(talkContent.talkId, talkId), eq(talks.isPublished, true)))
    .limit(1);

  return row ?? null;
}

export function formatTalkDuration(seconds: number | null): string | null {
  if (!seconds) return null;
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.round((seconds % 3600) / 60);
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes} min`;
}

// "Ada Lovelace, VP Engineering at Vercel" — skipping whichever parts are unset.
export function formatSpeaker(talk: Talk): string | null {
  if (!talk.speaker_name) return null;
  const role = [talk.speaker_title, talk.speaker_company].filter(Boolean).join(" at ");
  return role ? `${talk.speaker_name}, ${role}` : talk.speaker_name;
}
