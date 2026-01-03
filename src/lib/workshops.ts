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
export const workshops: Workshop[] = [];

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
