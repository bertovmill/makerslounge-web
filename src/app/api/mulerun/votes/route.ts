import { NextRequest, NextResponse } from "next/server";
import { asc, inArray } from "drizzle-orm";
import { getSiteDb } from "@/db/site";
import { mulerunDemos, mulerunVotes } from "@/db/site/schema";
import { requireAdmin } from "@/lib/api/auth";
import { badRequest, handleApiError } from "@/lib/api/respond";

type Demo = {
  id: string;
  team_name: string | null;
  name: string;
  project: string;
};

/**
 * Live vote tally. Public — this drives the results screen at the event.
 *
 * The scoring (3/2/1 for first/second/third) stays in JS rather than becoming
 * SQL: it is a handful of rows, and the tie-break order below is easier to read
 * and change here.
 */
export async function GET() {
  try {
    const db = getSiteDb();

    const [demos, votes] = await Promise.all([
      db
        .select({
          id: mulerunDemos.id,
          team_name: mulerunDemos.teamName,
          name: mulerunDemos.name,
          project: mulerunDemos.project,
        })
        .from(mulerunDemos)
        .orderBy(asc(mulerunDemos.createdAt)),
      db
        .select({
          first_id: mulerunVotes.firstId,
          second_id: mulerunVotes.secondId,
          third_id: mulerunVotes.thirdId,
        })
        .from(mulerunVotes),
    ]);

    const tally = new Map<
      string,
      { demo: Demo; points: number; first: number; second: number; third: number }
    >();
    for (const d of demos) {
      tally.set(d.id, { demo: d, points: 0, first: 0, second: 0, third: 0 });
    }
    for (const v of votes) {
      const a = tally.get(v.first_id);
      if (a) {
        a.points += 3;
        a.first += 1;
      }
      const b = tally.get(v.second_id);
      if (b) {
        b.points += 2;
        b.second += 1;
      }
      const c = tally.get(v.third_id);
      if (c) {
        c.points += 1;
        c.third += 1;
      }
    }

    const results = Array.from(tally.values())
      .map((r) => ({
        id: r.demo.id,
        team_name: r.demo.team_name,
        name: r.demo.name,
        project: r.demo.project,
        points: r.points,
        first: r.first,
        second: r.second,
        third: r.third,
      }))
      .sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        if (b.first !== a.first) return b.first - a.first;
        if (b.second !== a.second) return b.second - a.second;
        return b.third - a.third;
      });

    return NextResponse.json({ results, vote_count: votes.length });
  } catch (err) {
    return handleApiError(err, "api/mulerun/votes GET");
  }
}

/** Cast a vote. Open — voting is by browser id, not by account. */
export async function POST(request: NextRequest) {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return badRequest("Invalid JSON");
    }

    const { voter_id, first_id, second_id, third_id } = (body ?? {}) as {
      voter_id?: unknown;
      first_id?: unknown;
      second_id?: unknown;
      third_id?: unknown;
    };

    if (typeof voter_id !== "string" || voter_id.trim().length === 0 || voter_id.length > 64) {
      return badRequest("Invalid voter id");
    }
    if (
      typeof first_id !== "string" ||
      typeof second_id !== "string" ||
      typeof third_id !== "string"
    ) {
      return badRequest("Pick three teams");
    }
    if (first_id === second_id || first_id === third_id || second_id === third_id) {
      return badRequest("Pick three different teams");
    }

    const db = getSiteDb();

    // Confirm the picked demos exist. The foreign keys would reject a bad id
    // anyway, but this gives the voter a message they can act on.
    const existing = await db
      .select({ id: mulerunDemos.id })
      .from(mulerunDemos)
      .where(inArray(mulerunDemos.id, [first_id, second_id, third_id]));

    if (existing.length !== 3) {
      return badRequest("One of the teams you picked is no longer in the lineup.");
    }

    try {
      await db.insert(mulerunVotes).values({
        voterId: voter_id.trim(),
        firstId: first_id,
        secondId: second_id,
        thirdId: third_id,
      });
    } catch (err) {
      // unique_violation on mulerun_votes_voter_id_key — one vote per browser.
      // Postgres surfaces the SQLSTATE differently through the Neon driver than
      // through PostgREST, so match on either.
      const e = err as { code?: string; message?: string };
      if (e.code === "23505" || e.message?.includes("mulerun_votes_voter_id_key")) {
        return NextResponse.json(
          { error: "You've already voted from this browser." },
          { status: 409 },
        );
      }
      throw err;
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err, "api/mulerun/votes POST");
  }
}

/**
 * Clear all votes.
 *
 * SECURITY: previously unauthenticated with the service-role key, so anyone could
 * reset the tally mid-event. Now admin-only.
 */
export async function DELETE(request: NextRequest) {
  try {
    await requireAdmin();

    const all = new URL(request.url).searchParams.get("all");
    if (all !== "1") return badRequest("Provide ?all=1");

    await getSiteDb().delete(mulerunVotes);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err, "api/mulerun/votes DELETE");
  }
}
