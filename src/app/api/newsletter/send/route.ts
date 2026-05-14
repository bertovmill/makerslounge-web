import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { createClient } from "@/lib/supabase-server";
import { supabase as supabaseAnon } from "@/lib/supabase";
import { renderNewsletterEmail } from "@/lib/email-render";

const ADMIN_EMAIL = "bertmill19@gmail.com";
const BCC_BATCH_SIZE = 40;

export async function POST(request: NextRequest) {
  const supabaseSSR = await createClient();
  const { data: { user } } = await supabaseSSR.auth.getUser();

  if (!user || user.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  if (!process.env.RESEND_API_KEY || !process.env.RESEND_FROM_EMAIL) {
    return NextResponse.json(
      { error: "Resend env vars not configured" },
      { status: 500 }
    );
  }

  const { postId } = await request.json();
  if (!postId || typeof postId !== "string") {
    return NextResponse.json({ error: "postId is required" }, { status: 400 });
  }

  const { data: post, error: postError } = await supabaseAnon
    .from("blog_posts")
    .select("id, slug, title, excerpt, content, cover_image, tags, is_published, newsletter_sent_at")
    .eq("id", postId)
    .single();

  if (postError || !post) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  if (!post.is_published) {
    return NextResponse.json(
      { error: "Post must be published before sending" },
      { status: 400 }
    );
  }

  if (post.newsletter_sent_at) {
    return NextResponse.json(
      {
        error: "Newsletter already sent for this post",
        sentAt: post.newsletter_sent_at,
      },
      { status: 409 }
    );
  }

  if (!Array.isArray(post.tags) || !post.tags.includes("newsletter")) {
    return NextResponse.json(
      { error: "Post is not tagged 'newsletter'" },
      { status: 400 }
    );
  }

  const { data: subs, error: subsError } = await supabaseAnon
    .from("email_subscriptions")
    .select("email")
    .eq("is_active", true);

  if (subsError) {
    return NextResponse.json(
      { error: "Failed to load subscribers", details: subsError.message },
      { status: 500 }
    );
  }

  const recipients = (subs || []).map((s) => s.email).filter(Boolean);
  if (recipients.length === 0) {
    return NextResponse.json({ error: "No active subscribers" }, { status: 400 });
  }

  const postUrl = `https://makerslounge.ca/blog/${post.slug}`;
  const html = renderNewsletterEmail({
    title: post.title,
    excerpt: post.excerpt,
    coverImage: post.cover_image,
    markdown: post.content,
    postUrl,
  });

  const resend = new Resend(process.env.RESEND_API_KEY);
  const from = `MakersLounge <${process.env.RESEND_FROM_EMAIL}>`;
  const subject = post.title;

  const failures: { batch: string[]; error: string }[] = [];
  let sentCount = 0;

  for (let i = 0; i < recipients.length; i += BCC_BATCH_SIZE) {
    const batch = recipients.slice(i, i + BCC_BATCH_SIZE);
    const { error } = await resend.emails.send({
      from,
      to: process.env.RESEND_FROM_EMAIL!,
      bcc: batch,
      subject,
      html,
    });

    if (error) {
      failures.push({ batch, error: String(error) });
    } else {
      sentCount += batch.length;
    }
  }

  await supabaseAnon
    .from("blog_posts")
    .update({ newsletter_sent_at: new Date().toISOString() })
    .eq("id", postId);

  return NextResponse.json({
    message: "Newsletter sent",
    sentCount,
    totalRecipients: recipients.length,
    failures,
  });
}

export async function GET() {
  const supabaseSSR = await createClient();
  const { data: { user } } = await supabaseSSR.auth.getUser();

  if (!user || user.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { count, error } = await supabaseAnon
    .from("email_subscriptions")
    .select("*", { count: "exact", head: true })
    .eq("is_active", true);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ activeSubscribers: count ?? 0 });
}
