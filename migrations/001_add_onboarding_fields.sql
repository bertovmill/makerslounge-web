-- Add onboarding fields to profiles table
-- Run this in your Supabase SQL Editor

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS currently_building TEXT,
ADD COLUMN IF NOT EXISTS looking_for_skills TEXT[],
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;

-- Update existing profiles to mark them as onboarded (they already have accounts)
UPDATE profiles SET onboarding_completed = TRUE WHERE onboarding_completed IS NULL;
