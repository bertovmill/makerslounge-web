import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Anthropic from "@anthropic-ai/sdk";
import { CATEGORIES } from "@/app/hackathons/mulerun/categories";
import { buildTeams, type Signup, type Team } from "@/app/hackathons/mulerun/teamBuilder";

const CATEGORY_NAMES = Object.fromEntries(
  CATEGORIES.map((c) => [c.slug, c.name])
);

function nameOf(slug: string): string {
  return CATEGORY_NAMES[slug] ?? slug;
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
