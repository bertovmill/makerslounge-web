-- Make RLS work for both Supabase and Clerk sessions.
--
-- 68 policy expressions call auth.uid(), which reads the Supabase session JWT.
-- Once Clerk authenticates, no Supabase JWT exists, auth.uid() is NULL, and all
-- 68 checks fail closed — users would appear signed in and see none of their
-- own data.
--
-- current_profile_id() replaces auth.uid() and understands both tokens, so this
-- migration is safe to apply BEFORE the cutover and does not require a
-- big-bang switch:
--
--   * Clerk token    — `sub` looks like `user_xxx`; resolved through
--                      profiles.clerk_user_id to the profile uuid.
--   * Supabase token — `sub` is already the uuid; returned unchanged, so
--                      current behaviour is preserved exactly.
--
-- SECURITY DEFINER is required, not incidental: the function reads
-- public.profiles, and profiles' own policies call this function. Without it
-- the lookup would recurse into the policy that invoked it. search_path is
-- pinned for the usual reason a SECURITY DEFINER function must pin it.

BEGIN;

CREATE OR REPLACE FUNCTION public.current_profile_id()
RETURNS uuid
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $fn$
DECLARE
  sub text := auth.jwt() ->> 'sub';
  pid uuid;
BEGIN
  IF sub IS NULL OR sub = '' THEN
    RETURN NULL;
  END IF;

  -- Clerk ids carry a prefix; Supabase subjects are bare uuids.
  IF sub LIKE 'user\_%' THEN
    SELECT id INTO pid FROM public.profiles WHERE clerk_user_id = sub LIMIT 1;
    RETURN pid;
  END IF;

  BEGIN
    RETURN sub::uuid;
  EXCEPTION WHEN others THEN
    -- An unrecognised subject denies rather than errors: a policy that throws
    -- turns into a 500, while NULL simply matches no rows.
    RETURN NULL;
  END;
END;
$fn$;

COMMENT ON FUNCTION public.current_profile_id() IS
  'Row-owner id for RLS. Understands both Clerk (sub=user_xxx, mapped via profiles.clerk_user_id) and Supabase (sub=uuid) sessions. Replaces auth.uid() in policies during the Clerk migration.';

GRANT EXECUTE ON FUNCTION public.current_profile_id() TO anon, authenticated, service_role;

DROP POLICY "Users can block others" ON public.blocked_users;
CREATE POLICY "Users can block others" ON public.blocked_users AS PERMISSIVE FOR INSERT TO public
  WITH CHECK ((public.current_profile_id() = blocker_id));
DROP POLICY "Users can unblock" ON public.blocked_users;
CREATE POLICY "Users can unblock" ON public.blocked_users AS PERMISSIVE FOR DELETE TO public
  USING ((public.current_profile_id() = blocker_id));
DROP POLICY "Users can view their blocks" ON public.blocked_users;
CREATE POLICY "Users can view their blocks" ON public.blocked_users AS PERMISSIVE FOR SELECT TO public
  USING ((public.current_profile_id() = blocker_id));
DROP POLICY "Authenticated users can create posts" ON public.blog_posts;
CREATE POLICY "Authenticated users can create posts" ON public.blog_posts AS PERMISSIVE FOR INSERT TO public
  WITH CHECK ((public.current_profile_id() IS NOT NULL));
DROP POLICY "Authenticated users can read all posts" ON public.blog_posts;
CREATE POLICY "Authenticated users can read all posts" ON public.blog_posts AS PERMISSIVE FOR SELECT TO public
  USING ((public.current_profile_id() IS NOT NULL));
DROP POLICY "Authors can delete their own posts" ON public.blog_posts;
CREATE POLICY "Authors can delete their own posts" ON public.blog_posts AS PERMISSIVE FOR DELETE TO public
  USING ((public.current_profile_id() = author_id));
DROP POLICY "Authors can update their own posts" ON public.blog_posts;
CREATE POLICY "Authors can update their own posts" ON public.blog_posts AS PERMISSIVE FOR UPDATE TO public
  USING ((public.current_profile_id() = author_id))
  WITH CHECK ((public.current_profile_id() = author_id));
DROP POLICY "Users can create broadcast accounts" ON public.broadcast_accounts;
CREATE POLICY "Users can create broadcast accounts" ON public.broadcast_accounts AS PERMISSIVE FOR INSERT TO public
  WITH CHECK ((public.current_profile_id() = user_id));
DROP POLICY "Users can delete their own broadcast accounts" ON public.broadcast_accounts;
CREATE POLICY "Users can delete their own broadcast accounts" ON public.broadcast_accounts AS PERMISSIVE FOR DELETE TO public
  USING ((public.current_profile_id() = user_id));
DROP POLICY "Users can update their own broadcast accounts" ON public.broadcast_accounts;
CREATE POLICY "Users can update their own broadcast accounts" ON public.broadcast_accounts AS PERMISSIVE FOR UPDATE TO public
  USING ((public.current_profile_id() = user_id))
  WITH CHECK ((public.current_profile_id() = user_id));
DROP POLICY "Users can view their own broadcast accounts" ON public.broadcast_accounts;
CREATE POLICY "Users can view their own broadcast accounts" ON public.broadcast_accounts AS PERMISSIVE FOR SELECT TO public
  USING ((public.current_profile_id() = user_id));
DROP POLICY "Users can create broadcast channels" ON public.broadcast_channels;
CREATE POLICY "Users can create broadcast channels" ON public.broadcast_channels AS PERMISSIVE FOR INSERT TO public
  WITH CHECK ((public.current_profile_id() = user_id));
DROP POLICY "Users can delete their own broadcast channels" ON public.broadcast_channels;
CREATE POLICY "Users can delete their own broadcast channels" ON public.broadcast_channels AS PERMISSIVE FOR DELETE TO public
  USING ((public.current_profile_id() = user_id));
DROP POLICY "Users can update their own broadcast channels" ON public.broadcast_channels;
CREATE POLICY "Users can update their own broadcast channels" ON public.broadcast_channels AS PERMISSIVE FOR UPDATE TO public
  USING ((public.current_profile_id() = user_id))
  WITH CHECK ((public.current_profile_id() = user_id));
DROP POLICY "Users can view their own broadcast channels" ON public.broadcast_channels;
CREATE POLICY "Users can view their own broadcast channels" ON public.broadcast_channels AS PERMISSIVE FOR SELECT TO public
  USING ((public.current_profile_id() = user_id));
DROP POLICY "Users can delete their own comments" ON public.comments;
CREATE POLICY "Users can delete their own comments" ON public.comments AS PERMISSIVE FOR DELETE TO public
  USING ((public.current_profile_id() = user_id));
DROP POLICY "Users can insert their own comments" ON public.comments;
CREATE POLICY "Users can insert their own comments" ON public.comments AS PERMISSIVE FOR INSERT TO public
  WITH CHECK ((public.current_profile_id() = user_id));
DROP POLICY "Recipients can respond to requests" ON public.connections;
CREATE POLICY "Recipients can respond to requests" ON public.connections AS PERMISSIVE FOR UPDATE TO public
  USING ((public.current_profile_id() = recipient_id))
  WITH CHECK ((public.current_profile_id() = recipient_id));
DROP POLICY "Users can delete their connections" ON public.connections;
CREATE POLICY "Users can delete their connections" ON public.connections AS PERMISSIVE FOR DELETE TO public
  USING ((((public.current_profile_id() = requester_id) AND (status = 'pending'::text)) OR (((public.current_profile_id() = requester_id) OR (public.current_profile_id() = recipient_id)) AND (status = 'accepted'::text))));
DROP POLICY "Users can send connection requests" ON public.connections;
CREATE POLICY "Users can send connection requests" ON public.connections AS PERMISSIVE FOR INSERT TO public
  WITH CHECK ((public.current_profile_id() = requester_id));
DROP POLICY "Users can view their own connections" ON public.connections;
CREATE POLICY "Users can view their own connections" ON public.connections AS PERMISSIVE FOR SELECT TO public
  USING (((public.current_profile_id() = requester_id) OR (public.current_profile_id() = recipient_id)));
DROP POLICY "Users can delete own content_events" ON public.content_events;
CREATE POLICY "Users can delete own content_events" ON public.content_events AS PERMISSIVE FOR DELETE TO public
  USING ((public.current_profile_id() = user_id));
DROP POLICY "Users can insert own content_events" ON public.content_events;
CREATE POLICY "Users can insert own content_events" ON public.content_events AS PERMISSIVE FOR INSERT TO public
  WITH CHECK ((public.current_profile_id() = user_id));
DROP POLICY "Users can update own content_events" ON public.content_events;
CREATE POLICY "Users can update own content_events" ON public.content_events AS PERMISSIVE FOR UPDATE TO public
  USING ((public.current_profile_id() = user_id));
DROP POLICY "Users can view own content_events" ON public.content_events;
CREATE POLICY "Users can view own content_events" ON public.content_events AS PERMISSIVE FOR SELECT TO public
  USING ((public.current_profile_id() = user_id));
DROP POLICY "Users can create conversations" ON public.conversations;
CREATE POLICY "Users can create conversations" ON public.conversations AS PERMISSIVE FOR INSERT TO public
  WITH CHECK (((public.current_profile_id() = participant_1) OR (public.current_profile_id() = participant_2)));
DROP POLICY "Users can update own conversations" ON public.conversations;
CREATE POLICY "Users can update own conversations" ON public.conversations AS PERMISSIVE FOR UPDATE TO public
  USING (((public.current_profile_id() = participant_1) OR (public.current_profile_id() = participant_2)));
DROP POLICY "Users can view own conversations" ON public.conversations;
CREATE POLICY "Users can view own conversations" ON public.conversations AS PERMISSIVE FOR SELECT TO public
  USING (((public.current_profile_id() = participant_1) OR (public.current_profile_id() = participant_2)));
DROP POLICY "Users can manage their own home vision" ON public.home_visions;
CREATE POLICY "Users can manage their own home vision" ON public.home_visions AS PERMISSIVE FOR ALL TO public
  USING ((public.current_profile_id() = user_id))
  WITH CHECK ((public.current_profile_id() = user_id));
DROP POLICY "Users can manage their own identities" ON public.identities;
CREATE POLICY "Users can manage their own identities" ON public.identities AS PERMISSIVE FOR ALL TO public
  USING ((public.current_profile_id() = user_id));
DROP POLICY "Users can delete their own likes" ON public.likes;
CREATE POLICY "Users can delete their own likes" ON public.likes AS PERMISSIVE FOR DELETE TO public
  USING ((public.current_profile_id() = user_id));
DROP POLICY "Users can insert their own likes" ON public.likes;
CREATE POLICY "Users can insert their own likes" ON public.likes AS PERMISSIVE FOR INSERT TO public
  WITH CHECK ((public.current_profile_id() = user_id));
DROP POLICY "Users can delete own contacts" ON public.matcher_contacts;
CREATE POLICY "Users can delete own contacts" ON public.matcher_contacts AS PERMISSIVE FOR DELETE TO public
  USING ((public.current_profile_id() = user_id));
DROP POLICY "Users can insert own contacts" ON public.matcher_contacts;
CREATE POLICY "Users can insert own contacts" ON public.matcher_contacts AS PERMISSIVE FOR INSERT TO public
  WITH CHECK ((public.current_profile_id() = user_id));
DROP POLICY "Users can update own contacts" ON public.matcher_contacts;
CREATE POLICY "Users can update own contacts" ON public.matcher_contacts AS PERMISSIVE FOR UPDATE TO public
  USING ((public.current_profile_id() = user_id));
DROP POLICY "Users can view own contacts" ON public.matcher_contacts;
CREATE POLICY "Users can view own contacts" ON public.matcher_contacts AS PERMISSIVE FOR SELECT TO public
  USING ((public.current_profile_id() = user_id));
DROP POLICY "Owner can delete meetups" ON public.meetups;
CREATE POLICY "Owner can delete meetups" ON public.meetups AS PERMISSIVE FOR DELETE TO public
  USING ((public.current_profile_id() = created_by));
DROP POLICY "Owner can insert meetups" ON public.meetups;
CREATE POLICY "Owner can insert meetups" ON public.meetups AS PERMISSIVE FOR INSERT TO public
  WITH CHECK ((public.current_profile_id() = created_by));
DROP POLICY "Owner can select meetups" ON public.meetups;
CREATE POLICY "Owner can select meetups" ON public.meetups AS PERMISSIVE FOR SELECT TO public
  USING ((public.current_profile_id() = created_by));
DROP POLICY "Owner can update meetups" ON public.meetups;
CREATE POLICY "Owner can update meetups" ON public.meetups AS PERMISSIVE FOR UPDATE TO public
  USING ((public.current_profile_id() = created_by));
DROP POLICY "Users can send messages in own conversations" ON public.messages;
CREATE POLICY "Users can send messages in own conversations" ON public.messages AS PERMISSIVE FOR INSERT TO public
  WITH CHECK (((public.current_profile_id() = sender_id) AND (EXISTS ( SELECT 1
   FROM conversations c
  WHERE ((c.id = messages.conversation_id) AND ((c.participant_1 = public.current_profile_id()) OR (c.participant_2 = public.current_profile_id())))))));
DROP POLICY "Users can update own messages" ON public.messages;
CREATE POLICY "Users can update own messages" ON public.messages AS PERMISSIVE FOR UPDATE TO public
  USING (((public.current_profile_id() = sender_id) OR (EXISTS ( SELECT 1
   FROM conversations c
  WHERE ((c.id = messages.conversation_id) AND ((c.participant_1 = public.current_profile_id()) OR (c.participant_2 = public.current_profile_id())))))));
DROP POLICY "Users can view messages in own conversations" ON public.messages;
CREATE POLICY "Users can view messages in own conversations" ON public.messages AS PERMISSIVE FOR SELECT TO public
  USING ((EXISTS ( SELECT 1
   FROM conversations c
  WHERE ((c.id = messages.conversation_id) AND ((c.participant_1 = public.current_profile_id()) OR (c.participant_2 = public.current_profile_id()))))));
DROP POLICY "Creator can delete profile_event_notes" ON public.profile_event_notes;
CREATE POLICY "Creator can delete profile_event_notes" ON public.profile_event_notes AS PERMISSIVE FOR DELETE TO public
  USING ((public.current_profile_id() = created_by));
DROP POLICY "Creator can insert profile_event_notes" ON public.profile_event_notes;
CREATE POLICY "Creator can insert profile_event_notes" ON public.profile_event_notes AS PERMISSIVE FOR INSERT TO public
  WITH CHECK ((public.current_profile_id() = created_by));
DROP POLICY "Creator can select profile_event_notes" ON public.profile_event_notes;
CREATE POLICY "Creator can select profile_event_notes" ON public.profile_event_notes AS PERMISSIVE FOR SELECT TO public
  USING ((public.current_profile_id() = created_by));
DROP POLICY "Creator can update profile_event_notes" ON public.profile_event_notes;
CREATE POLICY "Creator can update profile_event_notes" ON public.profile_event_notes AS PERMISSIVE FOR UPDATE TO public
  USING ((public.current_profile_id() = created_by));
DROP POLICY "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles AS PERMISSIVE FOR INSERT TO public
  WITH CHECK ((public.current_profile_id() = id));
DROP POLICY "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles AS PERMISSIVE FOR UPDATE TO public
  USING ((public.current_profile_id() = id));
DROP POLICY "Users can CRUD own projects" ON public.projects;
CREATE POLICY "Users can CRUD own projects" ON public.projects AS PERMISSIVE FOR ALL TO public
  USING ((public.current_profile_id() = user_id));
DROP POLICY "Users can delete own projects" ON public.projects;
CREATE POLICY "Users can delete own projects" ON public.projects AS PERMISSIVE FOR DELETE TO public
  USING ((public.current_profile_id() = user_id));
DROP POLICY "Users can insert own projects" ON public.projects;
CREATE POLICY "Users can insert own projects" ON public.projects AS PERMISSIVE FOR INSERT TO public
  WITH CHECK ((public.current_profile_id() = user_id));
DROP POLICY "Users can update own projects" ON public.projects;
CREATE POLICY "Users can update own projects" ON public.projects AS PERMISSIVE FOR UPDATE TO public
  USING ((public.current_profile_id() = user_id));
DROP POLICY "Users can create reports" ON public.reports;
CREATE POLICY "Users can create reports" ON public.reports AS PERMISSIVE FOR INSERT TO public
  WITH CHECK ((public.current_profile_id() = reporter_id));
DROP POLICY "Users can view their own reports" ON public.reports;
CREATE POLICY "Users can view their own reports" ON public.reports AS PERMISSIVE FOR SELECT TO public
  USING ((public.current_profile_id() = reporter_id));
DROP POLICY "Users can delete their own scheduled posts" ON public.scheduled_posts;
CREATE POLICY "Users can delete their own scheduled posts" ON public.scheduled_posts AS PERMISSIVE FOR DELETE TO public
  USING ((public.current_profile_id() = user_id));
DROP POLICY "Users can insert their own scheduled posts" ON public.scheduled_posts;
CREATE POLICY "Users can insert their own scheduled posts" ON public.scheduled_posts AS PERMISSIVE FOR INSERT TO public
  WITH CHECK ((public.current_profile_id() = user_id));
DROP POLICY "Users can update their own scheduled posts" ON public.scheduled_posts;
CREATE POLICY "Users can update their own scheduled posts" ON public.scheduled_posts AS PERMISSIVE FOR UPDATE TO public
  USING ((public.current_profile_id() = user_id));
DROP POLICY "Users can view their own scheduled posts" ON public.scheduled_posts;
CREATE POLICY "Users can view their own scheduled posts" ON public.scheduled_posts AS PERMISSIVE FOR SELECT TO public
  USING ((public.current_profile_id() = user_id));
DROP POLICY "Users can delete own connections" ON public.social_connections;
CREATE POLICY "Users can delete own connections" ON public.social_connections AS PERMISSIVE FOR DELETE TO public
  USING ((public.current_profile_id() = user_id));
DROP POLICY "Users can insert own connections" ON public.social_connections;
CREATE POLICY "Users can insert own connections" ON public.social_connections AS PERMISSIVE FOR INSERT TO public
  WITH CHECK ((public.current_profile_id() = user_id));
DROP POLICY "Users can update own connections" ON public.social_connections;
CREATE POLICY "Users can update own connections" ON public.social_connections AS PERMISSIVE FOR UPDATE TO public
  USING ((public.current_profile_id() = user_id));
DROP POLICY "Users can view own connections" ON public.social_connections;
CREATE POLICY "Users can view own connections" ON public.social_connections AS PERMISSIVE FOR SELECT TO public
  USING ((public.current_profile_id() = user_id));
DROP POLICY "Users can delete own portfolio items" ON public.value_portfolio;
CREATE POLICY "Users can delete own portfolio items" ON public.value_portfolio AS PERMISSIVE FOR DELETE TO public
  USING ((public.current_profile_id() = user_id));
DROP POLICY "Users can insert own portfolio items" ON public.value_portfolio;
CREATE POLICY "Users can insert own portfolio items" ON public.value_portfolio AS PERMISSIVE FOR INSERT TO public
  WITH CHECK ((public.current_profile_id() = user_id));
DROP POLICY "Users can update own portfolio items" ON public.value_portfolio;
CREATE POLICY "Users can update own portfolio items" ON public.value_portfolio AS PERMISSIVE FOR UPDATE TO public
  USING ((public.current_profile_id() = user_id));

COMMIT;
