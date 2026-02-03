-- Custom channels table for user-defined channels beyond the defaults
-- Run this in your Supabase SQL Editor

-- Create the broadcast_channels table
CREATE TABLE IF NOT EXISTS broadcast_channels (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  icon TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_broadcast_channels_user ON broadcast_channels(user_id);

-- Row Level Security
ALTER TABLE broadcast_channels ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own channels
CREATE POLICY "Users can view their own broadcast channels"
  ON broadcast_channels FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can create their own channels
CREATE POLICY "Users can create broadcast channels"
  ON broadcast_channels FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own channels
CREATE POLICY "Users can update their own broadcast channels"
  ON broadcast_channels FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own channels
CREATE POLICY "Users can delete their own broadcast channels"
  ON broadcast_channels FOR DELETE
  USING (auth.uid() = user_id);
