-- The first weekly series: MakersLounge Saturdays at Waterworks, from Nov 7 2026.
-- Its occurrences are created by the top-up in src/lib/events/server.ts on the
-- first read of /events, or by POST /api/event-series for any later series.

INSERT INTO makerslounge.event_series
  (slug, title, description, location, weekday, start_local, end_local, timezone, starts_on)
VALUES (
  'makerslounge-saturdays',
  'MakersLounge Saturdays',
  $$A weekly afternoon of building alongside Toronto makers. Bring something to work on, start something new, or just come see what people are making.

**Itinerary**

* 11:30 to 12:00 · Intros (you're grouped by what you're building)
* 12:00 to 2:30 · Co-working and co-making (grab lunch from the food hall)
* 2:30 to 3:00 · Demos and mingle

**Before you come**

1. RSVP here
2. Join our Slack: [makerslounge.slack.com](https://join.slack.com/t/makerslounge/shared_invite/zt-43ly03o4m-Uz5arHN0w98OBU50_cPhsA)
3. Sign up at [makerslounge.ca](https://makerslounge.ca)
4. Bring something to work on

Post with #MakersLounge to help us grow the community. See you Saturday!$$,
  'Waterworks, 499 Richmond St W, Toronto',
  6,
  '11:30',
  '15:00',
  'America/Toronto',
  '2026-11-07'
)
ON CONFLICT (slug) DO NOTHING;
