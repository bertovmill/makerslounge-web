import { NextRequest, NextResponse } from "next/server";
import { and, asc, eq, ilike, inArray, or, sql } from "drizzle-orm";
import { getSiteDb } from "@/db/site";
import { communityContacts } from "@/db/site/schema";
import { isAdmin, requireAdmin } from "@/lib/api/auth";
import { badRequest, handleApiError } from "@/lib/api/respond";

/**
 * The community contact book — people who exist in the CRM before they have an
 * account.
 *
 * Five policies are being replaced, and they are not all admin-only:
 *
 *   admin_select / admin_insert / admin_update / admin_delete   the admin email
 *   public_read_visible                                        SELECT where
 *                                                              visibility = 'public'
 *
 * So a non-admin could read contacts explicitly marked public. All 822 rows are
 * currently `private`, meaning that policy matches nothing today — but it is
 * preserved rather than collapsed into "admin only", because collapsing it would
 * change what happens the first time somebody marks a contact public.
 *
 * The rows hold emails, phone numbers and employers, which is why the default is
 * closed.
 */

const contactColumns = {
  id: communityContacts.id,
  name: communityContacts.name,
  first_name: communityContacts.firstName,
  last_name: communityContacts.lastName,
  email: communityContacts.email,
  phone: communityContacts.phone,
  summary: communityContacts.summary,
  notes: communityContacts.notes,
  skills: communityContacts.skills,
  company: communityContacts.company,
  role: communityContacts.role,
  source: communityContacts.source,
  linkedin: communityContacts.linkedin,
  twitter: communityContacts.twitter,
  instagram: communityContacts.instagram,
  website: communityContacts.website,
  visibility: communityContacts.visibility,
  matched_profile_id: communityContacts.matchedProfileId,
  matched_at: communityContacts.matchedAt,
  metadata: communityContacts.metadata,
  created_at: communityContacts.createdAt,
  updated_at: communityContacts.updatedAt,
};

/** camelCase Drizzle key -> snake_case column, for `excluded.<col>` in an upsert. */
function toSnake(s: string): string {
  return s.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
}

const WRITABLE = {
  name: "name",
  first_name: "firstName",
  last_name: "lastName",
  email: "email",
  phone: "phone",
  summary: "summary",
  notes: "notes",
  skills: "skills",
  company: "company",
  role: "role",
  source: "source",
  linkedin: "linkedin",
  twitter: "twitter",
  instagram: "instagram",
  website: "website",
  visibility: "visibility",
  metadata: "metadata",
} as const;

/**
 * GET — admins see everything, everyone else sees only public contacts.
 *
 *   ?id=<uuid>   one contact
 *   ?q=text      name / company / summary
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const admin = await isAdmin();

    const conditions = admin ? [] : [eq(communityContacts.visibility, "public")];

    const id = searchParams.get("id");
    if (id) conditions.push(eq(communityContacts.id, id));

    const q = searchParams.get("q");
    if (q?.trim()) {
      const term = `%${q.trim()}%`;
      conditions.push(
        or(
          ilike(communityContacts.name, term),
          ilike(communityContacts.firstName, term),
          ilike(communityContacts.lastName, term),
          ilike(communityContacts.company, term),
          ilike(communityContacts.summary, term),
        )!,
      );
    }

    const rows = await getSiteDb()
      .select(contactColumns)
      .from(communityContacts)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(asc(communityContacts.name));

    return NextResponse.json({ data: rows });
  } catch (err) {
    return handleApiError(err, "api/community-contacts GET");
  }
}

function pick(body: Record<string, unknown>): Record<string, unknown> {
  const values: Record<string, unknown> = {};
  for (const [wire, column] of Object.entries(WRITABLE)) {
    if (wire in body) values[column] = body[wire];
  }
  return values;
}

/**
 * Create a contact, or bulk-upsert an import.
 *
 * A JSON array body is the CSV import path: upsert on `email`, which is what the
 * unique index `community_contacts_email_idx` is there for. Batched in the client
 * previously and still batched here, because a single statement with several hundred
 * rows is the one case where the Neon HTTP driver's request size starts to matter.
 */
export async function POST(request: Request) {
  try {
    await requireAdmin();
    const raw = (await request.json()) as Record<string, unknown> | Record<string, unknown>[];

    if (Array.isArray(raw)) {
      if (raw.length === 0) return NextResponse.json({ data: [], upserted: 0 });

      const rows = raw.map(pick).filter((r) => r.email);
      if (rows.length === 0) return badRequest("each imported contact needs an email");

      const db = getSiteDb();
      const BATCH = 200;
      let upserted = 0;

      for (let i = 0; i < rows.length; i += BATCH) {
        const batch = rows.slice(i, i + BATCH) as (typeof communityContacts.$inferInsert)[];
        const done = await db
          .insert(communityContacts)
          .values(batch)
          .onConflictDoUpdate({
            target: communityContacts.email,
            // `coalesce(excluded.x, existing.x)`, not plain `excluded.x`. A CSV that
            // omits a column arrives as NULL, and assigning it directly would blank
            // out phone numbers and employers that were already on file. This way an
            // import only ever fills in or replaces values it actually carries.
            set: Object.fromEntries(
              Object.values(WRITABLE)
                .filter((col) => col !== "email")
                .map((col) => {
                  const c = toSnake(col);
                  // `source` is a union, not a replacement: a contact imported from
                  // two lists belongs to both. The client used to do this by
                  // pre-fetching each batch's existing sources and merging in JS.
                  if (col === "source") {
                    return [
                      col,
                      sql.raw(`(
                        select array(select distinct unnest(
                          coalesce("community_contacts".source, '{}'::text[]) ||
                          coalesce(excluded.source, '{}'::text[])
                        ))
                      )`),
                    ];
                  }
                  return [
                    col,
                    sql.raw(`coalesce(excluded.${c}, "community_contacts".${c})`),
                  ];
                }),
            ),
          })
          .returning({ id: communityContacts.id });
        upserted += done.length;
      }

      return NextResponse.json({ upserted });
    }

    const values = pick(raw);
    if (!values.name && !values.email) return badRequest("name or email is required");

    // `community_contacts_email_idx` is UNIQUE, so an import of an address already on
    // file would otherwise surface as an opaque 500.
    try {
      const [created] = await getSiteDb()
        .insert(communityContacts)
        .values(values as typeof communityContacts.$inferInsert)
        .returning(contactColumns);
      return NextResponse.json({ data: created });
    } catch (err) {
      const e = err as { code?: string; message?: string };
      if (e.code === "23505" || e.message?.includes("community_contacts_email_idx")) {
        return NextResponse.json(
          { error: "A contact with that email already exists" },
          { status: 409 },
        );
      }
      throw err;
    }
  } catch (err) {
    return handleApiError(err, "api/community-contacts POST");
  }
}

/** Update a contact. Admin only. */
export async function PATCH(request: Request) {
  try {
    await requireAdmin();
    const body = (await request.json()) as Record<string, unknown> & { id?: string };
    if (!body.id) return badRequest("id is required");

    const updates: Record<string, unknown> = {};
    for (const [wire, column] of Object.entries(WRITABLE)) {
      if (wire in body) updates[column] = body[wire];
    }
    if (Object.keys(updates).length === 0) return badRequest("no writable fields provided");
    updates.updatedAt = sql`now()`;

    const [updated] = await getSiteDb()
      .update(communityContacts)
      .set(updates)
      .where(eq(communityContacts.id, body.id))
      .returning(contactColumns);

    if (!updated) return NextResponse.json({ error: "not_found" }, { status: 404 });
    return NextResponse.json({ data: updated });
  } catch (err) {
    return handleApiError(err, "api/community-contacts PATCH");
  }
}

/** Delete one contact (`?id=`) or several (`?ids=a,b,c`). Admin only. */
export async function DELETE(request: NextRequest) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const ids = searchParams.get("ids");

    if (ids) {
      const list = ids.split(",").map((s) => s.trim()).filter(Boolean);
      // An empty `inArray` is invalid SQL, and "no ids" must not mean "all rows".
      if (list.length === 0) return badRequest("ids was empty");
      const done = await getSiteDb()
        .delete(communityContacts)
        .where(inArray(communityContacts.id, list))
        .returning({ id: communityContacts.id });
      return NextResponse.json({ success: true, deleted: done.length });
    }

    if (!id) return badRequest("id or ids is required");

    const [deleted] = await getSiteDb()
      .delete(communityContacts)
      .where(eq(communityContacts.id, id))
      .returning({ id: communityContacts.id });

    if (!deleted) return NextResponse.json({ error: "not_found" }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (err) {
    return handleApiError(err, "api/community-contacts DELETE");
  }
}
