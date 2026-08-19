import { NextRequest, NextResponse } from "next/server";
import { asc, eq } from "drizzle-orm";
import { getSiteDb } from "@/db/site";
import { mulerunSignups } from "@/db/site/schema";
import { requireAdmin } from "@/lib/api/auth";
import { badRequest, handleApiError } from "@/lib/api/respond";

/** List signups. Public, as the event's own screens display this openly. */
export async function GET() {
  try {
    const db = getSiteDb();
    const signups = await db
      .select({
        id: mulerunSignups.id,
        name: mulerunSignups.name,
        categories: mulerunSignups.categories,
        created_at: mulerunSignups.createdAt,
      })
      .from(mulerunSignups)
      .orderBy(asc(mulerunSignups.createdAt));

    return NextResponse.json({ signups });
  } catch (err) {
    return handleApiError(err, "api/mulerun/signups GET");
  }
}

/**
 * Delete one signup, or all of them.
 *
 * SECURITY: this required no authentication whatsoever — it reached straight for
 * the Supabase service-role key, so `DELETE ?all=1` from anyone on the internet
 * would wipe the table. It is now admin-only.
 */
export async function DELETE(request: NextRequest) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const all = searchParams.get("all");
    const db = getSiteDb();

    if (id) {
      await db.delete(mulerunSignups).where(eq(mulerunSignups.id, id));
      return NextResponse.json({ ok: true });
    }

    if (all === "1") {
      await db.delete(mulerunSignups);
      return NextResponse.json({ ok: true });
    }

    return badRequest("Provide ?id=<uuid> or ?all=1");
  } catch (err) {
    return handleApiError(err, "api/mulerun/signups DELETE");
  }
}
