import { profiles } from "@/db/site/schema";

/**
 * The profile columns the API returns, and the subset a member may write.
 *
 * Under Supabase the `profiles` SELECT policy was `USING (true)` — every column
 * was world-readable, and the browser selected whatever it liked. That is
 * preserved here rather than narrowed, because narrowing it would silently break
 * whichever of the twenty-odd client components happened to need a field.
 *
 * One column deserves a second look on its own: `linkedin_data` is scraped profile
 * detail written by the admin enrichment route, and it has always been publicly
 * readable because the policy covered the whole row. Flagged rather than changed —
 * see docs/rls-policy-inventory.md on policies that were opened up and never
 * tightened. There is no email column, so no address leaks either way.
 */
export const publicProfileColumns = {
  id: profiles.id,
  username: profiles.username,
  name: profiles.name,
  first_name: profiles.firstName,
  last_name: profiles.lastName,
  photo_url: profiles.photoUrl,
  cover_image: profiles.coverImage,
  bio: profiles.bio,
  skills: profiles.skills,
  looking_for_skills: profiles.lookingForSkills,
  looking_for_help: profiles.lookingForHelp,
  currently_building: profiles.currentlyBuilding,
  linkedin: profiles.linkedin,
  twitter: profiles.twitter,
  instagram: profiles.instagram,
  youtube: profiles.youtube,
  tiktok: profiles.tiktok,
  website: profiles.website,
  avatar_style: profiles.avatarStyle,
  theme_config: profiles.themeConfig,
  whiteboard_data: profiles.whiteboardData,
  show_whiteboard: profiles.showWhiteboard,
  // Two onboarding flags exist and they are not interchangeable.
  // `onboarding_completed` is the one the onboarding pages read and write, and it is
  // true for 42 profiles. `has_completed_onboarding` is vestigial — true for exactly
  // one — and nothing reads it. Both are exposed rather than quietly picking one,
  // because a caller reading the wrong flag gets a plausible answer.
  onboarding_completed: profiles.onboardingCompleted,
  has_completed_onboarding: profiles.hasCompletedOnboarding,
  application_status: profiles.applicationStatus,
  linkedin_data: profiles.linkedinData,
  linkedin_data_updated_at: profiles.linkedinDataUpdatedAt,
  created_at: profiles.createdAt,
  updated_at: profiles.updatedAt,
};

/**
 * Fields a member may change on their own profile.
 *
 * Deliberately a whitelist. `id` and `clerk_user_id` are the identity mapping and
 * must never be writable; `application_status` is an admin decision; and
 * `linkedin_data` is written only by the enrichment route. Under RLS the policy
 * checked *which row* you could update but not *which columns*, so a crafted
 * PATCH could previously have set any of these on your own profile — including
 * approving your own application.
 */
const WRITABLE = {
  username: "username",
  name: "name",
  first_name: "firstName",
  last_name: "lastName",
  photo_url: "photoUrl",
  cover_image: "coverImage",
  bio: "bio",
  skills: "skills",
  looking_for_skills: "lookingForSkills",
  looking_for_help: "lookingForHelp",
  currently_building: "currentlyBuilding",
  linkedin: "linkedin",
  twitter: "twitter",
  instagram: "instagram",
  youtube: "youtube",
  tiktok: "tiktok",
  website: "website",
  avatar_style: "avatarStyle",
  theme_config: "themeConfig",
  whiteboard_data: "whiteboardData",
  show_whiteboard: "showWhiteboard",
  onboarding_completed: "onboardingCompleted",
  has_completed_onboarding: "hasCompletedOnboarding",
} as const;

/** Map a snake_cased request body onto the writable Drizzle columns. */
export function pickProfileUpdates(
  body: Record<string, unknown>,
): Partial<typeof profiles.$inferInsert> {
  const updates: Record<string, unknown> = {};
  for (const [wire, column] of Object.entries(WRITABLE)) {
    if (wire in body) updates[column] = body[wire];
  }
  return updates as Partial<typeof profiles.$inferInsert>;
}
