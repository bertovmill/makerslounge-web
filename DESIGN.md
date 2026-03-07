# MakersLounge — Design & Build Document

A living document tracking design decisions, page status, and the rebuild roadmap.

---

## Vision

Luma tells you *when* to show up. MakersLounge tells you *who* to talk to and *why*.

A community platform for makers/builders that goes beyond event logistics — housing rich profiles, AI-powered matching, and opportunity discovery.

---

## Design Principles

1. **Minimalism** — Every element earns its place. No decoration for decoration's sake.
2. **Simplicity** — If it takes explanation, it's too complex.
3. **Organization** — Clear hierarchy, consistent spacing, predictable patterns.
4. **Mobile-first** — Design at 375px, scale up. Bottom tab bar on mobile.
5. **Not "AI-looking"** — No generic gradients, glassmorphism, or gratuitous animations.

---

## Design System

### Font
- **Geist Sans** — Body, UI, headings. One font, all weights.
- **Geist Mono** — Code, data, secondary info.

### Colors
Monochrome only. Black + white + neutral grays.

| Token              | Value     | Usage                    |
|---------------------|-----------|--------------------------|
| `--foreground`      | `#0a0a0a` | Primary text, logo       |
| `--muted-foreground`| `#737373` | Secondary text           |
| `--background`      | `#ffffff` | Page background          |
| `--secondary`       | `#f5f5f5` | Hover states, cards      |
| `--border`          | `#e5e5e5` | Borders, dividers        |
| `--primary`         | `#0a0a0a` | Buttons, active states   |
| `--destructive`     | `#dc2626` | Errors, destructive acts |

### Components
- **Base:** shadcn/ui (unstyled, themed to our palette)
- **Icons:** Lucide React
- **Radius:** 0.5rem (subtle, not bubbly)

### Logo
Black wordmark: "MakersLounge" in Geist Semibold. No icon.

---

## Navigation

### Desktop
Top bar: Logo (left) | People, Match, Events (center-left) | Settings (right)

### Mobile
- Top bar: Logo + hamburger
- Bottom tab bar: People, Match, Events, Profile (persistent)
- Hamburger opens full-screen menu for secondary items

---

## Pages — Rebuild Status

### Core (rebuild in order)

| #  | Route          | Purpose                          | Status      |
|----|----------------|----------------------------------|-------------|
| 1  | `/`            | Landing (guests) / Feed (users)  | DONE        |
| 2  | `/auth`        | Sign in / sign up                | DONE        |
| 3  | `/onboarding`  | New user profile setup           | DONE        |
| 4  | `/people`      | Community directory + search     | DONE        |
| 5  | `/profile`     | Edit own profile                 | DONE        |
| 6  | `/p/[username]`| Public profile                   | DONE        |
| 7  | `/matcher`     | AI-powered matching              | DONE        |
| 8  | `/events`      | Events + context layer           | DONE        |
| 9  | `/settings`    | Account settings                 | DONE        |

### Infrastructure (done)

| Item            | Status    |
|-----------------|-----------|
| Geist font      | DONE      |
| globals.css     | DONE      |
| Color tokens    | DONE      |
| Logo            | DONE      |
| Navbar          | DONE      |
| Layout shell    | DONE      |

### Cut (revisit later)

| Route                | Reason                              |
|----------------------|-------------------------------------|
| `/docs/*`            | Not needed for MVP                  |
| `/blog/*`            | Not needed for MVP                  |
| `/admin/*`           | Rebuild after core is solid         |
| `/agents/*`          | Feature creep — add back if needed  |
| `/brand`             | Old brand system                    |
| `/values`            | Content page, low priority          |
| `/about`             | Content page, low priority          |
| `/workshops`         | Not active                          |
| `/connections`       | Merge into matcher/people           |
| `/matches`           | Merge into matcher                  |
| `/feedback`          | Move to in-app widget               |
| `/offline`           | PWA concern, not MVP                |

---

## Data Model (existing — keep as-is)

### profiles
- `id`, `username`, `full_name`, `bio`, `avatar_url`
- `skills` (text[]), `interests` (text[])
- `website`, `twitter`, `linkedin`, `github`
- `created_at`, `updated_at`

### projects
- `id`, `user_id`, `title`, `description`
- `media_urls` (text[])
- `created_at`

---

## Tech Stack

| Layer       | Choice                  |
|-------------|-------------------------|
| Framework   | Next.js 16 (App Router) |
| Database    | Supabase                |
| Auth        | Supabase Auth           |
| Styling     | Tailwind CSS v4         |
| Components  | shadcn/ui               |
| Icons       | Lucide React            |
| Font        | Geist (Sans + Mono)     |
| Deployment  | Vercel                  |

---

## Open Questions

- [ ] Should the homepage feed show projects, opportunities, or both?
- [ ] Do we need real-time chat, or is matching + contact info enough?
- [ ] Event integration — pull from Luma API, or manual entry?
- [ ] Push notifications — PWA web push, or save for native app?
- [ ] Should `/matcher` be conversational (chat UI) or form-based?
