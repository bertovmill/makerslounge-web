import { NextResponse } from "next/server";
import { ApiAuthError } from "./auth";

/**
 * Uniform error responses for the site's API routes.
 *
 * Worth having a single place for this: while Supabase enforced authorization,
 * a denied read came back as an empty result and a denied write as a PostgREST
 * error code, and the client code grew used to both. Now that the checks are
 * ours, the failures should at least be shaped consistently.
 */

/** Map a thrown error to a response. Unknown errors become a 500 and are logged. */
export function handleApiError(err: unknown, context: string): NextResponse {
  if (err instanceof ApiAuthError) {
    return NextResponse.json({ error: err.code }, { status: err.status });
  }
  console.error(`[${context}]`, err);
  return NextResponse.json({ error: "internal_error" }, { status: 500 });
}

/** 400 for a request the caller can fix. */
export function badRequest(message: string): NextResponse {
  return NextResponse.json({ error: "bad_request", detail: message }, { status: 400 });
}
