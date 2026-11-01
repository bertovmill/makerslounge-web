-- A weekly series carries its own cover photo, so every generated occurrence
-- shows the venue instead of the generic default. Asked for on 2026-11-01:
-- MakersLounge Saturdays use a photo of the Waterworks lounge.
--
-- New occurrences copy it in the top-up in src/lib/events/server.ts; this
-- backfills the ones already created that have no photo of their own.

ALTER TABLE makerslounge.event_series ADD COLUMN image_url text;

UPDATE makerslounge.event_series
SET image_url = '/makerslounge-photos/waterworks-lounge.webp'
WHERE slug = 'makerslounge-saturdays';

UPDATE makerslounge.events e
SET image_url = s.image_url,
    updated_at = now()
FROM makerslounge.event_series s
WHERE e.series_id = s.id
  AND e.image_url IS NULL
  AND s.image_url IS NOT NULL;
