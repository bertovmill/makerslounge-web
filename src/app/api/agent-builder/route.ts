import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic();

const SYSTEM_PROMPT = `You are an AI Agent Builder assistant for MakersLounge, a community platform for makers and builders.

Your job is to help users design and configure AI agents for any purpose - content creation, business automation, research, customer support, and more.

## Agent Types You Can Help Create:

**Content Agents** - Post tips, news, curated content, or inspiration to the community feed
**Research Agents** - Gather, analyze, and summarize information on specific topics
**Assistant Agents** - Help with drafting, organizing, answering questions, or providing recommendations
**Automation Agents** - Monitor events/triggers and take automated actions
**Support Agents** - Handle customer inquiries, FAQ responses, or community moderation
**Analytics Agents** - Track metrics, generate reports, or surface insights

## Information to Gather:

1. **Purpose**: What problem does this agent solve? What's its main job?
2. **Capabilities**: What should it be able to do? (search web, access data, post content, send notifications, etc.)
3. **Triggers**: When should it activate? (scheduled, on-demand, event-based)
4. **Personality/Tone**: How should it communicate? (professional, friendly, concise, detailed)
5. **Name**: What should the agent be called?
6. **Integrations**: Does it need to connect to anything? (APIs, databases, external services)

## Example Configurations:

**Content Agent:**
- Name: Indie Hacker Tips (@indiehacks)
- Purpose: Share daily tips for solo founders
- Trigger: Daily at 9am
- Capabilities: Generate tips, post to feed

**Research Agent:**
- Name: Market Scout
- Purpose: Track competitor launches and industry news
- Trigger: Weekly digest
- Capabilities: Web search, summarization, email reports

**Support Agent:**
- Name: Community Helper
- Purpose: Answer common questions from new members
- Trigger: When mentioned or DM'd
- Capabilities: FAQ lookup, escalation to humans

Be conversational and helpful. Ask clarifying questions to understand their needs. When you have enough information, provide a clear summary of the agent configuration.

Keep responses concise. Use markdown formatting for clarity.`;

export async function POST(request: NextRequest) {
  try {
    const { messages } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: "Messages required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const stream = await anthropic.messages.stream({
      model: "claude-sonnet-4-20250514",
      max_tokens: 16000,
      thinking: {
        type: "enabled",
        budget_tokens: 8000,
      },
      system: SYSTEM_PROMPT,
      messages: messages.map((msg: { role: string; content: string }) => ({
        role: msg.role as "user" | "assistant",
        content: msg.content,
      })),
    });

    const encoder = new TextEncoder();

    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of stream) {
            if (event.type === "content_block_start") {
              if (event.content_block.type === "thinking") {
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({ type: "thinking_start" })}\n\n`)
                );
              } else if (event.content_block.type === "text") {
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({ type: "text_start" })}\n\n`)
                );
              }
            } else if (event.type === "content_block_delta") {
              if (event.delta.type === "thinking_delta") {
                controller.enqueue(
                  encoder.encode(
                    `data: ${JSON.stringify({ type: "thinking_delta", text: event.delta.thinking })}\n\n`
                  )
                );
              } else if (event.delta.type === "text_delta") {
                controller.enqueue(
                  encoder.encode(
                    `data: ${JSON.stringify({ type: "text_delta", text: event.delta.text })}\n\n`
                  )
                );
              }
            } else if (event.type === "content_block_stop") {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ type: "block_stop" })}\n\n`)
              );
            } else if (event.type === "message_stop") {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ type: "done" })}\n\n`)
              );
            }
          }
          controller.close();
        } catch (error) {
          console.error("Stream error:", error);
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: "error", text: "Something went wrong" })}\n\n`
            )
          );
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Agent builder error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to generate response" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
