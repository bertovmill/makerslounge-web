import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { and, eq, isNull, sql } from "drizzle-orm";
import { getSiteDb } from "@/db/site";
import { blogPosts, emailSubscriptions } from "@/db/site/schema";
import { requireAdmin } from "@/lib/api/auth";
import { badRequest, handleApiError } from "@/lib/api/respond";
import { renderNewsletterEmail } from "@/lib/email-render";

const BCC_BATCH_SIZE = 40;

/**
 * Email a blog post tagged 'newsletter' to every active subscriber.
 *
 * This route could not have worked. It authorised with
 * `supabaseSSR.auth.getUser()` — Supabase Auth, which stopped existing at the
 * Clerk cutover — so `user` was always null and every call returned 403 before
 * reaching anything else. And behind that, `newsletter_sent_at` was not a column
 * in the database at all (migration 026 was never applied), so the select naming
 * it would have failed too. Both are fixed: authorization is `requireAdmin()`, and
 * neon-migrations/0002 adds the column.
 */
export async function POST(request: NextRequest) {
  try {
    await requireAdmin();

    if (!process.env.RESEND_API_KEY || !process.env.RESEND_FROM_EMAIL) {
      return NextResponse.json({ error: "Resend env vars not configured" }, { status: 500 });
    }

    const { postId } = (await request.json()) as { postId?: string };
    if (!postId || typeof postId !== "string") return badRequest("postId is required");

    const db = getSiteDb();

    const [post] = await db
      .select({
        id: blogPosts.id,
        slug: blogPosts.slug,
        title: blogPosts.title,
        excerpt: blogPosts.excerpt,
        content: blogPosts.content,
        coverImage: blogPosts.coverImage,
        tags: blogPosts.tags,
        isPublished: blogPosts.isPublished,
        newsletterSentAt: blogPosts.newsletterSentAt,
      })
      .from(blogPosts)
      .where(eq(blogPosts.id, postId))
      .limit(1);

    if (!post) return NextResponse.json({ error: "Post not found" }, { status: 404 });

    if (!post.isPublished) return badRequest("Post must be published before sending");

    if (post.newsletterSentAt) {
      return NextResponse.json(
        { error: "Newsletter already sent for this post", sentAt: post.newsletterSentAt },
        { status: 409 },
      );
    }

    if (!Array.isArray(post.tags) || !post.tags.includes("newsletter")) {
      return badRequest("Post is not tagged 'newsletter'");
    }

    const subs = await db
      .select({ email: emailSubscriptions.email })
      .from(emailSubscriptions)
      .where(eq(emailSubscriptions.isActive, true));

    const recipients = subs.map((s) => s.email).filter(Boolean);
    if (recipients.length === 0) return badRequest("No active subscribers");

    // Claim the send BEFORE dispatching anything. This used to be written at the
    // end, so a crash or timeout part-way through left the flag unset and a retry
    // re-mailed everyone who had already received it. The conditional WHERE makes
    // the claim atomic: if another request got there first, no row updates and we
    // stop rather than double-sending.
    const [claimed] = await db
      .update(blogPosts)
      .set({ newsletterSentAt: sql`now()` })
      .where(and(eq(blogPosts.id, postId), isNull(blogPosts.newsletterSentAt)))
      .returning({ id: blogPosts.id });

    if (!claimed) {
      return NextResponse.json(
        { error: "Newsletter already sent for this post" },
        { status: 409 },
      );
    }

    const postUrl = `https://makerslounge.ca/blog/${post.slug}`;
    const html = renderNewsletterEmail({
      title: post.title,
      excerpt: post.excerpt,
      coverImage: post.coverImage,
      markdown: post.content,
      postUrl,
    });

    const resend = new Resend(process.env.RESEND_API_KEY);
    const from = `MakersLounge <${process.env.RESEND_FROM_EMAIL}>`;

    const failures: { batch: string[]; error: string }[] = [];
    let sentCount = 0;

    for (let i = 0; i < recipients.length; i += BCC_BATCH_SIZE) {
      const batch = recipients.slice(i, i + BCC_BATCH_SIZE);
      const { error } = await resend.emails.send({
        from,
        to: process.env.RESEND_FROM_EMAIL!,
        bcc: batch,
        subject: post.title,
        html,
      });

      if (error) {
        failures.push({ batch, error: String(error) });
      } else {
        sentCount += batch.length;
      }
    }

    // Every batch failed, so nothing went out — release the claim so it can be
    // retried. A partial failure keeps the claim: re-running would re-mail the
    // batches that did succeed, and the response reports which ones to chase.
    if (sentCount === 0) {
      await db
        .update(blogPosts)
        .set({ newsletterSentAt: null })
        .where(eq(blogPosts.id, postId));
    }

    return NextResponse.json({
      message: "Newsletter sent",
      sentCount,
      totalRecipients: recipients.length,
      failures,
    });
  } catch (err) {
    return handleApiError(err, "api/newsletter/send POST");
  }
}

/** Active subscriber count, for the admin UI. */
export async function GET() {
  try {
    await requireAdmin();

    const [row] = await getSiteDb()
      .select({ n: sql<number>`count(*)::int` })
      .from(emailSubscriptions)
      .where(eq(emailSubscriptions.isActive, true));

    return NextResponse.json({ activeSubscribers: row?.n ?? 0 });
  } catch (err) {
    return handleApiError(err, "api/newsletter/send GET");
  }
}
