-- Add separate first_name and last_name columns to profiles table
-- The existing 'name' column is kept for backwards compatibility

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS first_name TEXT,
ADD COLUMN IF NOT EXISTS last_name TEXT;

-- Optionally populate from existing name data
UPDATE profiles
SET
  first_name = split_part(name, ' ', 1),
  last_name = CASE
    WHEN position(' ' in name) > 0
    THEN substring(name from position(' ' in name) + 1)
    ELSE NULL
  END
WHERE name IS NOT NULL AND first_name IS NULL;
