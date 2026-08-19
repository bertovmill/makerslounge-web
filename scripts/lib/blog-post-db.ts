/**
 * Blog-post helpers for the one-off content scripts.
 *
 * These scripts used the Supabase service-role key to insert and delete posts. There is
 * no RLS to bypass now, and no session to authorise with either — a CLI script is
 * trusted server code by definition — so they talk to Neon directly.
 *
 * `.env.local` is loaded by the scripts themselves; only Next.js does that
 * automatically.
 */
import { eq } from "drizzle-orm";
import { getSiteDb } from "../../src/db/site";
import { blogPosts } from "../../src/db/site/schema";

export type BlogPostInput = typeof blogPosts.$inferInsert;

/** Delete a post by slug. Returns how many rows went. */
export async function deletePostBySlug(slug: string): Promise<number> {
  const done = await getSiteDb()
    .delete(blogPosts)
    .where(eq(blogPosts.slug, slug))
    .returning({ id: blogPosts.id });
  return done.length;
}

/**
 * Insert a post, replacing any existing one with the same slug.
 *
 * The scripts all did check-then-delete-then-insert; this keeps that behaviour, which is
 * what makes them re-runnable.
 */
export async function upsertPostBySlug(post: BlogPostInput): Promise<{ slug: string }> {
  const replaced = await deletePostBySlug(post.slug);
  if (replaced > 0) console.log(`   (replaced an existing post at /${post.slug})`);

  const [created] = await getSiteDb()
    .insert(blogPosts)
    .values(post)
    .returning({ slug: blogPosts.slug });

  return created;
}

/** Find a post by slug, or null. */
export async function findPostBySlug(slug: string): Promise<{ slug: string } | null> {
  const [row] = await getSiteDb()
    .select({ slug: blogPosts.slug })
    .from(blogPosts)
    .where(eq(blogPosts.slug, slug))
    .limit(1);
  return row ?? null;
}

/** Insert without replacing. Throws on a slug collision, which is the intent here. */
export async function insertPost(post: BlogPostInput): Promise<{ id: string; slug: string }> {
  const [created] = await getSiteDb()
    .insert(blogPosts)
    .values(post)
    .returning({ id: blogPosts.id, slug: blogPosts.slug });
  return created;
}
