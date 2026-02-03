-- Add accounts and channels support for broadcast ideas
-- Run this in your Supabase SQL Editor

-- Create the broadcast_accounts table (personal + business accounts)
CREATE TABLE broadcast_accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'personal' CHECK (type IN ('personal', 'business')),
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookups
CREATE INDEX idx_broadcast_accounts_user ON broadcast_accounts(user_id);

-- Add account_id and channels to broadcast_ideas
ALTER TABLE broadcast_ideas
ADD COLUMN account_id UUID REFERENCES broadcast_accounts(id) ON DELETE SET NULL,
ADD COLUMN channels TEXT[] DEFAULT '{}';

-- Index for filtering by account
CREATE INDEX idx_broadcast_ideas_account ON broadcast_ideas(account_id);

-- Row Level Security for broadcast_accounts
ALTER TABLE broadcast_accounts ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own accounts
CREATE POLICY "Users can view their own broadcast accounts"
  ON broadcast_accounts FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can create their own accounts
CREATE POLICY "Users can create broadcast accounts"
  ON broadcast_accounts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own accounts
CREATE POLICY "Users can update their own broadcast accounts"
  ON broadcast_accounts FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own accounts
CREATE POLICY "Users can delete their own broadcast accounts"
  ON broadcast_accounts FOR DELETE
  USING (auth.uid() = user_id);

-- Custom channels table (for user-defined channels beyond the defaults)
CREATE TABLE broadcast_channels (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  icon TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookups
CREATE INDEX idx_broadcast_channels_user ON broadcast_channels(user_id);

-- Row Level Security for broadcast_channels
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

-- Optional: Create a default personal account for each new user
-- You can run this separately to create accounts for existing users:
-- INSERT INTO broadcast_accounts (user_id, name, type)
-- SELECT id, COALESCE(raw_user_meta_data->>'full_name', email), 'personal'
-- FROM auth.users
-- WHERE id NOT IN (SELECT user_id FROM broadcast_accounts WHERE type = 'personal');
