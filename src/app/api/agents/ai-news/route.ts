import { NextResponse } from "next/server";
import { query } from "@anthropic-ai/claude-agent-sdk";
import type { Options, AgentDefinition, SDKMessage } from "@anthropic-ai/claude-agent-sdk";
import { getSiteDb } from "@/db/site";
import { projects } from "@/db/site/schema";
import { isAdmin } from "@/lib/api/auth";

interface NewsItem {
  title: string;
  description: string;
  source_url?: string;
  source_name?: string;
  category?: string;
}

interface AgentOutput {
  news_items: NewsItem[];
  summary: string;
}

// Post news items to the feed
async function postToFeed(item: NewsItem, userId: string) {
  let fullDescription = item.description;
  if (item.source_name) {
    fullDescription += `\n\nSource: ${item.source_name}`;
  }

  // Runs from a cron trigger as well as a signed-in request, so `userId` is passed
  // in by the caller rather than read from a session — that is what the
  // service-role key was for here.
  try {
    const [created] = await getSiteDb()
      .insert(projects)
      .values({
        userId,
        title: item.title,
        description: fullDescription,
        mediaUrls: [],
        metadata: item.source_url
          ? {
              source_url: item.source_url,
              source_name: item.source_name,
              category: item.category,
              posted_by_agent: true,
            }
          : { posted_by_agent: true },
      })
      .returning({ id: projects.id });

    return { success: true, post_id: created.id };
  } catch (error) {
    console.error("Error posting to feed:", error);
    return { success: false, error: error instanceof Error ? error.message : "insert failed" };
  }
}

// =============================================================================
// AGENT PROMPTS
// =============================================================================

const LEAD_AGENT_PROMPT = `You are the AI News Lead Agent for MakersLounge, a community of makers and builders.

**CRITICAL RULES:**
1. You MUST delegate ALL research to specialized researcher subagents. You NEVER search yourself.
2. Keep ALL responses SHORT - maximum 2-3 sentences. NO greetings, NO emojis.
3. Get straight to work immediately - spawn subagents right away.

<role_definition>
- Break news gathering into 3-4 distinct categories
- Spawn multiple researcher subagents IN PARALLEL to investigate each category
- After ALL researchers complete, spawn a curator subagent to rank and filter
- Finally, spawn a writer subagent to format the final news items
- Your ONLY tool is Task - you delegate everything to subagents
</role_definition>

<workflow>
**STEP 1: SPAWN RESEARCHER SUBAGENTS (IN PARALLEL)**
Spawn 3-4 researchers simultaneously, each focused on ONE category:
- Researcher 1: "AI models and releases" - new model announcements, capabilities, benchmarks
- Researcher 2: "AI startups and funding" - funding rounds, acquisitions, new companies
- Researcher 3: "AI tools and APIs" - new developer tools, APIs, frameworks, libraries
- Researcher 4: "AI research breakthroughs" - papers with practical applications

Give EACH researcher:
- subagent_type: "news-researcher"
- description: Brief 3-5 word category name
- prompt: Specific instructions on what to search for

**STEP 2: WAIT FOR ALL RESEARCHERS**
Do NOT proceed until all researchers have finished searching.

**STEP 3: SPAWN CURATOR SUBAGENT**
After all research is done:
- subagent_type: "news-curator"
- description: "Rank and filter news"
- prompt: "Review all the research findings. Select the top 3-5 most newsworthy items for technical builders. Rank by: recency, impact, relevance to makers. Output as JSON."

**STEP 4: SPAWN WRITER SUBAGENT**
Finally:
- subagent_type: "news-writer"
- description: "Format final news posts"
- prompt: "Take the curated news items and format them for posting. Each item needs: clear title (under 100 chars), 2-3 sentence description explaining why it matters to builders, source URL and name. Output as JSON with news_items array."

**STEP 5: OUTPUT FINAL JSON**
Once the writer completes, output the final JSON with all news items.
</workflow>

<parallel_spawning>
**IMPORTANT: Spawn researchers IN PARALLEL, not one at a time**
All 3-4 researchers should be spawned in a single response, then wait for all to complete.
</parallel_spawning>

<output_format>
Your FINAL output must be ONLY a JSON object:
{
  "news_items": [
    {
      "title": "Clear headline under 100 chars",
      "description": "2-3 sentence summary of why this matters to builders",
      "source_url": "https://...",
      "source_name": "Source Name",
      "category": "models|startups|tools|research"
    }
  ],
  "summary": "Brief summary of what was found"
}
</output_format>`;

const NEWS_RESEARCHER_PROMPT = `You are a News Researcher subagent for MakersLounge.

**YOUR TASK:**
Search the web for the latest AI news in your assigned category from the past 24-48 hours.

**RULES:**
1. Use WebSearch to find 2-3 relevant news items in your category
2. Focus on NEWS (announcements, releases, funding) not tutorials or guides
3. Prioritize: official announcements, major tech news sites, reputable sources
4. Get the actual source URL and publication name

**SEARCH STRATEGY:**
- Search for "[category] news today 2026" or "[category] announced 2026"
- Look for recent dates in results
- Skip anything older than 48 hours

**OUTPUT FORMAT:**
After searching, output a JSON object with your findings:
{
  "category": "your category name",
  "findings": [
    {
      "title": "headline",
      "summary": "what happened and why it matters",
      "source_url": "https://...",
      "source_name": "TechCrunch/etc",
      "date_found": "approximate date"
    }
  ]
}

Be concise. Search efficiently. Output JSON when done.`;

const NEWS_CURATOR_PROMPT = `You are a News Curator subagent for MakersLounge.

**YOUR TASK:**
Review all research findings from the researcher subagents and select the TOP 3-5 most newsworthy items.

**RANKING CRITERIA (in order of importance):**
1. Recency - prefer news from today or yesterday
2. Impact - major releases, significant funding, breakthrough capabilities
3. Relevance - useful for technical builders, makers, entrepreneurs
4. Credibility - from reputable sources with verifiable URLs

**FILTER OUT:**
- Old news (more than 48 hours)
- Minor updates or patch releases
- Opinion pieces or speculation
- Duplicate stories (keep the best source)

**OUTPUT FORMAT:**
{
  "curated_items": [
    {
      "title": "headline",
      "summary": "why this matters",
      "source_url": "https://...",
      "source_name": "Source",
      "category": "models|startups|tools|research",
      "rank": 1,
      "ranking_reason": "why this made the cut"
    }
  ],
  "total_reviewed": number,
  "total_selected": number
}`;

const NEWS_WRITER_PROMPT = `You are a News Writer subagent for MakersLounge.

**YOUR TASK:**
Take the curated news items and format them for posting to the MakersLounge feed.

**WRITING STYLE:**
- Clear, concise headlines (under 100 characters)
- 2-3 sentence descriptions that explain WHY this matters to builders
- Focus on practical implications, not hype
- Professional tone, no emojis

**HEADLINE FORMULA:**
[Company/Tool] + [Action verb] + [What's new/significant]
Examples:
- "Anthropic Releases Claude 4 with Extended Context Window"
- "OpenAI Secures $10B Funding Round for AGI Research"
- "Meta Open-Sources New Code Generation Model"

**DESCRIPTION FORMULA:**
Sentence 1: What happened
Sentence 2: Why it matters to builders
Sentence 3 (optional): Key capability or detail

**OUTPUT FORMAT:**
{
  "news_items": [
    {
      "title": "Formatted headline under 100 chars",
      "description": "2-3 sentence description for builders",
      "source_url": "https://...",
      "source_name": "Source Name",
      "category": "models|startups|tools|research"
    }
  ],
  "summary": "Brief summary: Found X items across Y categories"
}`;

// =============================================================================
// AGENT DEFINITIONS
// =============================================================================

const NEWS_AGENTS: Record<string, AgentDefinition> = {
  "news-researcher": {
    description:
      "Use this agent to search for AI news in a specific category. " +
      "The researcher uses WebSearch to find recent news items. " +
      "Give it a specific category to focus on (models, startups, tools, or research).",
    tools: ["WebSearch"],
    prompt: NEWS_RESEARCHER_PROMPT,
    model: "haiku"
  },
  "news-curator": {
    description:
      "Use this agent AFTER all researchers have completed to rank and filter findings. " +
      "The curator reviews all research and selects the top 3-5 most newsworthy items.",
    tools: [],
    prompt: NEWS_CURATOR_PROMPT,
    model: "haiku"
  },
  "news-writer": {
    description:
      "Use this agent AFTER the curator to format final news posts. " +
      "The writer takes curated items and formats them with proper headlines and descriptions.",
    tools: [],
    prompt: NEWS_WRITER_PROMPT,
    model: "haiku"
  }
};

// =============================================================================
// MAIN HANDLER
// =============================================================================

// Admin email allowed to run the agent

export async function POST(request: Request) {
  try {
    // Verify authorization - protect against unauthorized API calls
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    // Allow cron jobs with CRON_SECRET (for scheduled runs)
    const cronSecret = process.env.CRON_SECRET;
    const isCronRequest = cronSecret && token === cronSecret;

    if (!isCronRequest) {
      // This used to call `supabase.auth.getUser(token)` on the bearer token. The
      // client had already been switched to send a *Clerk* token — with a comment
      // claiming the route verified it "the same way" — but Supabase Auth cannot
      // validate a Clerk JWT, so every non-cron request failed with "Invalid
      // token". The agent has only been reachable via CRON_SECRET.
      //
      // Clerk reads its session from the request cookies, so the bearer header is
      // no longer needed at all; the client can keep sending it harmlessly.
      if (!(await isAdmin())) {
        return NextResponse.json({ error: "Forbidden - admin only" }, { status: 403 });
      }
    }

    const { action, stream, userId } = await request.json();

    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error("ANTHROPIC_API_KEY not configured");
    }

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("SUPABASE_SERVICE_ROLE_KEY not configured");
    }

    if (action === "run" && !userId) {
      throw new Error("userId is required to post news items");
    }

    if (stream) {
      return handleStreamingRequest(action, userId);
    }

    return handleNonStreamingRequest(action, userId);
  } catch (error: unknown) {
    console.error("AI News Agent error:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to run agent";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

async function handleStreamingRequest(action: string, userId?: string) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        try {
          controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
        } catch {
          // Controller may be closed
        }
      };

      try {
        const today = new Date().toLocaleDateString("en-US", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        });

        const prompt = `TODAY'S DATE: ${today}

Find the latest AI news from the past 24-48 hours.

Spawn 3-4 researcher subagents IN PARALLEL to cover:
1. AI models and releases
2. AI startups and funding
3. AI tools and APIs
4. AI research breakthroughs

Then spawn a curator to select the top 3-5 items, and a writer to format them.

Output the final news items as JSON.`;

        const options: Options = {
          allowedTools: ["Task"],
          agents: NEWS_AGENTS,
          permissionMode: "bypassPermissions",
          allowDangerouslySkipPermissions: true,
          systemPrompt: LEAD_AGENT_PROMPT,
          maxTurns: 15,
          model: "claude-sonnet-4-20250514",
        };

        send("step", { step: "Starting AI News Agent (multi-agent)...", icon: "🚀" });

        let result: AgentOutput | null = null;
        let researcherCount = 0;
        let curatorSpawned = false;
        let writerSpawned = false;

        // Track subagents for progress updates
        const activeSubagents = new Map<string, { type: string; description: string }>();

        for await (const message of query({ prompt, options })) {
          // Handle assistant messages (including subagent spawns)
          if (message.type === "assistant" && message.message?.content) {
            const parentId = message.parent_tool_use_id;

            for (const block of message.message.content) {
              // Track Task tool calls (subagent spawns)
              if (block.type === "tool_use" && block.name === "Task") {
                const input = block.input as {
                  subagent_type?: string;
                  description?: string;
                  prompt?: string;
                };

                const subagentType = input.subagent_type || "unknown";
                const description = input.description || "";

                activeSubagents.set(block.id, { type: subagentType, description });

                if (subagentType === "news-researcher") {
                  researcherCount++;
                  send("step", {
                    step: `Spawning Researcher #${researcherCount}: ${description}`,
                    icon: "🔍",
                    subagent: `RESEARCHER-${researcherCount}`
                  });
                } else if (subagentType === "news-curator") {
                  curatorSpawned = true;
                  send("step", {
                    step: "Spawning Curator to rank findings...",
                    icon: "📊",
                    subagent: "CURATOR"
                  });
                } else if (subagentType === "news-writer") {
                  writerSpawned = true;
                  send("step", {
                    step: "Spawning Writer to format posts...",
                    icon: "✍️",
                    subagent: "WRITER"
                  });
                }
              }

              // Track WebSearch from subagents
              if (block.type === "tool_use" && block.name === "WebSearch") {
                const input = block.input as { query?: string };
                const subagentInfo = parentId ? activeSubagents.get(parentId) : null;
                const agentLabel = subagentInfo
                  ? `RESEARCHER (${subagentInfo.description})`
                  : "AGENT";

                send("step", {
                  step: `[${agentLabel}] Searching: "${input.query || 'AI news'}"`,
                  icon: "🔎"
                });
              }

              // Try to parse JSON from text blocks
              if (block.type === "text" && block.text) {
                const text = block.text.trim();

                // Look for final JSON output
                if (text.includes("news_items") && text.includes("[")) {
                  try {
                    // Extract JSON from text (might have surrounding text)
                    const jsonMatch = text.match(/\{[\s\S]*"news_items"[\s\S]*\}/);
                    if (jsonMatch) {
                      const parsed = JSON.parse(jsonMatch[0]) as AgentOutput;
                      if (parsed.news_items && Array.isArray(parsed.news_items)) {
                        result = parsed;
                        send("step", {
                          step: `Found ${result.news_items.length} news items`,
                          icon: "✅"
                        });
                      }
                    }
                  } catch {
                    // Not valid JSON yet
                  }
                }

                // Send thinking updates for non-JSON text
                if (!text.startsWith("{") && !text.startsWith("[")) {
                  const preview = text.slice(0, 150);
                  if (preview.length > 20) {
                    send("thinking", { text: preview + (text.length > 150 ? "..." : "") });
                  }
                }
              }
            }
          }

          // Handle result message
          if (message.type === "result" && message.subtype === "success") {
            const resultText = message.result;
            if (resultText && !result) {
              try {
                const jsonMatch = resultText.match(/\{[\s\S]*"news_items"[\s\S]*\}/);
                if (jsonMatch) {
                  result = JSON.parse(jsonMatch[0]) as AgentOutput;
                }
              } catch {
                console.log("Could not parse final result:", resultText);
              }
            }
          }
        }

        // Validate result
        if (!result || !result.news_items || result.news_items.length === 0) {
          send("complete", {
            success: true,
            message: "No news items found",
            posted: [],
            stats: { researchers: researcherCount, curatorSpawned, writerSpawned }
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
            const postResult = await postToFeed(item, userId!);
            postedItems.push({
              title: item.title,
              success: postResult.success,
            });
          }
        }

        send("complete", {
          success: true,
          message: result.summary || "Multi-agent news gathering complete",
          posted: postedItems,
          news_items: result.news_items,
          dry_run: action !== "run",
          stats: { researchers: researcherCount, curatorSpawned, writerSpawned }
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

async function handleNonStreamingRequest(action: string, userId?: string) {
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const prompt = `TODAY'S DATE: ${today}

Find the latest AI news from the past 24-48 hours.

Spawn 3-4 researcher subagents IN PARALLEL to cover:
1. AI models and releases
2. AI startups and funding
3. AI tools and APIs
4. AI research breakthroughs

Then spawn a curator to select the top 3-5 items, and a writer to format them.

Output the final news items as JSON.`;

  const options: Options = {
    allowedTools: ["Task"],
    agents: NEWS_AGENTS,
    permissionMode: "bypassPermissions",
    allowDangerouslySkipPermissions: true,
    systemPrompt: LEAD_AGENT_PROMPT,
    maxTurns: 15,
    model: "claude-sonnet-4-20250514",
  };

  let result: AgentOutput | null = null;

  for await (const message of query({ prompt, options })) {
    // Check for JSON in assistant messages
    if (message.type === "assistant" && message.message?.content) {
      for (const block of message.message.content) {
        if (block.type === "text" && block.text) {
          const text = block.text.trim();
          if (text.includes("news_items")) {
            try {
              const jsonMatch = text.match(/\{[\s\S]*"news_items"[\s\S]*\}/);
              if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]) as AgentOutput;
                if (parsed.news_items && Array.isArray(parsed.news_items)) {
                  result = parsed;
                }
              }
            } catch {
              // Not valid JSON
            }
          }
        }
      }
    }

    // Check result message
    if (message.type === "result" && message.subtype === "success") {
      const resultText = message.result;
      if (resultText && !result) {
        try {
          const jsonMatch = resultText.match(/\{[\s\S]*"news_items"[\s\S]*\}/);
          if (jsonMatch) {
            result = JSON.parse(jsonMatch[0]) as AgentOutput;
          }
        } catch {
          console.log("Could not parse result");
        }
      }
    }
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
      const postResult = await postToFeed(item, userId!);
      postedItems.push({
        title: item.title,
        success: postResult.success,
      });
    }
  }

  return NextResponse.json({
    success: true,
    message: result.summary || "Multi-agent news gathering complete",
    posted: postedItems,
    news_items: result.news_items,
    dry_run: action !== "run",
  });
}
