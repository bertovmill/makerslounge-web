-- Fix: Allow either party to delete/remove a connection
-- Run this in your Supabase SQL Editor

-- Drop the old restrictive policy
DROP POLICY IF EXISTS "Users can cancel their sent requests" ON connections;

-- Create new policy that allows:
-- 1. Requester can cancel pending requests
-- 2. Either party can remove an accepted connection
CREATE POLICY "Users can delete their connections"
  ON connections FOR DELETE
  USING (
    -- Requester can cancel pending requests
    (auth.uid() = requester_id AND status = 'pending')
    OR
    -- Either party can remove accepted connections
    ((auth.uid() = requester_id OR auth.uid() = recipient_id) AND status = 'accepted')
  );
