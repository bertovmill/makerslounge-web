import { NextResponse } from "next/server";
import { generateText, type ModelMessage } from "ai";

export async function POST(request: Request) {
  try {
    const { message, history } = await request.json();

    // Build conversation history for Claude
    const conversationHistory: ModelMessage[] = history
      .map((msg: { role: string; content: string }) => ({
        role: msg.role === "user" ? ("user" as const) : ("assistant" as const),
        content: msg.content,
      }));

    conversationHistory.push({
      role: "user",
      content: message,
    });

    const { text } = await generateText({
      model: "anthropic/claude-3.7-sonnet",
      maxOutputTokens: 1024,
      system: `You are a creative podcast consultant helping brainstorm episode ideas for the MakersLounge Podcast.

The podcast focuses on interviewing the most productive and creative individuals in the world to discuss their process for creating their best work.

When suggesting ideas:
- Focus on makers, builders, entrepreneurs, and creators
- Emphasize productivity, creative process, and craft
- Suggest specific guest names when possible
- Include potential episode angles and key questions
- Be concise but inspiring
- Consider diverse fields: tech, hardware, AI, design, art, manufacturing, etc.

Keep responses conversational and helpful.`,
      messages: conversationHistory,
    });

    return NextResponse.json({ response: text });
  } catch (error: any) {
    console.error("Podcast ideas API error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to generate ideas" },
      { status: 500 }
    );
  }
}
