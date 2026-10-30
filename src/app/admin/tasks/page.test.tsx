import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import AdminTasksPage from "./page";
import { compareOpenTasks, parseTaskInput, type AdminTask } from "@/lib/admin-tasks";

// Radix primitives stood in by plain elements. In a git worktree Radix resolves
// a second copy of React from the parent checkout and every hook throws, so the
// page is tested for its own behaviour, not Radix's.
type Kids = { children?: React.ReactNode };
vi.mock("@/components/ui/dialog", () => ({
  Dialog: ({ open, children }: Kids & { open: boolean }) => (open ? <div role="dialog">{children}</div> : null),
  DialogContent: ({ children }: Kids) => <div>{children}</div>,
  DialogHeader: ({ children }: Kids) => <div>{children}</div>,
  DialogFooter: ({ children }: Kids) => <div>{children}</div>,
  DialogTitle: ({ children }: Kids) => <h2>{children}</h2>,
  DialogDescription: ({ children }: Kids) => <p>{children}</p>,
}));
vi.mock("@/components/ui/dropdown-menu", () => ({
  DropdownMenu: ({ children }: Kids) => <>{children}</>,
  DropdownMenuTrigger: ({ children }: Kids) => <>{children}</>,
  DropdownMenuContent: () => null,
  DropdownMenuItem: () => null,
  DropdownMenuSeparator: () => null,
}));
vi.mock("@/components/ui/select", () => ({
  Select: ({ children }: Kids) => <div>{children}</div>,
  SelectTrigger: ({ children }: Kids) => <button type="button">{children}</button>,
  SelectValue: () => null,
  SelectContent: () => null,
  SelectItem: () => null,
}));
vi.mock("@/components/ui/collapsible", async () => {
  const { createContext, useContext } = await import("react");
  const Ctx = createContext({ open: false, toggle: () => {} });
  return {
    Collapsible: ({ open, onOpenChange, children }: Kids & { open: boolean; onOpenChange: (o: boolean) => void }) => (
      <Ctx.Provider value={{ open, toggle: () => onOpenChange(!open) }}>{children}</Ctx.Provider>
    ),
    CollapsibleTrigger: ({ children }: Kids) => (
      <button type="button" onClick={useContext(Ctx).toggle}>
        {children}
      </button>
    ),
    CollapsibleContent: ({ children }: Kids) => (useContext(Ctx).open ? <div>{children}</div> : null),
  };
});

function task(overrides: Partial<AdminTask>): AdminTask {
  return {
    id: overrides.id ?? Math.random().toString(36).slice(2),
    title: "A task",
    notes: null,
    due_date: null,
    priority: null,
    assignee: null,
    completed_at: null,
    created_at: "2026-10-01T12:00:00Z",
    ...overrides,
  };
}

describe("parseTaskInput", () => {
  it("requires a title on create and trims it", () => {
    expect(() => parseTaskInput({}, { requireTitle: true })).toThrow("title is required");
    expect(parseTaskInput({ title: "  Blast  " }, { requireTitle: true })).toEqual({ title: "Blast" });
  });

  it("only returns keys that were sent, so a toggle touches nothing else", () => {
    expect(parseTaskInput({ done: true }, { requireTitle: false })).toEqual({ done: true });
  });

  it("rejects bad dates and priorities", () => {
    expect(() => parseTaskInput({ due_date: "Oct 31" }, { requireTitle: false })).toThrow();
    expect(() => parseTaskInput({ priority: 5 }, { requireTitle: false })).toThrow();
    expect(parseTaskInput({ due_date: "", priority: null }, { requireTitle: false })).toEqual({
      due_date: null,
      priority: null,
    });
  });
});

describe("compareOpenTasks", () => {
  it("puts soonest due first, undated last, and breaks ties by priority", () => {
    const sorted = [
      task({ id: "undated", priority: 0 }),
      task({ id: "nov-p2", due_date: "2026-11-02", priority: 2 }),
      task({ id: "nov-p0", due_date: "2026-11-02", priority: 0 }),
      task({ id: "oct", due_date: "2026-10-31" }),
    ].sort(compareOpenTasks);
    expect(sorted.map((t) => t.id)).toEqual(["oct", "nov-p0", "nov-p2", "undated"]);
  });
});

describe("AdminTasksPage", () => {
  const rows = [
    task({ id: "t1", title: "Send a blast for weekend coworking", due_date: "2026-10-31", priority: 0, assignee: "Berto Mill" }),
    task({ id: "t2", title: "Book the venue", completed_at: "2026-10-29T15:00:00Z" }),
  ];
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
      if (init?.method === "PATCH") {
        const body = JSON.parse(String(init.body));
        const row = rows.find((r) => url.endsWith(r.id))!;
        return new Response(
          JSON.stringify({ data: { ...row, completed_at: body.done ? "2026-10-30T20:00:00Z" : null } }),
        );
      }
      return new Response(JSON.stringify({ data: rows }));
    });
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => vi.unstubAllGlobals());

  it("lists open tasks and folds done ones into a Done section", async () => {
    render(<AdminTasksPage />);
    expect(await screen.findByText("Send a blast for weekend coworking")).toBeInTheDocument();
    expect(screen.getByText("Berto Mill")).toBeInTheDocument();
    expect(screen.getAllByTitle("Urgent").length).toBeGreaterThan(0);
    expect(screen.queryByText("Book the venue")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Done/ }));
    expect(await screen.findByText("Book the venue")).toBeInTheDocument();
  });

  it("checks a task off with a PATCH of just { done: true }", async () => {
    render(<AdminTasksPage />);
    const table = await screen.findByRole("table", { name: "Open tasks" });
    fireEvent.click(within(table).getByRole("checkbox", { name: /Mark "Send a blast/ }));
    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/admin/tasks/t1",
        expect.objectContaining({ method: "PATCH", body: JSON.stringify({ done: true }) }),
      ),
    );
    await waitFor(() => expect(screen.getByText("No open tasks")).toBeInTheDocument());
  });
});
