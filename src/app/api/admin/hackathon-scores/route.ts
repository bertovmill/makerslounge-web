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

// GET /api/admin/hackathon-scores?submission_id=...&judge_name=...
export async function GET(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const submissionId = searchParams.get("submission_id");
  const judgeName = searchParams.get("judge_name");
  if (!submissionId || !judgeName) {
    return NextResponse.json({ error: "submission_id and judge_name required" }, { status: 400 });
  }

  const { data, error } = await serviceClient()
    .from("hackathon_scores")
    .select("criterion_key, score")
    .eq("submission_id", submissionId)
    .eq("judge_name", judgeName);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// POST /api/admin/hackathon-scores  { judge_name, submission_id, criterion_key, score }
export async function POST(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json()) as {
    judge_name: string;
    submission_id: string;
    criterion_key: string;
    score: number;
  };

  const { error } = await serviceClient()
    .from("hackathon_scores")
    .upsert(body, { onConflict: "judge_name,submission_id,criterion_key" });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
