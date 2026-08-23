import { NextRequest, NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";
import { getSiteDb } from "@/db/site";
import { emailSubscriptions } from "@/db/site/schema";
import { notifyNewSubscriber } from "@/lib/slack";
import { mintTalkAccessToken, TALK_ACCESS_COOKIE } from "@/lib/talk-access";

/**
 * Trade an email address for access to the recorded talks.
 *
 * The email lands in `email_subscriptions` — the same table `/api/subscribe`
 * writes, so a talk unlock grows the newsletter list rather than a parallel one —
 * and the response sets the signed cookie that `getTalkViewerEmail()` reads.
 *
 * Deliberately not `/api/subscribe` itself: that route is the newsletter form and
 * returns early with "already subscribed" for a known email, which is the wrong
 * behaviour here. A returning visitor on a new device has to get a fresh cookie,
 * not a 200 telling them they're already on the list.
 *
 * No welcome email. `/api/subscribe` sends one because signing up for a
 * newsletter is the whole intent there; someone who typed an email to watch a
 * video did not ask for mail, and sending it unprompted is how you train people
 * to mark you as spam. The Slack ping still fires so new addresses are visible.
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** "talks" is added so the source of a subscription is legible in the admin list. */
const SUBSCRIBED_TO = ["talks", "events", "podcasts"];

export async function POST(request: NextRequest) {
  let email: unknown;
  try {
    ({ email } = await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (typeof email !== "string" || !EMAIL_RE.test(email.trim())) {
    return NextResponse.json({ error: "Enter a valid email address" }, { status: 400 });
  }

  const normalized = email.toLowerCase().trim();

  const token = mintTalkAccessToken(normalized);
  if (!token) {
    // No signing secret means the cookie can't be trusted, so refuse rather than
    // hand out the video id on an unverifiable token.
    console.error("talk unlock: no TALK_GATE_SECRET or CLERK_SECRET_KEY configured");
    return NextResponse.json({ error: "Gate is misconfigured" }, { status: 500 });
  }

  // Recording the email must not block access — someone who typed a valid address
  // has held up their end, and a database hiccup shouldn't read as a rejection.
  try {
    const db = getSiteDb();

    const [existing] = await db
      .select({ id: emailSubscriptions.id, isActive: emailSubscriptions.isActive })
      .from(emailSubscriptions)
      .where(eq(emailSubscriptions.email, normalized))
      .limit(1);

    if (!existing) {
      await db.insert(emailSubscriptions).values({
        email: normalized,
        subscribedTo: SUBSCRIBED_TO,
      });
    } else {
      // Union rather than overwrite: a newsletter subscriber who unlocks a talk
      // shouldn't silently lose whatever they'd already opted into.
      await db
        .update(emailSubscriptions)
        .set({
          isActive: true,
          subscribedTo: sql`(
            select array_agg(distinct s)
            from unnest(coalesce(${emailSubscriptions.subscribedTo}, '{}') || 'talks'::text[]) as s
          )`,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(emailSubscriptions.email, normalized));
    }

    if (!existing || !existing.isActive) {
      await notifyNewSubscriber({
        email: normalized,
        subscribedTo: SUBSCRIBED_TO,
        returning: Boolean(existing),
      });
    }
  } catch (err) {
    console.error("talk unlock: failed to record subscription", err);
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(TALK_ACCESS_COOKIE.name, token, TALK_ACCESS_COOKIE.options);
  return response;
}
