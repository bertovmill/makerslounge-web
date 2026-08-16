import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { type NextRequest } from "next/server";

/**
 * Clerk authenticates the entire site. Supabase is the database only and no
 * longer has a session to refresh here.
 *
 * Clerk runs on every request because `ClerkProvider` sits in the root layout
 * and a session cannot resolve on a route the middleware skipped. Enforcement
 * stays narrow: only the workshop redirects to a sign-in page. Everywhere else
 * decides its own access in the page, as it always has.
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

const withClerk = clerkMiddleware(async (auth, req) => {
  // Clerk still runs everywhere so the session resolves, but only the workshop
  // is redirect-protected here.
  const onWorkshop = isEveWorkshopHost(req) || isWorkshopRoute(req);
  if (!onWorkshop) return;

  const isPublic = isEveWorkshopHost(req)
    ? isPublicEveHostRoute(req)
    : isPublicWorkshopRoute(req);
  if (!isPublic) {
    await auth.protect();
  }
});

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
