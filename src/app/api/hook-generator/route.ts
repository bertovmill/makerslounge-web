import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export async function POST(request: Request) {
  try {
    const { topic, videoType } = await request.json();

    if (!topic) {
      return NextResponse.json(
        { error: "Topic is required" },
        { status: 400 }
      );
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error("ANTHROPIC_API_KEY not configured");
    }

    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    const systemPrompt = `You are an expert YouTube content strategist who specializes in creating hooks that maximize viewer retention. You understand what makes people stop scrolling and watch.

Your task is to generate compelling video hooks for tutorial and educational content, particularly for makers, builders, and tech enthusiasts.

Generate exactly 5 different hooks for the given topic. Each hook should:
1. Be 1-2 sentences maximum (what the creator says in the first 5-10 seconds)
2. Create curiosity or address a pain point
3. Feel natural and conversational, not clickbaity

Use these hook styles:
1. **Curiosity Gap** - Hint at something surprising or counterintuitive
2. **Problem/Solution** - Address a common frustration directly
3. **Bold Claim** - Make a strong statement that demands attention
4. **Story Hook** - Start with a brief personal anecdote
5. **Direct Value** - Clearly state what they'll learn and why it matters

For each hook, also provide:
- A brief suggested visual/action (what should be on screen during the hook)
- Why this hook works (1 sentence)

Format your response as JSON with this structure:
{
  "hooks": [
    {
      "style": "Curiosity Gap",
      "text": "The hook text here...",
      "visual": "Suggested visual/action",
      "why": "Why this works"
    }
  ]
}

Only respond with valid JSON, no other text.`;

    const userPrompt = `Generate 5 compelling hooks for a ${videoType || "tutorial"} video about: "${topic}"`;

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1500,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    });

    let text =
      response.content[0].type === "text" ? response.content[0].text : "";

    // Strip markdown code blocks if present
    text = text.replace(/^```json\s*\n?/, "").replace(/\n?```\s*$/, "").trim();

    // Parse the JSON response
    const hooks = JSON.parse(text);

    return NextResponse.json(hooks);
  } catch (error: unknown) {
    console.error("Hook generator API error:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to generate hooks";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
