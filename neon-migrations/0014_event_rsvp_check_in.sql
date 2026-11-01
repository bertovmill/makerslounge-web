-- Door check-in for in-house events, so they have real show-up counts like the
-- imported Luma history. Added 2026-11-01, before the first site event (Nov 7).
--
--   * `checked_in_at` is set when a host checks the guest in on
--     `/admin/events/<id>/guests`; NULL means they haven't arrived (yet).
--   * `walk_in` marks someone a host added at the door without an RSVP. Walk-ins
--     get no emails (no confirmation, no reminder), and their email is
--     optional, so `email` becomes nullable. The unique index on
--     event + lower(email) still holds for everyone who gave one.

ALTER TABLE makerslounge.event_rsvps
  ADD COLUMN checked_in_at timestamptz,
  ADD COLUMN walk_in       boolean NOT NULL DEFAULT false,
  ALTER COLUMN email DROP NOT NULL;
