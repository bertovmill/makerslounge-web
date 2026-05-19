import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "rpehnlhnrlfkupuberfi.supabase.co",
      },
    ],
  },
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

export default nextConfig;
