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

### Key Routes
- `/` - Homepage with project feed
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
