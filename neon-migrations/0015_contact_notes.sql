-- Notes from Berto's conversations with community members, one row per
-- conversation, shown as a timeline on `/admin/contacts/<id>`. Asked for on
-- 2026-11-01: "I need to start taking notes on my conversations with people."
--
--   * A table rather than `community_contacts.notes`: that column is one blob
--     (pasted LinkedIn profiles, form answers, a few hand-dated logs), with no
--     date or place to sort or filter on. It stays as the contact's "About".
--   * `happened_on` is a calendar date, not a timestamp: the note is written
--     after the coffee, and the day is what matters.
--   * `channel` is where it happened, as typed: "LinkedIn", "Coffee", "Call",
--     or an event name ("Maker Mondays #12"). Free text, so events need no list.
--   * `created_by` is the admin's profile; Cael writes as Berto's profile too.

CREATE TABLE makerslounge.contact_notes (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id  uuid NOT NULL REFERENCES makerslounge.community_contacts (id) ON DELETE CASCADE,
  happened_on date NOT NULL DEFAULT (now() AT TIME ZONE 'America/Toronto')::date,
  channel     text CHECK (channel IS NULL OR char_length(channel) <= 100),
  body        text NOT NULL CHECK (char_length(body) BETWEEN 1 AND 10000),
  created_by  uuid REFERENCES makerslounge.profiles (id) ON DELETE SET NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX contact_notes_contact_idx
  ON makerslounge.contact_notes (contact_id, happened_on DESC, created_at DESC);
