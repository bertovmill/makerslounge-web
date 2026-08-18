import type { NextRequest } from "next/server";
import { ApiAuthError } from "./auth";

/**
 * Shared-password gate for the hackathon judging endpoints.
 *
 * Deliberately NOT `requireAdmin()`. Judges are guests at the event, not site
 * admins with Clerk accounts, so these routes authenticate a role rather than a
 * person: whoever holds the judging password can score.
 *
 * KNOWN WEAKNESS, carried over rather than introduced. The same password is also
 * hardcoded in six client components (the scoring and results screens), which
 * means it ships inside the public JavaScript bundle and anyone can read it.
 * The env var below lets the server side be rotated without a code change, but a
 * real rotation also has to update those client files — so this is a smaller
 * improvement than it looks, and the endpoints should move to per-judge Clerk
 * accounts or signed links before the next event.
 *
 * The 2026 hackathon it serves has already happened, which is why this is flagged
 * rather than redesigned as part of the database migration.
 */
const JUDGE_PASSWORD = process.env.HACKATHON_JUDGE_PASSWORD || "makers2026";

/** Throws ApiAuthError(401) unless the request carries the judging password. */
export function requireJudge(req: NextRequest): void {
  if (req.headers.get("x-admin-password") !== JUDGE_PASSWORD) {
    throw new ApiAuthError(401, "unauthorized");
  }
}
