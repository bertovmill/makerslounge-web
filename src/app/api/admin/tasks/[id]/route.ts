import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getSiteDb } from "@/db/site";
import { adminTasks } from "@/db/site/schema";
import { requireAdmin } from "@/lib/api/auth";
import { badRequest, handleApiError } from "@/lib/api/respond";
import { parseTaskInput } from "@/lib/admin-tasks";
import { taskColumns } from "@/lib/admin-tasks-server";

type Ctx = { params: Promise<{ id: string }> };

/** Edit a task, or check it off with `{ done: true }` (and back with `false`). */
export async function PATCH(request: Request, { params }: Ctx) {
  try {
    await requireAdmin();
    const { id } = await params;
    let input;
    try {
      input = parseTaskInput(await request.json(), { requireTitle: false });
    } catch (err) {
      return badRequest((err as Error).message);
    }

    const set: Partial<typeof adminTasks.$inferInsert> = { updatedAt: new Date().toISOString() };
    if (input.title !== undefined) set.title = input.title;
    if (input.notes !== undefined) set.notes = input.notes;
    if (input.due_date !== undefined) set.dueDate = input.due_date;
    if (input.priority !== undefined) set.priority = input.priority;
    if (input.assignee !== undefined) set.assignee = input.assignee;
    if (input.done !== undefined) set.completedAt = input.done ? new Date().toISOString() : null;

    const [row] = await getSiteDb()
      .update(adminTasks)
      .set(set)
      .where(eq(adminTasks.id, id))
      .returning(taskColumns);
    if (!row) return NextResponse.json({ error: "not_found" }, { status: 404 });
    return NextResponse.json({ data: row });
  } catch (err) {
    return handleApiError(err, "api/admin/tasks/[id] PATCH");
  }
}

export async function DELETE(_request: Request, { params }: Ctx) {
  try {
    await requireAdmin();
    const { id } = await params;
    const [row] = await getSiteDb()
      .delete(adminTasks)
      .where(eq(adminTasks.id, id))
      .returning({ id: adminTasks.id });
    if (!row) return NextResponse.json({ error: "not_found" }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (err) {
    return handleApiError(err, "api/admin/tasks/[id] DELETE");
  }
}
