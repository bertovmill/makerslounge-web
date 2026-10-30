"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronRight, MoreHorizontal, Plus, Trash2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { compareDoneTasks, compareOpenTasks, type AdminTask, type AdminTaskInput } from "@/lib/admin-tasks";

// ---------------------------------------------------------------------------
// Dates. Due dates are plain calendar days; "today" is MakersLounge's, Toronto.

function torontoToday(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Toronto" }).format(new Date());
}

function dayNumber(isoDate: string): number {
  const [y, m, d] = isoDate.split("-").map(Number);
  return Date.UTC(y, m - 1, d) / 86_400_000;
}

function formatDay(isoDate: string, today: string): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: isoDate.slice(0, 4) === today.slice(0, 4) ? undefined : "numeric",
    timeZone: "UTC",
  });
}

function dueLabel(isoDate: string, today: string): { text: string; tone: "overdue" | "soon" | "normal" } {
  const diff = dayNumber(isoDate) - dayNumber(today);
  if (diff < 0) return { text: diff === -1 ? "Yesterday" : `${-diff} days overdue`, tone: "overdue" };
  if (diff === 0) return { text: "Today", tone: "soon" };
  if (diff === 1) return { text: "Tomorrow", tone: "soon" };
  if (diff < 7) return { text: `In ${diff} days`, tone: "normal" };
  return { text: "", tone: "normal" };
}

function formatCompleted(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "America/Toronto" });
}

// ---------------------------------------------------------------------------
// API

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    cache: "no-store",
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.detail || body.error || `Request failed (${res.status})`);
  return body as T;
}

// ---------------------------------------------------------------------------
// Small pieces

const PRIORITY = [
  { value: 0, label: "P0", name: "Urgent", className: "bg-red-500/10 text-red-700 ring-red-600/20 dark:text-red-400" },
  { value: 1, label: "P1", name: "High", className: "bg-amber-500/10 text-amber-700 ring-amber-600/20 dark:text-amber-400" },
  { value: 2, label: "P2", name: "Normal", className: "bg-slate-500/10 text-slate-600 ring-slate-500/20 dark:text-slate-300" },
] as const;

function PriorityPill({ priority }: { priority: number | null }) {
  const p = PRIORITY.find((x) => x.value === priority);
  if (!p) return <span className="text-muted-foreground/60">—</span>;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-1.5 py-0.5 text-[11px] font-semibold tabular-nums ring-1 ring-inset",
        p.className,
      )}
      title={p.name}
    >
      {p.label}
    </span>
  );
}

function Assignee({ name }: { name: string | null }) {
  if (!name) return <span className="text-muted-foreground/60">—</span>;
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");
  return (
    <span className="flex min-w-0 items-center gap-2">
      <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-semibold text-primary">
        {initials}
      </span>
      <span className="truncate">{name}</span>
    </span>
  );
}

function DoneBox({ done, onToggle, label }: { done: boolean; onToggle: () => void; label: string }) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={done}
      aria-label={label}
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      className={cn(
        "flex size-[18px] items-center justify-center rounded-[5px] border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
        done
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-background hover:border-primary/60",
      )}
    >
      {done && <Check className="size-3" strokeWidth={3} />}
    </button>
  );
}

// Columns: checkbox · task · priority · due · assignee · menu. Priority and
// assignee drop out on phones; the priority pill moves next to the title.
const ROW_GRID =
  "grid grid-cols-[1.5rem_minmax(0,1fr)_5.5rem_1.75rem] md:grid-cols-[2.25rem_minmax(0,1fr)_5.5rem_9.5rem_10rem_2.25rem] items-center gap-x-3";

function TaskRow({
  task,
  today,
  onToggle,
  onEdit,
  onDelete,
}: {
  task: AdminTask;
  today: string;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const done = !!task.completed_at;
  const due = task.due_date && !done ? dueLabel(task.due_date, today) : null;

  return (
    <div
      role="row"
      tabIndex={0}
      onClick={onEdit}
      onKeyDown={(e) => {
        if (e.key === "Enter" && e.target === e.currentTarget) onEdit();
      }}
      className={cn(
        ROW_GRID,
        "group min-h-14 cursor-pointer border-b border-border/70 px-4 py-2.5 text-sm last:border-b-0 transition-colors hover:bg-muted/40 focus-visible:bg-muted/50 focus-visible:outline-none",
      )}
    >
      <div>
        <DoneBox done={done} onToggle={onToggle} label={done ? `Mark "${task.title}" not done` : `Mark "${task.title}" done`} />
      </div>

      <div className="min-w-0">
        <div
          className={cn(
            "line-clamp-2 font-medium md:truncate",
            done && "text-muted-foreground line-through decoration-muted-foreground/50",
          )}
        >
          {task.title}
        </div>
        {(task.notes || (task.priority !== null && !done)) && (
          <div className="mt-0.5 flex min-w-0 items-center gap-2">
            {task.priority !== null && !done && (
              <span className="shrink-0 md:hidden">
                <PriorityPill priority={task.priority} />
              </span>
            )}
            {task.notes && <p className="truncate text-xs text-muted-foreground">{task.notes}</p>}
          </div>
        )}
      </div>

      <div className="hidden md:block">{done ? null : <PriorityPill priority={task.priority} />}</div>

      <div className="tabular-nums">
        {done ? (
          <span className="text-xs text-muted-foreground">Done {formatCompleted(task.completed_at!)}</span>
        ) : task.due_date ? (
          <div className="leading-tight">
            <div className={cn(due?.tone === "overdue" && "font-medium text-red-600 dark:text-red-400")}>
              {formatDay(task.due_date, today)}
            </div>
            {due?.text && (
              <div
                className={cn(
                  "text-xs",
                  due.tone === "overdue" && "text-red-600/80 dark:text-red-400/80",
                  due.tone === "soon" && "text-amber-700 dark:text-amber-400",
                  due.tone === "normal" && "text-muted-foreground",
                )}
              >
                {due.text}
              </div>
            )}
          </div>
        ) : (
          <span className="text-muted-foreground/60">—</span>
        )}
      </div>

      <div className="hidden min-w-0 md:block">
        <Assignee name={task.assignee} />
      </div>

      <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label={`Actions for "${task.title}"`}
              className="flex size-7 items-center justify-center rounded-md text-muted-foreground opacity-100 transition hover:bg-muted hover:text-foreground md:opacity-0 md:group-hover:opacity-100 md:focus-visible:opacity-100 data-[state=open]:opacity-100"
            >
              <MoreHorizontal className="size-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem onSelect={onEdit}>
              <Pencil className="size-4" /> Edit
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={onToggle}>
              <Check className="size-4" /> {done ? "Mark not done" : "Mark done"}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onSelect={onDelete}>
              <Trash2 className="size-4" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

function TableHeader() {
  return (
    <div
      role="row"
      className={cn(
        ROW_GRID,
        "border-b border-border bg-muted/40 px-4 py-2 text-xs font-medium text-muted-foreground",
      )}
    >
      {/* sr-only is absolutely positioned, so it would drop out of the grid and
          shift every heading left a column; wrap it in a cell. */}
      <span>
        <span className="sr-only">Done</span>
      </span>
      <span>Task</span>
      <span className="hidden md:block">Priority</span>
      <span>Due</span>
      <span className="hidden md:block">Assignee</span>
      <span>
        <span className="sr-only">Actions</span>
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Create / edit dialog

type Draft = { title: string; notes: string; due_date: string; priority: string; assignee: string };

const emptyDraft: Draft = { title: "", notes: "", due_date: "", priority: "none", assignee: "" };

function draftFrom(task: AdminTask): Draft {
  return {
    title: task.title,
    notes: task.notes ?? "",
    due_date: task.due_date ?? "",
    priority: task.priority === null ? "none" : String(task.priority),
    assignee: task.assignee ?? "",
  };
}

function TaskDialog({
  open,
  task,
  assignees,
  onClose,
  onSave,
  onDelete,
}: {
  open: boolean;
  task: AdminTask | null;
  assignees: string[];
  onClose: () => void;
  onSave: (input: AdminTaskInput) => Promise<void>;
  onDelete: (task: AdminTask) => void;
}) {
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setDraft(task ? draftFrom(task) : emptyDraft);
      setError(null);
    }
  }, [open, task]);

  const set = (patch: Partial<Draft>) => setDraft((d) => ({ ...d, ...patch }));

  const submit = async () => {
    if (!draft.title.trim()) {
      setError("Give the task a title.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSave({
        title: draft.title,
        notes: draft.notes || null,
        due_date: draft.due_date || null,
        priority: draft.priority === "none" ? null : Number(draft.priority),
        assignee: draft.assignee || null,
      });
      onClose();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              submit();
            }
          }}
          className="space-y-5"
        >
          <DialogHeader>
            <DialogTitle>{task ? "Edit task" : "New task"}</DialogTitle>
            <DialogDescription>
              {task ? "Changes save to the shared MakersLounge list." : "Add a to-do for running MakersLounge."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <label className="block space-y-1.5">
              <span className="text-sm font-medium">Title</span>
              <Input
                autoFocus
                value={draft.title}
                onChange={(e) => set({ title: e.target.value })}
                placeholder="Send a blast for weekend coworking"
                maxLength={300}
              />
            </label>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <label className="block space-y-1.5">
                <span className="text-sm font-medium">Due date</span>
                <Input type="date" value={draft.due_date} onChange={(e) => set({ due_date: e.target.value })} />
              </label>
              <div className="space-y-1.5">
                <span className="block text-sm font-medium">Priority</span>
                <Select value={draft.priority} onValueChange={(v) => set({ priority: v })}>
                  <SelectTrigger className="w-full" aria-label="Priority">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No priority</SelectItem>
                    {PRIORITY.map((p) => (
                      <SelectItem key={p.value} value={String(p.value)}>
                        {p.label} · {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <label className="block space-y-1.5">
                <span className="text-sm font-medium">Assignee</span>
                <Input
                  value={draft.assignee}
                  onChange={(e) => set({ assignee: e.target.value })}
                  placeholder="Berto"
                  list="admin-task-assignees"
                  maxLength={100}
                />
                <datalist id="admin-task-assignees">
                  {assignees.map((a) => (
                    <option key={a} value={a} />
                  ))}
                </datalist>
              </label>
            </div>

            <label className="block space-y-1.5">
              <span className="text-sm font-medium">Notes</span>
              <Textarea
                value={draft.notes}
                onChange={(e) => set({ notes: e.target.value })}
                placeholder="Details, links, a draft of the message…"
                rows={4}
                maxLength={5000}
              />
            </label>
          </div>

          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

          <DialogFooter className="items-center sm:justify-between">
            {task ? (
              <Button
                type="button"
                variant="ghost"
                className="text-red-600 hover:bg-red-500/10 hover:text-red-700 sm:mr-auto"
                onClick={() => onDelete(task)}
              >
                <Trash2 className="size-4" /> Delete
              </Button>
            ) : (
              <span className="hidden text-xs text-muted-foreground sm:block">⌘ Enter to save</span>
            )}
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Saving…" : task ? "Save changes" : "Create task"}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Page

export default function AdminTasksPage() {
  const [tasks, setTasks] = useState<AdminTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<AdminTask | null>(null);
  const [quickTitle, setQuickTitle] = useState("");
  const [doneOpen, setDoneOpen] = useState(false);
  const quickRef = useRef<HTMLInputElement>(null);
  const today = torontoToday();

  const load = useCallback(async () => {
    try {
      const { data } = await api<{ data: AdminTask[] }>("/api/admin/tasks");
      setTasks(data);
      setError(null);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // "N" opens a new task, like Linear, when focus isn't in a field.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      if (el.closest("input, textarea, select, [contenteditable=true], [role=dialog]")) return;
      if (e.key === "n" && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        setEditing(null);
        setDialogOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const open = useMemo(() => tasks.filter((t) => !t.completed_at).sort(compareOpenTasks), [tasks]);
  const done = useMemo(() => tasks.filter((t) => t.completed_at).sort(compareDoneTasks), [tasks]);
  const overdue = open.filter((t) => t.due_date && t.due_date < today).length;
  const assignees = useMemo(
    () => [...new Set(tasks.map((t) => t.assignee).filter((a): a is string => !!a))].sort(),
    [tasks],
  );

  const replace = (row: AdminTask) => setTasks((ts) => ts.map((t) => (t.id === row.id ? row : t)));

  const toggle = async (task: AdminTask) => {
    const nowDone = !task.completed_at;
    replace({ ...task, completed_at: nowDone ? new Date().toISOString() : null });
    try {
      const { data } = await api<{ data: AdminTask }>(`/api/admin/tasks/${task.id}`, {
        method: "PATCH",
        body: JSON.stringify({ done: nowDone }),
      });
      replace(data);
    } catch (err) {
      replace(task);
      setError((err as Error).message);
    }
  };

  const save = async (input: AdminTaskInput) => {
    if (editing) {
      const { data } = await api<{ data: AdminTask }>(`/api/admin/tasks/${editing.id}`, {
        method: "PATCH",
        body: JSON.stringify(input),
      });
      replace(data);
    } else {
      const { data } = await api<{ data: AdminTask }>("/api/admin/tasks", {
        method: "POST",
        body: JSON.stringify(input),
      });
      setTasks((ts) => [data, ...ts]);
    }
  };

  const remove = async (task: AdminTask) => {
    if (!confirm(`Delete "${task.title}"? This can't be undone.`)) return;
    setDialogOpen(false);
    setTasks((ts) => ts.filter((t) => t.id !== task.id));
    try {
      await api(`/api/admin/tasks/${task.id}`, { method: "DELETE" });
    } catch (err) {
      setError((err as Error).message);
      load();
    }
  };

  const quickAdd = async () => {
    const title = quickTitle.trim();
    if (!title) return;
    setQuickTitle("");
    try {
      const { data } = await api<{ data: AdminTask }>("/api/admin/tasks", {
        method: "POST",
        body: JSON.stringify({ title }),
      });
      setTasks((ts) => [data, ...ts]);
    } catch (err) {
      setQuickTitle(title);
      setError((err as Error).message);
    }
  };

  const openEdit = (task: AdminTask) => {
    setEditing(task);
    setDialogOpen(true);
  };

  const summary = loading
    ? "Loading…"
    : open.length === 0
      ? "Nothing open. Nice."
      : `${open.length} open${overdue ? ` · ${overdue} overdue` : ""}${done.length ? ` · ${done.length} done` : ""}`;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 md:px-8 md:py-10">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Tasks</h1>
          <p className="mt-1 text-sm text-muted-foreground">MakersLounge to-dos · {summary}</p>
        </div>
        <Button
          size="sm"
          onClick={() => {
            setEditing(null);
            setDialogOpen(true);
          }}
        >
          <Plus className="size-4" /> New task
          <kbd className="ml-1 hidden rounded border border-primary-foreground/30 px-1 text-[10px] font-medium opacity-80 sm:inline">
            N
          </kbd>
        </Button>
      </div>

      {error && (
        <div className="mb-4 flex items-center justify-between rounded-lg border border-red-500/30 bg-red-500/5 px-4 py-2.5 text-sm text-red-700 dark:text-red-400">
          <span>Something went wrong: {error}</span>
          <button className="text-xs font-medium underline-offset-2 hover:underline" onClick={() => setError(null)}>
            Dismiss
          </button>
        </div>
      )}

      <div role="table" aria-label="Open tasks" className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            quickAdd();
          }}
          className="flex items-center gap-3 border-b border-border px-4 py-2.5"
        >
          <Plus className="ml-0.5 size-4 shrink-0 text-muted-foreground" />
          <input
            ref={quickRef}
            value={quickTitle}
            onChange={(e) => setQuickTitle(e.target.value)}
            placeholder="Add a task and press Enter"
            aria-label="Quick add a task"
            maxLength={300}
            className="h-8 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/70"
          />
          {quickTitle && (
            <span className="hidden text-xs text-muted-foreground sm:block">Enter to add</span>
          )}
        </form>

        <TableHeader />

        {loading ? (
          <div className="divide-y divide-border/70">
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex h-14 items-center gap-4 px-4">
                <div className="size-[18px] animate-pulse rounded-[5px] bg-muted" />
                <div className="h-3 w-1/3 animate-pulse rounded bg-muted" />
              </div>
            ))}
          </div>
        ) : open.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-4 py-14 text-center">
            <div className="mb-3 flex size-10 items-center justify-center rounded-full bg-muted">
              <Check className="size-5 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium">No open tasks</p>
            <p className="mt-1 text-sm text-muted-foreground">Add one above, or press N.</p>
          </div>
        ) : (
          open.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              today={today}
              onToggle={() => toggle(task)}
              onEdit={() => openEdit(task)}
              onDelete={() => remove(task)}
            />
          ))
        )}
      </div>

      {done.length > 0 && (
        <Collapsible open={doneOpen} onOpenChange={setDoneOpen} className="mt-6">
          <CollapsibleTrigger className="flex items-center gap-1.5 rounded-md px-1 py-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
            <ChevronRight className={cn("size-4 transition-transform", doneOpen && "rotate-90")} />
            Done
            <span className="rounded-full bg-muted px-1.5 text-xs tabular-nums">{done.length}</span>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div role="table" aria-label="Done tasks" className="mt-2 overflow-hidden rounded-xl border border-border bg-card shadow-sm">
              {done.map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  today={today}
                  onToggle={() => toggle(task)}
                  onEdit={() => openEdit(task)}
                  onDelete={() => remove(task)}
                />
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}

      <TaskDialog
        open={dialogOpen}
        task={editing}
        assignees={assignees}
        onClose={() => setDialogOpen(false)}
        onSave={save}
        onDelete={remove}
      />
    </div>
  );
}
