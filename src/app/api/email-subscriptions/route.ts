import { NextResponse } from "next/server";
import { desc, eq, sql } from "drizzle-orm";
import { getSiteDb } from "@/db/site";
import { emailSubscriptions } from "@/db/site/schema";
import { requireAdmin } from "@/lib/api/auth";
import { handleApiError } from "@/lib/api/respond";

/**
 * Newsletter subscribers, for the admin screens.
 *
 * Admin-only. Under Supabase this table was readable with the anon key — the browser
 * listed every subscriber's email address on /admin/subscribers, and only the UI's own
 * admin check stood in front of it. Signing up is still public; that lives in
 * /api/subscribe.
 */
export async function GET() {
  try {
    await requireAdmin();
    const db = getSiteDb();

    const rows = await db
      .select({
        id: emailSubscriptions.id,
        email: emailSubscriptions.email,
        subscribed_to: emailSubscriptions.subscribedTo,
        is_active: emailSubscriptions.isActive,
        created_at: emailSubscriptions.createdAt,
      })
      .from(emailSubscriptions)
      .orderBy(desc(emailSubscriptions.createdAt));

    const [{ active }] = await db
      .select({ active: sql<number>`count(*)::int` })
      .from(emailSubscriptions)
      .where(eq(emailSubscriptions.isActive, true));

    return NextResponse.json({ data: rows, activeCount: active });
  } catch (err) {
    return handleApiError(err, "api/email-subscriptions GET");
  }
}
