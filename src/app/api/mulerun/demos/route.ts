import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const MAX_DEMOS = 10;

function readClient() {
  if (!SUPABASE_URL || !ANON_KEY) return null;
  return createClient(SUPABASE_URL, ANON_KEY);
}

function adminClient() {
  if (!SUPABASE_URL || !SERVICE_KEY) return null;
  return createClient(SUPABASE_URL, SERVICE_KEY);
}

export async function GET() {
  const supabase = readClient();
  if (!supabase) {
    return NextResponse.json({ error: "Server not configured" }, { status: 500 });
  }
  const { data, error } = await supabase
    .from("mulerun_demos")
    .select("id, team_name, name, project, created_at")
    .order("created_at", { ascending: true });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ demos: data ?? [], max: MAX_DEMOS });
}

export async function POST(request: NextRequest) {
  const supabase = readClient();
  if (!supabase) {
    return NextResponse.json({ error: "Server not configured" }, { status: 500 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { team_name, name, project } = (body ?? {}) as {
    team_name?: unknown;
    name?: unknown;
    project?: unknown;
  };

  if (
    typeof team_name !== "string" ||
    team_name.trim().length === 0 ||
    team_name.trim().length > 80
  ) {
    return NextResponse.json(
      { error: "Team name is required" },
      { status: 400 }
    );
  }
  if (
    typeof name !== "string" ||
    name.trim().length === 0 ||
    name.trim().length > 120
  ) {
    return NextResponse.json(
      { error: "Member names are required" },
      { status: 400 }
    );
  }
  if (
    typeof project !== "string" ||
    project.trim().length === 0 ||
    project.trim().length > 200
  ) {
    return NextResponse.json(
      { error: "Tell us what you built" },
      { status: 400 }
    );
  }

  // Cap at MAX_DEMOS total submissions.
  const { count, error: countError } = await supabase
    .from("mulerun_demos")
    .select("*", { count: "exact", head: true });
  if (countError) {
    return NextResponse.json({ error: countError.message }, { status: 500 });
  }
  if ((count ?? 0) >= MAX_DEMOS) {
    return NextResponse.json(
      { error: "All demo slots are full." },
      { status: 409 }
    );
  }

  const { error } = await supabase.from("mulerun_demos").insert({
    team_name: team_name.trim(),
    name: name.trim(),
    project: project.trim(),
  });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest) {
  const supabase = adminClient();
  if (!supabase) {
    return NextResponse.json(
      { error: "SUPABASE_SERVICE_ROLE_KEY is not configured on the server" },
      { status: 500 }
    );
  }
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const all = searchParams.get("all");

  if (id) {
    const { error } = await supabase
      .from("mulerun_demos")
      .delete()
      .eq("id", id);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  }

  if (all === "1") {
    const { error } = await supabase
      .from("mulerun_demos")
      .delete()
      .not("id", "is", null);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json(
    { error: "Provide ?id=<uuid> or ?all=1" },
    { status: 400 }
  );
}
