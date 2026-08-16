# Migrating MakersLounge off Supabase → Clerk + Neon/Drizzle + Blob

Status: **Phase 0 done, Phase 1 not started.** Written 2026-08-15, right after
the Eve Agent Workshop was folded into this repo (`/eve-workshop`), which
brought Clerk and Neon/Drizzle into the codebase for the first time. Decisions
taken and Phase 0 landed 2026-08-16.

## Decisions taken (2026-08-16)

1. **Scope: everything.** Auth → Clerk, data → Neon/Drizzle, storage → Vercel
   Blob, then Supabase goes away. Not a database-only swap.
2. **Realtime: polling.** The four subscriptions are all unread-message badges
   and live conversation updates; an interval poll is imperceptible for a badge
   and avoids standing up SSE or Queues for it.
3. **One Neon project.** The site's tables live in a `makerslounge` Postgres
   schema alongside the workshop's four in `public`. One connection string, one
   bill, no name collisions.
4. **Clerk production instance** is still outstanding — see "Things to decide".

The workshop is the bridgehead: Clerk and Drizzle are already installed,
configured, and running in production on `/eve-workshop`, so none of the work
below starts from zero.

---

## What actually has to move

Measured against `src/` at the time of writing:

| Surface | Size | Target |
| --- | --- | --- |
| Files importing Supabase | 102 | — |
| Tables queried | 33 (38 exist in production) | Neon Postgres via Drizzle |
| `supabase.auth.*` call sites | 60, across 34 files | Clerk |
| Storage buckets | `media`, `podcasts` | Vercel Blob |
| Realtime subscriptions | 4 (`messages`, `Navbar`, `Sidebar`) | see "Realtime" |
| Routes using the service-role key | 20 | plain server-side Drizzle |
| Committed SQL migrations | `supabase/migrations/*` | Drizzle migrations |

Table row counts by query frequency — `profiles` (56 query sites),
`community_contacts` (23), `blog_posts` (17), `podcasts` (15), `projects` (14),
`media` (14), `likes` (12), `conversations` (12), then a long tail down to
single-use tables like `matcher_events`.

### The two genuinely hard parts

**1. Existing user accounts.** Production users live in Supabase Auth, and the
sign-in methods are Google OAuth, Apple OAuth, and email/password. They cannot
be re-created by asking everyone to sign up again without locking people out of
their own profiles.

- Email/password users: Supabase stores bcrypt hashes, and Clerk's user-import
  API accepts bcrypt directly, so passwords carry over without a reset.
- Google/Apple users: no password exists to migrate. These are matched on
  verified email address — import the user into Clerk with the verified email
  and the matching OAuth account linked, so the next Google sign-in lands on the
  same account.
- Every row keyed by a Supabase `auth.users` UUID (`profiles.id` above all) needs
  a mapping to the new Clerk user id. Keep the old UUID as a column
  (`supabase_user_id`) rather than rewriting foreign keys in one shot — it makes
  the migration reversible and lets both id spaces coexist during cutover.

**2. Storage has no equivalent.** Neon is Postgres only. The `media` and
`podcasts` buckets need to move to Vercel Blob, and every stored URL in the
database (`profiles.photo_url`, `projects.media_urls`, podcast audio) has to be
rewritten to the new host. Upload sites: `profile`, `updates`, `ProfileView`,
`FeedbackButton`, `ValuePortfolioModal`, the hackathon `SubmissionForm`. Two
admin screens use `createSignedUrl` for private files — Blob's private store
covers that, but the call shape is different.

### Realtime

Supabase Realtime has no Neon equivalent. Four subscriptions depend on it, all
for unread-message counts and live conversation updates. Options, cheapest
first: poll on an interval (fine for unread badges), move to SSE off a Vercel
Function, or use Vercel Queues. This is the one place where the migration is a
feature rewrite rather than a port, and it should be decided before starting.

### Row Level Security

Supabase RLS policies are enforced in the database; 20 routes deliberately use
the service-role key to bypass them. Neon has no RLS layer wired to a JWT, so
**every policy currently written in SQL becomes application code**. This is the
most dangerous part of the migration: a policy that silently stops being
enforced does not throw, it leaks. Each table's policies in
`supabase/migrations/*` need to be read and re-expressed as explicit `where`
clauses or a shared authorization helper, with tests.

---

## Suggested sequencing

Each phase ships independently and leaves the site working.

**Phase 0 — groundwork. ✅ Done 2026-08-16.**

- `src/db/site/schema.ts` — all 37 production tables (343 columns, 25 foreign
  keys) in a `makerslounge` pgSchema.
- `src/db/site/index.ts` — `getSiteDb()`, deliberately a separate client from
  the workshop's `getDb()` so a stray import can't join across the boundary.
- `drizzle.site.config.ts` — `schemaFilter: ["makerslounge"]`, with the existing
  `drizzle.config.ts` pinned to `["public"]` so neither config generates DROPs
  for the other's tables.
- `drizzle/site/0000_init_site_schema.sql` — generated, **not applied**, and not
  committed (`/drizzle/` is gitignored repo-wide, as it is for the workshop).
  Regenerate any time with
  `npx drizzle-kit generate --config drizzle.site.config.ts`.

Nothing imports any of it; Supabase is still the source of truth.

The schema was generated from the **live database's PostgREST OpenAPI spec**
(`GET /rest/v1/` with the service-role key), not from `supabase/migrations/*`,
because production had 38 tables against 31 in the plan and the committed SQL
had drifted. Regenerate the same way if the Supabase schema changes before
cutover.

Constraints and indexes come from a second source, a `pg_dump --schema-only`
taken the same day, because PostgREST describes neither. **15 UNIQUE
constraints, 1 unique index and 53 further indexes** are now in the schema —
including `profiles_username_key`, whose absence would have silently permitted
duplicate usernames and broken `/p/[username]` with no error at the point of
failure.

The dump lives at `~/supabase-schema-backups/schema-public.sql`, deliberately
outside the repo.

### Getting the dump again

The obvious path does not work. `db.<ref>.supabase.co` is **IPv6-only** since
Supabase dropped IPv4 for direct connections, so it fails to resolve on an
IPv4-only machine. Use the **session pooler** instead — note `aws-1`, and note
the username carries the project ref:

```
postgresql://postgres.<ref>:<password>@aws-1-us-east-1.pooler.supabase.com:5432/postgres
```

Port 5432, not the transaction pooler's 6543 — `pg_dump` needs session mode.
`pg_dump` itself comes from Homebrew `libpq` (client only). If the pooler
answers `Tenant or user not found` the region prefix is wrong; if it answers
`password authentication failed`, the host is right and only the password is
wrong.

### What the dump found that this plan had missed

- **112 RLS policies across 35 tables**, catalogued in
  `docs/rls-policy-inventory.md`. 66 are row-owner checks, 14 hardcode an admin
  email, 19 are wide open. That file is the Phase 2 worksheet.
- **`hackathon_voter_notes` has RLS enabled with zero policies** — which in
  Postgres denies everything to `anon` and `authenticated`, not "allows
  everything". Only the service-role key reaches it today.
- **9 functions and 6 triggers**, which the original inventory did not mention
  at all. They need reading and porting or replacing before Phase 2 completes;
  a trigger that silently stops firing is the same class of failure as a
  dropped RLS policy.
- **One expression index** (`idx_blog_posts_search`, a GIN full-text index over
  `title || excerpt || content`) that the Drizzle DSL cannot express. It must be
  added as raw SQL after the tables are created, or blog search degrades to a
  sequential scan.

`connection_counts` is excluded — it's an aggregate view, not a table, and will
need re-creating as a view or folding into a query.

**Phase 1 — auth cutover.** The riskiest phase, so it goes early while the
codebase is otherwise unchanged and a revert is cheap.
1. Import users into Clerk (bcrypt for password users, verified-email matching
   for Google/Apple), writing `clerk_user_id` onto `profiles`.
2. Move `ClerkProvider` from `src/app/eve-workshop/layout.tsx` to the root
   layout, and widen `middleware.ts` from the workshop-only matcher to the whole
   site.
3. Replace the 59 `supabase.auth.*` call sites. Most are `getUser` (34) and
   translate directly to Clerk's `auth()` / `currentUser()`.
4. Keep Supabase as the database throughout this phase, reading rows by the
   mapped id.

**Phase 2 — data, table by table.** Move tables in dependency order, starting
with the leaves (`feedback`, `email_subscriptions`, `matcher_events`) to build
confidence, and doing `profiles` last since 56 sites touch it. For each table:
re-express its RLS policies as application-level checks, port the queries, then
backfill and verify row counts match before deleting anything.

**Phase 3 — storage.** Copy both buckets into Vercel Blob, rewrite stored URLs,
switch the upload sites, then flip the two signed-URL admin screens.

**Phase 4 — realtime.** Whatever was decided above.

**Phase 5 — teardown.** Drop `@supabase/*` from `package.json`, delete the
Supabase client and middleware branch, remove the Supabase env vars from Vercel,
and archive the Supabase project (do not delete it until a full backup is stored
somewhere durable).

---

## Things to decide before starting

~~1. **Realtime**~~ — decided: polling. See "Decisions taken" above.
~~2. **One Neon project or two?**~~ — decided: one, split by Postgres schema.

~~3. **`pg_dump --schema-only`**~~ — taken 2026-08-16; constraints folded in and
policies catalogued.

Still open:

1. **A data dump.** The schema dump is structure only. Before any cutover, take
   a full `pg_dump` with rows as a real backup — that has not been done.
2. **Clerk instance.** The workshop currently runs against a Clerk
   **development** instance (`*.clerk.accounts.dev`), which is exactly why
   `src/app/eve-workshop/profile/actions.ts` has a hand-rolled server-side
   sign-out — third-party cookie blocking breaks Clerk's client-side
   `signOut()` across origins. A site-wide migration needs a **production**
   Clerk instance on `makerslounge.ca`, and that workaround can then be deleted.
3. **Cutover window.** Phase 1 changes how every user signs in. It wants a
   quiet window and a tested rollback, not a Friday evening.
