import { NextResponse } from "next/server";
import { desc } from "drizzle-orm";
import { getSiteDb } from "@/db/site";
import { adminTasks } from "@/db/site/schema";
import { requireAdmin } from "@/lib/api/auth";
import { badRequest, handleApiError } from "@/lib/api/respond";
import { parseTaskInput, type AdminTask } from "@/lib/admin-tasks";
import { taskColumns } from "@/lib/admin-tasks-server";

/** Every task, open and done. The page splits and sorts them. */
export async function GET() {
  try {
    await requireAdmin();
    const rows: AdminTask[] = await getSiteDb()
      .select(taskColumns)
      .from(adminTasks)
      .orderBy(desc(adminTasks.createdAt));
    return NextResponse.json({ data: rows });
  } catch (err) {
    return handleApiError(err, "api/admin/tasks GET");
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin();
    let input;
    try {
      input = parseTaskInput(await request.json(), { requireTitle: true });
    } catch (err) {
      return badRequest((err as Error).message);
    }
    const [row] = await getSiteDb()
      .insert(adminTasks)
      .values({
        title: input.title!,
        notes: input.notes ?? null,
        dueDate: input.due_date ?? null,
        priority: input.priority ?? null,
        assignee: input.assignee ?? null,
        completedAt: input.done ? new Date().toISOString() : null,
      })
      .returning(taskColumns);
    return NextResponse.json({ data: row }, { status: 201 });
  } catch (err) {
    return handleApiError(err, "api/admin/tasks POST");
  }
}
