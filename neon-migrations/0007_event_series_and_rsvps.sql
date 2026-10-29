-- In-house events, so Makerslounge no longer needs Luma for its own meetups.
--
-- `events` already held one-off events (title, times, location). This adds:
--
--   * `events.slug`, the readable URL at /events/<slug>.
--   * `event_series`, a weekly rule ("every Saturday 11:30 to 3 at Waterworks").
--     Each occurrence is materialised as a normal `events` row, so RSVPs, the
--     guest list and the event page treat a series date like any other event.
--     `src/lib/events/series.ts` tops occurrences up to `weeks_ahead` on read.
--   * `event_rsvps`, one row per guest per event. Name and email only, no
--     account needed. Emails are admin-only: the public API returns counts.
--
-- Times are stored as local wall-clock times plus a timezone, and converted per
-- date with `AT TIME ZONE`, so a Saturday stays 11:30 across a DST change.

CREATE TABLE makerslounge.event_series (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        text NOT NULL UNIQUE,
  title       text NOT NULL,
  description text,
  location    text,
  -- 0 = Sunday ... 6 = Saturday, matching Postgres `extract(dow ...)`.
  weekday     smallint NOT NULL CHECK (weekday BETWEEN 0 AND 6),
  start_local time NOT NULL,
  end_local   time NOT NULL,
  timezone    text NOT NULL DEFAULT 'America/Toronto',
  starts_on   date NOT NULL,
  ends_on     date,
  capacity    integer CHECK (capacity IS NULL OR capacity > 0),
  weeks_ahead smallint NOT NULL DEFAULT 8 CHECK (weeks_ahead BETWEEN 1 AND 52),
  created_by  uuid REFERENCES makerslounge.profiles(id),
  created_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT event_series_times_ordered CHECK (end_local > start_local)
);

ALTER TABLE makerslounge.events
  ADD COLUMN slug      text UNIQUE,
  ADD COLUMN series_id uuid REFERENCES makerslounge.event_series(id) ON DELETE SET NULL,
  ADD COLUMN capacity  integer CHECK (capacity IS NULL OR capacity > 0);

-- One occurrence per series per start time, so a top-up can't double-insert.
CREATE UNIQUE INDEX events_series_start_idx
  ON makerslounge.events (series_id, start_time)
  WHERE series_id IS NOT NULL;

CREATE TABLE makerslounge.event_rsvps (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id   uuid NOT NULL REFERENCES makerslounge.events(id) ON DELETE CASCADE,
  name       text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 120),
  email      text NOT NULL CHECK (char_length(email) BETWEEN 3 AND 254),
  profile_id uuid REFERENCES makerslounge.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- One RSVP per email per event; a repeat RSVP is a no-op, not a second seat.
CREATE UNIQUE INDEX event_rsvps_event_email_idx
  ON makerslounge.event_rsvps (event_id, lower(email));
