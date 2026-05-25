import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const ADMIN_PASSWORD = "makers2026";

function serviceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

function authorized(req: NextRequest) {
  return req.headers.get("x-admin-password") === ADMIN_PASSWORD;
}

// GET /api/admin/hackathon-notes?submission_id=...&judge_name=...
export async function GET(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const submissionId = searchParams.get("submission_id");
  const judgeName = searchParams.get("judge_name");
  if (!submissionId || !judgeName) {
    return NextResponse.json({ error: "submission_id and judge_name required" }, { status: 400 });
  }

  const { data, error } = await serviceClient()
    .from("hackathon_voter_notes")
    .select("notes")
    .eq("submission_id", submissionId)
    .eq("judge_name", judgeName)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ notes: data?.notes ?? "" });
}

// POST /api/admin/hackathon-notes  { judge_name, submission_id, notes }
export async function POST(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { judge_name, submission_id, notes } = (await req.json()) as {
    judge_name: string;
    submission_id: string;
    notes: string;
  };

  const { error } = await serviceClient()
    .from("hackathon_voter_notes")
    .upsert(
      { judge_name, submission_id, notes, updated_at: new Date().toISOString() },
      { onConflict: "judge_name,submission_id" },
    );

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
