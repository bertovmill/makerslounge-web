import { describe, expect, it } from "vitest";
import type { PersonMatches } from "@/lib/meetup-matcher";
import { runChecks } from "./checks";
import type { MatcherDataset } from "./dataset";

const dataset: MatcherDataset = {
  name: "tiny",
  description: "",
  meetupName: "tiny",
  participants: [
    { id: "a", name: "Ada", skills: ["Stripe Connect"], looking_for_help: "a designer" },
    { id: "b", name: "Bo", skills: ["Figma", "branding"], looking_for_help: "payments help" },
    { id: "c", name: "Cy", skills: ["Kubernetes"] },
    { id: "d", name: "Di", skills: ["fundraising"] },
  ],
  planted: [{ person_id: "a", should_match_id: "b", why: "designer" }],
};

const match = (id: string, name: string, reason = "Ask about Figma") => ({
  matched_id: id,
  matched_name: name,
  reason,
  conversation_starter: "Say hi",
});

describe("runChecks", () => {
  it("passes clean output and finds the planted pair", () => {
    const out: PersonMatches[] = dataset.participants.map((p) => ({
      person_id: p.id,
      person_name: p.name,
      matches: dataset.participants.filter((o) => o.id !== p.id).map((o) => match(o.id, o.name)),
    }));
    const s = runChecks(dataset, out);
    expect(s.coverage).toBe(1);
    expect(s.structural_pass_rate).toBe(1);
    expect(s.planted_recall).toBe(1);
  });

  it("flags self-matches, duplicates, unknown ids, wrong names and missing people", () => {
    const out: PersonMatches[] = [
      { person_id: "a", person_name: "Ada", matches: [match("a", "Ada"), match("c", "Cy"), match("c", "Cy")] },
      { person_id: "b", person_name: "Bo", matches: [match("zz", "Ghost"), match("a", "Wrong"), match("c", "Cy")] },
    ];
    const s = runChecks(dataset, out);
    const issues = Object.fromEntries(s.people.map((p) => [p.person_id, p.issues.join(" | ")]));
    expect(issues.a).toMatch(/themselves/);
    expect(issues.a).toMatch(/duplicate/);
    expect(issues.b).toMatch(/unknown id zz/);
    expect(issues.b).toMatch(/doesn't match id a/);
    expect(issues.c).toMatch(/no matches returned/);
    expect(s.coverage).toBe(0.5);
    expect(s.planted_recall).toBe(0);
  });

  it("counts a reason as grounded only if it reuses the matched person's profile", () => {
    const out: PersonMatches[] = [
      { person_id: "a", person_name: "Ada", matches: [match("b", "Bo", "Bo does branding"), match("c", "Cy", "Great energy"), match("d", "Di", "Nice person")] },
    ];
    expect(runChecks(dataset, out).people[0].grounded).toBe(1);
  });
});
