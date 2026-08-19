import { NextResponse } from "next/server";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { requireUser } from "@/lib/api/auth";
import { handleApiError } from "@/lib/api/respond";

/**
 * Issues short-lived tokens for browser uploads to Vercel Blob.
 *
 * Client uploads rather than proxying bytes through a route handler: podcast audio
 * and project videos run to tens of megabytes, and streaming those through a
 * function to re-upload them is wasted time and compute. The browser talks to Blob
 * directly with a token this route mints.
 *
 * The token is the whole boundary, so the pathname is validated here. Supabase
 * Storage enforced write paths with bucket policies; Blob has no equivalent, so
 * `onBeforeGenerateToken` throws unless the requested path matches one of the
 * shapes below. Without that check any signed-in member could request a token for
 * `profiles/<someone-else>/avatar.png` and overwrite another person's photo.
 */

/**
 * Where each kind of upload is allowed to land.
 *
 * `{id}` is substituted with the caller's own profile id, so ownership is
 * structural rather than checked after the fact. `feedback` is the exception: it is
 * keyed by timestamp, not by user, because the screenshots are triaged as a single
 * queue — but it is still session-gated and cannot escape its own prefix.
 */
const ALLOWED_PREFIXES = [
  "media/profiles/{id}/",
  "media/projects/{id}/",
  "media/value-portfolio/{id}/",
  "media/feedback/",
  "podcasts/{id}/",
  "broadcast-media/{id}/",
];

const ALLOWED_CONTENT_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "image/svg+xml",
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "audio/mpeg",
  "audio/mp4",
  "audio/wav",
  "audio/x-wav",
  "audio/webm",
];

// Comfortably above the largest existing object (a 35 MB video) without inviting
// someone to park a DVD image in the store.
const MAX_BYTES = 200 * 1024 * 1024;

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as HandleUploadBody;

    const result = await handleUpload({
      request,
      body,
      onBeforeGenerateToken: async (pathname) => {
        // Runs for the token request; the completion callback below is invoked by
        // Blob itself and carries no session, which is why authorization lives here.
        const profileId = await requireUser();

        // `..` cannot traverse in a Blob key the way it does on a filesystem, but
        // reject it anyway rather than reasoning about what the storage layer
        // normalises.
        if (pathname.includes("..") || pathname.startsWith("/")) {
          throw new Error("Invalid upload path");
        }

        const allowed = ALLOWED_PREFIXES.some((prefix) =>
          pathname.startsWith(prefix.replace("{id}", profileId)),
        );
        if (!allowed) {
          throw new Error(`Upload path not allowed: ${pathname}`);
        }

        return {
          allowedContentTypes: ALLOWED_CONTENT_TYPES,
          maximumSizeInBytes: MAX_BYTES,
          // Suffix on: replacing an avatar under a fixed key would otherwise be
          // served stale from the CDN, which is what `upsert: true` papered over on
          // Supabase. The new URL is written to the database anyway.
          addRandomSuffix: true,
          tokenPayload: JSON.stringify({ profileId }),
        };
      },
    });

    return NextResponse.json(result);
  } catch (err) {
    // handleUpload throws plain Errors for a rejected path; surface those as 400 so
    // the client can show something useful, and keep 401 for "not signed in".
    return handleApiError(err, "api/blob/upload");
  }
}
