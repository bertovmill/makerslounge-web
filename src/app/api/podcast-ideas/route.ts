import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { message, history } = await request.json();

    // Build conversation history for Claude
    const messages = [
      ...history.map((msg: { role: string; content: string }) => ({
        role: msg.role === "user" ? "user" : "assistant",
        content: msg.content,
      })),
      {
        role: "user",
        content: message,
      },
    ];

    const response = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 1024,
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
      messages: messages as any,
    });

    const text = response.content[0].type === "text" ? response.content[0].text : "";

    return NextResponse.json({ response: text });
  } catch (error) {
    console.error("Podcast ideas API error:", error);
    return NextResponse.json(
      { error: "Failed to generate ideas" },
      { status: 500 }
    );
  }
}
