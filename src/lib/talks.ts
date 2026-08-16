import type { SupabaseClient } from "@supabase/supabase-js";

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

// The gated half of a talk: everything a signed-out visitor must not see.
export interface TalkContent {
  talk_id: string;
  provider: string;
  video_id: string;
  transcript: string | null;
}

// Metadata only — safe to call for signed-out visitors, who see the teaser.
export async function fetchPublishedTalks(client: SupabaseClient): Promise<Talk[]> {
  const { data } = await client
    .from("talks")
    .select("*")
    .eq("is_published", true)
    .order("published_at", { ascending: false });

  return data ?? [];
}

export async function fetchTalkBySlug(
  client: SupabaseClient,
  slug: string
): Promise<Talk | null> {
  const { data } = await client
    .from("talks")
    .select("*")
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle();

  return data ?? null;
}

// Returns null for signed-out visitors: RLS on `talk_content` withholds the row
// rather than erroring, so the caller just renders the sign-up prompt instead.
export async function fetchTalkContent(
  client: SupabaseClient,
  talkId: string
): Promise<TalkContent | null> {
  const { data } = await client
    .from("talk_content")
    .select("talk_id, provider, video_id, transcript")
    .eq("talk_id", talkId)
    .maybeSingle();

  return data ?? null;
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
