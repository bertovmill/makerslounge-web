/**
 * Who puts on in-house events, shown on every event page the way Luma shows a
 * calendar ("Presented by") and its people ("Hosted by"). Every event on the
 * site is MakersLounge's, so this is one constant rather than a column.
 */

export type SocialLink = { kind: "instagram" | "x" | "linkedin" | "slack" | "website"; href: string };

export const PRESENTER = {
  name: "MakersLounge",
  href: "/",
  socials: [
    { kind: "instagram", href: "https://instagram.com/makersloungeto" },
    { kind: "x", href: "https://x.com/makersloungeto" },
    { kind: "linkedin", href: "https://linkedin.com/company/makerslounge" },
    { kind: "slack", href: "https://makerslounge.slack.com" },
    { kind: "website", href: "https://makerslounge.ca" },
  ] satisfies SocialLink[],
};

export const HOSTS = [
  {
    name: "Berto Mill",
    photo: "/headshots/Berto Mill_Headshot.jpg",
    socials: [
      { kind: "x", href: "https://x.com/robert_vmill" },
      { kind: "linkedin", href: "https://www.linkedin.com/in/bertomill/" },
    ] satisfies SocialLink[],
  },
];

/**
 * Where "Contact the host" messages go. Server-side only: the page never shows
 * it, so the address isn't scraped off every event page.
 */
export const HOST_CONTACT_EMAIL = "berto@makerslounge.ca";
