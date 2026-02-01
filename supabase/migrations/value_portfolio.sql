-- Value Portfolio Table Migration
-- Run this in your Supabase SQL Editor

-- Create value_portfolio table
CREATE TABLE value_portfolio (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  value_description TEXT,
  media_urls TEXT[] DEFAULT '{}',
  links JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups by user
CREATE INDEX idx_value_portfolio_user_id ON value_portfolio(user_id);

-- Enable Row Level Security
ALTER TABLE value_portfolio ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view portfolio items (public profiles)
CREATE POLICY "Public value_portfolio are viewable by everyone"
  ON value_portfolio FOR SELECT
  USING (true);

-- Policy: Users can insert their own portfolio items
CREATE POLICY "Users can insert own portfolio items"
  ON value_portfolio FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own portfolio items
CREATE POLICY "Users can update own portfolio items"
  ON value_portfolio FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: Users can delete their own portfolio items
CREATE POLICY "Users can delete own portfolio items"
  ON value_portfolio FOR DELETE
  USING (auth.uid() = user_id);
