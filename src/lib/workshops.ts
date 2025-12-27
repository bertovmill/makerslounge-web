export interface Workshop {
  id: string;
  title: string;
  description: string;
  date: string; // ISO date string
  time: string; // e.g. "6:00 PM - 8:00 PM"
  location: string;
  instructor: {
    name: string;
    photo?: string;
  };
  coverImage?: string;
  tags: string[];
  lumaUrl: string;
  spotsAvailable?: number;
  maxSpots?: number;
}

// Add your workshops here - they'll automatically display on the workshops page
export const workshops: Workshop[] = [
  {
    id: "1",
    title: "Intro to 3D Printing",
    description:
      "Learn the fundamentals of 3D printing, from modeling basics to choosing the right filament. Perfect for beginners who want to start creating physical prototypes.",
    date: "2025-01-15",
    time: "6:00 PM - 8:30 PM",
    location: "MakersLounge HQ, Toronto",
    instructor: {
      name: "Sarah Chen",
    },
    tags: ["3D Printing", "Beginner", "Hardware"],
    lumaUrl: "https://lu.ma/makerslounge",
    spotsAvailable: 8,
    maxSpots: 12,
  },
  {
    id: "2",
    title: "Build Your First AI Agent",
    description:
      "Hands-on workshop where you'll build a functional AI agent using Claude and the Agent SDK. Bring your laptop and leave with a working project.",
    date: "2025-01-22",
    time: "7:00 PM - 9:00 PM",
    location: "Virtual (Zoom)",
    instructor: {
      name: "Marcus Williams",
    },
    tags: ["AI", "Coding", "Intermediate"],
    lumaUrl: "https://lu.ma/makerslounge",
    spotsAvailable: 15,
    maxSpots: 25,
  },
  {
    id: "3",
    title: "Laser Cutting & Engraving 101",
    description:
      "Master the basics of laser cutting and engraving. Learn to create custom designs, understand materials, and safety best practices.",
    date: "2025-02-05",
    time: "5:30 PM - 8:00 PM",
    location: "MakersLounge HQ, Toronto",
    instructor: {
      name: "Jamie Park",
    },
    tags: ["Laser Cutting", "Beginner", "Hardware"],
    lumaUrl: "https://lu.ma/makerslounge",
    spotsAvailable: 6,
    maxSpots: 8,
  },
];

// Helper to get upcoming workshops (sorted by date)
export function getUpcomingWorkshops(): Workshop[] {
  const now = new Date();
  return workshops
    .filter((w) => new Date(w.date) >= now)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

// Helper to get past workshops
export function getPastWorkshops(): Workshop[] {
  const now = new Date();
  return workshops
    .filter((w) => new Date(w.date) < now)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}
