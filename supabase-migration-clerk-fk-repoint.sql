-- Re-point identity foreign keys from auth.users to profiles.
--
-- Clerk is taking over authentication, which means `auth.users` stops being
-- filled — but 19 foreign keys in this schema still require a row there. The
-- most important is `profiles_id_fkey`: without this migration a Clerk-only
-- signup cannot even get a profile row, because the database demands a matching
-- Supabase auth user.
--
-- Re-pointing rather than dropping keeps database-enforced integrity and the
-- ON DELETE behaviour. Each constraint below preserves its original action —
-- generated from pg_constraint.confdeltype rather than transcribed by hand.
-- Verified safe before running: zero orphan rows across all 19 constraints,
-- i.e. every referenced auth user already has a profile.
--
-- `profiles.id` keeps its existing uuid values, so no data changes and nothing
-- that reads `user.id` has to change. profiles simply becomes the root identity
-- table, which is the shape Phase 2 needs when this data moves to Neon.

BEGIN;

ALTER TABLE public.blocked_users DROP CONSTRAINT blocked_users_blocked_id_fkey;
ALTER TABLE public.blocked_users ADD CONSTRAINT blocked_users_blocked_id_fkey FOREIGN KEY (blocked_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE public.blocked_users DROP CONSTRAINT blocked_users_blocker_id_fkey;
ALTER TABLE public.blocked_users ADD CONSTRAINT blocked_users_blocker_id_fkey FOREIGN KEY (blocker_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE public.broadcast_accounts DROP CONSTRAINT broadcast_accounts_user_id_fkey;
ALTER TABLE public.broadcast_accounts ADD CONSTRAINT broadcast_accounts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE public.broadcast_channels DROP CONSTRAINT broadcast_channels_user_id_fkey;
ALTER TABLE public.broadcast_channels ADD CONSTRAINT broadcast_channels_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE public.content_events DROP CONSTRAINT content_events_user_id_fkey;
ALTER TABLE public.content_events ADD CONSTRAINT content_events_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE public.events DROP CONSTRAINT events_created_by_fkey;
ALTER TABLE public.events ADD CONSTRAINT events_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id);
ALTER TABLE public.feedback DROP CONSTRAINT feedback_user_id_fkey;
ALTER TABLE public.feedback ADD CONSTRAINT feedback_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.home_visions DROP CONSTRAINT home_visions_user_id_fkey;
ALTER TABLE public.home_visions ADD CONSTRAINT home_visions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE public.identities DROP CONSTRAINT identities_user_id_fkey;
ALTER TABLE public.identities ADD CONSTRAINT identities_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE public.matcher_contacts DROP CONSTRAINT matcher_contacts_user_id_fkey;
ALTER TABLE public.matcher_contacts ADD CONSTRAINT matcher_contacts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE public.matcher_events DROP CONSTRAINT matcher_events_user_id_fkey;
ALTER TABLE public.matcher_events ADD CONSTRAINT matcher_events_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id);
ALTER TABLE public.meetups DROP CONSTRAINT meetups_created_by_fkey;
ALTER TABLE public.meetups ADD CONSTRAINT meetups_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE public.profile_event_notes DROP CONSTRAINT profile_event_notes_created_by_fkey;
ALTER TABLE public.profile_event_notes ADD CONSTRAINT profile_event_notes_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id);
ALTER TABLE public.profile_event_notes DROP CONSTRAINT profile_event_notes_profile_id_fkey;
ALTER TABLE public.profile_event_notes ADD CONSTRAINT profile_event_notes_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE public.reports DROP CONSTRAINT reports_reported_user_id_fkey;
ALTER TABLE public.reports ADD CONSTRAINT reports_reported_user_id_fkey FOREIGN KEY (reported_user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE public.reports DROP CONSTRAINT reports_reporter_id_fkey;
ALTER TABLE public.reports ADD CONSTRAINT reports_reporter_id_fkey FOREIGN KEY (reporter_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE public.scheduled_posts DROP CONSTRAINT scheduled_posts_user_id_fkey;
ALTER TABLE public.scheduled_posts ADD CONSTRAINT scheduled_posts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE public.social_connections DROP CONSTRAINT social_connections_user_id_fkey;
ALTER TABLE public.social_connections ADD CONSTRAINT social_connections_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- profiles becomes the root: its id no longer has to exist in auth.users.
ALTER TABLE public.profiles DROP CONSTRAINT profiles_id_fkey;

COMMIT;
