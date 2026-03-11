-- Message usage tracking
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS messages_used integer DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS message_limit_reset_at timestamptz;
