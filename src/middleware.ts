import { createServerClient } from "@supabase/ssr";
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Two auth systems share this file while the site migrates from Supabase to
 * Clerk:
 *
 * - Clerk owns `/eve-workshop/*` — the Eve Agent Workshop, folded in from its
 *   own repo. Its attendee records are keyed by Clerk user ids.
 * - Supabase owns everything else, where the only job is refreshing the auth
 *   token on each request.
 *
 * Clerk is mounted app-wide (see `ClerkProvider` in the root layout) but only
 * *enforced* on the routes below, so the rest of the site is untouched until
 * the migration proper.
 */

// Workshop routes that must stay reachable while signed out.
//
// `/eve/*` is the workshop agent's own HTTP surface. It authenticates itself
// in `workshop-helper/agent/channels/eve.ts` (Clerk session, then Vercel
// OIDC) and fails closed, so it must not be redirect-protected here — a 307 to
// the sign-in page would break non-browser callers like the eve TUI.
// Note the `/eve` patterns are written as `/eve` + `/eve/(.*)` rather than
// `/eve(.*)`: the latter also matches `/eve-workshop/...`, which would quietly
// make every workshop page public.
const isPublicWorkshopRoute = createRouteMatcher([
  "/eve-workshop",
  "/eve-workshop/sign-in(.*)",
  "/eve-workshop/sign-up(.*)",
  "/eve",
  "/eve/(.*)",
]);

const isWorkshopRoute = createRouteMatcher([
  "/eve-workshop",
  "/eve-workshop/(.*)",
  "/api/eve-workshop/(.*)",
  "/eve",
  "/eve/(.*)",
]);

// eve.makerslounge.ca serves the workshop from unprefixed paths (`/wifi`,
// `/attendees`, …) via the host rewrites in `next.config.ts`.
//
// Middleware runs BEFORE those rewrites, so on that host it sees `/wifi`, not
// `/eve-workshop/wifi` — the matchers above would all miss, Clerk would never
// run, and the rewrite would then happily serve a page that is auth-gated on
// the main domain. So the host gets its own matcher over the unprefixed paths.
// The whole subdomain is the workshop, so everything on it is a workshop route.
const EVE_WORKSHOP_HOST = "eve.makerslounge.ca";

const isPublicEveHostRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/eve",
  "/eve/(.*)",
  // Reachable unprefixed too, since the app's own routes still resolve here.
  "/eve-workshop",
  "/eve-workshop/sign-in(.*)",
  "/eve-workshop/sign-up(.*)",
]);

function isEveWorkshopHost(request: NextRequest) {
  const host = request.headers.get("host")?.split(":")[0].toLowerCase();
  return host === EVE_WORKSHOP_HOST;
}

// Clerk now runs on every request, because `ClerkProvider` sits in the root
// layout and its session cannot resolve on a route the middleware skipped.
// Enforcement is still narrow: only the workshop redirects to a sign-in page.
// The rest of the site decides its own access in the page, exactly as before.
const withClerk = clerkMiddleware(async (auth, req) => {
  const onWorkshop = isEveWorkshopHost(req) || isWorkshopRoute(req);

  if (onWorkshop) {
    const isPublic = isEveWorkshopHost(req)
      ? isPublicEveHostRoute(req)
      : isPublicWorkshopRoute(req);
    if (!isPublic) {
      await auth.protect();
    }
    // The workshop never touched Supabase and still doesn't.
    return;
  }

  // Everywhere else, keep refreshing the Supabase token while pre-cutover
  // sessions are still in play. Drops out once everyone is on Clerk.
  return refreshSupabaseSession(req);
});

async function refreshSupabaseSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: Do not remove this line - it refreshes the auth token
  await supabase.auth.getUser();

  return supabaseResponse;
}

export default withClerk;

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
