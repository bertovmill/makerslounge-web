import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const MIN_FREEFORM = 20;
const MAX_FREEFORM = 600;
const MAX_NAME = 80;

export async function POST(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.json({ error: "Server not configured" }, { status: 500 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { name, background, looking_for } = (body ?? {}) as {
    name?: unknown;
    background?: unknown;
    looking_for?: unknown;
  };

  if (
    typeof name !== "string" ||
    name.trim().length === 0 ||
    name.trim().length > MAX_NAME
  ) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  if (
    typeof background !== "string" ||
    background.trim().length < MIN_FREEFORM ||
    background.trim().length > MAX_FREEFORM
  ) {
    return NextResponse.json(
      { error: `Background must be at least ${MIN_FREEFORM} characters` },
      { status: 400 }
    );
  }

  if (
    typeof looking_for !== "string" ||
    looking_for.trim().length < MIN_FREEFORM ||
    looking_for.trim().length > MAX_FREEFORM
  ) {
    return NextResponse.json(
      { error: `Tell us who you're looking for (at least ${MIN_FREEFORM} characters)` },
      { status: 400 }
    );
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  const { error } = await supabase.from("innovation_hackathon_signups").insert({
    name: name.trim(),
    background: background.trim(),
    looking_for: looking_for.trim(),
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
