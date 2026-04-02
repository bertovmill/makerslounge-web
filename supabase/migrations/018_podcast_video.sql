-- Add video support to podcasts
ALTER TABLE podcasts ADD COLUMN IF NOT EXISTS video_url TEXT;
