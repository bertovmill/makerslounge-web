import type { NextConfig } from "next";
import { withEve } from "eve/next";

const EVE_WORKSHOP_HOST = "eve.makerslounge.ca";

const EVE_WORKSHOP_ROUTES: [source: string, destination: string][] = [
  ["/", "/eve-workshop"],
  ["/attendees", "/eve-workshop/attendees"],
  ["/wifi", "/eve-workshop/wifi"],
  ["/resources", "/eve-workshop/resources"],
  ["/profile", "/eve-workshop/profile"],
  ["/sign-in/:path*", "/eve-workshop/sign-in/:path*"],
  ["/sign-up/:path*", "/eve-workshop/sign-up/:path*"],
  ["/api/questions", "/api/eve-workshop/questions"],
  ["/api/demo-slots", "/api/eve-workshop/demo-slots"],
];

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "rpehnlhnrlfkupuberfi.supabase.co",
      },
      {
        // Clerk-hosted avatars, shown on /eve-workshop/profile.
        protocol: "https",
        hostname: "img.clerk.com",
      },
    ],
  },
  // eve.makerslounge.ca was its own Vercel project before the workshop was
  // folded in here. Serving it off this app as a rewrite keeps every link and
  // QR code handed out at the workshop working, with the subdomain intact.
  //
  // Routes are listed one by one rather than as a `/:path*` catch-all on
  // purpose: a catch-all on `beforeFiles` also swallows `/_next/*` (the app's
  // own JS and CSS), `/eve/*` (the workshop agent's HTTP surface, which has to
  // stay unprefixed) and `/eve-workshop/*` itself — the links the pages
  // actually render, which would end up doubled.
  rewrites: async () => ({
    beforeFiles: EVE_WORKSHOP_ROUTES.map(([source, destination]) => ({
      source,
      destination,
      has: [{ type: "host" as const, value: EVE_WORKSHOP_HOST }],
    })),
    afterFiles: [],
    fallback: [],
  }),
  redirects: async () => [
    {
      source: "/hackathon",
      destination: "/hackathons/2026-innovation-hackathon",
      permanent: true,
    },
    {
      source: "/hackathon/:path*",
      destination: "/hackathons/2026-innovation-hackathon/:path*",
      permanent: true,
    },
  ],
  headers: async () => [
    {
      source: "/sw.js",
      headers: [
        {
          key: "Cache-Control",
          value: "no-cache, no-store, must-revalidate",
        },
        {
          key: "Content-Type",
          value: "application/javascript; charset=utf-8",
        },
      ],
    },
  ],
};

// Two eve agents ship with this app, each its own package with its own
// dependencies:
//
//   workshop-helper  the Eve Agent Workshop's assistant  -> `/eve-workshop`
//   community        May, the maker connector            -> `/home`
//
// Naming them (rather than the single-agent `eveRoot` shorthand) is what allows
// the second one, and it moves each mount from `/eve/v1/*` to
// `/eve/agents/<name>/eve/v1/*`. `useEveAgent({ agent })` picks the matching one
// — see `workshop-helper-widget.tsx` and `src/app/home/page.tsx`.
export default withEve(nextConfig, {
  agents: {
    "workshop-helper": "./workshop-helper",
    community: "./community-agent",
  },
});
