-- Add additional social link columns to profiles table
-- linkedin, twitter, and website already exist

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS instagram TEXT,
ADD COLUMN IF NOT EXISTS youtube TEXT,
ADD COLUMN IF NOT EXISTS tiktok TEXT;
