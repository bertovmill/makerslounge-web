import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export async function GET(request: NextRequest) {
  if (!SUPABASE_URL || !ANON_KEY) {
    return NextResponse.json({ error: "Server not configured" }, { status: 500 });
  }
  const supabase = createClient(SUPABASE_URL, ANON_KEY);
  const voterId = new URL(request.url).searchParams.get("voter_id");
  if (!voterId || voterId.length === 0 || voterId.length > 64) {
    return NextResponse.json({ voted: false });
  }
  const { count, error } = await supabase
    .from("mulerun_votes")
    .select("*", { count: "exact", head: true })
    .eq("voter_id", voterId);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ voted: (count ?? 0) > 0 });
}
