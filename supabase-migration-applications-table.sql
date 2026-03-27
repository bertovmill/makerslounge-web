-- Applications table (no auth account needed)
CREATE TABLE applications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  what_are_you_building TEXT,
  help_with TEXT,
  skills TEXT[],
  looking_for_skills TEXT[],
  linkedin TEXT,
  other_socials JSONB,
  how_did_you_hear TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES profiles(id)
);

-- Index for admin queries
CREATE INDEX idx_applications_status ON applications(status);
CREATE INDEX idx_applications_email ON applications(email);

-- RLS
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

-- Anyone can insert (submit an application)
CREATE POLICY "Anyone can submit an application"
  ON applications FOR INSERT
  WITH CHECK (true);

-- Admin can read all applications
CREATE POLICY "Admin can read applications"
  ON applications FOR SELECT
  USING (auth.jwt() ->> 'email' = 'bertmill19@gmail.com');

-- Admin can update applications (approve/reject)
CREATE POLICY "Admin can update applications"
  ON applications FOR UPDATE
  USING (auth.jwt() ->> 'email' = 'bertmill19@gmail.com')
  WITH CHECK (auth.jwt() ->> 'email' = 'bertmill19@gmail.com');

-- Applicants can read their own application by email (for status check)
CREATE POLICY "Applicants can check their own status"
  ON applications FOR SELECT
  USING (email = current_setting('request.jwt.claims', true)::json ->> 'email');
