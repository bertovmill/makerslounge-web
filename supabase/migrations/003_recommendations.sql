-- Add recommendation columns to matcher_events table
ALTER TABLE matcher_events
ADD COLUMN IF NOT EXISTS last_query TEXT,
ADD COLUMN IF NOT EXISTS last_recommendations JSONB;

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_matcher_events_user_id ON matcher_events(user_id);
