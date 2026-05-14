import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Anthropic from "@anthropic-ai/sdk";
import { CATEGORIES } from "@/app/hackathons/mulerun/categories";

type Signup = {
  id: string;
  name: string;
  categories: string[];
};

type Team = {
  members: Signup[];
  sharedCategories: string[];
  unionCategories: string[];
  why: string;
};

const CATEGORY_NAMES = Object.fromEntries(
  CATEGORIES.map((c) => [c.slug, c.name])
);

function nameOf(slug: string): string {
  return CATEGORY_NAMES[slug] ?? slug;
}

function jaccard(a: string[], b: string[]): number {
  const setA = new Set(a);
  const setB = new Set(b);
  if (setA.size === 0 && setB.size === 0) return 0;
  let intersection = 0;
  for (const x of setA) if (setB.has(x)) intersection++;
  const union = setA.size + setB.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

function avgJaccard(person: Signup, group: Signup[]): number {
  if (group.length === 0) return 0;
  let sum = 0;
  for (const m of group) sum += jaccard(person.categories, m.categories);
  return sum / group.length;
}

/**
 * Greedy team building:
 *   1) Take the most-overlapping pair as the seed.
 *   2) Add the person with the highest avg similarity to that pair, if any
 *      remaining people exist and the pair has < 3 members.
 *   3) Repeat with the rest of the pool.
 *   4) Stragglers (single leftover) get appended to the smallest team.
 */
function buildTeams(signups: Signup[]): Team[] {
  const pool = [...signups];
  const teams: Signup[][] = [];

  while (pool.length >= 2) {
    // Find the best pair in the remaining pool.
    let bestI = 0;
    let bestJ = 1;
    let bestScore = -1;
    for (let i = 0; i < pool.length; i++) {
      for (let j = i + 1; j < pool.length; j++) {
        const score = jaccard(pool[i].categories, pool[j].categories);
        if (score > bestScore) {
          bestScore = score;
          bestI = i;
          bestJ = j;
        }
      }
    }
    const team: Signup[] = [pool[bestI], pool[bestJ]];
    // Remove indices safely (higher index first).
    pool.splice(bestJ, 1);
    pool.splice(bestI, 1);

    // Try to add a third member.
    if (pool.length > 0) {
      let bestIdx = 0;
      let bestAvg = -1;
      for (let k = 0; k < pool.length; k++) {
        const avg = avgJaccard(pool[k], team);
        if (avg > bestAvg) {
          bestAvg = avg;
          bestIdx = k;
        }
      }
      // Three guards on adding a third member:
      //   1) Forced add when only one person is left in the pool — they'd be
      //      stranded otherwise.
      //   2) Don't strand: skip if removing one would leave a lone person.
      //   3) Quality: don't add a misfit (zero interest overlap with the pair).
      const forced = pool.length === 1;
      const wouldStrand = pool.length - 1 === 1;
      const decentMatch = bestAvg > 0;
      if (forced || (decentMatch && !wouldStrand)) {
        team.push(pool[bestIdx]);
        pool.splice(bestIdx, 1);
      }
    }

    teams.push(team);
  }

  // If exactly one straggler remains, append to the team they fit best with.
  if (pool.length === 1) {
    const lone = pool[0];
    let bestTeam = 0;
    let bestAvg = -1;
    for (let i = 0; i < teams.length; i++) {
      const avg = avgJaccard(lone, teams[i]);
      if (avg > bestAvg) {
        bestAvg = avg;
        bestTeam = i;
      }
    }
    teams[bestTeam].push(lone);
  }

  return teams.map((members) => {
    const sets = members.map((m) => new Set(m.categories));
    const shared = [...sets[0]].filter((c) => sets.every((s) => s.has(c)));
    const union = Array.from(new Set(members.flatMap((m) => m.categories)));
    return {
      members,
      sharedCategories: shared,
      unionCategories: union,
      why:
        shared.length > 0
          ? `Shared interests: ${shared.map(nameOf).join(", ")}.`
          : `Spans ${union.map(nameOf).join(", ")} — a cross-functional crew.`,
    };
  });
}

async function polishWhyWithClaude(teams: Team[]): Promise<Team[]> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || teams.length === 0) return teams;

  try {
    const client = new Anthropic({ apiKey });
    const teamsForPrompt = teams.map((t, i) => ({
      id: i,
      members: t.members.map((m) => ({
        name: m.name,
        interests: m.categories.map(nameOf),
      })),
      shared: t.sharedCategories.map(nameOf),
      union: t.unionCategories.map(nameOf),
    }));

    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: `You're helping pair up hackers at an AI hackathon. Below are ${teams.length} teams already grouped by overlapping interests. For each team, write ONE short sentence (12–22 words) explaining why this team is a good fit — reference shared interests and what they could build together. Be specific, energetic, and concrete. No filler.

Respond as a JSON object with this exact shape: {"reasons": ["...", "..."]} with one string per team in the same order. No prose, just JSON.

Teams:
${JSON.stringify(teamsForPrompt, null, 2)}`,
        },
      ],
    });

    const text = message.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("");

    // Pull JSON out even if Claude wrapped it in code fences
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return teams;
    const parsed = JSON.parse(jsonMatch[0]) as { reasons?: string[] };
    if (!Array.isArray(parsed.reasons)) return teams;

    return teams.map((t, i) => {
      const reason = parsed.reasons?.[i];
      return typeof reason === "string" && reason.trim().length > 0
        ? { ...t, why: reason.trim() }
        : t;
    });
  } catch {
    // Fail open — return the mechanical "why" so the presenter is never stuck.
    return teams;
  }
}

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.json({ error: "Server not configured" }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  const { data, error } = await supabase
    .from("mulerun_signups")
    .select("id, name, categories")
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const signups = (data ?? []) as Signup[];

  if (signups.length < 2) {
    return NextResponse.json({
      total: signups.length,
      teams: [],
      message: "Need at least 2 signups before matching.",
    });
  }

  const raw = buildTeams(signups);
  const polished = await polishWhyWithClaude(raw);

  return NextResponse.json({
    total: signups.length,
    teams: polished,
  });
}
