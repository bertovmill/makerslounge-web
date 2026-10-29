-- Two changes to in-house events, both asked for on 2026-10-29.
--
-- 1. RSVPs say what the guest is building. Intros at a meetup group people by
--    it, so the host needs it before the day. Optional at the database level
--    so RSVPs taken before this column existed stay valid; the form and API
--    require it for new ones.
--
-- 2. Each weekly occurrence carries its date in its title
--    ("MakersLounge Saturday · Nov 7"), so the Events list and inboxes don't
--    show seven identical names. New occurrences get it from the top-up in
--    src/lib/events/server.ts; this backfills the ones already created.

ALTER TABLE makerslounge.event_rsvps
  ADD COLUMN building text CHECK (building IS NULL OR char_length(building) <= 280);

UPDATE makerslounge.event_series
SET title = 'MakersLounge Saturday'
WHERE slug = 'makerslounge-saturdays';

UPDATE makerslounge.events e
SET title = s.title || ' · ' || to_char(e.start_time AT TIME ZONE s.timezone, 'Mon FMDD'),
    updated_at = now()
FROM makerslounge.event_series s
WHERE e.series_id = s.id;
