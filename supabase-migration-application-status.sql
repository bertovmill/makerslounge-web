-- Add application status to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS application_status TEXT DEFAULT 'pending' CHECK (application_status IN ('pending', 'approved', 'rejected'));

-- Existing users are already approved
UPDATE profiles SET application_status = 'approved' WHERE application_status IS NULL OR application_status = 'pending';

-- New signups default to 'pending' (already handled by DEFAULT above)

-- Index for admin queries
CREATE INDEX IF NOT EXISTS idx_profiles_application_status ON profiles(application_status);

-- Admin can update application status
CREATE POLICY "Admin can update application status"
  ON profiles FOR UPDATE
  USING (auth.jwt() ->> 'email' = 'bertmill19@gmail.com')
  WITH CHECK (auth.jwt() ->> 'email' = 'bertmill19@gmail.com');
