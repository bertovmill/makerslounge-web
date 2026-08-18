-- Talks: recorded guest talks, gated behind an account.
--
-- Ported from the repo-root `supabase-migration-talks.sql`, which was WRITTEN BUT
-- NEVER APPLIED. Neither `talks` nor `talk_content` existed in the Supabase
-- database, so `/talks` has been quietly rendering "No talks yet. Stay tuned."
-- in production: `fetchPublishedTalks` discarded the PostgREST error and returned
-- an empty array. Applying migrations to Supabase needed a human in the SQL
-- editor, and this one never got run.
--
-- The gate is why this is two tables instead of one. Everything a signed-out
-- visitor is allowed to see (title, speaker, description, thumbnail) lives in
-- `talks`. The things they must sign up for — the video id and the transcript —
-- live in `talk_content`.
--
-- The original relied on RLS for the gate: `talk_content` was readable only by
-- the `authenticated` role, so a signed-out request got an empty row rather than
-- an error, and the page rendered the signup prompt. Neon has no JWT-aware policy
-- layer, so that check now lives in `src/lib/talks.ts` and its callers, which
-- refuse to fetch content without a session. The four policies are therefore
-- dropped here, not translated -- a policy left in SQL would never be enforced.

CREATE TABLE IF NOT EXISTS makerslounge.talks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,

  -- Speaker is denormalised on purpose: guests are usually not Makerslounge
  -- members, so there's no profile row to join to.
  speaker_name TEXT,
  speaker_title TEXT,
  speaker_company TEXT,
  speaker_photo_url TEXT,

  thumbnail_url TEXT,
  duration_seconds INTEGER,
  recorded_at TIMESTAMPTZ,

  is_published BOOLEAN DEFAULT false,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES makerslounge.profiles(id)
);

-- The gated half. One row per talk. The transcript lives here rather than in
-- `talks` because it is the talk in text form — leaving it publicly readable
-- would hand over the content the video gate exists to protect.
CREATE TABLE IF NOT EXISTS makerslounge.talk_content (
  talk_id UUID REFERENCES makerslounge.talks(id) ON DELETE CASCADE PRIMARY KEY,
  provider TEXT NOT NULL DEFAULT 'youtube',
  video_id TEXT NOT NULL,
  transcript TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS talks_published_idx
  ON makerslounge.talks (is_published, published_at DESC);
