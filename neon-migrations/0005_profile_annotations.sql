-- Private tags and a note that one member keeps about another.
--
-- A personal CRM layer over /people: "met at meetup 12", "wants a cofounder",
-- "follow up". Everything here is scoped to the member who wrote it — the tagged
-- person never sees it, and neither does anyone else. That is why the primary
-- key is (owner_id, profile_id) rather than a bare id: there is exactly one
-- annotation per pair, and every read and write is keyed on the owner first.
--
-- Deliberately separate from `profile_event_notes`, which is one note per person
-- per *meetup* and is what the meetup matcher syncs into. That shape forces a
-- meetup name on every row; this one is free-form and has no event.
--
-- Neon has no RLS, so the owner scope is enforced in
-- `src/app/api/profile-annotations/route.ts`, in front of every query.

CREATE TABLE makerslounge.profile_annotations (
  owner_id   uuid NOT NULL REFERENCES makerslounge.profiles(id) ON DELETE CASCADE,
  profile_id uuid NOT NULL REFERENCES makerslounge.profiles(id) ON DELETE CASCADE,
  tags       text[] NOT NULL DEFAULT '{}',
  note       text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (owner_id, profile_id),
  CONSTRAINT profile_annotations_tags_max CHECK (cardinality(tags) <= 20),
  CONSTRAINT profile_annotations_note_max CHECK (note IS NULL OR char_length(note) <= 2000)
);

-- Filtering /people by one of the viewer's own tags is `owner_id = me AND tags @> '{x}'`.
CREATE INDEX profile_annotations_owner_tags_idx
  ON makerslounge.profile_annotations USING gin (tags)
  WHERE cardinality(tags) > 0;
