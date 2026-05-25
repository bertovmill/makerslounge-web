ALTER TABLE hackathon_submissions
ADD COLUMN IF NOT EXISTS is_finalist boolean DEFAULT false;
