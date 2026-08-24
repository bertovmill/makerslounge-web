---
description: Deep-research one candidate on the open web before recommending them, using web_search and web_fetch.
---

# Research a maker

Use when the user is weighing a specific person — hiring, co-founding, or a
serious collaboration — and the community profile alone is too thin to justify a
recommendation. Skip it for casual "who should I meet" browsing; it costs several
searches.

## Procedure

1. Start from the community record. Call `get_maker_profile` so you have their
   `linkedin`, `twitter`, and `website` links and what they say they're building.
2. Search deliberately, one angle per call, rather than one broad query:
   - `"<name>" <their company or project>` — confirms you have the right person
   - `<their project name>` — what the work actually looks like from outside
   - `"<name>" github OR blog OR talk` — evidence of how they build and think
3. Read, don't skim headlines. `web_fetch` the two or three most substantive
   results in full — a personal site, a GitHub profile, a conference talk page.
   Search snippets are not evidence.
4. Cross-check identity before you attribute anything. Common names collide.
   If the search results could plausibly be a different person, say so and
   attribute nothing you can't tie to them.

## Reporting

- Lead with the community evidence, then the web evidence. Community data is the
  source of truth about membership; the web is context.
- Link every external claim to the URL it came from, inline.
- Say what you could not find. "No public writing I could locate" is a useful
  signal and an honest one.
- Never infer someone's employment status, availability, or willingness to be
  hired from public pages. Recommend the introduction; let the person answer.
