import { NextRequest, NextResponse } from "next/server";
import { and, asc, eq } from "drizzle-orm";
import { getSiteDb } from "@/db/site";
import { valuePortfolio } from "@/db/site/schema";
import { requireUser } from "@/lib/api/auth";
import { badRequest, handleApiError } from "@/lib/api/respond";

/**
 * A member's value portfolio.
 *
 * Reads are public (`"Public value_portfolio are viewable by everyone"`); writes are
 * row-owner. `user_id` comes from the session, and updates and deletes are scoped by
 * it, so an item belonging to someone else simply matches nothing.
 */

const WRITABLE = {
  title: "title",
  category: "category",
  value_description: "valueDescription",
  media_urls: "mediaUrls",
  links: "links",
} as const;

function pick(body: Record<string, unknown>) {
  const out: Record<string, unknown> = {};
  for (const [wire, column] of Object.entries(WRITABLE)) {
    if (wire in body) out[column] = body[wire];
  }
  return out;
}

/** `?userId=` to read someone's portfolio; omitted means the caller's own. */
export async function GET(request: NextRequest) {
  try {
    const userId = new URL(request.url).searchParams.get("userId");
    const target = userId ?? (await requireUser());

    const rows = await getSiteDb()
      .select()
      .from(valuePortfolio)
      .where(eq(valuePortfolio.userId, target))
      .orderBy(asc(valuePortfolio.createdAt));

    return NextResponse.json({ data: rows });
  } catch (err) {
    return handleApiError(err, "api/value-portfolio GET");
  }
}

export async function POST(request: Request) {
  try {
    const me = await requireUser();
    const values = pick((await request.json()) as Record<string, unknown>);

    // Both NOT NULL.
    if (!values.title || !values.category) {
      return badRequest("title and category are required");
    }

    const [created] = await getSiteDb()
      .insert(valuePortfolio)
      .values({ ...values, userId: me } as typeof valuePortfolio.$inferInsert)
      .returning({ id: valuePortfolio.id });

    return NextResponse.json({ data: created });
  } catch (err) {
    return handleApiError(err, "api/value-portfolio POST");
  }
}

export async function PATCH(request: Request) {
  try {
    const me = await requireUser();
    const body = (await request.json()) as Record<string, unknown> & { id?: string };
    if (!body.id) return badRequest("id is required");

    const updates = pick(body);
    if (Object.keys(updates).length === 0) return badRequest("no writable fields provided");
    updates.updatedAt = new Date().toISOString();

    const [updated] = await getSiteDb()
      .update(valuePortfolio)
      .set(updates)
      .where(and(eq(valuePortfolio.id, body.id), eq(valuePortfolio.userId, me)))
      .returning({ id: valuePortfolio.id });

    if (!updated) return NextResponse.json({ error: "not_found" }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (err) {
    return handleApiError(err, "api/value-portfolio PATCH");
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const me = await requireUser();
    const id = new URL(request.url).searchParams.get("id");
    if (!id) return badRequest("id is required");

    const [deleted] = await getSiteDb()
      .delete(valuePortfolio)
      .where(and(eq(valuePortfolio.id, id), eq(valuePortfolio.userId, me)))
      .returning({ id: valuePortfolio.id });

    if (!deleted) return NextResponse.json({ error: "not_found" }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (err) {
    return handleApiError(err, "api/value-portfolio DELETE");
  }
}
