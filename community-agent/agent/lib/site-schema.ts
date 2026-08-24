// GENERATED FILE — DO NOT EDIT.
//
// Copied from src/db/site/schema.ts by scripts/sync-agent-schema.mjs, which runs
// on predev, prebuild and postinstall. Edit the source file instead; anything
// written here is overwritten on the next build.

// Site schema — the tables behind makerslounge.ca, now living in Neon.
//
// GENERATED, do not hand-edit. Produced by `drizzle-kit pull` against the live
// Neon `makerslounge` schema, which was itself created from a Supabase
// `pg_dump --schema-only`.
//
// Regenerate with:
//   DATABASE_URL=... npx drizzle-kit pull --config drizzle.site.config.ts
//   node scripts/strip-schema-suffix.mjs
//
// Generating rather than hand-writing is deliberate: the previous hand-written
// version had drifted from production — it was missing `profiles.clerk_user_id`
// (added during the Clerk cutover) and described 25 foreign keys where the
// database has 43. A missing column throws; a missing constraint does not.
//
// No RLS policies here on purpose. Supabase enforced 112 of them in SQL; Neon
// has no JWT-aware policy layer, so authorization is per-route application code
// instead. See docs/supabase-to-clerk-neon-migration.md.

import { pgTable, pgSchema, index, foreignKey, unique, uuid, text, integer, timestamp, boolean, check, jsonb, date, uniqueIndex, primaryKey, bigint } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const makerslounge = pgSchema("makerslounge");


export const talks = makerslounge.table("talks", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	title: text().notNull(),
	slug: text().notNull(),
	description: text(),
	speakerName: text("speaker_name"),
	speakerTitle: text("speaker_title"),
	speakerCompany: text("speaker_company"),
	speakerPhotoUrl: text("speaker_photo_url"),
	thumbnailUrl: text("thumbnail_url"),
	durationSeconds: integer("duration_seconds"),
	recordedAt: timestamp("recorded_at", { withTimezone: true, mode: 'string' }),
	isPublished: boolean("is_published").default(false),
	publishedAt: timestamp("published_at", { withTimezone: true, mode: 'string' }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	createdBy: uuid("created_by"),
}, (table) => [
	index("talks_published_idx").using("btree", table.isPublished.asc().nullsLast().op("timestamptz_ops"), table.publishedAt.desc().nullsFirst().op("timestamptz_ops")),
	foreignKey({
			columns: [table.createdBy],
			foreignColumns: [profiles.id],
			name: "talks_created_by_fkey"
		}),
	unique("talks_slug_key").on(table.slug),
]);

export const talkContent = makerslounge.table("talk_content", {
	talkId: uuid("talk_id").primaryKey().notNull(),
	provider: text().default('youtube').notNull(),
	videoId: text("video_id").notNull(),
	transcript: text(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.talkId],
			foreignColumns: [talks.id],
			name: "talk_content_talk_id_fkey"
		}).onDelete("cascade"),
]);

export const blogPosts = makerslounge.table("blog_posts", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	slug: text().notNull(),
	title: text().notNull(),
	excerpt: text().notNull(),
	content: text().notNull(),
	authorId: uuid("author_id"),
	coverImage: text("cover_image"),
	readTimeMinutes: integer("read_time_minutes").default(5),
	isPublished: boolean("is_published").default(false),
	isFeatured: boolean("is_featured").default(false),
	tags: text().array().default([]),
	publishedAt: timestamp("published_at", { withTimezone: true, mode: 'string' }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	newsletterSentAt: timestamp("newsletter_sent_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("idx_blog_posts_author_id").using("btree", table.authorId.asc().nullsLast().op("uuid_ops")),
	index("idx_blog_posts_created_at").using("btree", table.createdAt.desc().nullsFirst().op("timestamptz_ops")),
	index("idx_blog_posts_featured").using("btree", table.isFeatured.asc().nullsLast().op("bool_ops"), table.publishedAt.desc().nullsFirst().op("bool_ops")),
	index("idx_blog_posts_published").using("btree", table.isPublished.asc().nullsLast().op("timestamptz_ops"), table.publishedAt.desc().nullsFirst().op("bool_ops")),
	index("idx_blog_posts_search").using("gin", sql`to_tsvector('english'::regconfig, ((((title || ' '::text) || excerpt) || ' '::text) || content))`),
	index("idx_blog_posts_slug").using("btree", table.slug.asc().nullsLast().op("text_ops")),
	index("idx_blog_posts_tags").using("gin", table.tags.asc().nullsLast().op("array_ops")),
	foreignKey({
			columns: [table.authorId],
			foreignColumns: [profiles.id],
			name: "blog_posts_author_id_fkey"
		}).onDelete("cascade"),
	unique("blog_posts_slug_key").on(table.slug),
]);

export const innovationHackathonSignups = makerslounge.table("innovation_hackathon_signups", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: text().notNull(),
	background: text().notNull(),
	lookingFor: text("looking_for").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	email: text(),
	matchedTeam: text("matched_team"),
	isFinalist: boolean("is_finalist").default(false),
}, (table) => [
	index("innovation_hackathon_signups_created_at_idx").using("btree", table.createdAt.desc().nullsFirst().op("timestamptz_ops")),
	check("innovation_hackathon_signups_background_length", sql`(char_length(background) >= 20) AND (char_length(background) <= 600)`),
	check("innovation_hackathon_signups_looking_for_length", sql`(char_length(looking_for) >= 20) AND (char_length(looking_for) <= 600)`),
	check("innovation_hackathon_signups_name_length", sql`(char_length(name) >= 1) AND (char_length(name) <= 80)`),
]);

export const mulerunSignups = makerslounge.table("mulerun_signups", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: text().notNull(),
	categories: text().array().default([]).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("mulerun_signups_created_at_idx").using("btree", table.createdAt.desc().nullsFirst().op("timestamptz_ops")),
	check("mulerun_signups_categories_check", sql`(array_length(categories, 1) >= 1) AND (array_length(categories, 1) <= 3)`),
	check("mulerun_signups_name_check", sql`(length(TRIM(BOTH FROM name)) >= 1) AND (length(TRIM(BOTH FROM name)) <= 80)`),
]);

export const connections = makerslounge.table("connections", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	requesterId: uuid("requester_id").notNull(),
	recipientId: uuid("recipient_id").notNull(),
	status: text().default('pending').notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_connections_recipient").using("btree", table.recipientId.asc().nullsLast().op("uuid_ops")),
	index("idx_connections_requester").using("btree", table.requesterId.asc().nullsLast().op("uuid_ops")),
	index("idx_connections_status").using("btree", table.status.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.recipientId],
			foreignColumns: [profiles.id],
			name: "connections_recipient_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.requesterId],
			foreignColumns: [profiles.id],
			name: "connections_requester_id_fkey"
		}).onDelete("cascade"),
	unique("connections_requester_id_recipient_id_key").on(table.requesterId, table.recipientId),
	check("connections_check", sql`requester_id <> recipient_id`),
	check("connections_status_check", sql`status = ANY (ARRAY['pending'::text, 'accepted'::text, 'declined'::text])`),
]);

export const meetups = makerslounge.table("meetups", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: text().notNull(),
	createdBy: uuid("created_by").notNull(),
	participants: jsonb().default([]).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	customFieldNames: jsonb("custom_field_names").default([]),
}, (table) => [
	foreignKey({
			columns: [table.createdBy],
			foreignColumns: [profiles.id],
			name: "meetups_created_by_fkey"
		}).onDelete("cascade"),
]);

export const emailSubscriptions = makerslounge.table("email_subscriptions", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	email: text().notNull(),
	subscribedTo: text("subscribed_to").array().default(["events", "podcasts"]),
	isActive: boolean("is_active").default(true),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_email_subscriptions_created_at").using("btree", table.createdAt.desc().nullsFirst().op("timestamptz_ops")),
	index("idx_email_subscriptions_email").using("btree", table.email.asc().nullsLast().op("text_ops")),
	index("idx_email_subscriptions_is_active").using("btree", table.isActive.asc().nullsLast().op("bool_ops")),
	unique("email_subscriptions_email_key").on(table.email),
]);

export const events = makerslounge.table("events", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	title: text().notNull(),
	description: text(),
	startTime: timestamp("start_time", { withTimezone: true, mode: 'string' }).notNull(),
	endTime: timestamp("end_time", { withTimezone: true, mode: 'string' }).notNull(),
	location: text(),
	imageUrl: text("image_url"),
	eventUrl: text("event_url"),
	createdBy: uuid("created_by"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	isAllDay: boolean("is_all_day").default(false),
}, (table) => [
	index("events_start_time_idx").using("btree", table.startTime.asc().nullsLast().op("timestamptz_ops")),
	foreignKey({
			columns: [table.createdBy],
			foreignColumns: [profiles.id],
			name: "events_created_by_fkey"
		}),
]);

export const workshops = makerslounge.table("workshops", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	title: text().notNull(),
	description: text().notNull(),
	date: date().notNull(),
	time: text().notNull(),
	location: text().notNull(),
	instructorName: text("instructor_name").notNull(),
	instructorPhoto: text("instructor_photo"),
	coverImage: text("cover_image"),
	tags: text().array().default([]),
	lumaUrl: text("luma_url").notNull(),
	spotsAvailable: integer("spots_available"),
	maxSpots: integer("max_spots"),
	isPublished: boolean("is_published").default(false),
	isVirtual: boolean("is_virtual").default(false),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_workshops_date").using("btree", table.date.desc().nullsFirst().op("date_ops")),
	index("idx_workshops_published").using("btree", table.isPublished.asc().nullsLast().op("bool_ops")),
]);

export const profiles = makerslounge.table("profiles", {
	id: uuid().primaryKey().notNull(),
	name: text(),
	photoUrl: text("photo_url"),
	linkedin: text(),
	twitter: text(),
	website: text(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	bio: text(),
	skills: text().array(),
	username: text(),
	avatarStyle: text("avatar_style"),
	whiteboardData: jsonb("whiteboard_data"),
	showWhiteboard: boolean("show_whiteboard").default(false),
	hasCompletedOnboarding: boolean("has_completed_onboarding").default(false),
	themeConfig: jsonb("theme_config").default({"theme_id":"default"}),
	coverImage: text("cover_image"),
	currentlyBuilding: text("currently_building"),
	lookingForSkills: text("looking_for_skills").array(),
	onboardingCompleted: boolean("onboarding_completed").default(false),
	instagram: text(),
	youtube: text(),
	tiktok: text(),
	firstName: text("first_name"),
	lastName: text("last_name"),
	applicationStatus: text("application_status").default('pending'),
	lookingForHelp: text("looking_for_help"),
	linkedinData: jsonb("linkedin_data"),
	linkedinDataUpdatedAt: timestamp("linkedin_data_updated_at", { withTimezone: true, mode: 'string' }),
	clerkUserId: text("clerk_user_id"),
}, (table) => [
	index("idx_profiles_application_status").using("btree", table.applicationStatus.asc().nullsLast().op("text_ops")),
	index("idx_profiles_onboarding").using("btree", table.hasCompletedOnboarding.asc().nullsLast().op("bool_ops")),
	uniqueIndex("profiles_clerk_user_id_key").using("btree", table.clerkUserId.asc().nullsLast().op("text_ops")).where(sql`(clerk_user_id IS NOT NULL)`),
	index("profiles_skills_idx").using("gin", table.skills.asc().nullsLast().op("array_ops")),
	unique("profiles_username_key").on(table.username),
]);

export const applications = makerslounge.table("applications", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	email: text().notNull(),
	name: text().notNull(),
	whatAreYouBuilding: text("what_are_you_building"),
	linkedin: text(),
	howDidYouHear: text("how_did_you_hear"),
	status: text().default('pending'),
	adminNotes: text("admin_notes"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	reviewedAt: timestamp("reviewed_at", { withTimezone: true, mode: 'string' }),
	reviewedBy: uuid("reviewed_by"),
	helpWith: text("help_with"),
	skills: text().array(),
	lookingForSkills: text("looking_for_skills").array(),
	otherSocials: jsonb("other_socials"),
}, (table) => [
	index("idx_applications_email").using("btree", table.email.asc().nullsLast().op("text_ops")),
	index("idx_applications_status").using("btree", table.status.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.reviewedBy],
			foreignColumns: [profiles.id],
			name: "applications_reviewed_by_fkey"
		}),
	check("applications_status_check", sql`status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text])`),
]);

export const blockedUsers = makerslounge.table("blocked_users", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	blockerId: uuid("blocker_id").notNull(),
	blockedId: uuid("blocked_id").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_blocked_users_blocked").using("btree", table.blockedId.asc().nullsLast().op("uuid_ops")),
	index("idx_blocked_users_blocker").using("btree", table.blockerId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.blockedId],
			foreignColumns: [profiles.id],
			name: "blocked_users_blocked_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.blockerId],
			foreignColumns: [profiles.id],
			name: "blocked_users_blocker_id_fkey"
		}).onDelete("cascade"),
	unique("blocked_users_blocker_id_blocked_id_key").on(table.blockerId, table.blockedId),
]);

export const broadcastAccounts = makerslounge.table("broadcast_accounts", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	name: text().notNull(),
	type: text().default('personal').notNull(),
	avatarUrl: text("avatar_url"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_broadcast_accounts_user").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [profiles.id],
			name: "broadcast_accounts_user_id_fkey"
		}).onDelete("cascade"),
	check("broadcast_accounts_type_check", sql`type = ANY (ARRAY['personal'::text, 'business'::text])`),
]);

export const broadcastChannels = makerslounge.table("broadcast_channels", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	name: text().notNull(),
	icon: text().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_broadcast_channels_user").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [profiles.id],
			name: "broadcast_channels_user_id_fkey"
		}).onDelete("cascade"),
]);

export const projects = makerslounge.table("projects", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	title: text().notNull(),
	description: text(),
	mediaUrls: text("media_urls").array(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	category: text(),
	metadata: jsonb(),
}, (table) => [
	index("idx_projects_category").using("btree", table.category.asc().nullsLast().op("text_ops")),
	index("idx_projects_category_created_at").using("btree", table.category.asc().nullsLast().op("text_ops"), table.createdAt.desc().nullsFirst().op("text_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [profiles.id],
			name: "projects_user_id_fkey"
		}).onDelete("cascade"),
	check("projects_category_check", sql`category = ANY (ARRAY['project_showcase'::text, 'job_board'::text, 'question'::text, 'update'::text])`),
]);

export const communityContacts = makerslounge.table("community_contacts", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	email: text(),
	name: text(),
	firstName: text("first_name"),
	lastName: text("last_name"),
	notes: text(),
	skills: text().array(),
	company: text(),
	role: text(),
	source: text().array(),
	linkedin: text(),
	twitter: text(),
	instagram: text(),
	website: text(),
	matchedProfileId: uuid("matched_profile_id"),
	matchedAt: timestamp("matched_at", { withTimezone: true, mode: 'string' }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	metadata: jsonb().default({}),
	phone: text(),
	summary: text(),
	visibility: text().default('private'),
}, (table) => [
	uniqueIndex("community_contacts_email_idx").using("btree", table.email.asc().nullsLast().op("text_ops")),
	index("community_contacts_matched_profile_id_idx").using("btree", table.matchedProfileId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.matchedProfileId],
			foreignColumns: [profiles.id],
			name: "community_contacts_matched_profile_id_fkey"
		}),
	check("community_contacts_visibility_check", sql`visibility = ANY (ARRAY['private'::text, 'public'::text])`),
]);

export const contentEvents = makerslounge.table("content_events", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	name: text().notNull(),
	description: text(),
	eventDate: date("event_date").notNull(),
	color: text().default('coral'),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("content_events_user_id_idx").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [profiles.id],
			name: "content_events_user_id_fkey"
		}).onDelete("cascade"),
]);

export const conversations = makerslounge.table("conversations", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	participant1: uuid("participant_1").notNull(),
	participant2: uuid("participant_2").notNull(),
	lastMessageAt: timestamp("last_message_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_conversations_participant_1").using("btree", table.participant1.asc().nullsLast().op("uuid_ops")),
	index("idx_conversations_participant_2").using("btree", table.participant2.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.participant1],
			foreignColumns: [profiles.id],
			name: "conversations_participant_1_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.participant2],
			foreignColumns: [profiles.id],
			name: "conversations_participant_2_fkey"
		}).onDelete("cascade"),
	unique("unique_conversation").on(table.participant1, table.participant2),
	check("no_self_chat", sql`participant_1 <> participant_2`),
]);

export const feedback = makerslounge.table("feedback", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id"),
	email: text(),
	message: text().notNull(),
	completed: boolean().default(false),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	screenshotUrl: text("screenshot_url"),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [profiles.id],
			name: "feedback_user_id_fkey"
		}).onDelete("set null"),
]);

export const comments = makerslounge.table("comments", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	projectId: uuid("project_id"),
	content: text().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	targetType: text("target_type").default('project'),
	targetId: text("target_id"),
}, (table) => [
	index("idx_comments_blog_posts").using("btree", table.targetType.asc().nullsLast().op("text_ops"), table.targetId.asc().nullsLast().op("text_ops")).where(sql`(target_type = 'blog_post'::text)`),
	index("idx_comments_target").using("btree", table.targetType.asc().nullsLast().op("text_ops"), table.targetId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.projectId],
			foreignColumns: [projects.id],
			name: "comments_project_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [profiles.id],
			name: "comments_user_id_fkey"
		}).onDelete("cascade"),
	check("comments_project_id_required_for_projects", sql`(target_type <> 'project'::text) OR (project_id IS NOT NULL)`),
]);

export const hackathonSubmissions = makerslounge.table("hackathon_submissions", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	projectLink: text("project_link").notNull(),
	title: text(),
	description: text(),
	videoUrl: text("video_url"),
	fileUrls: text("file_urls").array().default([]),
	teamName: text("team_name"),
	builderEmails: text("builder_emails").array().default([]),
	challengeTrack: text("challenge_track"),
	status: text().default('new').notNull(),
	userAgent: text("user_agent"),
	ipHash: text("ip_hash"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	reviewedAt: timestamp("reviewed_at", { withTimezone: true, mode: 'string' }),
	isFinalist: boolean("is_finalist").default(false),
	isRound2: boolean("is_round2").default(false).notNull(),
}, (table) => [
	index("hackathon_submissions_created_at_idx").using("btree", table.createdAt.desc().nullsFirst().op("timestamptz_ops")),
	index("hackathon_submissions_status_idx").using("btree", table.status.asc().nullsLast().op("text_ops")),
	check("hackathon_submissions_status_check", sql`status = ANY (ARRAY['new'::text, 'reviewed'::text, 'finalist'::text, 'winner'::text, 'spam'::text])`),
]);

export const hackathonScores = makerslounge.table("hackathon_scores", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	judgeName: text("judge_name").notNull(),
	submissionId: uuid("submission_id").notNull(),
	criterionKey: text("criterion_key").notNull(),
	score: integer().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.submissionId],
			foreignColumns: [hackathonSubmissions.id],
			name: "hackathon_scores_submission_id_fkey"
		}).onDelete("cascade"),
	unique("hackathon_scores_judge_name_submission_id_criterion_key_key").on(table.judgeName, table.submissionId, table.criterionKey),
	check("hackathon_scores_score_check", sql`(score >= 1) AND (score <= 5)`),
]);

export const homeVisions = makerslounge.table("home_visions", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	title: text().default('My Roadmap').notNull(),
	subtitle: text(),
	pillars: jsonb().default([]).notNull(),
	ruleTitle: text("rule_title"),
	ruleText: text("rule_text"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("home_visions_user_idx").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [profiles.id],
			name: "home_visions_user_id_fkey"
		}).onDelete("cascade"),
	unique("home_visions_user_id_key").on(table.userId),
]);

export const identities = makerslounge.table("identities", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	text: text().notNull(),
	isActive: boolean("is_active").default(true).notNull(),
	sortOrder: integer("sort_order").default(0).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("identities_user_idx").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [profiles.id],
			name: "identities_user_id_fkey"
		}).onDelete("cascade"),
]);

export const matcherContacts = makerslounge.table("matcher_contacts", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	email: text().notNull(),
	name: text().notNull(),
	notes: text(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	customFields: jsonb("custom_fields").default({}),
}, (table) => [
	index("idx_matcher_contacts_user_id").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [profiles.id],
			name: "matcher_contacts_user_id_fkey"
		}).onDelete("cascade"),
	unique("matcher_contacts_user_id_email_key").on(table.userId, table.email),
]);

export const matcherEvents = makerslounge.table("matcher_events", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id"),
	name: text().notNull(),
	contacts: jsonb().default([]).notNull(),
	groups: jsonb(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	lastQuery: text("last_query"),
	lastRecommendations: jsonb("last_recommendations"),
}, (table) => [
	index("idx_matcher_events_user_id").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [profiles.id],
			name: "matcher_events_user_id_fkey"
		}),
]);

export const messages = makerslounge.table("messages", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	conversationId: uuid("conversation_id").notNull(),
	senderId: uuid("sender_id").notNull(),
	content: text().notNull(),
	readAt: timestamp("read_at", { withTimezone: true, mode: 'string' }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_messages_conversation").using("btree", table.conversationId.asc().nullsLast().op("timestamptz_ops"), table.createdAt.asc().nullsLast().op("timestamptz_ops")),
	index("idx_messages_sender").using("btree", table.senderId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.conversationId],
			foreignColumns: [conversations.id],
			name: "messages_conversation_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.senderId],
			foreignColumns: [profiles.id],
			name: "messages_sender_id_fkey"
		}).onDelete("cascade"),
	check("messages_content_check", sql`(char_length(content) > 0) AND (char_length(content) <= 5000)`),
]);

export const mulerunDemos = makerslounge.table("mulerun_demos", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: text().notNull(),
	project: text().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	teamName: text("team_name"),
	videoUrl: text("video_url"),
}, (table) => [
	index("mulerun_demos_created_at_idx").using("btree", table.createdAt.desc().nullsFirst().op("timestamptz_ops")),
	check("mulerun_demos_name_check", sql`(length(TRIM(BOTH FROM name)) >= 1) AND (length(TRIM(BOTH FROM name)) <= 120)`),
	check("mulerun_demos_project_check", sql`(length(TRIM(BOTH FROM project)) >= 1) AND (length(TRIM(BOTH FROM project)) <= 200)`),
	check("mulerun_demos_team_name_length", sql`(team_name IS NULL) OR ((length(TRIM(BOTH FROM team_name)) >= 1) AND (length(TRIM(BOTH FROM team_name)) <= 80))`),
	check("mulerun_demos_video_url_length", sql`(video_url IS NULL) OR ((length(TRIM(BOTH FROM video_url)) >= 1) AND (length(TRIM(BOTH FROM video_url)) <= 500))`),
]);

export const mulerunVotes = makerslounge.table("mulerun_votes", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	voterId: text("voter_id").notNull(),
	firstId: uuid("first_id").notNull(),
	secondId: uuid("second_id").notNull(),
	thirdId: uuid("third_id").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("mulerun_votes_created_at_idx").using("btree", table.createdAt.desc().nullsFirst().op("timestamptz_ops")),
	foreignKey({
			columns: [table.firstId],
			foreignColumns: [mulerunDemos.id],
			name: "mulerun_votes_first_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.secondId],
			foreignColumns: [mulerunDemos.id],
			name: "mulerun_votes_second_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.thirdId],
			foreignColumns: [mulerunDemos.id],
			name: "mulerun_votes_third_id_fkey"
		}).onDelete("cascade"),
	unique("mulerun_votes_voter_id_key").on(table.voterId),
	check("mulerun_votes_check", sql`(first_id <> second_id) AND (first_id <> third_id) AND (second_id <> third_id)`),
	check("mulerun_votes_voter_id_check", sql`(length(voter_id) >= 1) AND (length(voter_id) <= 64)`),
]);

export const podcasts = makerslounge.table("podcasts", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	title: text().notNull(),
	slug: text().notNull(),
	description: text(),
	transcript: text(),
	audioUrl: text("audio_url"),
	coverImageUrl: text("cover_image_url"),
	durationSeconds: integer("duration_seconds"),
	episodeNumber: integer("episode_number"),
	isPublished: boolean("is_published").default(false),
	publishedAt: timestamp("published_at", { withTimezone: true, mode: 'string' }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	createdBy: uuid("created_by"),
	videoUrl: text("video_url"),
}, (table) => [
	foreignKey({
			columns: [table.createdBy],
			foreignColumns: [profiles.id],
			name: "podcasts_created_by_fkey"
		}),
	unique("podcasts_slug_key").on(table.slug),
]);

export const podcastGuests = makerslounge.table("podcast_guests", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	podcastId: uuid("podcast_id").notNull(),
	profileId: uuid("profile_id").notNull(),
}, (table) => [
	foreignKey({
			columns: [table.podcastId],
			foreignColumns: [podcasts.id],
			name: "podcast_guests_podcast_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.profileId],
			foreignColumns: [profiles.id],
			name: "podcast_guests_profile_id_fkey"
		}).onDelete("cascade"),
	unique("podcast_guests_podcast_id_profile_id_key").on(table.podcastId, table.profileId),
]);

export const profileEventNotes = makerslounge.table("profile_event_notes", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	profileId: uuid("profile_id").notNull(),
	meetupId: uuid("meetup_id"),
	meetupName: text("meetup_name").notNull(),
	notes: text(),
	createdBy: uuid("created_by").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.createdBy],
			foreignColumns: [profiles.id],
			name: "profile_event_notes_created_by_fkey"
		}),
	foreignKey({
			columns: [table.meetupId],
			foreignColumns: [meetups.id],
			name: "profile_event_notes_meetup_id_fkey"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.profileId],
			foreignColumns: [profiles.id],
			name: "profile_event_notes_profile_id_fkey"
		}).onDelete("cascade"),
	unique("profile_event_notes_profile_id_meetup_id_key").on(table.profileId, table.meetupId),
]);

export const reports = makerslounge.table("reports", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	reporterId: uuid("reporter_id").notNull(),
	reportedUserId: uuid("reported_user_id"),
	projectId: uuid("project_id"),
	commentId: uuid("comment_id"),
	reason: text().notNull(),
	details: text(),
	status: text().default('pending').notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	reviewedAt: timestamp("reviewed_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("idx_reports_reporter").using("btree", table.reporterId.asc().nullsLast().op("uuid_ops")),
	index("idx_reports_status").using("btree", table.status.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.commentId],
			foreignColumns: [comments.id],
			name: "reports_comment_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.projectId],
			foreignColumns: [projects.id],
			name: "reports_project_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.reportedUserId],
			foreignColumns: [profiles.id],
			name: "reports_reported_user_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.reporterId],
			foreignColumns: [profiles.id],
			name: "reports_reporter_id_fkey"
		}).onDelete("cascade"),
	check("reports_status_check", sql`status = ANY (ARRAY['pending'::text, 'reviewed'::text, 'actioned'::text, 'dismissed'::text])`),
]);

export const scheduledPosts = makerslounge.table("scheduled_posts", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	content: text().notNull(),
	platform: text().default('x').notNull(),
	scheduledFor: timestamp("scheduled_for", { withTimezone: true, mode: 'string' }).notNull(),
	status: text().default('pending').notNull(),
	postUrl: text("post_url"),
	errorMessage: text("error_message"),
	ideaId: uuid("idea_id"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	postedAt: timestamp("posted_at", { withTimezone: true, mode: 'string' }),
	qstashMessageId: text("qstash_message_id"),
	mediaUrls: text("media_urls").array().default([]),
}, (table) => [
	index("idx_scheduled_posts_pending").using("btree", table.scheduledFor.asc().nullsLast().op("timestamptz_ops")).where(sql`(status = 'pending'::text)`),
	index("idx_scheduled_posts_user").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [profiles.id],
			name: "scheduled_posts_user_id_fkey"
		}).onDelete("cascade"),
	check("scheduled_posts_status_check", sql`status = ANY (ARRAY['pending'::text, 'posted'::text, 'failed'::text, 'cancelled'::text])`),
]);

export const socialConnections = makerslounge.table("social_connections", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	platform: text().notNull(),
	platformUserId: text("platform_user_id").notNull(),
	platformUsername: text("platform_username"),
	platformName: text("platform_name"),
	platformAvatarUrl: text("platform_avatar_url"),
	accessToken: text("access_token").notNull(),
	refreshToken: text("refresh_token"),
	tokenExpiresAt: timestamp("token_expires_at", { withTimezone: true, mode: 'string' }),
	scopes: text().array(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_social_connections_user_platform").using("btree", table.userId.asc().nullsLast().op("text_ops"), table.platform.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [profiles.id],
			name: "social_connections_user_id_fkey"
		}).onDelete("cascade"),
	unique("social_connections_user_id_platform_platform_user_id_key").on(table.userId, table.platform, table.platformUserId),
]);

export const valuePortfolio = makerslounge.table("value_portfolio", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	title: text().notNull(),
	category: text().notNull(),
	valueDescription: text("value_description"),
	mediaUrls: text("media_urls").array().default([]),
	links: jsonb().default([]),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_value_portfolio_user_id").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [profiles.id],
			name: "value_portfolio_user_id_fkey"
		}).onDelete("cascade"),
]);

export const likes = makerslounge.table("likes", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	projectId: uuid("project_id"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	targetType: text("target_type").default('project'),
	targetId: text("target_id"),
}, (table) => [
	index("idx_likes_blog_posts").using("btree", table.targetType.asc().nullsLast().op("text_ops"), table.targetId.asc().nullsLast().op("text_ops")).where(sql`(target_type = 'blog_post'::text)`),
	index("idx_likes_target").using("btree", table.targetType.asc().nullsLast().op("text_ops"), table.targetId.asc().nullsLast().op("text_ops")),
	uniqueIndex("likes_user_target_key").using("btree", table.userId.asc().nullsLast().op("uuid_ops"), table.targetType.asc().nullsLast().op("text_ops"), table.targetId.asc().nullsLast().op("uuid_ops")).where(sql`(target_type <> 'project'::text)`),
	foreignKey({
			columns: [table.projectId],
			foreignColumns: [projects.id],
			name: "likes_project_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [profiles.id],
			name: "likes_user_id_fkey"
		}).onDelete("cascade"),
	unique("likes_user_id_project_id_key").on(table.userId, table.projectId),
	check("likes_project_id_required_for_projects", sql`(target_type <> 'project'::text) OR (project_id IS NOT NULL)`),
]);

export const hackathonVoterNotes = makerslounge.table("hackathon_voter_notes", {
	judgeName: text("judge_name").notNull(),
	submissionId: uuid("submission_id").notNull(),
	notes: text().default("").notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	primaryKey({ columns: [table.judgeName, table.submissionId], name: "hackathon_voter_notes_pkey"}),
]);
export const connectionCounts = makerslounge.view("connection_counts", {	profileId: uuid("profile_id"),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	connectionCount: bigint("connection_count", { mode: "number" }),
}).as(sql`SELECT p.id AS profile_id, count(DISTINCT CASE WHEN c.status = 'accepted'::text AND (c.requester_id = p.id OR c.recipient_id = p.id) THEN CASE WHEN c.requester_id = p.id THEN c.recipient_id ELSE c.requester_id END ELSE NULL::uuid END) AS connection_count FROM makerslounge.profiles p LEFT JOIN makerslounge.connections c ON c.requester_id = p.id OR c.recipient_id = p.id GROUP BY p.id`);