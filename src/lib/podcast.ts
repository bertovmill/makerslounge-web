export interface PodcastGuest {
  name: string;
  bio?: string;
  photo?: string;
  links?: {
    twitter?: string;
    linkedin?: string;
    website?: string;
  };
}

export interface PodcastPlatforms {
  spotify?: string;
  apple?: string;
  youtube?: string;
  google?: string;
  overcast?: string;
}

export interface PodcastEpisode {
  id: string;
  slug: string;
  episodeNumber: number;
  title: string;
  description: string;
  publishDate: string; // ISO date string
  durationMinutes: number;
  coverImage?: string;
  platforms: PodcastPlatforms;
  guests: PodcastGuest[];
  showNotes: string;
  isFeatured: boolean;
}

// Add your podcast episodes here - they'll automatically display on the podcast page
export const podcastEpisodes: PodcastEpisode[] = [
  {
    id: "1",
    slug: "building-in-public",
    episodeNumber: 1,
    title: "Building in Public: The Maker's Journey",
    description:
      "An inspiring conversation about transparency, community building, and the power of sharing your work before it's perfect.",
    publishDate: "2025-01-15",
    durationMinutes: 45,
    platforms: {
      spotify: "https://open.spotify.com/show/example",
      apple: "https://podcasts.apple.com/us/podcast/example",
      youtube: "https://youtube.com/watch?v=example",
    },
    guests: [
      {
        name: "Sarah Chen",
        bio: "Founder of OpenMake, a community-driven hardware startup",
        links: {
          twitter: "@sarahchen",
          linkedin: "https://linkedin.com/in/sarahchen",
        },
      },
    ],
    showNotes: `In this inaugural episode, we dive deep into the philosophy of building in public.

Topics covered:
- Why transparency builds trust with your community
- Overcoming the fear of sharing unfinished work
- How public building accelerated Sarah's startup journey
- Tools and platforms for effective public building
- The role of community feedback in product development

Links mentioned:
- OpenMake Community: https://openmake.io
- Sarah's build log: https://twitter.com/sarahchen`,
    isFeatured: true,
  },
  {
    id: "2",
    slug: "hardware-to-market",
    episodeNumber: 2,
    title: "From Prototype to Product: Hardware Startup Lessons",
    description:
      "Learn how to navigate manufacturing, supply chains, and bringing physical products to market from a seasoned hardware entrepreneur.",
    publishDate: "2025-01-22",
    durationMinutes: 52,
    platforms: {
      spotify: "https://open.spotify.com/show/example",
      apple: "https://podcasts.apple.com/us/podcast/example",
      youtube: "https://youtube.com/watch?v=example",
    },
    guests: [
      {
        name: "Marcus Rivera",
        bio: "CEO of TechMake, raised $5M for IoT hardware",
        links: {
          twitter: "@marcusrivera",
          website: "https://techmake.com",
        },
      },
    ],
    showNotes: `Marcus shares hard-won lessons from building and scaling a hardware startup.

Key takeaways:
- Finding the right manufacturing partners
- Managing cash flow with long production cycles
- The importance of prototyping and iteration
- Crowdfunding vs. VC funding for hardware
- Common pitfalls and how to avoid them

Resources:
- TechMake Case Study: https://techmake.com/story
- Hardware Startup Guide: https://hardwarestartup.guide`,
    isFeatured: true,
  },
  {
    id: "3",
    slug: "ai-agents-future",
    episodeNumber: 3,
    title: "AI Agents: Building the Future of Automation",
    description:
      "Exploring the cutting edge of AI agent development, from simple scripts to autonomous systems that think and act.",
    publishDate: "2025-01-29",
    durationMinutes: 48,
    platforms: {
      spotify: "https://open.spotify.com/show/example",
      apple: "https://podcasts.apple.com/us/podcast/example",
      youtube: "https://youtube.com/watch?v=example",
    },
    guests: [
      {
        name: "Dr. Aisha Patel",
        bio: "AI Researcher and founder of AgentLab",
        links: {
          twitter: "@aishapatel",
          website: "https://agentlab.ai",
        },
      },
      {
        name: "Jordan Kim",
        bio: "Software Engineer at Anthropic, Claude team",
        links: {
          twitter: "@jordankim",
          linkedin: "https://linkedin.com/in/jordankim",
        },
      },
    ],
    showNotes: `A technical deep-dive into the world of AI agents and autonomous systems.

Discussion points:
- What makes an AI agent "agentic"?
- Current state of AI agent frameworks
- Real-world applications and use cases
- Ethical considerations in autonomous systems
- The future of human-AI collaboration

Links:
- AgentLab Framework: https://agentlab.ai
- Claude Agent SDK: https://docs.anthropic.com/agent-sdk
- Recommended reading: "Designing Autonomous Systems"`,
    isFeatured: true,
  },
];

// Helper to get featured episodes
export function getFeaturedEpisodes(): PodcastEpisode[] {
  return podcastEpisodes
    .filter((ep) => ep.isFeatured)
    .sort(
      (a, b) =>
        new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime()
    );
}

// Helper to get all episodes sorted by date
export function getAllEpisodes(): PodcastEpisode[] {
  return [...podcastEpisodes].sort(
    (a, b) =>
      new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime()
  );
}

// Helper to get a single episode by slug
export function getEpisodeBySlug(
  slug: string
): PodcastEpisode | undefined {
  return podcastEpisodes.find((ep) => ep.slug === slug);
}
