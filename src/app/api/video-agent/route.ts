import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic();

const SYSTEM_PROMPT = `You are an AI video content assistant for MakersLounge. Your job is to help users plan and create engaging video content.

## Workflow

1. **Ask** about their video idea — topic, audience, platform, style
2. **Research** the topic using web search to find current trends, stats, or examples
3. **Suggest** specific content including title, caption, colors, layout, AND a full script

## Suggestion Format

When you have enough context, provide suggestions using this exact format:

\`\`\`
:::suggestion
title: Your suggested title here
caption: Your suggested caption/description here
backgroundColor: #hexcolor
accentColor: #hexcolor
aspectRatio: 16:9
overlayPosition: center
:::
\`\`\`

Field notes:
- **aspectRatio**: one of "16:9", "9:16", "1:1", "4:5"
- **overlayPosition**: one of "top", "center", "bottom"
- **backgroundColor** and **accentColor**: hex color codes that fit the video mood
- You can include multiple suggestion blocks if offering alternatives

## Script Format

Always generate a full script alongside your suggestion using this exact format:

\`\`\`
:::script
[Hook] A compelling opening line to grab attention immediately
[Intro] Brief introduction setting up what the video covers
[Point 1] First main talking point with key details
[Point 2] Second main talking point with key details
[Conclusion] Wrap up and summary of main takeaways
[CTA] Call to action — what viewers should do next
:::
\`\`\`

Script rules:
- Each line starts with a label in square brackets followed by the text
- Use labels like: Hook, Intro, Point 1, Point 2, Point 3, Conclusion, CTA
- Write naturally — these will be read aloud via text-to-speech
- Keep each segment concise (1-3 sentences)
- For short-form content (Reels/TikTok), use fewer segments (Hook, Main Point, CTA)
- For long-form (YouTube), use more segments with multiple points
- The :::script block should appear right before or after the :::suggestion block

## Guidelines

- Be conversational and concise
- Ask clarifying questions if the idea is vague
- Use web search to find relevant trends, data, or examples
- Suggest colors that match the mood/topic (dark & bold for tech, warm for lifestyle, etc.)
- For short-form (TikTok, Reels), suggest 9:16; for YouTube, suggest 16:9; for Instagram feed, suggest 1:1 or 4:5
- Keep suggestions practical and ready to apply`;

export async function POST(request: NextRequest) {
  try {
    const { messages, ideas } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: "Messages required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Build system prompt with optional ideas context
    let systemPrompt = SYSTEM_PROMPT;
    if (ideas && Array.isArray(ideas) && ideas.length > 0) {
      const ideasList = ideas
        .map(
          (idea: { title: string; notes: string; status: string }, i: number) =>
            `${i + 1}. **${idea.title}** (status: ${idea.status})${idea.notes ? `\n   Notes: ${idea.notes}` : ""}`
        )
        .join("\n");
      systemPrompt += `\n\n## User's Broadcast Ideas\n\nThe user has the following content ideas from their planning board. You can reference these when helping them create videos. If the user asks about their ideas, list them. If they say "use my first idea" or similar, use the corresponding idea.\n\n${ideasList}`;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const requestOptions: any = {
      model: "claude-sonnet-4-20250514",
      max_tokens: 8000,
      system: systemPrompt,
      tools: [
        {
          type: "web_search_20250305",
          name: "web_search",
          max_uses: 3,
        },
      ],
      messages: messages.map((msg: { role: string; content: string }) => ({
        role: msg.role as "user" | "assistant",
        content: msg.content,
      })),
    };

    const stream = await anthropic.messages.stream(requestOptions);

    const encoder = new TextEncoder();

    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of stream) {
            if (event.type === "content_block_start") {
              if (event.content_block.type === "text") {
                controller.enqueue(
                  encoder.encode(
                    `data: ${JSON.stringify({ type: "text_start" })}\n\n`
                  )
                );
              } else if (
                event.content_block.type === "server_tool_use" &&
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (event.content_block as any).name === "web_search"
              ) {
                controller.enqueue(
                  encoder.encode(
                    `data: ${JSON.stringify({ type: "search_status", text: "Researching..." })}\n\n`
                  )
                );
              }
            } else if (event.type === "content_block_delta") {
              if (event.delta.type === "text_delta") {
                controller.enqueue(
                  encoder.encode(
                    `data: ${JSON.stringify({ type: "text_delta", text: event.delta.text })}\n\n`
                  )
                );
              }
            } else if (event.type === "message_stop") {
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({ type: "done" })}\n\n`
                )
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
    console.error("Video agent error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to generate response" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
