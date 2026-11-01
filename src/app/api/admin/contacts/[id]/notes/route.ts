import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { getSiteDb } from "@/db/site";
import { communityContacts, contactNotes } from "@/db/site/schema";
import { requireAdmin } from "@/lib/api/auth";
import { badRequest, handleApiError } from "@/lib/api/respond";
import { parseNoteInput, type ContactNote } from "@/lib/contact-notes";
import { noteColumns } from "@/lib/contact-notes-server";

/**
 * Conversation notes on one community contact (migration 0015).
 *
 * Admin-only, and `requireAdmin()` also accepts Cael's bearer token, so Berto's
 * agent can log a conversation with `POST { body, channel?, happened_on? }`.
 */

type Ctx = { params: Promise<{ id: string }> };

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const notFound = () => NextResponse.json({ error: "not_found" }, { status: 404 });

/** Every note on the contact, newest conversation first. */
export async function GET(_request: Request, { params }: Ctx) {
  try {
    await requireAdmin();
    const { id } = await params;
    if (!UUID_RE.test(id)) return notFound();
    const rows: ContactNote[] = await getSiteDb()
      .select(noteColumns)
      .from(contactNotes)
      .where(eq(contactNotes.contactId, id))
      .orderBy(desc(contactNotes.happenedOn), desc(contactNotes.createdAt));
    return NextResponse.json({ data: rows });
  } catch (err) {
    return handleApiError(err, "api/admin/contacts/[id]/notes GET");
  }
}

export async function POST(request: Request, { params }: Ctx) {
  try {
    const adminId = await requireAdmin();
    const { id } = await params;
    if (!UUID_RE.test(id)) return notFound();
    let input;
    try {
      input = parseNoteInput(await request.json(), { requireBody: true });
    } catch (err) {
      return badRequest((err as Error).message);
    }

    const db = getSiteDb();
    const [contact] = await db
      .select({ id: communityContacts.id })
      .from(communityContacts)
      .where(eq(communityContacts.id, id))
      .limit(1);
    if (!contact) return notFound();

    const [row] = await db
      .insert(contactNotes)
      .values({
        contactId: id,
        body: input.body!,
        channel: input.channel ?? null,
        // Omitted = today in Toronto, the column default.
        ...(input.happened_on ? { happenedOn: input.happened_on } : {}),
        createdBy: adminId,
      })
      .returning(noteColumns);
    return NextResponse.json({ data: row }, { status: 201 });
  } catch (err) {
    return handleApiError(err, "api/admin/contacts/[id]/notes POST");
  }
}
