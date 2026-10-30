import { adminTasks } from "@/db/site/schema";

/** Selects an `admin_tasks` row in the snake_case `AdminTask` wire shape. */
export const taskColumns = {
  id: adminTasks.id,
  title: adminTasks.title,
  notes: adminTasks.notes,
  due_date: adminTasks.dueDate,
  priority: adminTasks.priority,
  assignee: adminTasks.assignee,
  completed_at: adminTasks.completedAt,
  created_at: adminTasks.createdAt,
};
