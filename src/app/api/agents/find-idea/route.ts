import Anthropic from "@anthropic-ai/sdk";
import { Sandbox } from "@e2b/code-interpreter";

const anthropic = new Anthropic();

const SYSTEM_PROMPT = `You are the "Find an Idea" agent for MakersLounge, a community of makers and builders.

Your job is to help users discover project ideas that match their group size, interests, and skill level.

**CONVERSATION FLOW:**
1. The user will tell you their group size and optionally some context.
2. Ask 2-3 SHORT follow-up questions (one at a time) to understand:
   - What topics/domains interest them (AI, hardware, social impact, creative tools, etc.)
   - Their skill level and tech stack (beginner/intermediate/advanced, languages they know)
   - Any constraints (time limit, budget, hackathon theme, etc.)
3. Once you have enough context, generate 3-5 tailored project ideas.
4. If you need to validate feasibility (check if an API exists, test a concept), use the run_code tool to run code in a sandbox.

**IDEA FORMAT:**
For each idea, provide:
- A catchy project name
- One-line pitch (what it does)
- Why it's a good fit for this group
- Key technologies/APIs they'd use
- Difficulty level (Easy / Medium / Hard)
- A rough scope estimate (weekend project, 1-2 weeks, month+)

**STYLE:**
- Be encouraging and enthusiastic but concise
- Tailor ideas to the group's actual skills — don't suggest ML projects to beginners
- Mix practical and creative ideas
- If it's a hackathon, bias toward impressive demos over production-ready apps

**IMPORTANT:**
- Keep messages short and conversational
- Don't dump all questions at once — ask one thing at a time
- When you have enough info (usually after 2-3 exchanges), generate ideas immediately
- Use the run_code tool ONLY when you need to verify something (e.g., check if an API is accessible, test a concept)`;

const tools: Anthropic.Messages.Tool[] = [
  {
    name: "run_code",
    description:
      "Run Python or JavaScript code in a sandboxed environment to validate ideas, check APIs, or prototype concepts. Use this when you need to verify feasibility of a project idea.",
    input_schema: {
      type: "object" as const,
      properties: {
        code: {
          type: "string",
          description: "The code to execute",
        },
        language: {
          type: "string",
          enum: ["python", "javascript"],
          description: "Programming language to use",
        },
      },
      required: ["code", "language"],
    },
  },
];

interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
}

async function runCodeInSandbox(
  code: string,
  language: string
): Promise<string> {
  const sandbox = await Sandbox.create();
  try {
    if (language === "python") {
      const result = await sandbox.runCode(code);
      const output = result.logs.stdout.join("\n") + result.logs.stderr.join("\n");
      return output || "(no output)";
    } else {
      // JavaScript - use subprocess
      const result = await sandbox.commands.run(`echo '${code.replace(/'/g, "\\'")}' | node`);
      return result.stdout + result.stderr || "(no output)";
    }
  } catch (error) {
    return `Error: ${error instanceof Error ? error.message : String(error)}`;
  } finally {
    await sandbox.kill();
  }
}

export async function POST(request: Request) {
  try {
    const { messages, groupSize } = (await request.json()) as {
      messages: ConversationMessage[];
      groupSize?: string;
    };

    if (!process.env.ANTHROPIC_API_KEY) {
      return new Response(
        JSON.stringify({ error: "ANTHROPIC_API_KEY not configured" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!process.env.E2B_API_KEY) {
      return new Response(
        JSON.stringify({ error: "E2B_API_KEY not configured" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // Build the messages for the API call
    const apiMessages: Anthropic.Messages.MessageParam[] = messages.map(
      (msg) => ({
        role: msg.role,
        content: msg.content,
      })
    );

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const send = (event: string, data: unknown) => {
          try {
            controller.enqueue(
              encoder.encode(
                `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
              )
            );
          } catch {
            // Controller may be closed
          }
        };

        try {
          // Agentic loop - keep going until we get a final text response
          let currentMessages = [...apiMessages];
          let turns = 0;
          const maxTurns = 10;

          while (turns < maxTurns) {
            turns++;

            const response = await anthropic.messages.create({
              model: "claude-sonnet-4-20250514",
              max_tokens: 2048,
              system: SYSTEM_PROMPT,
              tools,
              messages: currentMessages,
            });

            // Check if the response has tool use
            const toolUseBlocks = response.content.filter(
              (block) => block.type === "tool_use"
            );
            const textBlocks = response.content.filter(
              (block) => block.type === "text"
            );

            if (toolUseBlocks.length > 0) {
              // Process tool calls
              const toolResults: Anthropic.Messages.ToolResultBlockParam[] = [];

              for (const toolUse of toolUseBlocks) {
                if (
                  toolUse.type === "tool_use" &&
                  toolUse.name === "run_code"
                ) {
                  const input = toolUse.input as {
                    code: string;
                    language: string;
                  };

                  send("tool_call", {
                    name: "run_code",
                    language: input.language,
                    code: input.code.slice(0, 200) + (input.code.length > 200 ? "..." : ""),
                  });

                  const result = await runCodeInSandbox(
                    input.code,
                    input.language
                  );

                  send("tool_result", {
                    name: "run_code",
                    output: result.slice(0, 500),
                  });

                  toolResults.push({
                    type: "tool_result",
                    tool_use_id: toolUse.id,
                    content: result,
                  });
                }
              }

              // Add assistant message and tool results to conversation
              currentMessages = [
                ...currentMessages,
                { role: "assistant", content: response.content },
                { role: "user", content: toolResults },
              ];

              // If there was also text alongside tool use, send it
              if (textBlocks.length > 0) {
                const text = textBlocks
                  .map((b) => (b.type === "text" ? b.text : ""))
                  .join("\n");
                if (text.trim()) {
                  send("text", { content: text });
                }
              }

              // Continue the loop for the next turn
              continue;
            }

            // No tool use — this is the final response
            const finalText = textBlocks
              .map((b) => (b.type === "text" ? b.text : ""))
              .join("\n");

            send("message", { content: finalText, done: true });
            break;
          }
        } catch (error) {
          send("error", {
            error:
              error instanceof Error ? error.message : "Unknown error",
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
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Find Idea Agent error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Failed to run agent",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
