import type { Metadata } from "next";
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
 * `ClerkProvider` used to sit here, back when Clerk was enforced only on these
 * routes. It now lives in the root layout because Clerk authenticates the whole
 * site — nesting a second provider here would give the workshop its own Clerk
 * context and split the session.
 */
export default function EveWorkshopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="eve-workshop flex min-h-svh flex-col antialiased">
      <WelcomeTour>{children}</WelcomeTour>
    </div>
  );
}
