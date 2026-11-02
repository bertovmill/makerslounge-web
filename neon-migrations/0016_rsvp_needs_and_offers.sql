-- RSVPs ask three questions instead of one, asked for on 2026-11-01 to gather
-- more about who is coming:
--
--   1. What are you building?            (`building`, already there, required)
--   2. What do you need help with now?   (`needs_help`, optional)
--   3. What could you help others with?  (`can_help`, optional)
--
-- 2 and 3 mirror the `needs_help_with` / `can_help_with` fields in a contact's
-- structured intel, which is what the matcher pairs people on. Optional so the
-- form stays quick and older RSVPs stay valid.

ALTER TABLE makerslounge.event_rsvps
  ADD COLUMN needs_help text CHECK (needs_help IS NULL OR char_length(needs_help) <= 280),
  ADD COLUMN can_help   text CHECK (can_help IS NULL OR char_length(can_help) <= 280);
