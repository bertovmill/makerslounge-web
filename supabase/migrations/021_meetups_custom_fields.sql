-- Add custom event field names to meetups
ALTER TABLE public.meetups ADD COLUMN IF NOT EXISTS custom_field_names jsonb DEFAULT '[]';
