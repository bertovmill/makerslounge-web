import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { getSiteDb } from "@/db/site";
import { applications } from "@/db/site/schema";
import { requireAdmin } from "@/lib/api/auth";
import { badRequest, handleApiError } from "@/lib/api/respond";

/**
 * Membership applications.
 *
 * Admin-only, matching `"Admin can read applications"` / `"Admin can update
 * applications"`. Submitting an application is a separate public path.
 *
 * `reviewed_by` and `reviewed_at` are set here rather than accepted from the request:
 * they are the audit trail of who made the decision, which is precisely the thing a
 * client should not be able to author.
 */
export async function GET() {
  try {
    await requireAdmin();

    const rows = await getSiteDb()
      .select()
      .from(applications)
      .orderBy(desc(applications.createdAt));

    return NextResponse.json({ data: rows });
  } catch (err) {
    return handleApiError(err, "api/applications GET");
  }
}

export async function PATCH(request: Request) {
  try {
    const adminId = await requireAdmin();
    const { id, status, adminNotes } = (await request.json()) as {
      id?: string;
      status?: string;
      adminNotes?: string;
    };

    if (!id) return badRequest("id is required");
    if (status && !["pending", "approved", "rejected"].includes(status)) {
      return badRequest("status must be pending, approved or rejected");
    }

    const updates: Record<string, unknown> = {};
    if (status) {
      updates.status = status;
      updates.reviewedAt = new Date().toISOString();
      updates.reviewedBy = adminId;
    }
    if (adminNotes !== undefined) updates.adminNotes = adminNotes;

    if (Object.keys(updates).length === 0) return badRequest("nothing to update");

    const [updated] = await getSiteDb()
      .update(applications)
      .set(updates)
      .where(eq(applications.id, id))
      .returning({ id: applications.id });

    if (!updated) return NextResponse.json({ error: "not_found" }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (err) {
    return handleApiError(err, "api/applications PATCH");
  }
}
