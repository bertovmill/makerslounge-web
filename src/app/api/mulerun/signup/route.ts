import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { CATEGORIES, MIN_CATEGORIES, MAX_CATEGORIES } from "@/app/hackathons/mulerun/categories";

const VALID_SLUGS = new Set(CATEGORIES.map((c) => c.slug));

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

  const { name, categories } = (body ?? {}) as {
    name?: unknown;
    categories?: unknown;
  };

  if (typeof name !== "string" || name.trim().length === 0 || name.trim().length > 80) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  if (
    !Array.isArray(categories) ||
    categories.length < MIN_CATEGORIES ||
    categories.length > MAX_CATEGORIES ||
    !categories.every((c) => typeof c === "string" && VALID_SLUGS.has(c))
  ) {
    return NextResponse.json(
      { error: `Pick ${MIN_CATEGORIES}–${MAX_CATEGORIES} categories` },
      { status: 400 }
    );
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  const { error } = await supabase
    .from("mulerun_signups")
    .insert({
      name: name.trim(),
      categories: Array.from(new Set(categories)),
    });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
