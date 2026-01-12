import { NextResponse } from "next/server";
import { query } from "@anthropic-ai/claude-agent-sdk";
import type { Options } from "@anthropic-ai/claude-agent-sdk";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Agent's fixed user ID
const AI_NEWS_AGENT_ID = "ai-news-agent";

// Lazy initialization of Supabase client to avoid build-time errors
let supabase: SupabaseClient | null = null;

function getSupabase() {
  if (!supabase) {
    supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }
  return supabase;
}

interface NewsItem {
  title: string;
  description: string;
  source_url?: string;
  source_name?: string;
}

interface AgentOutput {
  news_items: NewsItem[];
  summary: string;
}

// Post news items to the feed
async function postToFeed(item: NewsItem) {
  let fullDescription = item.description;
  if (item.source_name) {
    fullDescription += `\n\nSource: ${item.source_name}`;
  }

  const { data, error } = await getSupabase()
    .from("projects")
    .insert({
      user_id: AI_NEWS_AGENT_ID,
      title: item.title,
      description: fullDescription,
      media_urls: [],
      metadata: item.source_url ? { source_url: item.source_url, source_name: item.source_name } : null,
    })
    .select()
    .single();

  if (error) {
    console.error("Error posting to feed:", error);
    return { success: false, error: error.message };
  }

  return { success: true, post_id: data.id };
}

export async function POST(request: Request) {
  try {
    const { action, stream } = await request.json();

    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error("ANTHROPIC_API_KEY not configured");
    }

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("SUPABASE_SERVICE_ROLE_KEY not configured");
    }

    // If streaming is requested, use SSE
    if (stream) {
      return handleStreamingRequest(action);
    }

    // Non-streaming request (original behavior)
    return handleNonStreamingRequest(action);
  } catch (error: unknown) {
    console.error("AI News Agent error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to run agent";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

async function handleStreamingRequest(action: string) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
      };

      try {
        const today = new Date().toLocaleDateString("en-US", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        });

        const prompt = `You are the AI News Agent for MakersLounge, a community of makers, builders, and entrepreneurs.

TODAY'S DATE: ${today}

YOUR TASK:
1. Use WebSearch to find the latest AI news from the past 24-48 hours
2. Search for topics like: "AI news today", "new AI models released", "AI startup funding", "open source AI projects"
3. Find 1-3 high-quality, newsworthy items relevant to builders:
   - New AI tools and APIs
   - Model releases and capabilities
   - Research breakthroughs with practical applications
   - AI startup news
   - Open source projects

IMPORTANT: After finding news, you MUST respond with ONLY a JSON object in this exact format (no other text):
{
  "news_items": [
    {
      "title": "Clear headline under 100 chars",
      "description": "2-3 sentence summary of why this matters to builders",
      "source_url": "https://...",
      "source_name": "Source Name"
    }
  ],
  "summary": "Brief summary of what you found"
}

Focus on accuracy and relevance to technical builders.`;

        const options: Options = {
          allowedTools: ["WebSearch", "WebFetch"],
          permissionMode: "bypassPermissions",
          allowDangerouslySkipPermissions: true,
          systemPrompt: {
            type: "preset",
            preset: "claude_code",
            append: "\n\nYou are finding AI news for the MakersLounge community. Always respond with valid JSON after searching.",
          },
          maxTurns: 10,
        };

        let result: AgentOutput | null = null;
        let searchCount = 0;
        let fetchCount = 0;

        send("step", { step: "Starting AI News Agent...", icon: "🚀" });

        let lastToolTime = Date.now();
        let sentProcessingStep = false;

        // Run the agent and stream progress
        for await (const message of query({ prompt, options })) {
          // If it's been a while since last tool and we haven't sent processing step
          const now = Date.now();
          if (now - lastToolTime > 3000 && !sentProcessingStep && searchCount > 0) {
            send("step", { step: "Analyzing search results...", icon: "🧠" });
            sentProcessingStep = true;
          }
          // Track tool usage for progress updates
          if (message.type === "assistant" && message.message?.content) {
            for (const block of message.message.content) {
              if (block.type === "tool_use") {
                lastToolTime = Date.now();
                if (block.name === "WebSearch") {
                  searchCount++;
                  const input = block.input as { query?: string };
                  send("step", {
                    step: `Searching: "${input.query || 'AI news'}"`,
                    icon: "🔍",
                    detail: `Search #${searchCount}`
                  });
                } else if (block.name === "WebFetch") {
                  fetchCount++;
                  const input = block.input as { url?: string };
                  const url = input.url || "";
                  const domain = url ? new URL(url).hostname : "website";
                  send("step", {
                    step: `Reading: ${domain}`,
                    icon: "📄",
                    detail: `Fetch #${fetchCount}`
                  });
                }
              } else if (block.type === "text" && block.text) {
                // Try to parse JSON from text
                const text = block.text.trim();
                if (text.startsWith("{") && text.includes("news_items")) {
                  try {
                    const parsed = JSON.parse(text) as AgentOutput;
                    if (parsed.news_items && Array.isArray(parsed.news_items)) {
                      result = parsed;
                      send("step", {
                        step: `Found ${result.news_items.length} news items`,
                        icon: "✅"
                      });
                    }
                  } catch {
                    // Not valid JSON yet, might be partial
                  }
                }

                // Send thinking updates (truncated) - only if not JSON
                if (!text.startsWith("{")) {
                  const preview = text.slice(0, 100);
                  if (preview.length > 20) {
                    send("thinking", { text: preview + (text.length > 100 ? "..." : "") });
                  }
                }
              }
            }
          }

          // Capture the result
          if ("result" in message) {
            if (typeof message.result === "string") {
              try {
                result = JSON.parse(message.result) as AgentOutput;
                send("step", {
                  step: `Found ${result.news_items?.length || 0} news items`,
                  icon: "✅"
                });
              } catch {
                console.log("Agent result:", message.result);
              }
            }
          }

          // Check for errors
          if ("error" in message && message.error) {
            send("error", { error: String(message.error) });
          }
        }

        if (!result || !result.news_items || result.news_items.length === 0) {
          send("complete", {
            success: true,
            message: "No news items found",
            posted: [],
          });
          controller.close();
          return;
        }

        // Post news items to the feed (only if action is "run")
        const postedItems: Array<{ title: string; success: boolean }> = [];

        if (action === "run") {
          send("step", { step: "Posting to feed...", icon: "📝" });

          for (const item of result.news_items) {
            send("step", {
              step: `Posting: "${item.title.slice(0, 50)}${item.title.length > 50 ? '...' : ''}"`,
              icon: "📤"
            });
            const postResult = await postToFeed(item);
            postedItems.push({
              title: item.title,
              success: postResult.success,
            });
          }
        }

        send("complete", {
          success: true,
          message: result.summary || "Agent completed",
          posted: postedItems,
          news_items: result.news_items,
          dry_run: action !== "run",
        });

      } catch (error) {
        send("error", {
          error: error instanceof Error ? error.message : "Unknown error"
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
}

async function handleNonStreamingRequest(action: string) {
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const prompt = `You are the AI News Agent for MakersLounge, a community of makers, builders, and entrepreneurs.

TODAY'S DATE: ${today}

YOUR TASK:
1. Use WebSearch to find the latest AI news from the past 24-48 hours
2. Search for topics like: "AI news today", "new AI models released", "AI startup funding", "open source AI projects"
3. Find 1-3 high-quality, newsworthy items relevant to builders:
   - New AI tools and APIs
   - Model releases and capabilities
   - Research breakthroughs with practical applications
   - AI startup news
   - Open source projects

IMPORTANT: After finding news, you MUST respond with ONLY a JSON object in this exact format (no other text):
{
  "news_items": [
    {
      "title": "Clear headline under 100 chars",
      "description": "2-3 sentence summary of why this matters to builders",
      "source_url": "https://...",
      "source_name": "Source Name"
    }
  ],
  "summary": "Brief summary of what you found"
}

Focus on accuracy and relevance to technical builders.`;

  const options: Options = {
    allowedTools: ["WebSearch", "WebFetch"],
    permissionMode: "bypassPermissions",
    allowDangerouslySkipPermissions: true,
    systemPrompt: {
      type: "preset",
      preset: "claude_code",
      append: "\n\nYou are finding AI news for the MakersLounge community. Always respond with valid JSON after searching.",
    },
    maxTurns: 10,
  };

  let result: AgentOutput | null = null;
  let agentError: string | null = null;

  for await (const message of query({ prompt, options })) {
    // Check for JSON in text blocks
    if (message.type === "assistant" && message.message?.content) {
      for (const block of message.message.content) {
        if (block.type === "text" && block.text) {
          const text = block.text.trim();
          if (text.startsWith("{") && text.includes("news_items")) {
            try {
              const parsed = JSON.parse(text) as AgentOutput;
              if (parsed.news_items && Array.isArray(parsed.news_items)) {
                result = parsed;
              }
            } catch {
              // Not valid JSON
            }
          }
        }
      }
    }

    // Also check result field
    if ("result" in message) {
      if (typeof message.result === "string") {
        try {
          const parsed = JSON.parse(message.result) as AgentOutput;
          if (parsed.news_items) {
            result = parsed;
          }
        } catch {
          console.log("Agent result:", message.result);
        }
      }
    }

    if ("error" in message && message.error) {
      agentError = String(message.error);
    }
  }

  if (agentError) {
    return NextResponse.json({ error: agentError }, { status: 500 });
  }

  if (!result || !result.news_items || result.news_items.length === 0) {
    return NextResponse.json({
      success: true,
      message: "No news items found",
      posted: [],
    });
  }

  const postedItems: Array<{ title: string; success: boolean }> = [];

  if (action === "run") {
    for (const item of result.news_items) {
      const postResult = await postToFeed(item);
      postedItems.push({
        title: item.title,
        success: postResult.success,
      });
    }
  }

  return NextResponse.json({
    success: true,
    message: result.summary || "Agent completed",
    posted: postedItems,
    news_items: result.news_items,
    dry_run: action !== "run",
  });
}
