import { NextResponse } from "next/server";

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;

export async function GET() {
  try {
    if (!ELEVENLABS_API_KEY) {
      return NextResponse.json(
        { error: "ELEVENLABS_API_KEY not configured" },
        { status: 500 }
      );
    }

    const response = await fetch("https://api.elevenlabs.io/v1/voices", {
      headers: {
        "xi-api-key": ELEVENLABS_API_KEY,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.detail?.message || "Failed to fetch voices" },
        { status: response.status }
      );
    }

    const data = await response.json();

    const voices = data.voices?.map(
      (v: { voice_id: string; name: string; preview_url: string; category: string }) => ({
        voice_id: v.voice_id,
        name: v.name,
        preview_url: v.preview_url,
        category: v.category,
      })
    ) ?? [];

    return NextResponse.json({ voices });
  } catch (error) {
    console.error("Fetch voices error:", error);
    return NextResponse.json(
      { error: "Failed to fetch voices" },
      { status: 500 }
    );
  }
}
