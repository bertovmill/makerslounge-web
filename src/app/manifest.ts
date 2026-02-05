import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "MakersLounge - Toronto's Maker Community",
    short_name: "MakersLounge",
    description:
      "Connect with makers, share projects, and grow your network in Toronto's most supportive community for builders.",
    start_url: "/",
    display: "standalone",
    background_color: "#1d1b2e",
    theme_color: "#1d1b2e",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
