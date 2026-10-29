# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start development server (http://localhost:3000)
npm run build    # Build for production
npm run lint     # Run ESLint
npm start        # Start production server
```

## Architecture

MakersLounge is a Next.js 16 app for connecting makers/builders. It uses the App Router with client-side rendering for most pages.

### Tech Stack
- **Next.js 16** with App Router (`src/app/`)
- **Supabase** for auth, database, and file storage
- **Tailwind CSS v4** with shadcn/ui components
- **TypeScript** with strict mode

### Key Patterns

**Supabase Client**: Singleton client at `src/lib/supabase.ts`. All database/auth operations use this.

**UI Components**: shadcn/ui components in `src/components/ui/` using class-variance-authority for variants. Use the `cn()` utility from `src/lib/utils.ts` to merge Tailwind classes.

**Design System**: Claude + Linear inspired theme with:
- Warm coral/terracotta primary color
- CSS utilities: `.glass`, `.glass-card`, `.text-gradient`, `.gradient-warm`
- OKLCH color space for all theme colors in `globals.css`

**Path Alias**: `@/*` maps to `./src/*`

### Database Tables
- `profiles` - User profiles with username, bio, skills, social links
- `projects` - User portfolio projects with media_urls array

### Auth & Onboarding
- OAuth (Google, Apple) redirects back to `/auth`, which checks `profiles.name` to determine if the user needs onboarding
- **Two onboarding flags exist**, and this file used to claim `onboarding_completed`
  "was never migrated to production". It was: it is true for 42 of 140 profiles and
  it is the flag the `/onboarding/*` pages read to decide whether to redirect.
  `has_completed_onboarding` is the vestigial one — true for exactly one profile,
  read by nothing. `AuthContext` uses neither; it treats a non-null `profiles.name`
  as "onboarding done", because a member can skip the form and still have a name.
- New users (no `profiles.name`) are sent to `/onboarding` — a single page asking for name and project(s)
- Users can skip onboarding and go straight to `/home`
- Production domain is `makerslounge.ca` (not `.com`)

### Key Routes
- `/` - Landing page (redirects authenticated users to `/home`)
- `/auth` - Login/signup (Google, Apple, email)
- `/onboarding` - Simple onboarding (name + projects)
- `/home` - the ML agent (formerly "May"), the community matcher agent (authenticated) — see below
- `/profile` - Edit own profile (authenticated)
- `/profile/[id]` - View user profile by ID
- `/p/[username]` - Public profile by username
- `/people` - Browse all makers
- `/matcher` - Contact matching tool
- `/feedback` - User feedback submission
- `/eve-workshop` - Eve Agent Workshop (see below)

### Landing page (`/`)

Rebuilt in Oct 2026 as a **full-bleed photo** page, after Berto called the
flat editorial look (hard ink edges, offset shadows, grain, sparkles, cartoon
value art) "too boxy and cartoony". Sections have stable ids: `#hero`,
`#next-event` (phones and tablets only), `#what-we-do`, `#community-photos`,
`#ask-ml-agent`, `#values`, `#listen-and-read`, `#join`.

- **The hero is real event photos.** `HeroPhotos.tsx` stacks three photos from
  `public/makerslounge-photos/` under a dark scrim. The first rests; the others
  crossfade over it on staggered delays (`.hero-slide` / `.hero-photos` in
  `globals.css`), and reduced motion holds the first still. The photos are only
  ~1086px wide, so swap in larger originals if they ever look soft on big screens.
- **Events come from Luma, never from copy.** `src/lib/luma-events.ts` reads the
  public iCalendar feed of the MakersLounge calendar (`cal-FGHayLJ6ZAmkYJi`, no
  key needed) and `/api/luma-events` returns `{ next, latest, total, since }`,
  cached for an hour. `NextEventCard` shows the next event with an RSVP link, or
  the latest one with "See what's next" when nothing is scheduled. Do not
  hardcode "every Monday": the last Maker Monday on Luma was May 4, 2026. Events whose
  address is hidden carry a Luma URL as `LOCATION`, so they get no venue.
- **The member count is gone from the page.** The live Neon db held 2 profiles
  in Oct 2026, so "Join 2 builders" was hurting more than helping. The event
  total from Luma is the social proof instead. `/api/community-stats` still exists.
- **Phones get a floating action pill** (`MobileEventBar.tsx`): RSVP to the next
  event, or Join when none is scheduled. It shows only between the hero's buttons
  and `#join`, tracked with two IntersectionObservers.
- Glass surfaces on the photo (nav pills, event card, phone bar) need
  `.allow-blur`, because a base-layer rule still strips `backdrop-blur-*` everywhere else.
- **Site-wide tokens changed with it**: radii are soft again (`--radius` 10px,
  scale up to 32px), `--shadow-card*` are low diffuse shadows instead of offset
  ink blocks, and the global grain overlay on `body::after` is gone.
- **Retired from the landing page, still in the repo**: the WebGPU member-light
  hero (`HeroField`, `member-light*.ts`), `LogoDots`, `MayField`, `LiveValueArt` /
  `ValueArt`, and the refractive `GlassCard`. Their render scripts
  (`scripts/render-member-light.mts`, `scripts/render-glass-panel.mts`) still run.
  If any of them come back: `half` is a reserved word in WGSL that Dawn accepts
  but Chrome rejects; a derivative after a non-uniform early `return` fails the
  uniformity check; a backtick in a WGSL comment ends the template string; and
  the Claude browser pane reports the tab hidden until it is clicked, so every
  canvas sleeps.

### The community agent — ML agent, formerly May (`/home`)

`/home` is an [eve](https://eve.dev) agent, not an API route. It lives in
`community-agent/`, its own npm package with its own lockfile, mounted by
`withEve()` in `next.config.ts` and deployed as a separate Vercel service.

- **Two agents now ship with this app**, so `next.config.ts` uses the *named*
  `agents:` map rather than the single-agent `eveRoot` shorthand. That puts each
  agent at `/eve/agents/<name>/eve/v1/*`, and the browser picks one with
  `useEveAgent({ agent: "community" | "workshop-helper" })`. There is no longer
  an agent at bare `/eve/v1/*`.
- **Identity is resolved once, server-side**, in
  `community-agent/agent/channels/eve.ts`: the Clerk cookie gives a Clerk user
  id, which is turned into a `profiles.id` and an admin flag and put on the
  session's auth attributes. Tools read it via `agent/lib/caller.ts` and never
  from their input. This replaced `/api/matcher-chat`, which read `userId` and
  `isAdmin` **out of the request body** — forging `isAdmin: true` exposed the 822
  private `community_contacts` rows, and forging `userId` sent messages as
  anyone.
- **`send_intro_message` is gated on `approval: always()`.** It writes to another
  member's inbox, and eve replays interrupted steps — so without the gate a
  re-run could deliver a second copy. The UI renders the prompt with
  ai-elements' `Confirmation`.
- **Web search is provider-managed.** `agent/tools/web_search.ts` is one line —
  `webSearch({ provider: "exa" })` — resolved through the AI Gateway, so there is
  no Exa key to hold. The old `web_search_person` tool never searched: it fetched
  URLs the *model guessed* and stripped the HTML, so LinkedIn and X always failed.
- **Shell and file tools are disabled** (`agent/tools/{bash,read_file,write_file,glob,grep}.ts`
  export `disableTool()`). This agent reads Postgres and the public web; it has no
  business with a filesystem.
- **The schema is copied, not imported.** `agent/lib/site-schema.ts` is generated
  from `src/db/site/schema.ts` by `scripts/sync-agent-schema.mjs`, which runs on
  `predev`, `prebuild`, and `postinstall`. Do not edit it, and do not switch it
  back to a relative `../../../src/...` import: `eve build` resolves that but
  `eve dev` does not, so it breaks local development while still deploying.
- **The chat UI is [ai-elements](https://ai-sdk.dev/elements)**, in
  `src/components/home/`. `@assistant-ui/*` was removed entirely. Installed
  components live in `src/components/ai-elements/`; add more with
  `npx ai-elements@latest add <name>` (the CLI reads
  `elements.ai-sdk.dev/api/registry`, not the stale `registry.ai-sdk.dev`).
  `agent-message.tsx` folds each turn's tool calls, reasoning and
  authorizations into one `ChainOfThought`, turns May's inline web links into
  `InlineCitation` hover cards by matching them against `web_search` results,
  and renders eve `file` parts with `Attachments`. `matcher-chat.tsx` drives a
  `Persona` (Rive, variant `halo`) off the eve status, sends attachments as AI
  SDK file parts in `UserContent`, and uses `SpeechInput` for dictation.
- **Two local edits to installed ai-elements files, keep them on upgrade.**
  `speech-input.tsx` gained `preferAudioRecording` (always record and send to
  `/api/voice/transcribe`, so Deepgram transcribes on every browser instead of
  Chrome's built-in recogniser) and `onListeningChange`. And the CLI-generated
  `src/components/ui/carousel.tsx` imported `cn` from a bogus `cn` npm package,
  which the CLI also installed — it is corrected to `@/lib/utils`; do not let a
  re-add put it back.

### Meetup matcher evals (`evals/matcher/`, `/admin/matcher-evals`)

The meetup matcher (`/meetup-matcher`, prompt and tools in
`src/lib/meetup-matcher.ts`) is measured, not eyeballed. The route and the evals
call the same `runMeetupMatcher()`, so a prompt or model change is evaluated
exactly as it ships.

- `npm run eval:matcher [dataset] [--no-judge] [--no-save]` runs it, scores it,
  saves the run to `makerslounge.matcher_eval_runs`, and **exits 1 if any metric is
  below `evals/matcher/thresholds.json`**, so it can gate a deploy.
- **Metrics**: coverage and rules followed (exactly 3 matches, real ids, names
  match ids, no self/duplicate matches) are deterministic; *planted recall* is
  whether May finds the pairs planted in a dataset (a need exactly one person in
  the room can meet); *grounding* is whether reasons reuse the matched person's
  own words; *needs met* is an LLM judge (Haiku, so May isn't grading herself).
- **Data never includes real people in the repo.** `data/synthetic-meetup.json`
  is fictional. `npm run eval:matcher:anonymize -- "<luma export.csv>" <name>`
  scrubs a real export into `data/private/` (gitignored) for local runs.
- **`/admin/matcher-evals`** shows each run and lets Berto grade May's intros one
  card at a time (swipe or ←/→). The judge's verdict is hidden until he grades,
  then "you vs. the judge" agreement shows whether the judge can be trusted.
- The synthetic set scores ~100%: it's a floor, not a benchmark. Real meetups
  are where it discriminates (meetup 12 caught a match whose name and id
  pointed at different people).

### Eve Agent Workshop (`/eve-workshop`)

Folded in from its own repo (`bertovmill/eve-workshop`) in Aug 2026. It is a
second app living inside this one, and it deliberately does **not** share this
site's conventions — treat it as a walled garden:

- **Auth is Clerk, not Supabase.** Its attendee data is keyed by Clerk user ids,
  which is why it wasn't ported. `src/middleware.ts` dispatches on path: Clerk
  for `/eve-workshop/*` and `/eve/*`, Supabase for everything else. Only
  `/eve-workshop` itself and its sign-in/sign-up pages are public.
- **Data is Neon + Drizzle, not Supabase.** Schema in `src/db/schema.ts`
  (`questions`, `demo_slots`, `agent_memories`, `learning_goals`).
- **Its code is namespaced**: `src/app/eve-workshop/`,
  `src/app/api/eve-workshop/`, `src/components/eve-workshop/` (with its own
  `ui/` — do not mix these with `src/components/ui/`), `src/lib/eve-workshop/`,
  `public/eve-workshop/`.
- **Its chrome is its own.** `Sidebar`, `AppShell`, and `FeedbackButton` all
  bail out on `/eve-workshop`. Styling is scoped in `globals.css` on
  `body:has(.eve-workshop)` — body-level, so Radix portals inherit it — which
  also disables the site's grain overlay and blur-neutraliser there.
- **`workshop-helper/`** is the Eve agent, mounted at
  `/eve/agents/workshop-helper/*` by `withEve()` in `next.config.ts` (it moved
  off bare `/eve/*` when the community agent was added — see above). It is its
  **own npm package** with its own lockfile and builds as a separate Vercel
  service — run `npm install` inside it to work on it, and do not hoist its
  dependencies to the root.
- **`eve.makerslounge.ca`** is rewritten route-by-route onto `/eve-workshop` in
  `next.config.ts`. Not a catch-all, on purpose — see the comment there.

A staged plan for moving the *rest* of the site onto Clerk + Neon lives in
`docs/supabase-to-clerk-neon-migration.md`.

### Environment Variables
Required in `.env.local`:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY` (Eve workshop)
- `DATABASE_URL` (Neon, Eve workshop)
- `NEXT_PUBLIC_CLERK_SIGN_IN_URL=/eve-workshop/sign-in`,
  `NEXT_PUBLIC_CLERK_SIGN_UP_URL=/eve-workshop/sign-up`
- `SLACK_WEBHOOK_URL` (optional) — Slack Incoming Webhook for the MakersLounge
  workspace. `/api/subscribe` pings it on every new or reactivated newsletter
  signup (`src/lib/slack.ts`). The channel is baked into the webhook, not chosen
  in code. Unset = silent no-op, so local dev and previews stay quiet. Never
  give it a `NEXT_PUBLIC_` prefix — that would inline the webhook into a client
  chunk and let anyone post to the channel.
- `WORKSHOP_WIFI_PASSWORD` (optional) — the venue Wi-Fi password for the next
  workshop. Deliberately not committed; when unset both the hero slide and
  `/eve-workshop/wifi` show "Ask a host". Server-side only — never give it a
  `NEXT_PUBLIC_` prefix, which would inline it into a client chunk that anyone
  can fetch without signing in.

Values in `.env.local` are written **quoted** (`KEY="pk_test_…"`). Next's dotenv
parser strips the quotes, so locally this is invisible — but anything that
copies a raw line into Vercel (`vercel env add`, a sync script) ships the quotes
as part of the value. A quoted `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` gets inlined
at build time and makes Clerk throw `Publishable key not valid`, which surfaces
as `MIDDLEWARE_INVOCATION_FAILED` — a 500 on every Clerk-routed path while the
rest of the site stays green. Strip surrounding quotes before pushing env values
upstream.

### Deploys

Vercel blocks any deployment whose commit author it can't map to the linked
GitHub account. This repo's commits **must** be authored as
`81169127+bertovmill@users.noreply.github.com` (set repo-locally) — commits made
with the global `rmill@aucctus.com` identity deploy as `BLOCKED` and silently
never reach production.

## Branding & Assets

**Logos**: All logo variants live in `public/logos/` and `Makerslounge-Branding/`:
- `logos/logo-luma.png` / `logos/logo-luma.svg` — Luma event profile logo
- `logos/luma-banner.png` / `logos/luma-banner.svg` — Luma event banner (mission statement on blue gradient)
- `logos/logo-banner-blue.png` / `logos/logo-banner-blue.svg` — Blue banner logo
- `logos/logo-instagram.png` / `logos/logo-instagram.svg` — Instagram profile logo
- `logos/linkedin-banner.png` / `logos/linkedin-banner.svg` — LinkedIn banner

**Brand colors**: Blue gradient (#6AC4F7 → #3A9FF3 → #1A7DE8), white text/logo

**Makerslounge logo SVG path**: The "M" flame mark path data is stored in the Luma cover SVG template at `/maker-mondays-cover.svg` in the project root (used by the scheduled task).

## Recurring Events

### Maker Mondays
- **What**: Weekly builder meetup — no talks, just makers building, creating, and shipping together
- **Tagline**: "Build. Connect. Create."
- **Luma RSVP link**: luma.com/makermonday3
- **Cover image**: 1080x1080 PNG, bold & energetic style with geometric accents on blue gradient, Makerslounge logo, "MAKER MONDAYS" title, date, and tagline
- **Scheduled task**: `maker-mondays-cover` runs every Friday at 9am to auto-generate the next Monday's cover image using cairosvg
- **Social posting**: Captions go out on LinkedIn, X, and Instagram — hype & energetic tone, include Luma RSVP link
- **Hashtags**: #MakerMondays #Makerslounge #BuildInPublic #AI #TorontoTech #Startups #Community

### Luma covers (`scripts/luma-cover/`)
- **Generated, not drawn.** `render-frames.mts` paints a square backdrop per
  variant with vgpu (headless, Dawn on Metal), `compose.mjs` lays Figtree type
  and the logo over each frame in headless Chrome, then ffmpeg makes a
  1080 PNG still and a 640 GIF loop. Variants (shader + palette + layout) live
  in `variants.mjs`; `time` is a loop phase in [0, 1) and every animated term
  goes through `TAU * time`, which is what makes the GIFs seamless.
- Run: `OUT=/tmp/f FRAMES=36 node --experimental-strip-types --no-warnings scripts/luma-cover/render-frames.mts`
  then `FRAMES_DIR=/tmp/f OUT=branding/luma-covers/meetup-N NUMBER=N DATE="..." node scripts/luma-cover/compose.mjs`.
- Outputs are committed under `branding/luma-covers/<event>/`. Meetup 13's
  nine variants are the first set.

### Toronto Tech Week (May 25–29, 2026)
- **Makerslounge event**: "Build in Public - Toronto Edition" — May 28 at 6:00 PM
- **Listed alongside**: Robinhood, Spotify, Carta, Vector Institute, Scale AI, Google Developers Group, and others
