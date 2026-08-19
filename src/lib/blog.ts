import { and, arrayContains, desc, eq, isNotNull, lte, sql } from "drizzle-orm";
import { getSiteDb } from "@/db/site";
import { blogPosts, profiles } from "@/db/site/schema";
import { type BlogPost, type BlogPostRow, dbRowToBlogPost } from "./blog-types";

/**
 * Blog reads, server-side only.
 *
 * SERVER ONLY — this imports Drizzle, which cannot be bundled into a client
 * component. Client components take the types from `./blog-types` and the
 * mutations from `./blog-client`, which go through `/api/blog`.
 *
 * The `profiles` join replaces PostgREST's embedded `profiles ( ... )` syntax.
 * Note it is a LEFT join: `blog_posts.author_id` is nullable, and an inner join
 * would silently drop any post without an author — the sort of difference that
 * shows up as a missing article rather than as an error.
 */

export type { BlogPost, BlogPostRow, BlogAuthor } from "./blog-types";

const postColumns = {
  id: blogPosts.id,
  slug: blogPosts.slug,
  title: blogPosts.title,
  excerpt: blogPosts.excerpt,
  content: blogPosts.content,
  cover_image: blogPosts.coverImage,
  author_id: blogPosts.authorId,
  tags: blogPosts.tags,
  read_time_minutes: blogPosts.readTimeMinutes,
  is_published: blogPosts.isPublished,
  is_featured: blogPosts.isFeatured,
  published_at: blogPosts.publishedAt,
  newsletter_sent_at: blogPosts.newsletterSentAt,
  created_at: blogPosts.createdAt,
  updated_at: blogPosts.updatedAt,
  authorName: profiles.name,
  authorPhoto: profiles.photoUrl,
};

type RawRow = {
  [K in keyof typeof postColumns]: K extends "authorName" | "authorPhoto"
    ? string | null
    : unknown;
};

/** Fold the flat join result back into the nested shape callers expect. */
function toRow(r: Record<string, unknown>): BlogPostRow {
  const { authorName, authorPhoto, ...rest } = r as RawRow & Record<string, unknown>;
  return {
    ...(rest as unknown as Omit<BlogPostRow, "profiles">),
    profiles:
      rest.author_id != null
        ? {
            id: rest.author_id as string,
            name: (authorName as string | null) ?? null,
            photo_url: (authorPhoto as string | null) ?? null,
          }
        : null,
  };
}

function baseQuery() {
  return getSiteDb()
    .select(postColumns)
    .from(blogPosts)
    .leftJoin(profiles, eq(profiles.id, blogPosts.authorId));
}

/**
 * Only posts published in the past.
 *
 * `published_at <= now()` is what lets a post be scheduled: it can be marked
 * published with a future date and stay hidden until then. `isNotNull` is added
 * explicitly because a NULL `published_at` makes the comparison NULL, which
 * excludes the row anyway — stating it keeps the intent readable.
 */
function isLive() {
  return and(
    eq(blogPosts.isPublished, true),
    isNotNull(blogPosts.publishedAt),
    lte(blogPosts.publishedAt, sql`now()`),
  );
}

export async function getAllPosts(): Promise<BlogPost[]> {
  const rows = await baseQuery().where(isLive()).orderBy(desc(blogPosts.publishedAt));
  return rows.map((r) => dbRowToBlogPost(toRow(r as Record<string, unknown>)));
}

export async function getFeaturedPosts(): Promise<BlogPost[]> {
  const rows = await baseQuery()
    .where(and(isLive(), eq(blogPosts.isFeatured, true)))
    .orderBy(desc(blogPosts.publishedAt));
  return rows.map((r) => dbRowToBlogPost(toRow(r as Record<string, unknown>)));
}

export async function getPostBySlug(slug: string): Promise<BlogPost | null> {
  const [row] = await baseQuery().where(and(isLive(), eq(blogPosts.slug, slug))).limit(1);
  return row ? dbRowToBlogPost(toRow(row as Record<string, unknown>)) : null;
}

export async function getPostsByTag(tag: string): Promise<BlogPost[]> {
  const rows = await baseQuery()
    .where(and(isLive(), arrayContains(blogPosts.tags, [tag])))
    .orderBy(desc(blogPosts.publishedAt));
  return rows.map((r) => dbRowToBlogPost(toRow(r as Record<string, unknown>)));
}

export async function getAllTags(): Promise<string[]> {
  const rows = await getSiteDb()
    .select({ tags: blogPosts.tags })
    .from(blogPosts)
    .where(isLive());

  const tagSet = new Set<string>();
  for (const row of rows) for (const tag of row.tags ?? []) tagSet.add(tag);
  return Array.from(tagSet).sort();
}

/** ALL posts, drafts included. Callers must authorise first. */
export async function getAllPostsAdmin(): Promise<BlogPostRow[]> {
  const rows = await baseQuery().orderBy(desc(blogPosts.createdAt));
  return rows.map((r) => toRow(r as Record<string, unknown>));
}

/** One post by id, draft or not. Callers must authorise first. */
export async function getPostById(id: string): Promise<BlogPostRow | null> {
  const [row] = await baseQuery().where(eq(blogPosts.id, id)).limit(1);
  return row ? toRow(row as Record<string, unknown>) : null;
}
