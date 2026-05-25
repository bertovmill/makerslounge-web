-- Add round 2 flag to hackathon submissions
ALTER TABLE hackathon_submissions
  ADD COLUMN IF NOT EXISTS is_round2 boolean NOT NULL DEFAULT false;
