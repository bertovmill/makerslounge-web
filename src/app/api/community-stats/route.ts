import { NextResponse } from "next/server";
import { count } from "drizzle-orm";
import { getSiteDb } from "@/db/site";
import { profiles } from "@/db/site/schema";
import { handleApiError } from "@/lib/api/respond";

/**
 * Public headline numbers for the landing page ("Join N builders").
 *
 * Only aggregates leave this route — never rows. Counts every profile, i.e.
 * everyone who has signed up, whether or not they finished onboarding.
 * Cached at the CDN for five minutes so the landing page doesn't hit Postgres
 * on every visit.
 */
export const revalidate = 300;

export async function GET() {
  try {
    const db = getSiteDb();
    const [{ value: members }] = await db.select({ value: count() }).from(profiles);
    return NextResponse.json(
      { members },
      { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600" } },
    );
  } catch (err) {
    return handleApiError(err, "community-stats");
  }
}
