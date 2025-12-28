-- Add whiteboard support to profiles
-- Run this migration in your Supabase SQL editor

-- Add whiteboard_data column to store tldraw document
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS whiteboard_data JSONB DEFAULT NULL;

-- Add show_whiteboard column to control visibility
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS show_whiteboard BOOLEAN DEFAULT false;

-- Add comment for documentation
COMMENT ON COLUMN profiles.whiteboard_data IS 'Stores tldraw whiteboard document data as JSON';
COMMENT ON COLUMN profiles.show_whiteboard IS 'Controls whether whiteboard is visible on public profile';
