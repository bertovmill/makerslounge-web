# Migrating MakersLounge off Supabase → Clerk + Neon/Drizzle + Blob

Status: **plan only, not started.** Written 2026-08-15, right after the Eve
Agent Workshop was folded into this repo (`/eve-workshop`), which brought Clerk
and Neon/Drizzle into the codebase for the first time.

The workshop is the bridgehead: Clerk and Drizzle are already installed,
configured, and running in production on `/eve-workshop`, so none of the work
below starts from zero.

---

## What actually has to move

Measured against `src/` at the time of writing:

| Surface | Size | Target |
| --- | --- | --- |
| Files importing Supabase | 102 | — |
| Tables queried | 31 | Neon Postgres via Drizzle |
| `supabase.auth.*` call sites | 59, across 34 files | Clerk |
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

**Phase 0 — groundwork.** Point Drizzle at a second schema in the same Neon
project the workshop already uses. Port the schema of the 31 tables into
`src/db/schema.ts` (they join the workshop's four). No app code changes yet;
this phase is just "the tables exist and Drizzle knows about them".

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

1. **Realtime**: polling, SSE, or Queues? Cheapest is polling; it changes the
   feel of the messages page slightly.
2. **One Neon project or two?** The workshop's four tables are already in one.
   Sharing it is simpler; separating keeps a throwaway workshop DB from sitting
   next to production user data.
3. **Clerk instance.** The workshop currently runs against a Clerk
   **development** instance (`*.clerk.accounts.dev`), which is exactly why
   `src/app/eve-workshop/profile/actions.ts` has a hand-rolled server-side
   sign-out — third-party cookie blocking breaks Clerk's client-side
   `signOut()` across origins. A site-wide migration needs a **production**
   Clerk instance on `makerslounge.ca`, and that workaround can then be deleted.
4. **Cutover window.** Phase 1 changes how every user signs in. It wants a
   quiet window and a tested rollback, not a Friday evening.
