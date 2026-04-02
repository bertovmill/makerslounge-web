-- Community contacts: shadow profiles for event attendees
-- Run this SQL in Supabase dashboard

CREATE TABLE IF NOT EXISTS community_contacts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  name TEXT,
  first_name TEXT,
  last_name TEXT,
  notes TEXT,
  skills TEXT[],
  company TEXT,
  role TEXT,
  source TEXT,                    -- e.g. "Maker Mondays #12"
  linkedin TEXT,
  twitter TEXT,
  instagram TEXT,
  website TEXT,
  matched_profile_id UUID REFERENCES profiles(id),
  matched_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX community_contacts_email_idx ON community_contacts(email);
CREATE INDEX community_contacts_matched_profile_id_idx ON community_contacts(matched_profile_id);

ALTER TABLE community_contacts ENABLE ROW LEVEL SECURITY;

-- Only admin can access
CREATE POLICY "admin_select" ON community_contacts FOR SELECT
  USING (auth.jwt() ->> 'email' = 'bertmill19@gmail.com');
CREATE POLICY "admin_insert" ON community_contacts FOR INSERT
  WITH CHECK (auth.jwt() ->> 'email' = 'bertmill19@gmail.com');
CREATE POLICY "admin_update" ON community_contacts FOR UPDATE
  USING (auth.jwt() ->> 'email' = 'bertmill19@gmail.com');
CREATE POLICY "admin_delete" ON community_contacts FOR DELETE
  USING (auth.jwt() ->> 'email' = 'bertmill19@gmail.com');

-- Auto-match function (SECURITY DEFINER bypasses RLS)
CREATE OR REPLACE FUNCTION match_community_contact(p_user_id UUID, p_user_email TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE community_contacts
  SET matched_profile_id = p_user_id, matched_at = NOW()
  WHERE LOWER(email) = LOWER(p_user_email) AND matched_profile_id IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
