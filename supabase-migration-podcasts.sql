-- Podcasts table
CREATE TABLE podcasts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  transcript TEXT,
  audio_url TEXT,
  cover_image_url TEXT,
  duration_seconds INTEGER,
  episode_number INTEGER,
  is_published BOOLEAN DEFAULT false,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES profiles(id)
);

-- Podcast guests junction table
CREATE TABLE podcast_guests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  podcast_id UUID REFERENCES podcasts(id) ON DELETE CASCADE NOT NULL,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  UNIQUE(podcast_id, profile_id)
);

-- RLS
ALTER TABLE podcasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE podcast_guests ENABLE ROW LEVEL SECURITY;

-- Public can read published podcasts
CREATE POLICY "Anyone can read published podcasts"
  ON podcasts FOR SELECT
  USING (is_published = true);

-- Admin can do everything with podcasts
CREATE POLICY "Admin full access to podcasts"
  ON podcasts FOR ALL
  USING (auth.jwt() ->> 'email' = 'bertmill19@gmail.com')
  WITH CHECK (auth.jwt() ->> 'email' = 'bertmill19@gmail.com');

-- Public can read podcast guests for published podcasts
CREATE POLICY "Anyone can read podcast guests"
  ON podcast_guests FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM podcasts WHERE podcasts.id = podcast_guests.podcast_id AND podcasts.is_published = true
  ));

-- Admin can manage podcast guests
CREATE POLICY "Admin full access to podcast guests"
  ON podcast_guests FOR ALL
  USING (auth.jwt() ->> 'email' = 'bertmill19@gmail.com')
  WITH CHECK (auth.jwt() ->> 'email' = 'bertmill19@gmail.com');

-- Create podcasts storage bucket (run this in Supabase dashboard or via API)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('podcasts', 'podcasts', true);
