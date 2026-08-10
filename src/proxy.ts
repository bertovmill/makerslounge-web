import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// `/eve/*` is the agent's own HTTP surface. It authenticates itself in
// `workshop-helper/agent/channels/eve.ts` (Clerk session, then Vercel OIDC) and
// fails closed, so it must not be redirect-protected here — a 307 to the
// sign-in page would break non-browser callers like the eve TUI.
// `/api/learning-goals` is fetched from the deck, which is itself public. It
// checks `auth()` and answers 401 on its own, so it must not be redirect-
// protected either — a 307 would be followed transparently by fetch() and read
// as a successful (but empty) response.
const isPublicRoute = createRouteMatcher([
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/eve(.*)",
  "/",
  "/api/learning-goals",
]);

export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icon|apple-icon|.*\\.(?:png|svg|ico|jpg|webp)).*)",
    "/(api|trpc)(.*)",
  ],
};
