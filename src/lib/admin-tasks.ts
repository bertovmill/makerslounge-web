/**
 * The admin to-do list at `/admin/tasks`, table `makerslounge.admin_tasks`.
 *
 * Shared by the API routes and the page: the wire shape, input validation and
 * the sort order, so the page re-sorts after an edit exactly as the server would.
 */

export type AdminTask = {
  id: string;
  title: string;
  notes: string | null;
  /** `YYYY-MM-DD`, a calendar date with no time or zone. */
  due_date: string | null;
  /** 0, 1 or 2, shown as P0 / P1 / P2. */
  priority: number | null;
  assignee: string | null;
  completed_at: string | null;
  created_at: string;
};

export type AdminTaskInput = {
  title?: string;
  notes?: string | null;
  due_date?: string | null;
  priority?: number | null;
  assignee?: string | null;
  done?: boolean;
};

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function optionalText(value: unknown, max: number, field: string): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value !== "string") throw new Error(`${field} must be a string`);
  const trimmed = value.trim();
  if (trimmed.length > max) throw new Error(`${field} is longer than ${max} characters`);
  return trimmed || null;
}

/**
 * Validate a create or update body. Only keys present in `body` come back, so a
 * PATCH that sends `{ done: true }` touches nothing else. Throws with a message
 * the caller can show.
 */
export function parseTaskInput(body: unknown, { requireTitle }: { requireTitle: boolean }): AdminTaskInput {
  if (!body || typeof body !== "object") throw new Error("body must be an object");
  const raw = body as Record<string, unknown>;
  const out: AdminTaskInput = {};

  if ("title" in raw || requireTitle) {
    const title = optionalText(raw.title, 300, "title");
    if (!title) throw new Error("title is required");
    out.title = title;
  }
  if ("notes" in raw) out.notes = optionalText(raw.notes, 5000, "notes");
  if ("assignee" in raw) out.assignee = optionalText(raw.assignee, 100, "assignee");
  if ("due_date" in raw) {
    const due = raw.due_date;
    if (due === null || due === "") out.due_date = null;
    else if (typeof due === "string" && DATE_RE.test(due) && !Number.isNaN(Date.parse(due))) out.due_date = due;
    else throw new Error("due_date must be YYYY-MM-DD");
  }
  if ("priority" in raw) {
    const p = raw.priority;
    if (p === null) out.priority = null;
    else if (p === 0 || p === 1 || p === 2) out.priority = p;
    else throw new Error("priority must be 0, 1, 2 or null");
  }
  if ("done" in raw) {
    if (typeof raw.done !== "boolean") throw new Error("done must be a boolean");
    out.done = raw.done;
  }
  return out;
}

/** Open tasks: overdue and soonest first, undated last; ties by priority, then oldest. */
export function compareOpenTasks(a: AdminTask, b: AdminTask): number {
  if (a.due_date !== b.due_date) {
    if (!a.due_date) return 1;
    if (!b.due_date) return -1;
    return a.due_date < b.due_date ? -1 : 1;
  }
  const pa = a.priority ?? 3;
  const pb = b.priority ?? 3;
  if (pa !== pb) return pa - pb;
  return a.created_at < b.created_at ? -1 : a.created_at > b.created_at ? 1 : 0;
}

/** Done tasks: most recently completed first. */
export function compareDoneTasks(a: AdminTask, b: AdminTask): number {
  return (b.completed_at ?? "").localeCompare(a.completed_at ?? "");
}
