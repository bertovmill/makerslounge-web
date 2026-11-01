import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { getSiteDb } from "@/db/site";
import { contactNotes } from "@/db/site/schema";
import { requireAdmin } from "@/lib/api/auth";
import { badRequest, handleApiError } from "@/lib/api/respond";
import { parseNoteInput } from "@/lib/contact-notes";
import { noteColumns } from "@/lib/contact-notes-server";

type Ctx = { params: Promise<{ id: string; noteId: string }> };

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const notFound = () => NextResponse.json({ error: "not_found" }, { status: 404 });

/** Both ids must match, so a note can't be edited through another contact's URL. */
function whereNote(id: string, noteId: string) {
  return and(eq(contactNotes.id, noteId), eq(contactNotes.contactId, id));
}

/** Edit a note's text, place or date. */
export async function PATCH(request: Request, { params }: Ctx) {
  try {
    await requireAdmin();
    const { id, noteId } = await params;
    if (!UUID_RE.test(id) || !UUID_RE.test(noteId)) return notFound();
    let input;
    try {
      input = parseNoteInput(await request.json(), { requireBody: false });
    } catch (err) {
      return badRequest((err as Error).message);
    }

    const set: Partial<typeof contactNotes.$inferInsert> = { updatedAt: new Date().toISOString() };
    if (input.body !== undefined) set.body = input.body;
    if (input.channel !== undefined) set.channel = input.channel;
    if (input.happened_on !== undefined) set.happenedOn = input.happened_on;

    const [row] = await getSiteDb()
      .update(contactNotes)
      .set(set)
      .where(whereNote(id, noteId))
      .returning(noteColumns);
    if (!row) return notFound();
    return NextResponse.json({ data: row });
  } catch (err) {
    return handleApiError(err, "api/admin/contacts/[id]/notes/[noteId] PATCH");
  }
}

export async function DELETE(_request: Request, { params }: Ctx) {
  try {
    await requireAdmin();
    const { id, noteId } = await params;
    if (!UUID_RE.test(id) || !UUID_RE.test(noteId)) return notFound();
    const [row] = await getSiteDb()
      .delete(contactNotes)
      .where(whereNote(id, noteId))
      .returning({ id: contactNotes.id });
    if (!row) return notFound();
    return NextResponse.json({ success: true });
  } catch (err) {
    return handleApiError(err, "api/admin/contacts/[id]/notes/[noteId] DELETE");
  }
}
