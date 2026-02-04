-- Add post_media_type column to broadcast_ideas for tracking planned media attachments
-- Run this in your Supabase SQL Editor

-- Add the column with a default of 'none'
ALTER TABLE broadcast_ideas
ADD COLUMN post_media_type TEXT DEFAULT 'none'
CHECK (post_media_type IN ('none', 'image', 'video', 'carousel'));

-- Add a comment for documentation
COMMENT ON COLUMN broadcast_ideas.post_media_type IS 'Type of media to include with the generated post: none, image, video, or carousel';
