-- Add is_all_day column to events table
ALTER TABLE events ADD COLUMN IF NOT EXISTS is_all_day BOOLEAN DEFAULT FALSE;
