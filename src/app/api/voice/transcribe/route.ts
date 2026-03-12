import { NextResponse } from "next/server";
import { experimental_transcribe as transcribe } from "ai";
import { deepgram } from "@ai-sdk/deepgram";

export const maxDuration = 30;

export async function POST(request: Request) {
  try {
    if (!process.env.DEEPGRAM_API_KEY) {
      return NextResponse.json(
        { error: "DEEPGRAM_API_KEY not configured" },
        { status: 500 },
      );
    }

    const formData = await request.formData();
    const audioFile = formData.get("audio") as File | null;

    if (!audioFile) {
      return NextResponse.json(
        { error: "No audio file provided" },
        { status: 400 },
      );
    }

    const arrayBuffer = await audioFile.arrayBuffer();

    const result = await transcribe({
      model: deepgram.transcription("nova-3"),
      audio: new Uint8Array(arrayBuffer),
    });

    return NextResponse.json({
      text: result.text,
      segments: result.segments,
    });
  } catch (error) {
    console.error("Deepgram transcription error:", error);
    const message =
      error instanceof Error ? error.message : "Transcription failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
