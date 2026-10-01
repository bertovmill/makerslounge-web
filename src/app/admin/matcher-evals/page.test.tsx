import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import MatcherEvalsPage from "./page";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

const participants = [
  { id: "s01", name: "Avery Tran", role: "Founder", currently_building: "Grocery app", looking_for_help: "A React Native developer" },
  { id: "s02", name: "Jordan Okafor", role: "Mobile engineer", skills: ["React Native"] },
  { id: "s03", name: "Priya Raman", role: "PhD student", skills: ["PyTorch"] },
];

const run = {
  id: "run-1",
  dataset: "synthetic-meetup",
  model: "anthropic/claude-sonnet-4",
  judge_model: "anthropic/claude-haiku-4.5",
  git_sha: "abc123",
  passed: false,
  metrics: { coverage: 1, structural_pass_rate: 0.5, planted_recall: null, grounding: 0.9, needs_met: 1 },
  thresholds: { coverage: 1, structural_pass_rate: 1, planted_recall: 0.85, grounding: 0.8, needs_met: 0.75 },
  created_at: "2026-10-01T12:00:00Z",
  total_matches: 2,
  labeled: 0,
  judge_agreement: null,
};

const results = {
  participants,
  planted: [],
  planted_missed: [],
  people: [
    {
      person_id: "s01",
      person_name: "Avery Tran",
      issues: [],
      judge: {
        person_id: "s01",
        need: "A React Native developer",
        needs_met: true,
        verdicts: [
          { matched_id: "s02", helps_with_need: true, why: "Builds React Native apps." },
          { matched_id: "s03", helps_with_need: false, why: "No mobile experience." },
        ],
      },
      matches: [
        { matched_id: "s02", matched_name: "Jordan Okafor", reason: "Jordan builds React Native apps.", conversation_starter: "Ask Jordan about Expo." },
        { matched_id: "s03", matched_name: "Priya Raman", reason: "Both curious about AI.", conversation_starter: "Talk models." },
      ],
    },
  ],
};

let calls: { url: string; method: string; body: unknown }[];

beforeEach(() => {
  calls = [];
  vi.stubGlobal("fetch", vi.fn(async (url: string, init?: RequestInit) => {
    calls.push({ url, method: init?.method ?? "GET", body: init?.body ? JSON.parse(String(init.body)) : null });
    const json = (b: unknown) => new Response(JSON.stringify(b), { status: 200 });
    if (url === "/api/admin/matcher-evals") return json({ runs: [run] });
    if (url.endsWith("/labels")) return json({ ok: true });
    return json({ run: { ...run, results }, labels: [] });
  }));
});

describe("/admin/matcher-evals", () => {
  it("shows the run's metrics and flags the one below threshold", async () => {
    render(<MatcherEvalsPage />);
    expect(await screen.findByText("Rules followed")).toBeInTheDocument();
    expect(screen.getByText("50%")).toHaveClass("text-destructive");
    expect(screen.getByText("FAIL")).toBeInTheDocument();
  });

  it("grades with the keyboard, reveals the judge afterwards, and undoes", async () => {
    render(<MatcherEvalsPage />);
    expect(await screen.findByText("Jordan builds React Native apps.")).toBeInTheDocument();
    // The judge's verdict stays hidden until Berto has graded.
    expect(screen.queryByText(/Builds React Native apps\./)).not.toBeInTheDocument();

    fireEvent.keyDown(window, { key: "ArrowRight" });
    await waitFor(() => expect(calls.some((c) => c.method === "POST")).toBe(true));
    expect(calls.find((c) => c.method === "POST")!.body).toEqual({ person_id: "s01", matched_id: "s02", good: true });
    expect(await screen.findByText(/The judge agreed/)).toBeInTheDocument();
    expect(screen.getByText("Both curious about AI.")).toBeInTheDocument();

    fireEvent.keyDown(window, { key: "ArrowRight" });
    expect(await screen.findByText(/The judge disagreed/)).toBeInTheDocument();
    expect(await screen.findByText(/Every introduction in this run is graded/)).toBeInTheDocument();

    fireEvent.click(screen.getByText("Undo"));
    await waitFor(() => expect(calls.some((c) => c.method === "DELETE")).toBe(true));
    expect(calls.find((c) => c.method === "DELETE")!.body).toEqual({ person_id: "s01", matched_id: "s03" });
    expect(await screen.findByText("Both curious about AI.")).toBeInTheDocument();
  });
});
