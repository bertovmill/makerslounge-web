import { NextResponse } from "next/server";
import { asc } from "drizzle-orm";
import { generateText } from "ai";
import { getSiteDb } from "@/db/site";
import { mulerunSignups } from "@/db/site/schema";
import { handleApiError } from "@/lib/api/respond";
import { CATEGORIES } from "@/app/hackathons/mulerun/categories";
import { buildTeams, type Signup, type Team } from "@/app/hackathons/mulerun/teamBuilder";

const CATEGORY_NAMES = Object.fromEntries(
  CATEGORIES.map((c) => [c.slug, c.name])
);

function nameOf(slug: string): string {
  return CATEGORY_NAMES[slug] ?? slug;
}

async function polishWhyWithClaude(teams: Team[]): Promise<Team[]> {
  if (teams.length === 0) return teams;

  try {
    const teamsForPrompt = teams.map((t, i) => ({
      id: i,
      members: t.members.map((m) => ({
        name: m.name,
        interests: m.categories.map(nameOf),
      })),
      shared: t.sharedCategories.map(nameOf),
      union: t.unionCategories.map(nameOf),
    }));

    const { text } = await generateText({
      model: "anthropic/claude-haiku-4.5",
      maxOutputTokens: 1024,
      prompt: `You're helping pair up hackers at an AI hackathon. Below are ${teams.length} teams already grouped by overlapping interests. For each team, write ONE short sentence (12–22 words) explaining why this team is a good fit — reference shared interests and what they could build together. Be specific, energetic, and concrete. No filler.

Respond as a JSON object with this exact shape: {"reasons": ["...", "..."]} with one string per team in the same order. No prose, just JSON.

Teams:
${JSON.stringify(teamsForPrompt, null, 2)}`,
    });

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
  try {
    const db = getSiteDb();
    const signups: Signup[] = await db
      .select({
        id: mulerunSignups.id,
        name: mulerunSignups.name,
        categories: mulerunSignups.categories,
      })
      .from(mulerunSignups)
      .orderBy(asc(mulerunSignups.createdAt));

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
  } catch (err) {
    return handleApiError(err, "api/mulerun/match");
  }
}
