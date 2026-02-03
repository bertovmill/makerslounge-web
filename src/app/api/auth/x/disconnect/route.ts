import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase-server";
import { createClient } from "@supabase/supabase-js";

export async function POST() {
  try {
    // Get authenticated user
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "You must be logged in" },
        { status: 401 }
      );
    }

    // Delete connection using service role
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { error: deleteError } = await supabaseAdmin
      .from("social_connections")
      .delete()
      .eq("user_id", user.id)
      .eq("platform", "x");

    if (deleteError) {
      console.error("Failed to disconnect X:", deleteError);
      return NextResponse.json(
        { error: "Failed to disconnect X account" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("X disconnect error:", error);
    return NextResponse.json(
      { error: "Failed to disconnect X account" },
      { status: 500 }
    );
  }
}
