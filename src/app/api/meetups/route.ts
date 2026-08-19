import { NextRequest, NextResponse } from "next/server";
import { and, desc, eq } from "drizzle-orm";
import { getSiteDb } from "@/db/site";
import { meetups } from "@/db/site/schema";
import { requireUser } from "@/lib/api/auth";
import { badRequest, handleApiError } from "@/lib/api/respond";

/**
 * Saved meetup rosters for the matcher tool.
 *
 * All four policies are owner-scoped (`current_profile_id() = created_by`), so a
 * member sees only their own. The list query previously had no owner filter at all in
 * the client — it selected every row and relied entirely on RLS to narrow it, which
 * means the intent was invisible in the code. It is explicit here.
 */

const columns = {
  id: meetups.id,
  name: meetups.name,
  participants: meetups.participants,
  custom_field_names: meetups.customFieldNames,
  created_at: meetups.createdAt,
  updated_at: meetups.updatedAt,
};

export async function GET() {
  try {
    const me = await requireUser();

    const rows = await getSiteDb()
      .select(columns)
      .from(meetups)
      .where(eq(meetups.createdBy, me))
      .orderBy(desc(meetups.updatedAt));

    return NextResponse.json({ data: rows });
  } catch (err) {
    return handleApiError(err, "api/meetups GET");
  }
}

export async function POST(request: Request) {
  try {
    const me = await requireUser();
    const { name, participants, customFieldNames } = (await request.json()) as {
      name?: string;
      participants?: unknown;
      customFieldNames?: unknown;
    };

    if (!name?.trim()) return badRequest("name is required");

    const [created] = await getSiteDb()
      .insert(meetups)
      .values({
        name: name.trim(),
        createdBy: me,
        participants: participants ?? [],
        customFieldNames: customFieldNames ?? [],
      })
      .returning(columns);

    return NextResponse.json({ data: created });
  } catch (err) {
    return handleApiError(err, "api/meetups POST");
  }
}

export async function PATCH(request: Request) {
  try {
    const me = await requireUser();
    const { id, name, participants, customFieldNames } = (await request.json()) as {
      id?: string;
      name?: string;
      participants?: unknown;
      customFieldNames?: unknown;
    };
    if (!id) return badRequest("id is required");

    const updates: Record<string, unknown> = {};
    if (name !== undefined) updates.name = name;
    if (participants !== undefined) updates.participants = participants;
    if (customFieldNames !== undefined) updates.customFieldNames = customFieldNames;
    if (Object.keys(updates).length === 0) return badRequest("nothing to update");

    // `meetups_updated_at` is a database trigger, so `updated_at` is not set here.
    const [updated] = await getSiteDb()
      .update(meetups)
      .set(updates)
      .where(and(eq(meetups.id, id), eq(meetups.createdBy, me)))
      .returning(columns);

    if (!updated) return NextResponse.json({ error: "not_found" }, { status: 404 });
    return NextResponse.json({ data: updated });
  } catch (err) {
    return handleApiError(err, "api/meetups PATCH");
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const me = await requireUser();
    const id = new URL(request.url).searchParams.get("id");
    if (!id) return badRequest("id is required");

    const [deleted] = await getSiteDb()
      .delete(meetups)
      .where(and(eq(meetups.id, id), eq(meetups.createdBy, me)))
      .returning({ id: meetups.id });

    if (!deleted) return NextResponse.json({ error: "not_found" }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (err) {
    return handleApiError(err, "api/meetups DELETE");
  }
}
