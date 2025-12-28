-- Add theme_config column to profiles table
-- Run this in your Supabase SQL Editor

-- Add the column with a default value
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS theme_config JSONB DEFAULT '{"theme_id": "default"}'::jsonb;

-- Add a comment to document the column
COMMENT ON COLUMN profiles.theme_config IS 'User theme and customization preferences (theme_id, sections, custom_sections, custom_colors)';

-- Optional: Create an index for faster theme_id lookups
CREATE INDEX IF NOT EXISTS idx_profiles_theme_id ON profiles ((theme_config->>'theme_id'));

-- Verify the migration
SELECT
  column_name,
  data_type,
  column_default
FROM information_schema.columns
WHERE table_name = 'profiles'
  AND column_name = 'theme_config';
