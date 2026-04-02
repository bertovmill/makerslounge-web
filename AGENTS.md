# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

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

**Design System**: Codex + Linear inspired theme with:
- Warm coral/terracotta primary color
- CSS utilities: `.glass`, `.glass-card`, `.text-gradient`, `.gradient-warm`
- OKLCH color space for all theme colors in `globals.css`

**Path Alias**: `@/*` maps to `./src/*`

### Database Tables
- `profiles` - User profiles with username, bio, skills, social links
- `projects` - User portfolio projects with media_urls array

### Auth & Onboarding
- OAuth (Google, Apple) redirects back to `/auth`, which checks `profiles.name` to determine if the user needs onboarding
- **Do NOT use the `onboarding_completed` column** — it was never migrated to production
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

### Environment Variables
Required in `.env.local`:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Branding & Assets

**Logos**: All logo variants live in `public/` and `Makerslounge-Branding/`:
- `logo-luma.png` / `logo-luma.svg` — Luma event profile logo
- `luma-banner.png` / `luma-banner.svg` — Luma event banner (mission statement on blue gradient)
- `logo-banner-blue.png` / `logo-banner-blue.svg` — Blue banner logo
- `logo-instagram.png` / `logo-instagram.svg` — Instagram profile logo
- `linkedin-banner.png` / `linkedin-banner.svg` — LinkedIn banner

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
