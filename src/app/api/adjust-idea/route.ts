import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export async function POST(request: Request) {
  try {
    const { title, notes, action, customPrompt } = await request.json();

    if (!title && !notes) {
      return NextResponse.json(
        { error: "Title or notes required" },
        { status: 400 }
      );
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error("ANTHROPIC_API_KEY not configured");
    }

    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    // Define action-specific prompts
    const actionPrompts: Record<string, { system: string; instruction: string }> = {
      expand: {
        system: `You are a creative content strategist helping expand and develop content ideas. Your job is to take rough ideas and add depth, context, and substance while keeping the original intent.`,
        instruction: `Expand on this idea with more details, context, and substance. Add 2-3 paragraphs of additional notes that flesh out the concept. Keep the same voice and intent.`,
      },
      improve_title: {
        system: `You are an expert at crafting compelling, attention-grabbing titles. You understand what makes people want to read more.`,
        instruction: `Generate 5 improved versions of this title. Make them more compelling, specific, or intriguing. Return ONLY the 5 titles, numbered 1-5, one per line. No explanations.`,
      },
      clarify: {
        system: `You are a skilled editor who helps clarify and sharpen ideas. You make complex or vague concepts clear and actionable.`,
        instruction: `Rewrite this idea to be clearer and more focused. Keep the core concept but make it more specific and actionable. Return the improved title and notes.`,
      },
      angles: {
        system: `You are a content strategist who sees multiple angles in every story. You help creators find unique perspectives that will resonate with audiences.`,
        instruction: `Suggest 5 different angles or hooks for this content idea. Each angle should offer a unique perspective that could make the content more engaging. Return as a numbered list with a brief description of each angle.`,
      },
      audience: {
        system: `You are a marketing expert who understands audience targeting. You help creators think about who their content is for and why it matters to them.`,
        instruction: `Identify 3 potential target audiences for this content idea and explain why it would resonate with each. For each audience, suggest a slight tweak to make it even more relevant to them.`,
      },
      shorten: {
        system: `You are a master of concise communication. You can distill complex ideas into their essence without losing meaning.`,
        instruction: `Condense this idea into its most essential form. Create a punchy, focused version that captures the core concept in fewer words. Return a shorter title and brief, impactful notes.`,
      },
      brainstorm: {
        system: `You are a creative brainstorming partner. You help generate related ideas and spin-off concepts that could complement the main idea.`,
        instruction: `Based on this idea, brainstorm 5 related content ideas that could work well alongside it. These could be sequels, different formats, or related topics. Return as a numbered list.`,
      },
      custom: {
        system: `You are a helpful AI assistant for content creators. Follow the user's specific instructions to help improve their content idea.`,
        instruction: customPrompt || "Help improve this idea.",
      },
    };

    const selectedAction = actionPrompts[action] || actionPrompts.expand;

    const userContent = `
Title: ${title || "(no title)"}
${notes ? `Notes: ${notes}` : "(no notes)"}

${selectedAction.instruction}`;

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1500,
      system: selectedAction.system,
      messages: [{ role: "user", content: userContent }],
    });

    const generatedContent =
      response.content[0].type === "text" ? response.content[0].text : "";

    return NextResponse.json({
      result: generatedContent.trim(),
      action,
    });
  } catch (error: unknown) {
    console.error("Adjust idea API error:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to process";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
