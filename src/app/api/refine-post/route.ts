import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export async function POST(request: Request) {
  try {
    const {
      originalIdea,
      currentContent,
      refinementRequest,
      channel,
      tone,
      conversationHistory = []
    } = await request.json();

    if (!currentContent || !refinementRequest) {
      return NextResponse.json(
        { error: "Current content and refinement request are required" },
        { status: 400 }
      );
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error("ANTHROPIC_API_KEY not configured");
    }

    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    // Channel-specific constraints
    const channelConstraints: Record<string, string> = {
      x: "Twitter/X: Maximum 280 characters. Be punchy and conversational.",
      linkedin: "LinkedIn: 1300 characters ideal, max 3000. Professional but personable.",
      instagram: "Instagram: Up to 2200 characters. First 125 shown in preview. Use emojis.",
      youtube: "YouTube: Can be longer. Hook in first sentence, include call-to-action.",
      tiktok: "TikTok: Short and punchy, 150 characters ideal. Gen-Z friendly.",
      threads: "Threads: Up to 500 characters. Conversational and casual.",
      default: "General social media post. Adapt to suit the platform.",
    };

    const toneDescriptions: Record<string, string> = {
      professional: "professional and authoritative",
      casual: "casual and friendly",
      educational: "educational and helpful",
      inspiring: "inspiring and motivational",
      humorous: "light and witty",
    };

    const constraint = channelConstraints[channel] || channelConstraints.default;
    const toneDesc = toneDescriptions[tone] || toneDescriptions.casual;

    const systemPrompt = `You are an expert content editor helping refine social media posts.

Platform: ${constraint}
Desired tone: ${toneDesc}

Original idea context:
- Title: ${originalIdea?.title || "Not provided"}
- Notes: ${originalIdea?.notes || "Not provided"}

Your job is to refine the post based on the user's feedback while:
- Keeping the core message and intent
- Respecting platform constraints (especially character limits)
- Maintaining a natural, human voice
- Making only the requested changes

Output only the refined post content - no explanations, no quotes, just the content itself.`;

    // Build messages array
    const messages: Message[] = [];

    // Add conversation history if exists
    for (const msg of conversationHistory) {
      messages.push(msg);
    }

    // Add the current refinement request
    if (messages.length === 0) {
      // First refinement - include the current content
      messages.push({
        role: "user",
        content: `Current post:\n\n${currentContent}\n\nPlease refine it: ${refinementRequest}`
      });
    } else {
      // Follow-up refinement
      messages.push({
        role: "user",
        content: refinementRequest
      });
    }

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      system: systemPrompt,
      messages: messages,
    });

    const refinedContent =
      response.content[0].type === "text" ? response.content[0].text.trim() : "";

    // Build updated conversation history
    const updatedHistory: Message[] = [
      ...messages,
      { role: "assistant", content: refinedContent }
    ];

    return NextResponse.json({
      content: refinedContent,
      conversationHistory: updatedHistory,
      debug: {
        request: {
          model: "claude-sonnet-4-20250514",
          system: systemPrompt,
          messages: messages,
        },
        response: {
          id: response.id,
          usage: response.usage,
        },
      },
    });
  } catch (error: unknown) {
    console.error("Refine post API error:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to refine post";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
