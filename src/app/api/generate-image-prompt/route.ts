import { NextResponse } from "next/server";
import { generateText } from "ai";

export async function POST(request: Request) {
  try {
    const { postContent, ideaTitle, ideaNotes, channel } = await request.json();

    if (!postContent && !ideaTitle) {
      return NextResponse.json(
        { error: "Post content or idea title is required" },
        { status: 400 }
      );
    }

    const context = postContent
      ? `Post content: ${postContent}`
      : `Title: ${ideaTitle}\nNotes: ${ideaNotes || "None"}`;

    const { text } = await generateText({
      model: "anthropic/claude-sonnet-4",
      maxOutputTokens: 300,
      system:
        "You are a visual content strategist. Given a social media post, output a concise image prompt (1-2 sentences) for an AI image generator. The image should complement the post visually. Avoid text, typography, or words in the image. Output only the prompt, nothing else.",
      prompt: `Platform: ${channel || "general"}\n\n${context}`,
    });

    return NextResponse.json({ prompt: text.trim() });
  } catch (error: unknown) {
    console.error("Generate image prompt error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to generate image prompt";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
