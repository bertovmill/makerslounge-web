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
- `/home` - Main feed (authenticated)
- `/profile` - Edit own profile (authenticated)
- `/profile/[id]` - View user profile by ID
- `/p/[username]` - Public profile by username
- `/people` - Browse all makers
- `/matcher` - Contact matching tool
- `/feedback` - User feedback submission
- `/eve-workshop` - Eve Agent Workshop (see below)

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
- **`workshop-helper/`** is the Eve agent, mounted at `/eve/*` by `withEve()` in
  `next.config.ts`. It is its **own npm package** with its own lockfile and
  builds as a separate Vercel service — run `npm install` inside it to work on
  it, and do not hoist its dependencies to the root.
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

### Toronto Tech Week (May 25–29, 2026)
- **Makerslounge event**: "Build in Public - Toronto Edition" — May 28 at 6:00 PM
- **Listed alongside**: Robinhood, Spotify, Carta, Vector Institute, Scale AI, Google Developers Group, and others
