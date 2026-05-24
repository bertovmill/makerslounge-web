ALTER TABLE innovation_hackathon_signups
ADD COLUMN IF NOT EXISTS is_finalist boolean DEFAULT false;
