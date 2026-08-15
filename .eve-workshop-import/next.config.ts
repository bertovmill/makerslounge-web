import type { NextConfig } from "next";
import { withEve } from "eve/next";

const nextConfig: NextConfig = {
  images: {
    // Clerk-hosted avatars, shown on /profile.
    remotePatterns: [{ protocol: "https", hostname: "img.clerk.com" }],
  },
};

export default withEve(nextConfig, {
  eveRoot: "./workshop-helper",
});
