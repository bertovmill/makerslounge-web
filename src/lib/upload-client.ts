"use client";

import { upload } from "@vercel/blob/client";

/**
 * Browser uploads to Vercel Blob.
 *
 * Replaces `supabase.storage.from(bucket).upload(...)` followed by
 * `getPublicUrl(...)`. Blob returns the public URL from the upload itself, so the
 * two-step dance is gone — and with it a failure mode where the upload succeeded but
 * the URL was derived from a path the caller assumed rather than the one written.
 *
 * The path is validated server-side in `/api/blob/upload`; see the prefix list there.
 * Paths keep the old bucket name as their first segment (`media/...`, `podcasts/...`)
 * so the keys line up with what was migrated across.
 */

export interface UploadResult {
  url: string;
  pathname: string;
}

/**
 * Upload one file and return its public URL.
 *
 * Throws on failure rather than returning null: every caller here needs the URL to
 * store, and silently carrying on with no URL is how a profile ends up pointing at
 * nothing.
 */
export async function uploadToBlob(pathname: string, file: Blob): Promise<UploadResult> {
  const blob = await upload(pathname, file, {
    access: "public",
    handleUploadUrl: "/api/blob/upload",
    contentType: file.type || undefined,
  });
  return { url: blob.url, pathname: blob.pathname };
}

/** `media/profiles/<id>/avatar.png` — the profile photo. */
export function profilePhotoPath(profileId: string, file: File): string {
  return `media/profiles/${profileId}/${safeName(file.name, "avatar")}`;
}

/** `media/projects/<id>/<name>` — post and project media. */
export function projectMediaPath(profileId: string, file: File): string {
  return `media/projects/${profileId}/${safeName(file.name, "media")}`;
}

/** `media/value-portfolio/<id>/<name>` */
export function valuePortfolioPath(profileId: string, file: File): string {
  return `media/value-portfolio/${profileId}/${safeName(file.name, "media")}`;
}

/** `media/feedback/<timestamp>.png` — triaged as one queue, not per user. */
export function feedbackScreenshotPath(): string {
  return `media/feedback/${Date.now()}-screenshot.png`;
}

/** `podcasts/<id>/<name>` — audio, video and cover art for an episode. */
export function podcastAssetPath(profileId: string, file: File, kind: string): string {
  return `podcasts/${profileId}/${kind}-${safeName(file.name, kind)}`;
}

/**
 * Keep the extension, drop everything that would make an awkward key.
 *
 * Blob keys are URLs, and the migrated files include names like
 * "Screenshot_2026-05-10_at_8.28.56_AM.png" — spaces and repeated dots survive fine,
 * but slashes would silently create folders and non-ASCII needs escaping at every
 * use. Random suffixing happens server-side, so collisions are not a concern here.
 */
function safeName(original: string, fallback: string): string {
  const cleaned = original
    .normalize("NFKD")
    .replace(/[^\w.\-]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-|-$/g, "");
  return cleaned && cleaned !== "." ? cleaned : fallback;
}
