import { NextRequest, NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";
import { getSiteDb } from "@/db/site";
import { mulerunVotes } from "@/db/site/schema";
import { handleApiError } from "@/lib/api/respond";

/**
 * Has this voter already voted?
 *
 * `voter_id` is a browser-generated identifier, not an account — the mulerun
 * demo vote is deliberately open to anyone in the room. So there is no session to
 * check here, and this remains readable without authentication, exactly as the
 * table's `true` RLS policy allowed.
 */
export async function GET(request: NextRequest) {
  try {
    const voterId = new URL(request.url).searchParams.get("voter_id");
    if (!voterId || voterId.length === 0 || voterId.length > 64) {
      return NextResponse.json({ voted: false });
    }

    const db = getSiteDb();
    const [row] = await db
      .select({ n: sql<number>`count(*)::int` })
      .from(mulerunVotes)
      .where(eq(mulerunVotes.voterId, voterId));

    return NextResponse.json({ voted: (row?.n ?? 0) > 0 });
  } catch (err) {
    return handleApiError(err, "api/mulerun/votes/me");
  }
}
