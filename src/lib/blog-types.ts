/**
 * Blog types and row mapping, with no database import.
 *
 * Split out from `lib/blog.ts` because that module now imports Drizzle, and
 * Drizzle cannot be bundled into a client component. `BlogCard` and `BlogList`
 * only need the shape, so they import from here; anything that needs to *read*
 * imports `lib/blog.ts` (server) or `lib/blog-client.ts` (browser).
 */

export interface BlogAuthor {
  name: string;
  photo?: string;
  role?: string;
}

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string; // markdown
  coverImage?: string;
  publishDate: string; // ISO date string
  author: BlogAuthor;
  tags: string[];
  readTimeMinutes: number;
  isFeatured: boolean;
}

/** A `blog_posts` row, optionally with the author profile joined on. */
export interface BlogPostRow {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  cover_image: string | null;
  author_id: string | null;
  tags: string[];
  read_time_minutes: number;
  is_published: boolean;
  is_featured: boolean;
  published_at: string | null;
  newsletter_sent_at: string | null;
  created_at: string;
  updated_at: string;
  profiles?: {
    id: string;
    name: string | null;
    photo_url: string | null;
  } | null;
}

export function dbRowToBlogPost(row: BlogPostRow): BlogPost {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    content: row.content,
    coverImage: row.cover_image || undefined,
    publishDate: row.published_at || row.created_at,
    author: {
      name: row.profiles?.name || "MakersLounge",
      photo: row.profiles?.photo_url || undefined,
      role: "Founder, MakersLounge",
    },
    tags: row.tags || [],
    readTimeMinutes: row.read_time_minutes || 5,
    isFeatured: row.is_featured || false,
  };
}
