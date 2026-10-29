-- Emails for in-house event RSVPs: a confirmation on RSVP, a reminder the day
-- before, and a cancel link in both.
--
--   * `cancel_token` is the secret in the cancel link. It is the only thing the
--     link carries, so it has to be unguessable: a random uuid, unique per RSVP.
--     The volatile default gives every existing row its own token.
--   * `reminder_sent_at` makes the reminder cron idempotent. The cron claims a
--     row by setting it before sending, so a retried or overlapping run never
--     emails anyone twice.

ALTER TABLE makerslounge.event_rsvps
  ADD COLUMN cancel_token     uuid NOT NULL DEFAULT gen_random_uuid(),
  ADD COLUMN reminder_sent_at timestamptz;

CREATE UNIQUE INDEX event_rsvps_cancel_token_idx
  ON makerslounge.event_rsvps (cancel_token);
