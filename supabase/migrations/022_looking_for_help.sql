-- Add looking_for_help free-text field to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS looking_for_help TEXT;
