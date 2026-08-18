import { NextRequest, NextResponse } from "next/server";
import { asc, eq } from "drizzle-orm";
import { getSiteDb } from "@/db/site";
import { mulerunDemos } from "@/db/site/schema";
import { requireAdmin } from "@/lib/api/auth";
import { badRequest, handleApiError } from "@/lib/api/respond";

/** List demos. Public — the event's leaderboard and voting screens show these. */
export async function GET() {
  try {
    const db = getSiteDb();
    const demos = await db
      .select({
        id: mulerunDemos.id,
        team_name: mulerunDemos.teamName,
        name: mulerunDemos.name,
        project: mulerunDemos.project,
        video_url: mulerunDemos.videoUrl,
        created_at: mulerunDemos.createdAt,
      })
      .from(mulerunDemos)
      .orderBy(asc(mulerunDemos.createdAt));

    return NextResponse.json({ demos });
  } catch (err) {
    return handleApiError(err, "api/mulerun/demos GET");
  }
}

/** Register a demo. Open, like the signup form — a walk-up form at an event. */
export async function POST(request: NextRequest) {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return badRequest("Invalid JSON");
    }

    const { team_name, name, project, video_url } = (body ?? {}) as {
      team_name?: unknown;
      name?: unknown;
      project?: unknown;
      video_url?: unknown;
    };

    if (typeof team_name !== "string" || team_name.trim().length === 0 || team_name.trim().length > 80) {
      return badRequest("Team name is required");
    }
    if (typeof name !== "string" || name.trim().length === 0 || name.trim().length > 120) {
      return badRequest("Member names are required");
    }
    if (typeof project !== "string" || project.trim().length === 0 || project.trim().length > 200) {
      return badRequest("Tell us what you built");
    }

    let videoUrl: string | null = null;
    if (video_url !== undefined && video_url !== null && video_url !== "") {
      if (typeof video_url !== "string" || video_url.trim().length > 500) {
        return badRequest("Video link is too long");
      }
      const trimmed = video_url.trim();
      try {
        const parsed = new URL(trimmed);
        if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
          throw new Error("bad protocol");
        }
      } catch {
        return badRequest("Video link must be a valid URL");
      }
      videoUrl = trimmed;
    }

    const db = getSiteDb();
    await db.insert(mulerunDemos).values({
      teamName: team_name.trim(),
      name: name.trim(),
      project: project.trim(),
      videoUrl,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err, "api/mulerun/demos POST");
  }
}

/**
 * Delete one demo, or all of them.
 *
 * SECURITY: previously unauthenticated and backed by the service-role key, so
 * `DELETE ?all=1` was open to anyone. Deleting a demo also cascades to its votes.
 * Now admin-only.
 */
export async function DELETE(request: NextRequest) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const all = searchParams.get("all");
    const db = getSiteDb();

    if (id) {
      await db.delete(mulerunDemos).where(eq(mulerunDemos.id, id));
      return NextResponse.json({ ok: true });
    }

    if (all === "1") {
      await db.delete(mulerunDemos);
      return NextResponse.json({ ok: true });
    }

    return badRequest("Provide ?id=<uuid> or ?all=1");
  } catch (err) {
    return handleApiError(err, "api/mulerun/demos DELETE");
  }
}
