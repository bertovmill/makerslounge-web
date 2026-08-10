import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// `/eve/*` is the agent's own HTTP surface. It authenticates itself in
// `workshop-helper/agent/channels/eve.ts` (Clerk session, then Vercel OIDC) and
// fails closed, so it must not be redirect-protected here — a 307 to the
// sign-in page would break non-browser callers like the eve TUI.
const isPublicRoute = createRouteMatcher(["/sign-in(.*)", "/sign-up(.*)", "/eve(.*)", "/"]);

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
