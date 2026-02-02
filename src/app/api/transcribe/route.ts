import { NextResponse } from "next/server";
import OpenAI from "openai";

export const maxDuration = 60; // Allow up to 60 seconds for transcription

export async function POST(request: Request) {
  try {
    // Check for API key
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OpenAI API key not configured. Add OPENAI_API_KEY to your environment variables." },
        { status: 500 }
      );
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Get the form data with the audio file
    const formData = await request.formData();
    const audioFile = formData.get("audio") as File | null;
    const language = formData.get("language") as string || "en";

    if (!audioFile) {
      return NextResponse.json(
        { error: "No audio file provided" },
        { status: 400 }
      );
    }

    // Check file size (max 25MB for Whisper API)
    if (audioFile.size > 25 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Audio file too large. Maximum size is 25MB." },
        { status: 400 }
      );
    }

    // Call OpenAI Whisper API with verbose JSON for word-level timestamps
    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: "whisper-1",
      language: language,
      response_format: "verbose_json",
      timestamp_granularities: ["word", "segment"],
    });

    // Convert Whisper response to our Caption format
    const captions = [];

    // Use word-level timestamps if available
    if (transcription.words && transcription.words.length > 0) {
      for (const word of transcription.words) {
        captions.push({
          text: " " + word.word, // Space prefix for proper rendering
          startMs: Math.round(word.start * 1000),
          endMs: Math.round(word.end * 1000),
          confidence: 1,
          timestampMs: Math.round(word.start * 1000),
        });
      }
    }
    // Fall back to segment-level timestamps
    else if (transcription.segments && transcription.segments.length > 0) {
      for (const segment of transcription.segments) {
        // Split segment into words and estimate timing
        const words = segment.text.trim().split(/\s+/);
        const segmentDuration = segment.end - segment.start;
        const wordDuration = segmentDuration / words.length;

        words.forEach((word, index) => {
          const startTime = segment.start + index * wordDuration;
          const endTime = startTime + wordDuration;

          captions.push({
            text: " " + word,
            startMs: Math.round(startTime * 1000),
            endMs: Math.round(endTime * 1000),
            confidence: 1,
            timestampMs: Math.round(startTime * 1000),
          });
        });
      }
    }
    // Fall back to full text without timestamps
    else {
      const fullText = transcription.text || "";
      const words = fullText.trim().split(/\s+/);
      const estimatedDuration = words.length * 300; // ~300ms per word average

      words.forEach((word, index) => {
        const startTime = index * 300;
        const endTime = (index + 1) * 300;

        captions.push({
          text: " " + word,
          startMs: startTime,
          endMs: endTime,
          confidence: 1,
          timestampMs: startTime,
        });
      });
    }

    return NextResponse.json({
      success: true,
      text: transcription.text,
      captions,
      language: transcription.language,
      duration: transcription.duration,
    });

  } catch (error: unknown) {
    console.error("Transcription API error:", error);

    // Handle specific OpenAI errors
    if (error instanceof OpenAI.APIError) {
      return NextResponse.json(
        { error: `OpenAI API error: ${error.message}` },
        { status: error.status || 500 }
      );
    }

    const errorMessage = error instanceof Error ? error.message : "Failed to transcribe audio";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
