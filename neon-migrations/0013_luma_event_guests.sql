-- Every guest of every MakersLounge Luma event, one row per person per event.
-- Added 2026-11-01, when the Luma guest CSVs were imported in full
-- (scripts/import-luma-guests.mjs).
--
--   * Everyone is kept, invited-only guests included: they are the pool we
--     invite from. `status` says who actually signed up: `approved` is a
--     registration, `invited` is someone we invited who never registered,
--     plus `waitlist`, `pending_approval` and `declined`.
--   * `answers` is the guest's registration form, question → answer, as Luma
--     exported it. The question wording changes from event to event, so the
--     import also folds them into structured fields on the contact
--     (`community_contacts.metadata -> 'intel'`).
--   * `contact_id` links to the person in `community_contacts`, matched on
--     lower(email). One person, many events.
--   * Luma events live in their own table, not `events`: `events` is what the
--     site renders and RSVPs to, and these are history.

CREATE TABLE makerslounge.luma_events (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  starts_at   timestamptz,
  ends_at     timestamptz,
  location    text,
  luma_url    text NOT NULL UNIQUE,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE makerslounge.luma_event_guests (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  luma_event_id    uuid NOT NULL REFERENCES makerslounge.luma_events (id) ON DELETE CASCADE,
  contact_id       uuid REFERENCES makerslounge.community_contacts (id) ON DELETE SET NULL,
  luma_guest_id    text,
  email            text NOT NULL,
  name             text,
  status           text NOT NULL,
  registered_at    timestamptz,
  checked_in_at    timestamptz,
  ticket_name      text,
  referrer         text,
  referred_by      text,
  utm_source       text,
  survey_rating    smallint,
  survey_feedback  text,
  answers          jsonb NOT NULL DEFAULT '{}'::jsonb,
  imported_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (luma_event_id, email)
);

CREATE INDEX luma_event_guests_contact_idx ON makerslounge.luma_event_guests (contact_id);
CREATE INDEX luma_event_guests_email_idx ON makerslounge.luma_event_guests (email);
