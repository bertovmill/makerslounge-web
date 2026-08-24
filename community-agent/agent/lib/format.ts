import { communityContacts, profiles } from "./db";

/**
 * Column shapes and result formatting, shared by every search tool so that a
 * profile looks identical no matter which tool surfaced it. Lifted verbatim from
 * the `/api/matcher-chat` route this agent replaced.
 */

export const profileCols = {
  id: profiles.id,
  name: profiles.name,
  username: profiles.username,
  bio: profiles.bio,
  skills: profiles.skills,
  looking_for_skills: profiles.lookingForSkills,
  currently_building: profiles.currentlyBuilding,
  photo_url: profiles.photoUrl,
};

export const contactCols = {
  id: communityContacts.id,
  name: communityContacts.name,
  first_name: communityContacts.firstName,
  last_name: communityContacts.lastName,
  summary: communityContacts.summary,
  skills: communityContacts.skills,
  company: communityContacts.company,
  role: communityContacts.role,
  source: communityContacts.source,
  linkedin: communityContacts.linkedin,
  metadata: communityContacts.metadata,
};

type ContactRow = { [K in keyof typeof contactCols]: unknown } & {
  id: string;
  name: string | null;
};

export function formatProfile(p: {
  id: string;
  name: string | null;
  username?: string | null;
  bio?: string | null;
  skills?: string[] | null;
  currently_building?: string | null;
  photo_url?: string | null;
}) {
  const profile: Record<string, unknown> = {
    id: p.id,
    name: p.name || "Anonymous",
  };
  if (p.username) {
    profile.username = p.username;
    profile.profile_url = `/p/${p.username}`;
  } else {
    profile.profile_url = `/profile/${p.id}`;
  }
  if (p.photo_url) profile.photo_url = p.photo_url;
  if (p.bio) profile.bio = p.bio;
  if (p.skills?.length) profile.skills = p.skills;
  if (p.currently_building) {
    try {
      const parsed = JSON.parse(p.currently_building);
      if (Array.isArray(parsed) && parsed.length) profile.building = parsed;
    } catch {
      if (p.currently_building.trim()) profile.building = p.currently_building;
    }
  }
  return profile;
}

export function formatCommunityContact(c: {
  id: string;
  name: string | null;
  first_name?: string | null;
  last_name?: string | null;
  summary?: string | null;
  skills?: string[] | null;
  company?: string | null;
  role?: string | null;
  source?: string[] | null;
  linkedin?: string | null;
  metadata?: Record<string, string> | null;
}) {
  const displayName =
    c.name || [c.first_name, c.last_name].filter(Boolean).join(" ") || "Unknown";
  const profile: Record<string, unknown> = {
    id: c.id,
    name: displayName,
    profile_url: `/community/${c.id}`,
    type: "community_contact",
  };
  if (c.summary) profile.bio = c.summary;
  if (c.skills?.length) profile.skills = c.skills;
  if (c.company) profile.company = c.company;
  if (c.role) profile.role = c.role;
  if (c.source?.length) profile.events_attended = c.source;
  if (c.linkedin) profile.linkedin = c.linkedin;
  if (c.metadata) {
    const interesting: Record<string, string> = {};
    for (const [k, v] of Object.entries(c.metadata)) {
      const kl = k.toLowerCase();
      if (
        kl.includes("project") ||
        kl.includes("skill") ||
        kl.includes("superpower") ||
        kl.includes("building") ||
        kl.includes("help") ||
        kl.includes("phase")
      ) {
        interesting[k] = v;
      }
    }
    if (Object.keys(interesting).length > 0) profile.additional_info = interesting;
  }
  return profile;
}

/**
 * `community_contacts.metadata` is jsonb, which Drizzle types as `unknown`.
 * The importers write it as a flat string map, so the narrowing happens here in
 * one place rather than at each call site.
 */
export function toContact(c: ContactRow) {
  return formatCommunityContact({
    ...(c as unknown as Parameters<typeof formatCommunityContact>[0]),
    metadata: (c.metadata ?? null) as Record<string, string> | null,
  });
}
