-- Make email and name nullable in matcher_contacts table
-- This allows importing contacts with any combination of fields

-- First, drop the unique constraint on (user_id, email)
ALTER TABLE matcher_contacts DROP CONSTRAINT IF EXISTS matcher_contacts_user_id_email_key;

-- Make email nullable
ALTER TABLE matcher_contacts ALTER COLUMN email DROP NOT NULL;

-- Make name nullable
ALTER TABLE matcher_contacts ALTER COLUMN name DROP NOT NULL;

-- Add a partial unique index - only enforce uniqueness when email is present
CREATE UNIQUE INDEX matcher_contacts_user_email_unique
ON matcher_contacts (user_id, email)
WHERE email IS NOT NULL;

-- Update any existing NULL emails to have unique placeholder values if needed
-- (This is just a safety measure in case there are any NULLs)
