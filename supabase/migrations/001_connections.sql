-- Connections table for user connection requests
-- Run this in your Supabase SQL Editor

-- Create the connections table
CREATE TABLE connections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  requester_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Prevent duplicate requests (A->B and B->A should both be prevented if one exists)
  UNIQUE(requester_id, recipient_id),

  -- Prevent self-connections
  CHECK (requester_id != recipient_id)
);

-- Index for fast lookups
CREATE INDEX idx_connections_requester ON connections(requester_id);
CREATE INDEX idx_connections_recipient ON connections(recipient_id);
CREATE INDEX idx_connections_status ON connections(status);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_connections_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER connections_updated_at
  BEFORE UPDATE ON connections
  FOR EACH ROW
  EXECUTE FUNCTION update_connections_updated_at();

-- Row Level Security (RLS)
ALTER TABLE connections ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view connections they're involved in
CREATE POLICY "Users can view their own connections"
  ON connections FOR SELECT
  USING (
    auth.uid() = requester_id OR
    auth.uid() = recipient_id
  );

-- Policy: Users can send connection requests (insert)
CREATE POLICY "Users can send connection requests"
  ON connections FOR INSERT
  WITH CHECK (auth.uid() = requester_id);

-- Policy: Users can update connections they received (accept/decline)
CREATE POLICY "Recipients can respond to requests"
  ON connections FOR UPDATE
  USING (auth.uid() = recipient_id)
  WITH CHECK (auth.uid() = recipient_id);

-- Policy: Users can delete/cancel their own requests
CREATE POLICY "Users can cancel their sent requests"
  ON connections FOR DELETE
  USING (auth.uid() = requester_id AND status = 'pending');

-- Optional: View to get connection counts for profiles
CREATE OR REPLACE VIEW connection_counts AS
SELECT
  p.id as profile_id,
  COUNT(DISTINCT CASE
    WHEN c.status = 'accepted' AND (c.requester_id = p.id OR c.recipient_id = p.id)
    THEN CASE WHEN c.requester_id = p.id THEN c.recipient_id ELSE c.requester_id END
  END) as connection_count
FROM profiles p
LEFT JOIN connections c ON c.requester_id = p.id OR c.recipient_id = p.id
GROUP BY p.id;
