import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { WelcomeTour } from "@/components/eve-workshop/welcome-tour";

export const metadata: Metadata = {
  title: "Eve Agent Workshop — Makerslounge",
  description:
    "Build your first AI agent with the Eve framework. A hands-on Makerslounge workshop — Build. Connect. Create.",
};

/**
 * The workshop keeps its own chrome: no MakersLounge sidebar, no AppShell, no
 * feedback button (those bail out on `/eve-workshop` — see `AppShell.tsx`).
 * The `.eve-workshop` class is what scopes the workshop's colour tokens and
 * radius scale in `globals.css`, so its palette can't leak into the rest of
 * the site and the site's editorial motif can't bleed into the slides.
 *
 * `ClerkProvider` sits here rather than in the root layout because Clerk is
 * only *enforced* on these routes for now (see `middleware.ts`) — mounting it
 * at the root would make every Supabase-authed page depend on Clerk's
 * middleware having run. It moves up when the site migrates to Clerk proper.
 */
export default function EveWorkshopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <div className="eve-workshop flex min-h-svh flex-col antialiased">
        <WelcomeTour>{children}</WelcomeTour>
      </div>
    </ClerkProvider>
  );
}
