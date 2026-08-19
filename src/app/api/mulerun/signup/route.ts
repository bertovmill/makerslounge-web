import { NextRequest, NextResponse } from "next/server";
import { getSiteDb } from "@/db/site";
import { mulerunSignups } from "@/db/site/schema";
import { badRequest, handleApiError } from "@/lib/api/respond";
import { CATEGORIES, MIN_CATEGORIES, MAX_CATEGORIES } from "@/app/hackathons/mulerun/categories";

const VALID_SLUGS = new Set(CATEGORIES.map((c) => c.slug));

/**
 * Sign up for a mulerun category.
 *
 * Open to anyone, as it was under Supabase — this is a walk-up form at an event,
 * not an account feature. The validation below is therefore the only gate, and
 * the table's CHECK constraints (name length, 1–3 categories) back it up in the
 * database.
 */
export async function POST(request: NextRequest) {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return badRequest("Invalid JSON");
    }

    const { name, categories } = (body ?? {}) as { name?: unknown; categories?: unknown };

    if (typeof name !== "string" || name.trim().length === 0 || name.trim().length > 80) {
      return badRequest("Name is required");
    }

    if (
      !Array.isArray(categories) ||
      categories.length < MIN_CATEGORIES ||
      categories.length > MAX_CATEGORIES ||
      !categories.every((c) => typeof c === "string" && VALID_SLUGS.has(c))
    ) {
      return badRequest(`Pick ${MIN_CATEGORIES}–${MAX_CATEGORIES} categories`);
    }

    const db = getSiteDb();
    await db.insert(mulerunSignups).values({
      name: name.trim(),
      categories: Array.from(new Set(categories)),
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err, "api/mulerun/signup");
  }
}
