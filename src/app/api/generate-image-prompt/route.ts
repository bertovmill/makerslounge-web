import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export async function POST(request: Request) {
  try {
    const { postContent, ideaTitle, ideaNotes, channel } = await request.json();

    if (!postContent && !ideaTitle) {
      return NextResponse.json(
        { error: "Post content or idea title is required" },
        { status: 400 }
      );
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error("ANTHROPIC_API_KEY not configured");
    }

    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    const context = postContent
      ? `Post content: ${postContent}`
      : `Title: ${ideaTitle}\nNotes: ${ideaNotes || "None"}`;

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 300,
      system:
        "You are a visual content strategist. Given a social media post, output a concise image prompt (1-2 sentences) for an AI image generator. The image should complement the post visually. Avoid text, typography, or words in the image. Output only the prompt, nothing else.",
      messages: [
        {
          role: "user",
          content: `Platform: ${channel || "general"}\n\n${context}`,
        },
      ],
    });

    const prompt =
      response.content[0].type === "text"
        ? response.content[0].text.trim()
        : "";

    return NextResponse.json({ prompt });
  } catch (error: unknown) {
    console.error("Generate image prompt error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to generate image prompt";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
