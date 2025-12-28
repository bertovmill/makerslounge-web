-- Create email_subscriptions table for newsletter signups
-- Run this in your Supabase SQL Editor

-- Create the table
CREATE TABLE IF NOT EXISTS email_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  subscribed_to TEXT[] DEFAULT ARRAY['events', 'podcasts']::TEXT[],
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add indexes for common queries
CREATE INDEX IF NOT EXISTS idx_email_subscriptions_email ON email_subscriptions(email);
CREATE INDEX IF NOT EXISTS idx_email_subscriptions_is_active ON email_subscriptions(is_active);
CREATE INDEX IF NOT EXISTS idx_email_subscriptions_created_at ON email_subscriptions(created_at DESC);

-- Add comments
COMMENT ON TABLE email_subscriptions IS 'Email subscriptions for events and podcast updates';
COMMENT ON COLUMN email_subscriptions.email IS 'Subscriber email address';
COMMENT ON COLUMN email_subscriptions.subscribed_to IS 'Array of subscription types (events, podcasts, etc.)';
COMMENT ON COLUMN email_subscriptions.is_active IS 'Whether the subscription is currently active';

-- Enable Row Level Security
ALTER TABLE email_subscriptions ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Allow anyone to insert (subscribe)
CREATE POLICY "Anyone can subscribe" ON email_subscriptions
  FOR INSERT
  WITH CHECK (true);

-- Allow anyone to read their own subscription by email
CREATE POLICY "Anyone can read subscriptions" ON email_subscriptions
  FOR SELECT
  USING (true);

-- Only allow updates to set is_active to false (unsubscribe)
CREATE POLICY "Anyone can unsubscribe" ON email_subscriptions
  FOR UPDATE
  USING (true)
  WITH CHECK (is_active = false OR is_active = true);

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_email_subscription_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to automatically update updated_at
CREATE TRIGGER update_email_subscription_timestamp
  BEFORE UPDATE ON email_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_email_subscription_updated_at();

-- Verify the migration
SELECT
  table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'email_subscriptions'
ORDER BY ordinal_position;
