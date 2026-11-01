// The logo files anyone can download: from the right-click menu on every
// MakersLounge logo, and from the landing page footer (`/#logo-downloads`).
// This replaced the old /brand page, which now redirects to that footer.

export type BrandAsset = {
  label: string;
  /** Short format tag shown next to the label, e.g. "SVG". */
  format: "SVG" | "PNG";
  href: string;
  /** Saved filename, so downloads aren't all called `logo.svg`. */
  filename: string;
};

// The flame mark on its own, in both formats.
export const LOGO_MARKS: BrandAsset[] = [
  { label: "Logo", format: "SVG", href: "/logos/logo.svg", filename: "makerslounge-logo.svg" },
  { label: "Logo", format: "PNG", href: "/logos/logo.png", filename: "makerslounge-logo.png" },
  { label: "White logo", format: "SVG", href: "/logos/logo-light.svg", filename: "makerslounge-logo-white.svg" },
  { label: "White logo", format: "PNG", href: "/logos/logo-white.png", filename: "makerslounge-logo-white.png" },
  { label: "Blue logo", format: "SVG", href: "/logos/logo-blue.svg", filename: "makerslounge-logo-blue.svg" },
  { label: "Blue logo", format: "PNG", href: "/logos/logo-blue.png", filename: "makerslounge-logo-blue.png" },
];

// Sized for a specific platform's profile picture or header.
export const SOCIAL_ASSETS: BrandAsset[] = [
  { label: "Instagram profile", format: "PNG", href: "/logos/logo-instagram.png", filename: "makerslounge-instagram.png" },
  { label: "Instagram profile, blue", format: "PNG", href: "/logos/logo-instagram-blue.png", filename: "makerslounge-instagram-blue.png" },
  { label: "Luma profile", format: "PNG", href: "/logos/logo-luma.png", filename: "makerslounge-luma.png" },
  { label: "LinkedIn banner", format: "PNG", href: "/logos/linkedin-banner.png", filename: "makerslounge-linkedin-banner.png" },
  { label: "Luma banner", format: "PNG", href: "/logos/luma-banner.png", filename: "makerslounge-luma-banner.png" },
  { label: "Blue banner", format: "PNG", href: "/logos/logo-banner-blue.png", filename: "makerslounge-banner-blue.png" },
];
