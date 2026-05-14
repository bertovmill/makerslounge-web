export type Category = {
  slug: string;
  name: string;
  examples: string;
};

export const CATEGORIES: Category[] = [
  { slug: "entertainment", name: "Entertainment", examples: "Image gen, video gen, just for fun" },
  { slug: "life", name: "Life assistant", examples: "Admin, planning, daily helpers" },
  { slug: "design", name: "Design", examples: "Image editing, ecommerce, marketing creative" },
  { slug: "content", name: "Content", examples: "Writing, video editing, slides" },
  { slug: "marketing", name: "Marketing", examples: "Social media, influencer, user growth" },
  { slug: "jobs", name: "Jobs", examples: "Job seeking, recruiting" },
  { slug: "research", name: "Research & data", examples: "Discovery, analysis, dashboards" },
  { slug: "web", name: "Web", examples: "Sites, landing pages, portfolios" },
  { slug: "verticals", name: "Verticals", examples: "Investment, contracts, education" },
];

export const MAX_CATEGORIES = 3;
export const MIN_CATEGORIES = 1;

export const SIGNUP_URL = "https://makerslounge.ca/hackathons/mulerun/signup";
