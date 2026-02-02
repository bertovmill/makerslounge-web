-- Broadcast ideas table for content kanban board
-- Run this in your Supabase SQL Editor

-- Create the broadcast_ideas table
CREATE TABLE broadcast_ideas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  notes TEXT,
  media_urls TEXT[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'idea' CHECK (status IN ('idea', 'in_progress', 'published')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for fast lookups
CREATE INDEX idx_broadcast_ideas_user ON broadcast_ideas(user_id);
CREATE INDEX idx_broadcast_ideas_status ON broadcast_ideas(status);
CREATE INDEX idx_broadcast_ideas_created ON broadcast_ideas(created_at DESC);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_broadcast_ideas_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER broadcast_ideas_updated_at
  BEFORE UPDATE ON broadcast_ideas
  FOR EACH ROW
  EXECUTE FUNCTION update_broadcast_ideas_updated_at();

-- Row Level Security (RLS)
ALTER TABLE broadcast_ideas ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own ideas
CREATE POLICY "Users can view their own broadcast ideas"
  ON broadcast_ideas FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can create their own ideas
CREATE POLICY "Users can create broadcast ideas"
  ON broadcast_ideas FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own ideas
CREATE POLICY "Users can update their own broadcast ideas"
  ON broadcast_ideas FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own ideas
CREATE POLICY "Users can delete their own broadcast ideas"
  ON broadcast_ideas FOR DELETE
  USING (auth.uid() = user_id);
