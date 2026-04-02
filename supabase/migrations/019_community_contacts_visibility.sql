-- Add visibility and summary to community_contacts
ALTER TABLE community_contacts ADD COLUMN IF NOT EXISTS summary TEXT;
ALTER TABLE community_contacts ADD COLUMN IF NOT EXISTS visibility TEXT DEFAULT 'private' CHECK (visibility IN ('private', 'public'));

-- Allow public read access for public contacts
CREATE POLICY "public_read_visible" ON community_contacts FOR SELECT
  USING (visibility = 'public');
