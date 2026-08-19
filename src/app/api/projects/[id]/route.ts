import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { getSiteDb } from "@/db/site";
import { projects } from "@/db/site/schema";
import { requireUser } from "@/lib/api/auth";
import { badRequest, handleApiError } from "@/lib/api/respond";

/**
 * Update or delete one post.
 *
 * Replaces `"Users can update their own projects"` and the delete equivalent, both
 * `current_profile_id() = user_id`. Ownership is a WHERE clause rather than a
 * fetch-then-compare: one statement, and someone else's post simply matches nothing.
 *
 * Deleting cascades to its likes and comments through the foreign keys.
 */

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  try {
    const me = await requireUser();
    const { id } = await params;
    const body = (await request.json()) as Record<string, unknown>;

    const updates: Record<string, unknown> = {};
    if (typeof body.title === "string") updates.title = body.title.trim();
    if ("description" in body) {
      updates.description =
        typeof body.description === "string" ? body.description.trim() || null : null;
    }
    if ("media_urls" in body) {
      updates.mediaUrls = Array.isArray(body.media_urls) ? (body.media_urls as string[]) : null;
    }
    if ("category" in body) updates.category = (body.category as string) ?? null;
    if ("metadata" in body) updates.metadata = body.metadata ?? null;

    if (Object.keys(updates).length === 0) return badRequest("no fields to update");
    updates.updatedAt = new Date().toISOString();

    const [updated] = await getSiteDb()
      .update(projects)
      .set(updates)
      .where(and(eq(projects.id, id), eq(projects.userId, me)))
      .returning({ id: projects.id });

    if (!updated) return NextResponse.json({ error: "not_found" }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (err) {
    return handleApiError(err, "api/projects/[id] PATCH");
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const me = await requireUser();
    const { id } = await params;

    const [deleted] = await getSiteDb()
      .delete(projects)
      .where(and(eq(projects.id, id), eq(projects.userId, me)))
      .returning({ id: projects.id });

    if (!deleted) return NextResponse.json({ error: "not_found" }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (err) {
    return handleApiError(err, "api/projects/[id] DELETE");
  }
}
