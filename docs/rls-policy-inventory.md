# RLS policy inventory

Extracted from a `pg_dump --schema-only` of the Supabase database on
2026-08-16. This is the Phase 2 worksheet for
`docs/supabase-to-clerk-neon-migration.md`.

**Why this file exists.** Neon has no RLS layer wired to a JWT. Every policy
below is enforced *in the database* today and becomes **application code**
after the move. This is the most dangerous part of the migration: a policy
that silently stops being enforced does not throw an error, it leaks data.
Work table by table, and treat a table as done only when each policy here has
a corresponding `where` clause or authorization check with a test.

**112 policies across 35 tables.** 36 tables have RLS enabled.

## Shape of the policies

| Pattern | Count | Becomes |
| --- | --- | --- |
| `auth.uid()` — row owner | 66 | `where(eq(table.userId, session.userId))` |
| `auth.jwt() ->> 'email'` — hardcoded admin | 14 | a shared `requireAdmin()` helper |
| `auth.role()` — signed-in vs anon | 1 | a signed-in check in the route |
| `true` — fully open | 19 | no check needed, but confirm that's intended |
| other / compound | 12 | read individually — these are the risky ones |

The `true` policies deserve a second look rather than a quick port: some are
genuinely public data, and some are a table that was opened up during
development and never tightened.

---

## Deny-all tables

These have RLS **enabled with zero policies**. In Postgres that is not
'no restrictions' — it denies everything to the `anon` and
`authenticated` roles. Only the service-role key, which bypasses RLS,
can read or write them today.

- `hackathon_voter_notes`

So the equivalent after the move is: reachable only from server-side
code, never from a user-scoped query. Check whether that was deliberate
or an accident that a service-role route has been papering over.

---

## `applications`

- **SELECT** — Admin can read applications
  - `USING` ((auth.jwt() ->> 'email'::text) = 'bertmill19@gmail.com'::text)
- **UPDATE** — Admin can update applications
  - `USING` ((auth.jwt() ->> 'email'::text) = 'bertmill19@gmail.com'::text)
  - `WITH CHECK` ((auth.jwt() ->> 'email'::text) = 'bertmill19@gmail.com'::text)
- **INSERT** — Anyone can submit an application
  - `WITH CHECK` true
- **SELECT** — Applicants can check their own status
  - `USING` (email = ((current_setting('request.jwt.claims'::text, true))::json ->> 'email'::text))

## `blocked_users`

- **INSERT** — Users can block others
  - `WITH CHECK` (auth.uid() = blocker_id)
- **DELETE** — Users can unblock
  - `USING` (auth.uid() = blocker_id)
- **SELECT** — Users can view their blocks
  - `USING` (auth.uid() = blocker_id)

## `blog_posts`

- **SELECT** — Anyone can read published posts
  - `USING` (is_published = true)
- **INSERT** — Authenticated users can create posts
  - `WITH CHECK` (auth.uid() IS NOT NULL)
- **SELECT** — Authenticated users can read all posts
  - `USING` (auth.uid() IS NOT NULL)
- **DELETE** — Authors can delete their own posts
  - `USING` (auth.uid() = author_id)
- **UPDATE** — Authors can update their own posts
  - `USING` (auth.uid() = author_id)
  - `WITH CHECK` (auth.uid() = author_id)

## `broadcast_accounts`

- **INSERT** — Users can create broadcast accounts
  - `WITH CHECK` (auth.uid() = user_id)
- **DELETE** — Users can delete their own broadcast accounts
  - `USING` (auth.uid() = user_id)
- **UPDATE** — Users can update their own broadcast accounts
  - `USING` (auth.uid() = user_id)
  - `WITH CHECK` (auth.uid() = user_id)
- **SELECT** — Users can view their own broadcast accounts
  - `USING` (auth.uid() = user_id)

## `broadcast_channels`

- **INSERT** — Users can create broadcast channels
  - `WITH CHECK` (auth.uid() = user_id)
- **DELETE** — Users can delete their own broadcast channels
  - `USING` (auth.uid() = user_id)
- **UPDATE** — Users can update their own broadcast channels
  - `USING` (auth.uid() = user_id)
  - `WITH CHECK` (auth.uid() = user_id)
- **SELECT** — Users can view their own broadcast channels
  - `USING` (auth.uid() = user_id)

## `comments`

- **SELECT** — Anyone can view comments
  - `USING` true
- **DELETE** — Users can delete their own comments
  - `USING` (auth.uid() = user_id)
- **INSERT** — Users can insert their own comments
  - `WITH CHECK` (auth.uid() = user_id)

## `community_contacts`

- **DELETE** — admin_delete
  - `USING` ((auth.jwt() ->> 'email'::text) = 'bertmill19@gmail.com'::text)
- **INSERT** — admin_insert
  - `WITH CHECK` ((auth.jwt() ->> 'email'::text) = 'bertmill19@gmail.com'::text)
- **SELECT** — admin_select
  - `USING` ((auth.jwt() ->> 'email'::text) = 'bertmill19@gmail.com'::text)
- **UPDATE** — admin_update
  - `USING` ((auth.jwt() ->> 'email'::text) = 'bertmill19@gmail.com'::text)
- **SELECT** — public_read_visible
  - `USING` (visibility = 'public'::text)

## `connections`

- **UPDATE** — Recipients can respond to requests
  - `USING` (auth.uid() = recipient_id)
  - `WITH CHECK` (auth.uid() = recipient_id)
- **DELETE** — Users can delete their connections
  - `USING` (((auth.uid() = requester_id) AND (status = 'pending'::text)) OR (((auth.uid() = requester_id) OR (auth.uid() = recipient_id)) AND (status = 'accepted'::text)))
- **INSERT** — Users can send connection requests
  - `WITH CHECK` (auth.uid() = requester_id)
- **SELECT** — Users can view their own connections
  - `USING` ((auth.uid() = requester_id) OR (auth.uid() = recipient_id))

## `content_events`

- **DELETE** — Users can delete own content_events
  - `USING` (auth.uid() = user_id)
- **INSERT** — Users can insert own content_events
  - `WITH CHECK` (auth.uid() = user_id)
- **UPDATE** — Users can update own content_events
  - `USING` (auth.uid() = user_id)
- **SELECT** — Users can view own content_events
  - `USING` (auth.uid() = user_id)

## `conversations`

- **INSERT** — Users can create conversations
  - `WITH CHECK` ((auth.uid() = participant_1) OR (auth.uid() = participant_2))
- **UPDATE** — Users can update own conversations
  - `USING` ((auth.uid() = participant_1) OR (auth.uid() = participant_2))
- **SELECT** — Users can view own conversations
  - `USING` ((auth.uid() = participant_1) OR (auth.uid() = participant_2))

## `email_subscriptions`

- **SELECT** — Anyone can read subscriptions
  - `USING` true
- **INSERT** — Anyone can subscribe
  - `WITH CHECK` true
- **UPDATE** — Anyone can unsubscribe
  - `USING` true
  - `WITH CHECK` ((is_active = false) OR (is_active = true))

## `events`

- **SELECT** — Anyone can view events
  - `USING` true
- **INSERT** — Only bertmill19@gmail.com can create events
  - `WITH CHECK` ((auth.jwt() ->> 'email'::text) = 'bertmill19@gmail.com'::text)
- **DELETE** — Only bertmill19@gmail.com can delete events
  - `USING` ((auth.jwt() ->> 'email'::text) = 'bertmill19@gmail.com'::text)
- **UPDATE** — Only bertmill19@gmail.com can update events
  - `USING` ((auth.jwt() ->> 'email'::text) = 'bertmill19@gmail.com'::text)

## `feedback`

- **UPDATE** — Admin can update feedback
  - `USING` ((auth.jwt() ->> 'email'::text) = 'bertmill19@gmail.com'::text)
- **SELECT** — Admin can view feedback
  - `USING` ((auth.jwt() ->> 'email'::text) = 'bertmill19@gmail.com'::text)
- **INSERT** — Anyone can insert feedback
  - `WITH CHECK` true

## `hackathon_scores`

- **ALL** — open_scores
  - `USING` true
  - `WITH CHECK` true

## `hackathon_submissions`

- **SELECT** — Admin can read submissions _(to authenticated)_
  - `USING` (auth.email() = 'bertmill19@gmail.com'::text)
- **UPDATE** — Admin can update submissions _(to authenticated)_
  - `USING` (auth.email() = 'bertmill19@gmail.com'::text)
  - `WITH CHECK` (auth.email() = 'bertmill19@gmail.com'::text)
- **SELECT** — Anyone can read finalist submissions _(to authenticated, anon)_
  - `USING` (is_finalist = true)
- **INSERT** — Anyone can submit _(to authenticated, anon)_
  - `WITH CHECK` true

## `home_visions`

- **ALL** — Users can manage their own home vision
  - `USING` (auth.uid() = user_id)
  - `WITH CHECK` (auth.uid() = user_id)

## `identities`

- **ALL** — Users can manage their own identities
  - `USING` (auth.uid() = user_id)

## `innovation_hackathon_signups`

- **SELECT** — innovation_hackathon_signups_admin_select _(to authenticated)_
  - `USING` ((auth.jwt() ->> 'email'::text) = 'bertmill19@gmail.com'::text)
- **INSERT** — innovation_hackathon_signups_public_insert _(to authenticated, anon)_
  - `WITH CHECK` true

## `likes`

- **SELECT** — Anyone can view likes
  - `USING` true
- **DELETE** — Users can delete their own likes
  - `USING` (auth.uid() = user_id)
- **INSERT** — Users can insert their own likes
  - `WITH CHECK` (auth.uid() = user_id)

## `matcher_contacts`

- **DELETE** — Users can delete own contacts
  - `USING` (auth.uid() = user_id)
- **INSERT** — Users can insert own contacts
  - `WITH CHECK` (auth.uid() = user_id)
- **UPDATE** — Users can update own contacts
  - `USING` (auth.uid() = user_id)
- **SELECT** — Users can view own contacts
  - `USING` (auth.uid() = user_id)

## `meetups`

- **DELETE** — Owner can delete meetups
  - `USING` (auth.uid() = created_by)
- **INSERT** — Owner can insert meetups
  - `WITH CHECK` (auth.uid() = created_by)
- **SELECT** — Owner can select meetups
  - `USING` (auth.uid() = created_by)
- **UPDATE** — Owner can update meetups
  - `USING` (auth.uid() = created_by)

## `messages`

- **INSERT** — Users can send messages in own conversations
  - `WITH CHECK` ((auth.uid() = sender_id) AND (EXISTS ( SELECT 1 FROM public.conversations c WHERE ((c.id = messages.conversation_id) AND ((c.participant_1 = auth.uid()) OR (c.participant_2 = auth.uid()))))))
- **UPDATE** — Users can update own messages
  - `USING` ((auth.uid() = sender_id) OR (EXISTS ( SELECT 1 FROM public.conversations c WHERE ((c.id = messages.conversation_id) AND ((c.participant_1 = auth.uid()) OR (c.participant_2 = auth.uid()))))))
- **SELECT** — Users can view messages in own conversations
  - `USING` (EXISTS ( SELECT 1 FROM public.conversations c WHERE ((c.id = messages.conversation_id) AND ((c.participant_1 = auth.uid()) OR (c.participant_2 = auth.uid())))))

## `mulerun_demos`

- **INSERT** — mulerun_demos_anon_insert _(to authenticated, anon)_
  - `WITH CHECK` true
- **SELECT** — mulerun_demos_anon_select _(to authenticated, anon)_
  - `USING` true

## `mulerun_signups`

- **INSERT** — mulerun_signups_anon_insert _(to authenticated, anon)_
  - `WITH CHECK` true
- **SELECT** — mulerun_signups_anon_select _(to authenticated, anon)_
  - `USING` true

## `mulerun_votes`

- **INSERT** — mulerun_votes_anon_insert _(to authenticated, anon)_
  - `WITH CHECK` true
- **SELECT** — mulerun_votes_anon_select _(to authenticated, anon)_
  - `USING` true
- **UPDATE** — mulerun_votes_anon_update _(to authenticated, anon)_
  - `USING` true
  - `WITH CHECK` true

## `podcast_guests`

- **ALL** — Admin full access to podcast guests
  - `USING` ((auth.jwt() ->> 'email'::text) = 'bertmill19@gmail.com'::text)
  - `WITH CHECK` ((auth.jwt() ->> 'email'::text) = 'bertmill19@gmail.com'::text)
- **SELECT** — Anyone can read podcast guests
  - `USING` (EXISTS ( SELECT 1 FROM public.podcasts WHERE ((podcasts.id = podcast_guests.podcast_id) AND (podcasts.is_published = true))))

## `podcasts`

- **ALL** — Admin full access to podcasts
  - `USING` ((auth.jwt() ->> 'email'::text) = 'bertmill19@gmail.com'::text)
  - `WITH CHECK` ((auth.jwt() ->> 'email'::text) = 'bertmill19@gmail.com'::text)
- **SELECT** — Anyone can read published podcasts
  - `USING` (is_published = true)

## `profile_event_notes`

- **DELETE** — Creator can delete profile_event_notes
  - `USING` (auth.uid() = created_by)
- **INSERT** — Creator can insert profile_event_notes
  - `WITH CHECK` (auth.uid() = created_by)
- **SELECT** — Creator can select profile_event_notes
  - `USING` (auth.uid() = created_by)
- **UPDATE** — Creator can update profile_event_notes
  - `USING` (auth.uid() = created_by)

## `profiles`

- **SELECT** — Public profiles are viewable by everyone
  - `USING` true
- **INSERT** — Users can insert own profile
  - `WITH CHECK` (auth.uid() = id)
- **UPDATE** — Users can update own profile
  - `USING` (auth.uid() = id)

## `projects`

- **SELECT** — Projects are viewable by everyone
  - `USING` true
- **SELECT** — Public projects are viewable by everyone
  - `USING` true
- **ALL** — Users can CRUD own projects
  - `USING` (auth.uid() = user_id)
- **DELETE** — Users can delete own projects
  - `USING` (auth.uid() = user_id)
- **INSERT** — Users can insert own projects
  - `WITH CHECK` (auth.uid() = user_id)
- **UPDATE** — Users can update own projects
  - `USING` (auth.uid() = user_id)

## `reports`

- **INSERT** — Users can create reports
  - `WITH CHECK` (auth.uid() = reporter_id)
- **SELECT** — Users can view their own reports
  - `USING` (auth.uid() = reporter_id)

## `scheduled_posts`

- **DELETE** — Users can delete their own scheduled posts
  - `USING` (auth.uid() = user_id)
- **INSERT** — Users can insert their own scheduled posts
  - `WITH CHECK` (auth.uid() = user_id)
- **UPDATE** — Users can update their own scheduled posts
  - `USING` (auth.uid() = user_id)
- **SELECT** — Users can view their own scheduled posts
  - `USING` (auth.uid() = user_id)

## `social_connections`

- **DELETE** — Users can delete own connections
  - `USING` (auth.uid() = user_id)
- **INSERT** — Users can insert own connections
  - `WITH CHECK` (auth.uid() = user_id)
- **UPDATE** — Users can update own connections
  - `USING` (auth.uid() = user_id)
- **SELECT** — Users can view own connections
  - `USING` (auth.uid() = user_id)

## `value_portfolio`

- **SELECT** — Public value_portfolio are viewable by everyone
  - `USING` true
- **DELETE** — Users can delete own portfolio items
  - `USING` (auth.uid() = user_id)
- **INSERT** — Users can insert own portfolio items
  - `WITH CHECK` (auth.uid() = user_id)
- **UPDATE** — Users can update own portfolio items
  - `USING` (auth.uid() = user_id)

## `workshops`

- **SELECT** — Anyone can view published workshops
  - `USING` (is_published = true)
- **ALL** — Authenticated users can manage workshops
  - `USING` (auth.role() = 'authenticated'::text)
