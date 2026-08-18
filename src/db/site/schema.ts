// Site schema — the tables behind makerslounge.ca, migrating off Supabase.
//
// Columns, types, primary keys and foreign keys come from the live database's
// PostgREST OpenAPI spec; UNIQUE constraints and indexes come from a
// `pg_dump --schema-only` of the same database. Two sources because PostgREST
// describes neither constraints nor indexes, and a missing UNIQUE does not
// throw — it silently permits duplicates. Both were taken 2026-08-16.
//
// These live in their own Postgres schema (`makerslounge`) inside the same Neon
// project as the Eve workshop's four tables, which stay in `public`. One
// connection string, one bill, no name collisions.
//
// NOT YET IN USE. Phase 0 of docs/supabase-to-clerk-neon-migration.md is
// "the tables exist and Drizzle knows about them" — no app code reads these
// yet, and Supabase remains the source of truth until Phase 2 moves tables
// over one at a time.
//
// Still not represented here, and tracked in the migration doc: 112 RLS
// policies (which become application code), 9 functions, 6 triggers, and the
// `connection_counts` view. Also one expression index that the Drizzle DSL
// cannot express, which must be added as raw SQL after the tables are created:
// blog_posts.idx_blog_posts_search: CREATE INDEX ... USING gin (to_tsvector('english'::regconfig, ((((title || ' '::text) || excerpt) || ' '::text) || content)))

import { boolean, date, index, integer, jsonb, pgSchema, primaryKey, text, timestamp, unique, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const site = pgSchema("makerslounge");

export const applications = site.table("applications", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull(),
  name: text("name").notNull(),
  whatAreYouBuilding: text("what_are_you_building"),
  linkedin: text("linkedin"),
  howDidYouHear: text("how_did_you_hear"),
  status: text("status").default("pending"),
  adminNotes: text("admin_notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  reviewedBy: uuid("reviewed_by").references(() => profiles.id),
  helpWith: text("help_with"),
  skills: text("skills").array(),
  lookingForSkills: text("looking_for_skills").array(),
  otherSocials: jsonb("other_socials"),
}, (t) => [
  index("idx_applications_email").on(t.email),
  index("idx_applications_status").on(t.status),
]);

export const blockedUsers = site.table("blocked_users", {
  id: uuid("id").primaryKey().defaultRandom(),
  blockerId: uuid("blocker_id").notNull(),
  blockedId: uuid("blocked_id").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
}, (t) => [
  unique("blocked_users_blocker_id_blocked_id_key").on(t.blockerId, t.blockedId),
  index("idx_blocked_users_blocked").on(t.blockedId),
  index("idx_blocked_users_blocker").on(t.blockerId),
]);

export const blogPosts = site.table("blog_posts", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull(),
  title: text("title").notNull(),
  excerpt: text("excerpt").notNull(),
  content: text("content").notNull(),
  authorId: uuid("author_id").references(() => profiles.id),
  coverImage: text("cover_image"),
  readTimeMinutes: integer("read_time_minutes").default(5),
  isPublished: boolean("is_published").default(false),
  isFeatured: boolean("is_featured").default(false),
  tags: text("tags").array(),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
}, (t) => [
  unique("blog_posts_slug_key").on(t.slug),
  index("idx_blog_posts_author_id").on(t.authorId),
  index("idx_blog_posts_created_at").on(t.createdAt.desc()),
  index("idx_blog_posts_featured").on(t.isFeatured, t.publishedAt.desc()),
  index("idx_blog_posts_published").on(t.isPublished, t.publishedAt.desc()),
  index("idx_blog_posts_slug").on(t.slug),
  index("idx_blog_posts_tags").using("gin", t.tags),
]);

export const broadcastAccounts = site.table("broadcast_accounts", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),
  name: text("name").notNull(),
  type: text("type").default("personal").notNull(),
  avatarUrl: text("avatar_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
}, (t) => [
  index("idx_broadcast_accounts_user").on(t.userId),
]);

export const broadcastChannels = site.table("broadcast_channels", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),
  name: text("name").notNull(),
  icon: text("icon").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
}, (t) => [
  index("idx_broadcast_channels_user").on(t.userId),
]);

export const comments = site.table("comments", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => profiles.id),
  projectId: uuid("project_id").notNull().references(() => projects.id),
  content: text("content").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  targetType: text("target_type").default("project"),
  targetId: text("target_id"),
}, (t) => [
  index("idx_comments_blog_posts").on(t.targetType, t.targetId).where(sql`target_type = 'blog_post'::text`),
  index("idx_comments_target").on(t.targetType, t.targetId),
]);

export const communityContacts = site.table("community_contacts", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email"),
  name: text("name"),
  firstName: text("first_name"),
  lastName: text("last_name"),
  notes: text("notes"),
  skills: text("skills").array(),
  company: text("company"),
  role: text("role"),
  source: text("source").array(),
  linkedin: text("linkedin"),
  twitter: text("twitter"),
  instagram: text("instagram"),
  website: text("website"),
  matchedProfileId: uuid("matched_profile_id").references(() => profiles.id),
  matchedAt: timestamp("matched_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  metadata: jsonb("metadata"),
  phone: text("phone"),
  summary: text("summary"),
  visibility: text("visibility").default("private"),
}, (t) => [
  uniqueIndex("community_contacts_email_idx").on(t.email),
  index("community_contacts_matched_profile_id_idx").on(t.matchedProfileId),
]);

export const connections = site.table("connections", {
  id: uuid("id").primaryKey().defaultRandom(),
  requesterId: uuid("requester_id").notNull().references(() => profiles.id),
  recipientId: uuid("recipient_id").notNull().references(() => profiles.id),
  status: text("status").default("pending").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
}, (t) => [
  unique("connections_requester_id_recipient_id_key").on(t.requesterId, t.recipientId),
  index("idx_connections_recipient").on(t.recipientId),
  index("idx_connections_requester").on(t.requesterId),
  index("idx_connections_status").on(t.status),
]);

export const contentEvents = site.table("content_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  eventDate: date("event_date").notNull(),
  color: text("color").default("coral"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
}, (t) => [
  index("content_events_user_id_idx").on(t.userId),
]);

export const conversations = site.table("conversations", {
  id: uuid("id").primaryKey().defaultRandom(),
  participant1: uuid("participant_1").notNull().references(() => profiles.id),
  participant2: uuid("participant_2").notNull().references(() => profiles.id),
  lastMessageAt: timestamp("last_message_at", { withTimezone: true }).defaultNow(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
}, (t) => [
  unique("unique_conversation").on(t.participant1, t.participant2),
  index("idx_conversations_participant_1").on(t.participant1),
  index("idx_conversations_participant_2").on(t.participant2),
]);

export const emailSubscriptions = site.table("email_subscriptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  // Subscriber email address
  email: text("email").notNull(),
  // Array of subscription types (events, podcasts, etc.)
  subscribedTo: text("subscribed_to").array(),
  // Whether the subscription is currently active
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
}, (t) => [
  unique("email_subscriptions_email_key").on(t.email),
  index("idx_email_subscriptions_created_at").on(t.createdAt.desc()),
  index("idx_email_subscriptions_email").on(t.email),
  index("idx_email_subscriptions_is_active").on(t.isActive),
]);

export const events = site.table("events", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  description: text("description"),
  startTime: timestamp("start_time", { withTimezone: true }).notNull(),
  endTime: timestamp("end_time", { withTimezone: true }).notNull(),
  location: text("location"),
  imageUrl: text("image_url"),
  eventUrl: text("event_url"),
  createdBy: uuid("created_by"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  isAllDay: boolean("is_all_day").default(false),
}, (t) => [
  index("events_start_time_idx").on(t.startTime),
]);

export const feedback = site.table("feedback", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id"),
  email: text("email"),
  message: text("message").notNull(),
  completed: boolean("completed").default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  screenshotUrl: text("screenshot_url"),
});

export const hackathonScores = site.table("hackathon_scores", {
  id: uuid("id").primaryKey().defaultRandom(),
  judgeName: text("judge_name").notNull(),
  submissionId: uuid("submission_id").notNull().references(() => hackathonSubmissions.id),
  criterionKey: text("criterion_key").notNull(),
  score: integer("score").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
}, (t) => [
  unique("hackathon_scores_judge_name_submission_id_criterion_key_key").on(t.judgeName, t.submissionId, t.criterionKey),
]);

export const hackathonSubmissions = site.table("hackathon_submissions", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectLink: text("project_link").notNull(),
  title: text("title"),
  description: text("description"),
  videoUrl: text("video_url"),
  fileUrls: text("file_urls").array(),
  teamName: text("team_name"),
  builderEmails: text("builder_emails").array(),
  challengeTrack: text("challenge_track"),
  status: text("status").default("new").notNull(),
  userAgent: text("user_agent"),
  ipHash: text("ip_hash"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  isFinalist: boolean("is_finalist").default(false),
  isRound2: boolean("is_round2").default(false).notNull(),
}, (t) => [
  index("hackathon_submissions_created_at_idx").on(t.createdAt.desc()),
  index("hackathon_submissions_status_idx").on(t.status),
]);

export const hackathonVoterNotes = site.table("hackathon_voter_notes", {
  judgeName: text("judge_name").notNull(),
  submissionId: uuid("submission_id").notNull(),
  notes: text("notes").default("").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  primaryKey({ columns: [t.judgeName, t.submissionId] }),
]);

export const homeVisions = site.table("home_visions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),
  title: text("title").default("My Roadmap").notNull(),
  subtitle: text("subtitle"),
  pillars: jsonb("pillars").notNull(),
  ruleTitle: text("rule_title"),
  ruleText: text("rule_text"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  unique("home_visions_user_id_key").on(t.userId),
  index("home_visions_user_idx").on(t.userId),
]);

export const identities = site.table("identities", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),
  text: text("text").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  index("identities_user_idx").on(t.userId),
]);

export const innovationHackathonSignups = site.table("innovation_hackathon_signups", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  background: text("background").notNull(),
  lookingFor: text("looking_for").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  email: text("email"),
  matchedTeam: text("matched_team"),
  isFinalist: boolean("is_finalist").default(false),
}, (t) => [
  index("innovation_hackathon_signups_created_at_idx").on(t.createdAt.desc()),
]);

export const likes = site.table("likes", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => profiles.id),
  projectId: uuid("project_id").notNull().references(() => projects.id),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  targetType: text("target_type").default("project"),
  targetId: text("target_id"),
}, (t) => [
  unique("likes_user_id_project_id_key").on(t.userId, t.projectId),
  index("idx_likes_blog_posts").on(t.targetType, t.targetId).where(sql`target_type = 'blog_post'::text`),
  index("idx_likes_target").on(t.targetType, t.targetId),
]);

export const matcherContacts = site.table("matcher_contacts", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),
  email: text("email").notNull(),
  name: text("name").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  customFields: jsonb("custom_fields"),
}, (t) => [
  unique("matcher_contacts_user_id_email_key").on(t.userId, t.email),
  index("idx_matcher_contacts_user_id").on(t.userId),
]);

export const matcherEvents = site.table("matcher_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id"),
  name: text("name").notNull(),
  contacts: jsonb("contacts").notNull(),
  groups: jsonb("groups"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  lastQuery: text("last_query"),
  lastRecommendations: jsonb("last_recommendations"),
}, (t) => [
  index("idx_matcher_events_user_id").on(t.userId),
]);

export const meetups = site.table("meetups", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  createdBy: uuid("created_by").notNull(),
  participants: jsonb("participants").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  customFieldNames: jsonb("custom_field_names"),
});

export const messages = site.table("messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  conversationId: uuid("conversation_id").notNull().references(() => conversations.id),
  senderId: uuid("sender_id").notNull().references(() => profiles.id),
  content: text("content").notNull(),
  readAt: timestamp("read_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
}, (t) => [
  index("idx_messages_conversation").on(t.conversationId, t.createdAt),
  index("idx_messages_sender").on(t.senderId),
]);

export const mulerunDemos = site.table("mulerun_demos", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  project: text("project").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  teamName: text("team_name"),
  videoUrl: text("video_url"),
}, (t) => [
  index("mulerun_demos_created_at_idx").on(t.createdAt.desc()),
]);

export const mulerunSignups = site.table("mulerun_signups", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  categories: text("categories").array().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  index("mulerun_signups_created_at_idx").on(t.createdAt.desc()),
]);

export const mulerunVotes = site.table("mulerun_votes", {
  id: uuid("id").primaryKey().defaultRandom(),
  voterId: text("voter_id").notNull(),
  firstId: uuid("first_id").notNull().references(() => mulerunDemos.id),
  secondId: uuid("second_id").notNull().references(() => mulerunDemos.id),
  thirdId: uuid("third_id").notNull().references(() => mulerunDemos.id),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  unique("mulerun_votes_voter_id_key").on(t.voterId),
  index("mulerun_votes_created_at_idx").on(t.createdAt.desc()),
]);

export const podcastGuests = site.table("podcast_guests", {
  id: uuid("id").primaryKey().defaultRandom(),
  podcastId: uuid("podcast_id").notNull().references(() => podcasts.id),
  profileId: uuid("profile_id").notNull().references(() => profiles.id),
}, (t) => [
  unique("podcast_guests_podcast_id_profile_id_key").on(t.podcastId, t.profileId),
]);

export const podcasts = site.table("podcasts", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  slug: text("slug").notNull(),
  description: text("description"),
  transcript: text("transcript"),
  audioUrl: text("audio_url"),
  coverImageUrl: text("cover_image_url"),
  durationSeconds: integer("duration_seconds"),
  episodeNumber: integer("episode_number"),
  isPublished: boolean("is_published").default(false),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  createdBy: uuid("created_by").references(() => profiles.id),
  videoUrl: text("video_url"),
}, (t) => [
  unique("podcasts_slug_key").on(t.slug),
]);

export const profileEventNotes = site.table("profile_event_notes", {
  id: uuid("id").primaryKey().defaultRandom(),
  profileId: uuid("profile_id").notNull(),
  meetupId: uuid("meetup_id").references(() => meetups.id),
  meetupName: text("meetup_name").notNull(),
  notes: text("notes"),
  createdBy: uuid("created_by").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  unique("profile_event_notes_profile_id_meetup_id_key").on(t.profileId, t.meetupId),
]);

export const profiles = site.table("profiles", {
  id: uuid("id").primaryKey(),
  name: text("name"),
  photoUrl: text("photo_url"),
  linkedin: text("linkedin"),
  twitter: text("twitter"),
  website: text("website"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  bio: text("bio"),
  skills: text("skills").array(),
  username: text("username"),
  avatarStyle: text("avatar_style"),
  // Stores tldraw whiteboard document data as JSON
  whiteboardData: jsonb("whiteboard_data"),
  // Controls whether whiteboard is visible on public profile
  showWhiteboard: boolean("show_whiteboard").default(false),
  // Tracks whether user has completed or dismissed the onboarding walkthrough
  hasCompletedOnboarding: boolean("has_completed_onboarding").default(false),
  themeConfig: jsonb("theme_config"),
  coverImage: text("cover_image"),
  currentlyBuilding: text("currently_building"),
  lookingForSkills: text("looking_for_skills").array(),
  onboardingCompleted: boolean("onboarding_completed").default(false),
  instagram: text("instagram"),
  youtube: text("youtube"),
  tiktok: text("tiktok"),
  firstName: text("first_name"),
  lastName: text("last_name"),
  applicationStatus: text("application_status").default("pending"),
  lookingForHelp: text("looking_for_help"),
  linkedinData: jsonb("linkedin_data"),
  linkedinDataUpdatedAt: timestamp("linkedin_data_updated_at", { withTimezone: true }),
}, (t) => [
  unique("profiles_username_key").on(t.username),
  index("idx_profiles_application_status").on(t.applicationStatus),
  index("idx_profiles_onboarding").on(t.hasCompletedOnboarding),
  index("profiles_skills_idx").using("gin", t.skills),
]);

export const projects = site.table("projects", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => profiles.id),
  title: text("title").notNull(),
  description: text("description"),
  mediaUrls: text("media_urls").array(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  // Post category: project_showcase, job_board, question, or update. NULL for legacy posts
  category: text("category"),
  metadata: jsonb("metadata"),
}, (t) => [
  index("idx_projects_category").on(t.category),
  index("idx_projects_category_created_at").on(t.category, t.createdAt.desc()),
]);

export const reports = site.table("reports", {
  id: uuid("id").primaryKey().defaultRandom(),
  reporterId: uuid("reporter_id").notNull(),
  reportedUserId: uuid("reported_user_id"),
  projectId: uuid("project_id").references(() => projects.id),
  commentId: uuid("comment_id").references(() => comments.id),
  reason: text("reason").notNull(),
  details: text("details"),
  status: text("status").default("pending").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
}, (t) => [
  index("idx_reports_reporter").on(t.reporterId),
  index("idx_reports_status").on(t.status),
]);

export const scheduledPosts = site.table("scheduled_posts", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),
  content: text("content").notNull(),
  platform: text("platform").default("x").notNull(),
  scheduledFor: timestamp("scheduled_for", { withTimezone: true }).notNull(),
  status: text("status").default("pending").notNull(),
  postUrl: text("post_url"),
  errorMessage: text("error_message"),
  ideaId: uuid("idea_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  postedAt: timestamp("posted_at", { withTimezone: true }),
  qstashMessageId: text("qstash_message_id"),
  mediaUrls: text("media_urls").array(),
}, (t) => [
  index("idx_scheduled_posts_pending").on(t.scheduledFor).where(sql`status = 'pending'::text`),
  index("idx_scheduled_posts_user").on(t.userId),
]);

export const socialConnections = site.table("social_connections", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),
  platform: text("platform").notNull(),
  platformUserId: text("platform_user_id").notNull(),
  platformUsername: text("platform_username"),
  platformName: text("platform_name"),
  platformAvatarUrl: text("platform_avatar_url"),
  accessToken: text("access_token").notNull(),
  refreshToken: text("refresh_token"),
  tokenExpiresAt: timestamp("token_expires_at", { withTimezone: true }),
  scopes: text("scopes").array(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
}, (t) => [
  unique("social_connections_user_id_platform_platform_user_id_key").on(t.userId, t.platform, t.platformUserId),
  index("idx_social_connections_user_platform").on(t.userId, t.platform),
]);

export const valuePortfolio = site.table("value_portfolio", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => profiles.id),
  title: text("title").notNull(),
  category: text("category").notNull(),
  valueDescription: text("value_description"),
  mediaUrls: text("media_urls").array(),
  links: jsonb("links"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
}, (t) => [
  index("idx_value_portfolio_user_id").on(t.userId),
]);

export const workshops = site.table("workshops", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  date: date("date").notNull(),
  time: text("time").notNull(),
  location: text("location").notNull(),
  instructorName: text("instructor_name").notNull(),
  instructorPhoto: text("instructor_photo"),
  coverImage: text("cover_image"),
  tags: text("tags").array(),
  lumaUrl: text("luma_url").notNull(),
  spotsAvailable: integer("spots_available"),
  maxSpots: integer("max_spots"),
  isPublished: boolean("is_published").default(false),
  isVirtual: boolean("is_virtual").default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
}, (t) => [
  index("idx_workshops_date").on(t.date.desc()),
  index("idx_workshops_published").on(t.isPublished),
]);
