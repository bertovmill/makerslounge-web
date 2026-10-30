-- A to-do list for running MakersLounge, at /admin/tasks. Asked for on
-- 2026-10-30 so organizer to-dos live in the admin portal instead of
-- scattered notes.
--
--   * Done is a timestamp, not a boolean: `completed_at IS NOT NULL` is done,
--     and the Done section can say when.
--   * `priority` is 0, 1 or 2 (shown as P0 / P1 / P2), nullable for "none".
--     A number so it sorts directly.
--   * `assignee` is a plain name, not a profile id: the people who help run
--     events don't all have accounts.

CREATE TABLE makerslounge.admin_tasks (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title        text NOT NULL CHECK (char_length(title) BETWEEN 1 AND 300),
  notes        text CHECK (notes IS NULL OR char_length(notes) <= 5000),
  due_date     date,
  priority     smallint CHECK (priority IS NULL OR priority BETWEEN 0 AND 2),
  assignee     text CHECK (assignee IS NULL OR char_length(assignee) <= 100),
  completed_at timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX admin_tasks_open_due_idx
  ON makerslounge.admin_tasks (due_date)
  WHERE completed_at IS NULL;
