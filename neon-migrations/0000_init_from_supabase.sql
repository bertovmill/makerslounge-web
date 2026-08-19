-- Site schema for Neon, generated from a live Supabase `public` dump.
--
-- Transformed by tmp/transform.py: schema renamed to `makerslounge`, and every
-- Supabase-only construct removed -- 112 RLS policies, `current_profile_id()`
-- (the RLS helper that read auth.jwt()), and `handle_new_user()` (a trigger on
-- auth.users, made redundant when Clerk took over signup).
--
-- Authorization now lives in application code, per-route. RLS is deliberately
-- NOT recreated here: Neon has no JWT-aware policy layer, so a policy left in
-- SQL would simply never be enforced.

CREATE SCHEMA IF NOT EXISTS makerslounge;
SET search_path = makerslounge, public;

-- Required, not cosmetic: pg_dump emits functions before the tables they query,
-- and `innovation_signups_count()` is LANGUAGE sql, whose body Postgres
-- validates at CREATE time unless this is off.
SET check_function_bodies = false;

CREATE FUNCTION makerslounge.innovation_signups_count() RETURNS bigint
    LANGUAGE sql SECURITY DEFINER
    SET search_path TO 'makerslounge'
    AS $$
  select count(*) from makerslounge.innovation_hackathon_signups;
$$;

CREATE FUNCTION makerslounge.match_community_contact(p_user_id uuid, p_user_email text) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'makerslounge', 'pg_temp'
    AS $$                                            
  BEGIN                                                     
    UPDATE community_contacts
    SET matched_profile_id = p_user_id, matched_at = NOW()
    WHERE LOWER(email) = LOWER(p_user_email) AND                
  matched_profile_id IS NULL;
  END;                                                          
  $$;

CREATE FUNCTION makerslounge.set_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
begin
  new.updated_at = now();
  return new;
end;
$$;

CREATE FUNCTION makerslounge.update_blog_posts_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE FUNCTION makerslounge.update_broadcast_ideas_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$                                                                                                                                        
  BEGIN                                                                                                                                                        
    NEW.updated_at = NOW();                                                                                                                                    
    RETURN NEW;                                                                                                                                                
  END;                                                                                                                                                         
  $$;

CREATE FUNCTION makerslounge.update_connections_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE FUNCTION makerslounge.update_email_subscription_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE FUNCTION makerslounge.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TABLE makerslounge.applications (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    email text NOT NULL,
    name text NOT NULL,
    what_are_you_building text,
    linkedin text,
    how_did_you_hear text,
    status text DEFAULT 'pending'::text,
    admin_notes text,
    created_at timestamp with time zone DEFAULT now(),
    reviewed_at timestamp with time zone,
    reviewed_by uuid,
    help_with text,
    skills text[],
    looking_for_skills text[],
    other_socials jsonb,
    CONSTRAINT applications_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text])))
);

CREATE TABLE makerslounge.blocked_users (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    blocker_id uuid NOT NULL,
    blocked_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE makerslounge.blog_posts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    slug text NOT NULL,
    title text NOT NULL,
    excerpt text NOT NULL,
    content text NOT NULL,
    author_id uuid,
    cover_image text,
    read_time_minutes integer DEFAULT 5,
    is_published boolean DEFAULT false,
    is_featured boolean DEFAULT false,
    tags text[] DEFAULT ARRAY[]::text[],
    published_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE makerslounge.broadcast_accounts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    name text NOT NULL,
    type text DEFAULT 'personal'::text NOT NULL,
    avatar_url text,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT broadcast_accounts_type_check CHECK ((type = ANY (ARRAY['personal'::text, 'business'::text])))
);

CREATE TABLE makerslounge.broadcast_channels (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    name text NOT NULL,
    icon text NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE makerslounge.comments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    project_id uuid NOT NULL,
    content text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    target_type text DEFAULT 'project'::text,
    target_id text
);

CREATE TABLE makerslounge.community_contacts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    email text,
    name text,
    first_name text,
    last_name text,
    notes text,
    skills text[],
    company text,
    role text,
    source text[],
    linkedin text,
    twitter text,
    instagram text,
    website text,
    matched_profile_id uuid,
    matched_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    metadata jsonb DEFAULT '{}'::jsonb,
    phone text,
    summary text,
    visibility text DEFAULT 'private'::text,
    CONSTRAINT community_contacts_visibility_check CHECK ((visibility = ANY (ARRAY['private'::text, 'public'::text])))
);

CREATE TABLE makerslounge.connections (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    requester_id uuid NOT NULL,
    recipient_id uuid NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT connections_check CHECK ((requester_id <> recipient_id)),
    CONSTRAINT connections_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'accepted'::text, 'declined'::text])))
);

CREATE TABLE makerslounge.profiles (
    id uuid NOT NULL,
    name text,
    photo_url text,
    linkedin text,
    twitter text,
    website text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    bio text,
    skills text[],
    username text,
    avatar_style text,
    whiteboard_data jsonb,
    show_whiteboard boolean DEFAULT false,
    has_completed_onboarding boolean DEFAULT false,
    theme_config jsonb DEFAULT '{"theme_id": "default"}'::jsonb,
    cover_image text,
    currently_building text,
    looking_for_skills text[],
    onboarding_completed boolean DEFAULT false,
    instagram text,
    youtube text,
    tiktok text,
    first_name text,
    last_name text,
    application_status text DEFAULT 'pending'::text,
    looking_for_help text,
    linkedin_data jsonb,
    linkedin_data_updated_at timestamp with time zone,
    clerk_user_id text
);

COMMENT ON COLUMN makerslounge.profiles.whiteboard_data IS 'Stores tldraw whiteboard document data as JSON';

COMMENT ON COLUMN makerslounge.profiles.show_whiteboard IS 'Controls whether whiteboard is visible on public profile';

COMMENT ON COLUMN makerslounge.profiles.has_completed_onboarding IS 'Tracks whether user has completed or dismissed the onboarding walkthrough';

COMMENT ON COLUMN makerslounge.profiles.clerk_user_id IS 'Clerk user id. Populated during the Supabase->Clerk migration; NULL until a profile is imported. profiles.id remains the Supabase auth uuid so both id spaces coexist during cutover.';

CREATE VIEW makerslounge.connection_counts AS
 SELECT p.id AS profile_id,
    count(DISTINCT
        CASE
            WHEN ((c.status = 'accepted'::text) AND ((c.requester_id = p.id) OR (c.recipient_id = p.id))) THEN
            CASE
                WHEN (c.requester_id = p.id) THEN c.recipient_id
                ELSE c.requester_id
            END
            ELSE NULL::uuid
        END) AS connection_count
   FROM (makerslounge.profiles p
     LEFT JOIN makerslounge.connections c ON (((c.requester_id = p.id) OR (c.recipient_id = p.id))))
  GROUP BY p.id;

CREATE TABLE makerslounge.content_events (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    name text NOT NULL,
    description text,
    event_date date NOT NULL,
    color text DEFAULT 'coral'::text,
    created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE makerslounge.conversations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    participant_1 uuid NOT NULL,
    participant_2 uuid NOT NULL,
    last_message_at timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT no_self_chat CHECK ((participant_1 <> participant_2))
);

CREATE TABLE makerslounge.email_subscriptions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    email text NOT NULL,
    subscribed_to text[] DEFAULT ARRAY['events'::text, 'podcasts'::text],
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

COMMENT ON TABLE makerslounge.email_subscriptions IS 'Email subscriptions for events and podcast updates';

COMMENT ON COLUMN makerslounge.email_subscriptions.email IS 'Subscriber email address';

COMMENT ON COLUMN makerslounge.email_subscriptions.subscribed_to IS 'Array of subscription types (events, podcasts, etc.)';

COMMENT ON COLUMN makerslounge.email_subscriptions.is_active IS 'Whether the subscription is currently active';

CREATE TABLE makerslounge.events (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text NOT NULL,
    description text,
    start_time timestamp with time zone NOT NULL,
    end_time timestamp with time zone NOT NULL,
    location text,
    image_url text,
    event_url text,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    is_all_day boolean DEFAULT false
);

CREATE TABLE makerslounge.feedback (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    email text,
    message text NOT NULL,
    completed boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    screenshot_url text
);

CREATE TABLE makerslounge.hackathon_scores (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    judge_name text NOT NULL,
    submission_id uuid NOT NULL,
    criterion_key text NOT NULL,
    score integer NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT hackathon_scores_score_check CHECK (((score >= 1) AND (score <= 5)))
);

CREATE TABLE makerslounge.hackathon_submissions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    project_link text NOT NULL,
    title text,
    description text,
    video_url text,
    file_urls text[] DEFAULT '{}'::text[],
    team_name text,
    builder_emails text[] DEFAULT '{}'::text[],
    challenge_track text,
    status text DEFAULT 'new'::text NOT NULL,
    user_agent text,
    ip_hash text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    reviewed_at timestamp with time zone,
    is_finalist boolean DEFAULT false,
    is_round2 boolean DEFAULT false NOT NULL,
    CONSTRAINT hackathon_submissions_status_check CHECK ((status = ANY (ARRAY['new'::text, 'reviewed'::text, 'finalist'::text, 'winner'::text, 'spam'::text])))
);

CREATE TABLE makerslounge.hackathon_voter_notes (
    judge_name text NOT NULL,
    submission_id uuid NOT NULL,
    notes text DEFAULT ''::text NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE makerslounge.home_visions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    title text DEFAULT 'My Roadmap'::text NOT NULL,
    subtitle text,
    pillars jsonb DEFAULT '[]'::jsonb NOT NULL,
    rule_title text,
    rule_text text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE makerslounge.identities (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    text text NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE makerslounge.innovation_hackathon_signups (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    background text NOT NULL,
    looking_for text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    email text,
    matched_team text,
    is_finalist boolean DEFAULT false,
    CONSTRAINT innovation_hackathon_signups_background_length CHECK (((char_length(background) >= 20) AND (char_length(background) <= 600))),
    CONSTRAINT innovation_hackathon_signups_looking_for_length CHECK (((char_length(looking_for) >= 20) AND (char_length(looking_for) <= 600))),
    CONSTRAINT innovation_hackathon_signups_name_length CHECK (((char_length(name) >= 1) AND (char_length(name) <= 80)))
);

CREATE TABLE makerslounge.likes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    project_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    target_type text DEFAULT 'project'::text,
    target_id text
);

CREATE TABLE makerslounge.matcher_contacts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    email text NOT NULL,
    name text NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    custom_fields jsonb DEFAULT '{}'::jsonb
);

CREATE TABLE makerslounge.matcher_events (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    name text NOT NULL,
    contacts jsonb DEFAULT '[]'::jsonb NOT NULL,
    groups jsonb,
    created_at timestamp with time zone DEFAULT now(),
    last_query text,
    last_recommendations jsonb
);

CREATE TABLE makerslounge.meetups (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    created_by uuid NOT NULL,
    participants jsonb DEFAULT '[]'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    custom_field_names jsonb DEFAULT '[]'::jsonb
);

CREATE TABLE makerslounge.messages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    conversation_id uuid NOT NULL,
    sender_id uuid NOT NULL,
    content text NOT NULL,
    read_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT messages_content_check CHECK (((char_length(content) > 0) AND (char_length(content) <= 5000)))
);

CREATE TABLE makerslounge.mulerun_demos (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    project text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    team_name text,
    video_url text,
    CONSTRAINT mulerun_demos_name_check CHECK (((length(TRIM(BOTH FROM name)) >= 1) AND (length(TRIM(BOTH FROM name)) <= 120))),
    CONSTRAINT mulerun_demos_project_check CHECK (((length(TRIM(BOTH FROM project)) >= 1) AND (length(TRIM(BOTH FROM project)) <= 200))),
    CONSTRAINT mulerun_demos_team_name_length CHECK (((team_name IS NULL) OR ((length(TRIM(BOTH FROM team_name)) >= 1) AND (length(TRIM(BOTH FROM team_name)) <= 80)))),
    CONSTRAINT mulerun_demos_video_url_length CHECK (((video_url IS NULL) OR ((length(TRIM(BOTH FROM video_url)) >= 1) AND (length(TRIM(BOTH FROM video_url)) <= 500))))
);

CREATE TABLE makerslounge.mulerun_signups (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    categories text[] DEFAULT '{}'::text[] NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT mulerun_signups_categories_check CHECK (((array_length(categories, 1) >= 1) AND (array_length(categories, 1) <= 3))),
    CONSTRAINT mulerun_signups_name_check CHECK (((length(TRIM(BOTH FROM name)) >= 1) AND (length(TRIM(BOTH FROM name)) <= 80)))
);

CREATE TABLE makerslounge.mulerun_votes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    voter_id text NOT NULL,
    first_id uuid NOT NULL,
    second_id uuid NOT NULL,
    third_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT mulerun_votes_check CHECK (((first_id <> second_id) AND (first_id <> third_id) AND (second_id <> third_id))),
    CONSTRAINT mulerun_votes_voter_id_check CHECK (((length(voter_id) >= 1) AND (length(voter_id) <= 64)))
);

CREATE TABLE makerslounge.podcast_guests (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    podcast_id uuid NOT NULL,
    profile_id uuid NOT NULL
);

CREATE TABLE makerslounge.podcasts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text NOT NULL,
    slug text NOT NULL,
    description text,
    transcript text,
    audio_url text,
    cover_image_url text,
    duration_seconds integer,
    episode_number integer,
    is_published boolean DEFAULT false,
    published_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    video_url text
);

CREATE TABLE makerslounge.profile_event_notes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    profile_id uuid NOT NULL,
    meetup_id uuid,
    meetup_name text NOT NULL,
    notes text,
    created_by uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE makerslounge.projects (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    title text NOT NULL,
    description text,
    media_urls text[],
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    category text,
    metadata jsonb,
    CONSTRAINT projects_category_check CHECK ((category = ANY (ARRAY['project_showcase'::text, 'job_board'::text, 'question'::text, 'update'::text])))
);

COMMENT ON COLUMN makerslounge.projects.category IS 'Post category: project_showcase, job_board, question, or update. NULL for legacy posts.';

CREATE TABLE makerslounge.reports (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    reporter_id uuid NOT NULL,
    reported_user_id uuid,
    project_id uuid,
    comment_id uuid,
    reason text NOT NULL,
    details text,
    status text DEFAULT 'pending'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    reviewed_at timestamp with time zone,
    CONSTRAINT reports_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'reviewed'::text, 'actioned'::text, 'dismissed'::text])))
);

CREATE TABLE makerslounge.scheduled_posts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    content text NOT NULL,
    platform text DEFAULT 'x'::text NOT NULL,
    scheduled_for timestamp with time zone NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    post_url text,
    error_message text,
    idea_id uuid,
    created_at timestamp with time zone DEFAULT now(),
    posted_at timestamp with time zone,
    qstash_message_id text,
    media_urls text[] DEFAULT '{}'::text[],
    CONSTRAINT scheduled_posts_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'posted'::text, 'failed'::text, 'cancelled'::text])))
);

CREATE TABLE makerslounge.social_connections (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    platform text NOT NULL,
    platform_user_id text NOT NULL,
    platform_username text,
    platform_name text,
    platform_avatar_url text,
    access_token text NOT NULL,
    refresh_token text,
    token_expires_at timestamp with time zone,
    scopes text[],
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE makerslounge.value_portfolio (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    title text NOT NULL,
    category text NOT NULL,
    value_description text,
    media_urls text[] DEFAULT '{}'::text[],
    links jsonb DEFAULT '[]'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE makerslounge.workshops (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text NOT NULL,
    description text NOT NULL,
    date date NOT NULL,
    "time" text NOT NULL,
    location text NOT NULL,
    instructor_name text NOT NULL,
    instructor_photo text,
    cover_image text,
    tags text[] DEFAULT '{}'::text[],
    luma_url text NOT NULL,
    spots_available integer,
    max_spots integer,
    is_published boolean DEFAULT false,
    is_virtual boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE ONLY makerslounge.applications
    ADD CONSTRAINT applications_pkey PRIMARY KEY (id);

ALTER TABLE ONLY makerslounge.blocked_users
    ADD CONSTRAINT blocked_users_blocker_id_blocked_id_key UNIQUE (blocker_id, blocked_id);

ALTER TABLE ONLY makerslounge.blocked_users
    ADD CONSTRAINT blocked_users_pkey PRIMARY KEY (id);

ALTER TABLE ONLY makerslounge.blog_posts
    ADD CONSTRAINT blog_posts_pkey PRIMARY KEY (id);

ALTER TABLE ONLY makerslounge.blog_posts
    ADD CONSTRAINT blog_posts_slug_key UNIQUE (slug);

ALTER TABLE ONLY makerslounge.broadcast_accounts
    ADD CONSTRAINT broadcast_accounts_pkey PRIMARY KEY (id);

ALTER TABLE ONLY makerslounge.broadcast_channels
    ADD CONSTRAINT broadcast_channels_pkey PRIMARY KEY (id);

ALTER TABLE ONLY makerslounge.comments
    ADD CONSTRAINT comments_pkey PRIMARY KEY (id);

ALTER TABLE ONLY makerslounge.community_contacts
    ADD CONSTRAINT community_contacts_pkey PRIMARY KEY (id);

ALTER TABLE ONLY makerslounge.connections
    ADD CONSTRAINT connections_pkey PRIMARY KEY (id);

ALTER TABLE ONLY makerslounge.connections
    ADD CONSTRAINT connections_requester_id_recipient_id_key UNIQUE (requester_id, recipient_id);

ALTER TABLE ONLY makerslounge.content_events
    ADD CONSTRAINT content_events_pkey PRIMARY KEY (id);

ALTER TABLE ONLY makerslounge.conversations
    ADD CONSTRAINT conversations_pkey PRIMARY KEY (id);

ALTER TABLE ONLY makerslounge.email_subscriptions
    ADD CONSTRAINT email_subscriptions_email_key UNIQUE (email);

ALTER TABLE ONLY makerslounge.email_subscriptions
    ADD CONSTRAINT email_subscriptions_pkey PRIMARY KEY (id);

ALTER TABLE ONLY makerslounge.events
    ADD CONSTRAINT events_pkey PRIMARY KEY (id);

ALTER TABLE ONLY makerslounge.feedback
    ADD CONSTRAINT feedback_pkey PRIMARY KEY (id);

ALTER TABLE ONLY makerslounge.hackathon_scores
    ADD CONSTRAINT hackathon_scores_judge_name_submission_id_criterion_key_key UNIQUE (judge_name, submission_id, criterion_key);

ALTER TABLE ONLY makerslounge.hackathon_scores
    ADD CONSTRAINT hackathon_scores_pkey PRIMARY KEY (id);

ALTER TABLE ONLY makerslounge.hackathon_submissions
    ADD CONSTRAINT hackathon_submissions_pkey PRIMARY KEY (id);

ALTER TABLE ONLY makerslounge.hackathon_voter_notes
    ADD CONSTRAINT hackathon_voter_notes_pkey PRIMARY KEY (judge_name, submission_id);

ALTER TABLE ONLY makerslounge.home_visions
    ADD CONSTRAINT home_visions_pkey PRIMARY KEY (id);

ALTER TABLE ONLY makerslounge.home_visions
    ADD CONSTRAINT home_visions_user_id_key UNIQUE (user_id);

ALTER TABLE ONLY makerslounge.identities
    ADD CONSTRAINT identities_pkey PRIMARY KEY (id);

ALTER TABLE ONLY makerslounge.innovation_hackathon_signups
    ADD CONSTRAINT innovation_hackathon_signups_pkey PRIMARY KEY (id);

ALTER TABLE ONLY makerslounge.likes
    ADD CONSTRAINT likes_pkey PRIMARY KEY (id);

ALTER TABLE ONLY makerslounge.likes
    ADD CONSTRAINT likes_user_id_project_id_key UNIQUE (user_id, project_id);

ALTER TABLE ONLY makerslounge.matcher_contacts
    ADD CONSTRAINT matcher_contacts_pkey PRIMARY KEY (id);

ALTER TABLE ONLY makerslounge.matcher_contacts
    ADD CONSTRAINT matcher_contacts_user_id_email_key UNIQUE (user_id, email);

ALTER TABLE ONLY makerslounge.matcher_events
    ADD CONSTRAINT matcher_events_pkey PRIMARY KEY (id);

ALTER TABLE ONLY makerslounge.meetups
    ADD CONSTRAINT meetups_pkey PRIMARY KEY (id);

ALTER TABLE ONLY makerslounge.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id);

ALTER TABLE ONLY makerslounge.mulerun_demos
    ADD CONSTRAINT mulerun_demos_pkey PRIMARY KEY (id);

ALTER TABLE ONLY makerslounge.mulerun_signups
    ADD CONSTRAINT mulerun_signups_pkey PRIMARY KEY (id);

ALTER TABLE ONLY makerslounge.mulerun_votes
    ADD CONSTRAINT mulerun_votes_pkey PRIMARY KEY (id);

ALTER TABLE ONLY makerslounge.mulerun_votes
    ADD CONSTRAINT mulerun_votes_voter_id_key UNIQUE (voter_id);

ALTER TABLE ONLY makerslounge.podcast_guests
    ADD CONSTRAINT podcast_guests_pkey PRIMARY KEY (id);

ALTER TABLE ONLY makerslounge.podcast_guests
    ADD CONSTRAINT podcast_guests_podcast_id_profile_id_key UNIQUE (podcast_id, profile_id);

ALTER TABLE ONLY makerslounge.podcasts
    ADD CONSTRAINT podcasts_pkey PRIMARY KEY (id);

ALTER TABLE ONLY makerslounge.podcasts
    ADD CONSTRAINT podcasts_slug_key UNIQUE (slug);

ALTER TABLE ONLY makerslounge.profile_event_notes
    ADD CONSTRAINT profile_event_notes_pkey PRIMARY KEY (id);

ALTER TABLE ONLY makerslounge.profile_event_notes
    ADD CONSTRAINT profile_event_notes_profile_id_meetup_id_key UNIQUE (profile_id, meetup_id);

ALTER TABLE ONLY makerslounge.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);

ALTER TABLE ONLY makerslounge.profiles
    ADD CONSTRAINT profiles_username_key UNIQUE (username);

ALTER TABLE ONLY makerslounge.projects
    ADD CONSTRAINT projects_pkey PRIMARY KEY (id);

ALTER TABLE ONLY makerslounge.reports
    ADD CONSTRAINT reports_pkey PRIMARY KEY (id);

ALTER TABLE ONLY makerslounge.scheduled_posts
    ADD CONSTRAINT scheduled_posts_pkey PRIMARY KEY (id);

ALTER TABLE ONLY makerslounge.social_connections
    ADD CONSTRAINT social_connections_pkey PRIMARY KEY (id);

ALTER TABLE ONLY makerslounge.social_connections
    ADD CONSTRAINT social_connections_user_id_platform_platform_user_id_key UNIQUE (user_id, platform, platform_user_id);

ALTER TABLE ONLY makerslounge.conversations
    ADD CONSTRAINT unique_conversation UNIQUE (participant_1, participant_2);

ALTER TABLE ONLY makerslounge.value_portfolio
    ADD CONSTRAINT value_portfolio_pkey PRIMARY KEY (id);

ALTER TABLE ONLY makerslounge.workshops
    ADD CONSTRAINT workshops_pkey PRIMARY KEY (id);

CREATE UNIQUE INDEX community_contacts_email_idx ON makerslounge.community_contacts USING btree (email);

CREATE INDEX community_contacts_matched_profile_id_idx ON makerslounge.community_contacts USING btree (matched_profile_id);

CREATE INDEX content_events_user_id_idx ON makerslounge.content_events USING btree (user_id);

CREATE INDEX events_start_time_idx ON makerslounge.events USING btree (start_time);

CREATE INDEX hackathon_submissions_created_at_idx ON makerslounge.hackathon_submissions USING btree (created_at DESC);

CREATE INDEX hackathon_submissions_status_idx ON makerslounge.hackathon_submissions USING btree (status);

CREATE INDEX home_visions_user_idx ON makerslounge.home_visions USING btree (user_id);

CREATE INDEX identities_user_idx ON makerslounge.identities USING btree (user_id);

CREATE INDEX idx_applications_email ON makerslounge.applications USING btree (email);

CREATE INDEX idx_applications_status ON makerslounge.applications USING btree (status);

CREATE INDEX idx_blocked_users_blocked ON makerslounge.blocked_users USING btree (blocked_id);

CREATE INDEX idx_blocked_users_blocker ON makerslounge.blocked_users USING btree (blocker_id);

CREATE INDEX idx_blog_posts_author_id ON makerslounge.blog_posts USING btree (author_id);

CREATE INDEX idx_blog_posts_created_at ON makerslounge.blog_posts USING btree (created_at DESC);

CREATE INDEX idx_blog_posts_featured ON makerslounge.blog_posts USING btree (is_featured, published_at DESC);

CREATE INDEX idx_blog_posts_published ON makerslounge.blog_posts USING btree (is_published, published_at DESC);

CREATE INDEX idx_blog_posts_search ON makerslounge.blog_posts USING gin (to_tsvector('english'::regconfig, ((((title || ' '::text) || excerpt) || ' '::text) || content)));

CREATE INDEX idx_blog_posts_slug ON makerslounge.blog_posts USING btree (slug);

CREATE INDEX idx_blog_posts_tags ON makerslounge.blog_posts USING gin (tags);

CREATE INDEX idx_broadcast_accounts_user ON makerslounge.broadcast_accounts USING btree (user_id);

CREATE INDEX idx_broadcast_channels_user ON makerslounge.broadcast_channels USING btree (user_id);

CREATE INDEX idx_comments_blog_posts ON makerslounge.comments USING btree (target_type, target_id) WHERE (target_type = 'blog_post'::text);

CREATE INDEX idx_comments_target ON makerslounge.comments USING btree (target_type, target_id);

CREATE INDEX idx_connections_recipient ON makerslounge.connections USING btree (recipient_id);

CREATE INDEX idx_connections_requester ON makerslounge.connections USING btree (requester_id);

CREATE INDEX idx_connections_status ON makerslounge.connections USING btree (status);

CREATE INDEX idx_conversations_participant_1 ON makerslounge.conversations USING btree (participant_1);

CREATE INDEX idx_conversations_participant_2 ON makerslounge.conversations USING btree (participant_2);

CREATE INDEX idx_email_subscriptions_created_at ON makerslounge.email_subscriptions USING btree (created_at DESC);

CREATE INDEX idx_email_subscriptions_email ON makerslounge.email_subscriptions USING btree (email);

CREATE INDEX idx_email_subscriptions_is_active ON makerslounge.email_subscriptions USING btree (is_active);

CREATE INDEX idx_likes_blog_posts ON makerslounge.likes USING btree (target_type, target_id) WHERE (target_type = 'blog_post'::text);

CREATE INDEX idx_likes_target ON makerslounge.likes USING btree (target_type, target_id);

CREATE INDEX idx_matcher_contacts_user_id ON makerslounge.matcher_contacts USING btree (user_id);

CREATE INDEX idx_matcher_events_user_id ON makerslounge.matcher_events USING btree (user_id);

CREATE INDEX idx_messages_conversation ON makerslounge.messages USING btree (conversation_id, created_at);

CREATE INDEX idx_messages_sender ON makerslounge.messages USING btree (sender_id);

CREATE INDEX idx_profiles_application_status ON makerslounge.profiles USING btree (application_status);

CREATE INDEX idx_profiles_onboarding ON makerslounge.profiles USING btree (has_completed_onboarding);

CREATE INDEX idx_projects_category ON makerslounge.projects USING btree (category);

CREATE INDEX idx_projects_category_created_at ON makerslounge.projects USING btree (category, created_at DESC);

CREATE INDEX idx_reports_reporter ON makerslounge.reports USING btree (reporter_id);

CREATE INDEX idx_reports_status ON makerslounge.reports USING btree (status);

CREATE INDEX idx_scheduled_posts_pending ON makerslounge.scheduled_posts USING btree (scheduled_for) WHERE (status = 'pending'::text);

CREATE INDEX idx_scheduled_posts_user ON makerslounge.scheduled_posts USING btree (user_id);

CREATE INDEX idx_social_connections_user_platform ON makerslounge.social_connections USING btree (user_id, platform);

CREATE INDEX idx_value_portfolio_user_id ON makerslounge.value_portfolio USING btree (user_id);

CREATE INDEX idx_workshops_date ON makerslounge.workshops USING btree (date DESC);

CREATE INDEX idx_workshops_published ON makerslounge.workshops USING btree (is_published);

CREATE INDEX innovation_hackathon_signups_created_at_idx ON makerslounge.innovation_hackathon_signups USING btree (created_at DESC);

CREATE INDEX mulerun_demos_created_at_idx ON makerslounge.mulerun_demos USING btree (created_at DESC);

CREATE INDEX mulerun_signups_created_at_idx ON makerslounge.mulerun_signups USING btree (created_at DESC);

CREATE INDEX mulerun_votes_created_at_idx ON makerslounge.mulerun_votes USING btree (created_at DESC);

CREATE UNIQUE INDEX profiles_clerk_user_id_key ON makerslounge.profiles USING btree (clerk_user_id) WHERE (clerk_user_id IS NOT NULL);

CREATE INDEX profiles_skills_idx ON makerslounge.profiles USING gin (skills);

CREATE TRIGGER connections_updated_at BEFORE UPDATE ON makerslounge.connections FOR EACH ROW EXECUTE FUNCTION makerslounge.update_connections_updated_at();

CREATE TRIGGER meetups_updated_at BEFORE UPDATE ON makerslounge.meetups FOR EACH ROW EXECUTE FUNCTION makerslounge.set_updated_at();

CREATE TRIGGER update_blog_posts_timestamp BEFORE UPDATE ON makerslounge.blog_posts FOR EACH ROW EXECUTE FUNCTION makerslounge.update_blog_posts_updated_at();

CREATE TRIGGER update_email_subscription_timestamp BEFORE UPDATE ON makerslounge.email_subscriptions FOR EACH ROW EXECUTE FUNCTION makerslounge.update_email_subscription_updated_at();

CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON makerslounge.events FOR EACH ROW EXECUTE FUNCTION makerslounge.update_updated_at_column();

CREATE TRIGGER update_workshops_updated_at BEFORE UPDATE ON makerslounge.workshops FOR EACH ROW EXECUTE FUNCTION makerslounge.update_updated_at_column();

ALTER TABLE ONLY makerslounge.applications
    ADD CONSTRAINT applications_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES makerslounge.profiles(id);

ALTER TABLE ONLY makerslounge.blocked_users
    ADD CONSTRAINT blocked_users_blocked_id_fkey FOREIGN KEY (blocked_id) REFERENCES makerslounge.profiles(id) ON DELETE CASCADE;

ALTER TABLE ONLY makerslounge.blocked_users
    ADD CONSTRAINT blocked_users_blocker_id_fkey FOREIGN KEY (blocker_id) REFERENCES makerslounge.profiles(id) ON DELETE CASCADE;

ALTER TABLE ONLY makerslounge.blog_posts
    ADD CONSTRAINT blog_posts_author_id_fkey FOREIGN KEY (author_id) REFERENCES makerslounge.profiles(id) ON DELETE CASCADE;

ALTER TABLE ONLY makerslounge.broadcast_accounts
    ADD CONSTRAINT broadcast_accounts_user_id_fkey FOREIGN KEY (user_id) REFERENCES makerslounge.profiles(id) ON DELETE CASCADE;

ALTER TABLE ONLY makerslounge.broadcast_channels
    ADD CONSTRAINT broadcast_channels_user_id_fkey FOREIGN KEY (user_id) REFERENCES makerslounge.profiles(id) ON DELETE CASCADE;

ALTER TABLE ONLY makerslounge.comments
    ADD CONSTRAINT comments_project_id_fkey FOREIGN KEY (project_id) REFERENCES makerslounge.projects(id) ON DELETE CASCADE;

ALTER TABLE ONLY makerslounge.comments
    ADD CONSTRAINT comments_user_id_fkey FOREIGN KEY (user_id) REFERENCES makerslounge.profiles(id) ON DELETE CASCADE;

ALTER TABLE ONLY makerslounge.community_contacts
    ADD CONSTRAINT community_contacts_matched_profile_id_fkey FOREIGN KEY (matched_profile_id) REFERENCES makerslounge.profiles(id);

ALTER TABLE ONLY makerslounge.connections
    ADD CONSTRAINT connections_recipient_id_fkey FOREIGN KEY (recipient_id) REFERENCES makerslounge.profiles(id) ON DELETE CASCADE;

ALTER TABLE ONLY makerslounge.connections
    ADD CONSTRAINT connections_requester_id_fkey FOREIGN KEY (requester_id) REFERENCES makerslounge.profiles(id) ON DELETE CASCADE;

ALTER TABLE ONLY makerslounge.content_events
    ADD CONSTRAINT content_events_user_id_fkey FOREIGN KEY (user_id) REFERENCES makerslounge.profiles(id) ON DELETE CASCADE;

ALTER TABLE ONLY makerslounge.conversations
    ADD CONSTRAINT conversations_participant_1_fkey FOREIGN KEY (participant_1) REFERENCES makerslounge.profiles(id) ON DELETE CASCADE;

ALTER TABLE ONLY makerslounge.conversations
    ADD CONSTRAINT conversations_participant_2_fkey FOREIGN KEY (participant_2) REFERENCES makerslounge.profiles(id) ON DELETE CASCADE;

ALTER TABLE ONLY makerslounge.events
    ADD CONSTRAINT events_created_by_fkey FOREIGN KEY (created_by) REFERENCES makerslounge.profiles(id);

ALTER TABLE ONLY makerslounge.feedback
    ADD CONSTRAINT feedback_user_id_fkey FOREIGN KEY (user_id) REFERENCES makerslounge.profiles(id) ON DELETE SET NULL;

ALTER TABLE ONLY makerslounge.hackathon_scores
    ADD CONSTRAINT hackathon_scores_submission_id_fkey FOREIGN KEY (submission_id) REFERENCES makerslounge.hackathon_submissions(id) ON DELETE CASCADE;

ALTER TABLE ONLY makerslounge.home_visions
    ADD CONSTRAINT home_visions_user_id_fkey FOREIGN KEY (user_id) REFERENCES makerslounge.profiles(id) ON DELETE CASCADE;

ALTER TABLE ONLY makerslounge.identities
    ADD CONSTRAINT identities_user_id_fkey FOREIGN KEY (user_id) REFERENCES makerslounge.profiles(id) ON DELETE CASCADE;

ALTER TABLE ONLY makerslounge.likes
    ADD CONSTRAINT likes_project_id_fkey FOREIGN KEY (project_id) REFERENCES makerslounge.projects(id) ON DELETE CASCADE;

ALTER TABLE ONLY makerslounge.likes
    ADD CONSTRAINT likes_user_id_fkey FOREIGN KEY (user_id) REFERENCES makerslounge.profiles(id) ON DELETE CASCADE;

ALTER TABLE ONLY makerslounge.matcher_contacts
    ADD CONSTRAINT matcher_contacts_user_id_fkey FOREIGN KEY (user_id) REFERENCES makerslounge.profiles(id) ON DELETE CASCADE;

ALTER TABLE ONLY makerslounge.matcher_events
    ADD CONSTRAINT matcher_events_user_id_fkey FOREIGN KEY (user_id) REFERENCES makerslounge.profiles(id);

ALTER TABLE ONLY makerslounge.meetups
    ADD CONSTRAINT meetups_created_by_fkey FOREIGN KEY (created_by) REFERENCES makerslounge.profiles(id) ON DELETE CASCADE;

ALTER TABLE ONLY makerslounge.messages
    ADD CONSTRAINT messages_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES makerslounge.conversations(id) ON DELETE CASCADE;

ALTER TABLE ONLY makerslounge.messages
    ADD CONSTRAINT messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES makerslounge.profiles(id) ON DELETE CASCADE;

ALTER TABLE ONLY makerslounge.mulerun_votes
    ADD CONSTRAINT mulerun_votes_first_id_fkey FOREIGN KEY (first_id) REFERENCES makerslounge.mulerun_demos(id) ON DELETE CASCADE;

ALTER TABLE ONLY makerslounge.mulerun_votes
    ADD CONSTRAINT mulerun_votes_second_id_fkey FOREIGN KEY (second_id) REFERENCES makerslounge.mulerun_demos(id) ON DELETE CASCADE;

ALTER TABLE ONLY makerslounge.mulerun_votes
    ADD CONSTRAINT mulerun_votes_third_id_fkey FOREIGN KEY (third_id) REFERENCES makerslounge.mulerun_demos(id) ON DELETE CASCADE;

ALTER TABLE ONLY makerslounge.podcast_guests
    ADD CONSTRAINT podcast_guests_podcast_id_fkey FOREIGN KEY (podcast_id) REFERENCES makerslounge.podcasts(id) ON DELETE CASCADE;

ALTER TABLE ONLY makerslounge.podcast_guests
    ADD CONSTRAINT podcast_guests_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES makerslounge.profiles(id) ON DELETE CASCADE;

ALTER TABLE ONLY makerslounge.podcasts
    ADD CONSTRAINT podcasts_created_by_fkey FOREIGN KEY (created_by) REFERENCES makerslounge.profiles(id);

ALTER TABLE ONLY makerslounge.profile_event_notes
    ADD CONSTRAINT profile_event_notes_created_by_fkey FOREIGN KEY (created_by) REFERENCES makerslounge.profiles(id);

ALTER TABLE ONLY makerslounge.profile_event_notes
    ADD CONSTRAINT profile_event_notes_meetup_id_fkey FOREIGN KEY (meetup_id) REFERENCES makerslounge.meetups(id) ON DELETE SET NULL;

ALTER TABLE ONLY makerslounge.profile_event_notes
    ADD CONSTRAINT profile_event_notes_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES makerslounge.profiles(id) ON DELETE CASCADE;

ALTER TABLE ONLY makerslounge.projects
    ADD CONSTRAINT projects_user_id_fkey FOREIGN KEY (user_id) REFERENCES makerslounge.profiles(id) ON DELETE CASCADE;

ALTER TABLE ONLY makerslounge.reports
    ADD CONSTRAINT reports_comment_id_fkey FOREIGN KEY (comment_id) REFERENCES makerslounge.comments(id) ON DELETE CASCADE;

ALTER TABLE ONLY makerslounge.reports
    ADD CONSTRAINT reports_project_id_fkey FOREIGN KEY (project_id) REFERENCES makerslounge.projects(id) ON DELETE CASCADE;

ALTER TABLE ONLY makerslounge.reports
    ADD CONSTRAINT reports_reported_user_id_fkey FOREIGN KEY (reported_user_id) REFERENCES makerslounge.profiles(id) ON DELETE CASCADE;

ALTER TABLE ONLY makerslounge.reports
    ADD CONSTRAINT reports_reporter_id_fkey FOREIGN KEY (reporter_id) REFERENCES makerslounge.profiles(id) ON DELETE CASCADE;

ALTER TABLE ONLY makerslounge.scheduled_posts
    ADD CONSTRAINT scheduled_posts_user_id_fkey FOREIGN KEY (user_id) REFERENCES makerslounge.profiles(id) ON DELETE CASCADE;

ALTER TABLE ONLY makerslounge.social_connections
    ADD CONSTRAINT social_connections_user_id_fkey FOREIGN KEY (user_id) REFERENCES makerslounge.profiles(id) ON DELETE CASCADE;

ALTER TABLE ONLY makerslounge.value_portfolio
    ADD CONSTRAINT value_portfolio_user_id_fkey FOREIGN KEY (user_id) REFERENCES makerslounge.profiles(id) ON DELETE CASCADE;
