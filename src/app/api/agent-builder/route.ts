import { NextRequest } from "next/server";
import { streamText, type ModelMessage } from "ai";

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

    const result = streamText({
      model: "anthropic/claude-sonnet-4",
      maxOutputTokens: 16000,
      system: SYSTEM_PROMPT,
      messages: messages.map((msg: { role: string; content: string }) => ({
        role: msg.role as "user" | "assistant",
        content: msg.content,
      })) as ModelMessage[],
      providerOptions: {
        anthropic: {
          thinking: { type: "enabled", budgetTokens: 8000 },
        },
      },
    });

    const encoder = new TextEncoder();

    // Re-emit the SDK's stream as the SSE protocol this route's UI already speaks.
    const readable = new ReadableStream({
      async start(controller) {
        const send = (payload: Record<string, unknown>) =>
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));

        try {
          for await (const part of result.fullStream) {
            switch (part.type) {
              case "reasoning-start":
                send({ type: "thinking_start" });
                break;
              case "text-start":
                send({ type: "text_start" });
                break;
              case "reasoning-delta":
                send({ type: "thinking_delta", text: part.text });
                break;
              case "text-delta":
                send({ type: "text_delta", text: part.text });
                break;
              case "reasoning-end":
              case "text-end":
                send({ type: "block_stop" });
                break;
              case "finish":
                send({ type: "done" });
                break;
            }
          }
          controller.close();
        } catch (error) {
          console.error("Stream error:", error);
          send({ type: "error", text: "Something went wrong" });
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
