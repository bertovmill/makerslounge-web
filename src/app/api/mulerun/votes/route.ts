import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

function readClient() {
  if (!SUPABASE_URL || !ANON_KEY) return null;
  return createClient(SUPABASE_URL, ANON_KEY);
}

function adminClient() {
  if (!SUPABASE_URL || !SERVICE_KEY) return null;
  return createClient(SUPABASE_URL, SERVICE_KEY);
}

type Demo = {
  id: string;
  team_name: string | null;
  name: string;
  project: string;
};

type VoteRow = {
  first_id: string;
  second_id: string;
  third_id: string;
};

export async function GET() {
  const supabase = readClient();
  if (!supabase) {
    return NextResponse.json({ error: "Server not configured" }, { status: 500 });
  }

  const [demosRes, votesRes] = await Promise.all([
    supabase
      .from("mulerun_demos")
      .select("id, team_name, name, project")
      .order("created_at", { ascending: true }),
    supabase
      .from("mulerun_votes")
      .select("first_id, second_id, third_id"),
  ]);

  if (demosRes.error) {
    return NextResponse.json({ error: demosRes.error.message }, { status: 500 });
  }
  if (votesRes.error) {
    return NextResponse.json({ error: votesRes.error.message }, { status: 500 });
  }

  const demos = (demosRes.data ?? []) as Demo[];
  const votes = (votesRes.data ?? []) as VoteRow[];

  const tally = new Map<
    string,
    {
      demo: Demo;
      points: number;
      first: number;
      second: number;
      third: number;
    }
  >();
  for (const d of demos) {
    tally.set(d.id, { demo: d, points: 0, first: 0, second: 0, third: 0 });
  }
  for (const v of votes) {
    const a = tally.get(v.first_id);
    if (a) {
      a.points += 3;
      a.first += 1;
    }
    const b = tally.get(v.second_id);
    if (b) {
      b.points += 2;
      b.second += 1;
    }
    const c = tally.get(v.third_id);
    if (c) {
      c.points += 1;
      c.third += 1;
    }
  }

  const results = Array.from(tally.values())
    .map((r) => ({
      id: r.demo.id,
      team_name: r.demo.team_name,
      name: r.demo.name,
      project: r.demo.project,
      points: r.points,
      first: r.first,
      second: r.second,
      third: r.third,
    }))
    .sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.first !== a.first) return b.first - a.first;
      if (b.second !== a.second) return b.second - a.second;
      return b.third - a.third;
    });

  return NextResponse.json({
    results,
    vote_count: votes.length,
  });
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

  const { voter_id, first_id, second_id, third_id } = (body ?? {}) as {
    voter_id?: unknown;
    first_id?: unknown;
    second_id?: unknown;
    third_id?: unknown;
  };

  if (
    typeof voter_id !== "string" ||
    voter_id.trim().length === 0 ||
    voter_id.length > 64
  ) {
    return NextResponse.json({ error: "Invalid voter id" }, { status: 400 });
  }
  if (
    typeof first_id !== "string" ||
    typeof second_id !== "string" ||
    typeof third_id !== "string"
  ) {
    return NextResponse.json({ error: "Pick three teams" }, { status: 400 });
  }
  if (
    first_id === second_id ||
    first_id === third_id ||
    second_id === third_id
  ) {
    return NextResponse.json(
      { error: "Pick three different teams" },
      { status: 400 }
    );
  }

  // Confirm the picked demos exist
  const { data: existing, error: lookupError } = await supabase
    .from("mulerun_demos")
    .select("id")
    .in("id", [first_id, second_id, third_id]);
  if (lookupError) {
    return NextResponse.json({ error: lookupError.message }, { status: 500 });
  }
  if (!existing || existing.length !== 3) {
    return NextResponse.json(
      { error: "One of the teams you picked is no longer in the lineup." },
      { status: 400 }
    );
  }

  const { error } = await supabase
    .from("mulerun_votes")
    .upsert(
      {
        voter_id: voter_id.trim(),
        first_id,
        second_id,
        third_id,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "voter_id" }
    );
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
  const all = searchParams.get("all");
  if (all !== "1") {
    return NextResponse.json({ error: "Provide ?all=1" }, { status: 400 });
  }
  const { error } = await supabase
    .from("mulerun_votes")
    .delete()
    .not("id", "is", null);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
