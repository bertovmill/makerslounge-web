import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { generateObject } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
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

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

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

  let parsed: LinkedinData;
  try {
    const result = await generateObject({
      model: anthropic("claude-sonnet-4-20250514"),
      schema: linkedinSchema,
      system:
        "You are extracting structured profile information from pasted LinkedIn content. Pull only what is clearly stated. Use null for anything missing — never invent details. Keep descriptions concise (max 2 sentences each).",
      prompt: `Extract a structured profile from this LinkedIn text:\n\n${linkedinText}`,
    });
    parsed = result.object;
  } catch (error) {
    console.error("LinkedIn enrichment failed:", error);
    return NextResponse.json(
      { error: "Failed to parse LinkedIn content. Try pasting more context." },
      { status: 500 }
    );
  }

  const supabaseAdmin = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: existing } = await supabaseAdmin
    .from("profiles")
    .select("bio, skills")
    .eq("id", profileId)
    .single();

  const updates: Record<string, unknown> = {
    linkedin_data: parsed,
    linkedin_data_updated_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  if (!existing?.bio && parsed.summary) {
    updates.bio = parsed.summary;
  }

  if ((!existing?.skills || existing.skills.length === 0) && parsed.skills.length > 0) {
    updates.skills = parsed.skills.slice(0, 12);
  }

  const { error: updateError } = await supabaseAdmin
    .from("profiles")
    .update(updates)
    .eq("id", profileId);

  if (updateError) {
    console.error("Failed to save linkedin_data:", updateError);
    return NextResponse.json({ error: "Failed to save profile." }, { status: 500 });
  }

  return NextResponse.json({ data: parsed });
}
