import { NextRequest, NextResponse } from "next/server";
import { and, desc, eq, sql } from "drizzle-orm";
import { getSiteDb } from "@/db/site";
import { profileEventNotes } from "@/db/site/schema";
import { requireUser } from "@/lib/api/auth";
import { badRequest, handleApiError } from "@/lib/api/respond";

/**
 * Private notes one member keeps about another, tied to a meetup.
 *
 * All four policies are keyed on `created_by`, not on `profile_id` — these are the
 * viewer's own notes about someone, not notes attached to that person's profile for
 * anyone to read. So every query here is scoped by `created_by = me`, and asking for
 * `?profileId=` narrows within that rather than opening it up.
 *
 * Getting this backwards would expose one member's private notes about another to the
 * subject of them, which is why the scope is stated rather than inferred.
 */
export async function GET(request: NextRequest) {
  try {
    const me = await requireUser();
    const profileId = new URL(request.url).searchParams.get("profileId");

    const rows = await getSiteDb()
      .select({
        id: profileEventNotes.id,
        profile_id: profileEventNotes.profileId,
        meetup_id: profileEventNotes.meetupId,
        meetup_name: profileEventNotes.meetupName,
        notes: profileEventNotes.notes,
        created_at: profileEventNotes.createdAt,
      })
      .from(profileEventNotes)
      .where(
        profileId
          ? and(
              eq(profileEventNotes.createdBy, me),
              eq(profileEventNotes.profileId, profileId),
            )
          : eq(profileEventNotes.createdBy, me),
      )
      .orderBy(desc(profileEventNotes.createdAt));

    return NextResponse.json({ data: rows });
  } catch (err) {
    return handleApiError(err, "api/profile-notes GET");
  }
}

/**
 * Create a note, or upsert a batch of them.
 *
 * An array body is the meetup-matcher's sync path: it saves a note per registered
 * participant, keyed on `(profile_id, meetup_id)` — which is exactly what the unique
 * index `profile_event_notes_profile_id_meetup_id_key` covers.
 *
 * `created_by` is the session's in both shapes; the client used to send it.
 */
export async function POST(request: Request) {
  try {
    const me = await requireUser();
    const raw = (await request.json()) as Record<string, unknown> | Record<string, unknown>[];

    if (Array.isArray(raw)) {
      const rows = raw
        .map((r) => ({
          profileId: r.profileId as string,
          meetupId: (r.meetupId as string | null) ?? null,
          meetupName: String(r.meetupName ?? "").trim(),
          notes: (r.notes as string | null) ?? null,
          createdBy: me,
        }))
        .filter((r) => r.profileId && r.meetupName);

      if (rows.length === 0) return NextResponse.json({ upserted: 0 });

      const done = await getSiteDb()
        .insert(profileEventNotes)
        .values(rows)
        .onConflictDoUpdate({
          target: [profileEventNotes.profileId, profileEventNotes.meetupId],
          set: {
            notes: sql`excluded.notes`,
            meetupName: sql`excluded.meetup_name`,
          },
        })
        .returning({ id: profileEventNotes.id });

      return NextResponse.json({ upserted: done.length });
    }

    const { profileId, meetupId, meetupName, notes } = raw as {
      profileId?: string;
      meetupId?: string | null;
      meetupName?: string;
      notes?: string | null;
    };

    // Both NOT NULL in the database.
    if (!profileId || !meetupName?.trim()) {
      return badRequest("profileId and meetupName are required");
    }

    const [created] = await getSiteDb()
      .insert(profileEventNotes)
      .values({
        profileId,
        meetupId: meetupId ?? null,
        meetupName: meetupName.trim(),
        notes: notes ?? null,
        createdBy: me,
      })
      .returning({ id: profileEventNotes.id, created_at: profileEventNotes.createdAt });

    return NextResponse.json({ data: created });
  } catch (err) {
    return handleApiError(err, "api/profile-notes POST");
  }
}

export async function PATCH(request: Request) {
  try {
    const me = await requireUser();
    const { id, notes, meetupName } = (await request.json()) as {
      id?: string;
      notes?: string | null;
      meetupName?: string;
    };
    if (!id) return badRequest("id is required");

    const updates: Record<string, unknown> = {};
    if (notes !== undefined) updates.notes = notes;
    if (meetupName !== undefined) updates.meetupName = meetupName;
    if (Object.keys(updates).length === 0) return badRequest("nothing to update");

    const [updated] = await getSiteDb()
      .update(profileEventNotes)
      .set(updates)
      .where(and(eq(profileEventNotes.id, id), eq(profileEventNotes.createdBy, me)))
      .returning({ id: profileEventNotes.id });

    if (!updated) return NextResponse.json({ error: "not_found" }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (err) {
    return handleApiError(err, "api/profile-notes PATCH");
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const me = await requireUser();
    const id = new URL(request.url).searchParams.get("id");
    if (!id) return badRequest("id is required");

    const [deleted] = await getSiteDb()
      .delete(profileEventNotes)
      .where(and(eq(profileEventNotes.id, id), eq(profileEventNotes.createdBy, me)))
      .returning({ id: profileEventNotes.id });

    if (!deleted) return NextResponse.json({ error: "not_found" }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (err) {
    return handleApiError(err, "api/profile-notes DELETE");
  }
}
