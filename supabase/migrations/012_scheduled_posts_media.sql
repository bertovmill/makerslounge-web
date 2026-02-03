-- Add media_urls column to scheduled_posts
ALTER TABLE scheduled_posts
ADD COLUMN IF NOT EXISTS media_urls TEXT[] DEFAULT '{}';
