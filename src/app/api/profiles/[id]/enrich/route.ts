import { NextRequest, NextResponse } from "next/server";
import { getServerAppUser } from "@/lib/clerk-server";
import { eq } from "drizzle-orm";
import { getSiteDb } from "@/db/site";
import { profiles } from "@/db/site/schema";
import { generateObject } from "ai";
import { z } from "zod";

const ADMIN_EMAIL = "bertmill19@gmail.com";

export const maxDuration = 60;

const linkedinSchema = z.object({
  summary: z
    .string()
    .describe("A warm, third-person 1-2 sentence summary of who this person is, their focus, and what makes them stand out."),
  headline: z.string().describe("Their current professional headline — usually role + company, e.g. 'Founder at Acme' or 'Senior PM at Stripe'."),
  location: z.string().nullable().describe("City and region if stated, otherwise null."),
  current_role: z
    .object({
      title: z.string(),
      company: z.string(),
      start_date: z.string().nullable().describe("Month + year if available, e.g. 'Jan 2024'."),
      description: z.string().nullable().describe("Brief description of what they do in this role."),
    })
    .nullable(),
  past_roles: z
    .array(
      z.object({
        title: z.string(),
        company: z.string(),
        start_date: z.string().nullable(),
        end_date: z.string().nullable(),
        description: z.string().nullable(),
      })
    )
    .describe("Prior work experience, most recent first."),
  education: z
    .array(
      z.object({
        school: z.string(),
        degree: z.string().nullable(),
        field: z.string().nullable(),
        years: z.string().nullable().describe("Years attended, e.g. '2018 - 2022'."),
      })
    )
    .describe("Schools and programs attended."),
  skills: z.array(z.string()).describe("Hard skills and tools they list (e.g. 'TypeScript', 'Product strategy', 'Figma'). Limit to top 12."),
  notable_links: z
    .array(z.object({ label: z.string(), url: z.string() }))
    .describe("Any notable URLs mentioned (personal site, portfolio, press, etc)."),
});

export type LinkedinData = z.infer<typeof linkedinSchema>;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: profileId } = await params;

  const user = await getServerAppUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  if (user.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { linkedinText } = await request.json();

  if (!linkedinText || typeof linkedinText !== "string" || linkedinText.trim().length < 50) {
    return NextResponse.json(
      { error: "Please paste at least a few lines from their LinkedIn." },
      { status: 400 }
    );
  }

  const db = getSiteDb();

  // Admin-only, checked above, and the target is a route param rather than the
  // caller — so this deliberately writes to someone else's profile. That is what
  // the service-role key was doing here.
  const [existing] = await db
    .select({ name: profiles.name, bio: profiles.bio, skills: profiles.skills })
    .from(profiles)
    .where(eq(profiles.id, profileId))
    .limit(1);

  if (!existing) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  const name = existing.name?.trim() || "this person";

  let parsed: LinkedinData;
  try {
    const result = await generateObject({
      model: "anthropic/claude-sonnet-5.5",
      schema: linkedinSchema,
      // A LinkedIn copy-paste drags in other people too: who they follow,
      // "People also viewed", recommendations. Naming the person keeps their
      // jobs from landing on this profile.
      system: `You are extracting structured profile information about ${name} from text pasted from their LinkedIn profile. Pull only what is clearly stated about ${name}. LinkedIn pages also show other people (people they follow, "People also viewed", recommendations, post authors): ignore anything about anyone else. Use null or empty values for anything missing — never invent details. Keep descriptions concise (max 2 sentences each).`,
      prompt: `Extract ${name}'s structured profile from this LinkedIn text:\n\n${linkedinText}`,
    });
    parsed = result.object;
  } catch (error) {
    console.error("LinkedIn enrichment failed:", error);
    return NextResponse.json(
      { error: "Failed to parse LinkedIn content. Try pasting more context." },
      { status: 500 }
    );
  }

  const foundAnything =
    parsed.headline.trim() ||
    parsed.current_role ||
    parsed.past_roles.length > 0 ||
    parsed.education.length > 0;

  if (!foundAnything) {
    return NextResponse.json(
      {
        error: `Nothing in that paste is about ${name}. Copy their own About, Experience and Education sections.`,
      },
      { status: 422 }
    );
  }

  const now = new Date().toISOString();
  const updates: Partial<typeof profiles.$inferInsert> = {
    linkedinData: parsed,
    linkedinDataUpdatedAt: now,
    updatedAt: now,
  };

  // Only fill gaps — anything the member wrote about themselves wins.
  if (!existing.bio && parsed.summary) {
    updates.bio = parsed.summary;
  }

  if ((!existing.skills || existing.skills.length === 0) && parsed.skills.length > 0) {
    updates.skills = parsed.skills.slice(0, 12);
  }

  await db.update(profiles).set(updates).where(eq(profiles.id, profileId));

  return NextResponse.json({ data: parsed });
}
