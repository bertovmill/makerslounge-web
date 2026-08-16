-- Talks: recorded guest talks, gated behind an account.
--
-- The gate is why this is two tables instead of one. Everything a signed-out
-- visitor is allowed to see (title, speaker, description, thumbnail) lives in
-- `talks` and is world-readable. The things they must sign up for — the video
-- id and the transcript — live in `talk_content`, which only authenticated
-- users can read.
--
-- Splitting by table rather than by column is deliberate: Postgres RLS is
-- row-level, so a single table would need column GRANTs, and a client doing
-- `select("*")` as anon would then hard-error instead of simply seeing less.

CREATE TABLE talks (
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
  created_by UUID REFERENCES profiles(id)
);

-- The gated half. One row per talk. The transcript lives here rather than in
-- `talks` because it is the talk in text form — leaving it publicly readable
-- would hand over the content the video gate exists to protect.
CREATE TABLE talk_content (
  talk_id UUID REFERENCES talks(id) ON DELETE CASCADE PRIMARY KEY,
  provider TEXT NOT NULL DEFAULT 'youtube',
  video_id TEXT NOT NULL,
  transcript TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX talks_published_idx ON talks (is_published, published_at DESC);

ALTER TABLE talks ENABLE ROW LEVEL SECURITY;
ALTER TABLE talk_content ENABLE ROW LEVEL SECURITY;

-- Anyone may read published talk metadata — this is the public teaser.
CREATE POLICY "Anyone can read published talks"
  ON talks FOR SELECT
  USING (is_published = true);

CREATE POLICY "Admin full access to talks"
  ON talks FOR ALL
  USING (auth.jwt() ->> 'email' = 'bertmill19@gmail.com')
  WITH CHECK (auth.jwt() ->> 'email' = 'bertmill19@gmail.com');

-- The gate itself: signed-in users only, and only for published talks.
CREATE POLICY "Authenticated users can read content for published talks"
  ON talk_content FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM talks WHERE talks.id = talk_content.talk_id AND talks.is_published = true
  ));

CREATE POLICY "Admin full access to talk content"
  ON talk_content FOR ALL
  USING (auth.jwt() ->> 'email' = 'bertmill19@gmail.com')
  WITH CHECK (auth.jwt() ->> 'email' = 'bertmill19@gmail.com');
