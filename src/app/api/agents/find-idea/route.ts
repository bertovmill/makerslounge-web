import { generateText, stepCountIs, tool, type ModelMessage } from "ai";
import { z } from "zod";
import { Sandbox } from "@e2b/code-interpreter";

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

const runCodeInputSchema = z.object({
  code: z.string().describe("The code to execute"),
  language: z.enum(["python", "javascript"]).describe("Programming language to use"),
});

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

    if (!process.env.E2B_API_KEY) {
      return new Response(
        JSON.stringify({ error: "E2B_API_KEY not configured" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // Build the messages for the API call
    const apiMessages: ModelMessage[] = messages.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));

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
          const { text: finalText } = await generateText({
            model: "anthropic/claude-sonnet-4",
            maxOutputTokens: 2048,
            system: SYSTEM_PROMPT,
            messages: apiMessages,
            stopWhen: stepCountIs(10),
            tools: {
              run_code: tool({
                description:
                  "Run Python or JavaScript code in a sandboxed environment to validate ideas, check APIs, or prototype concepts. Use this when you need to verify feasibility of a project idea.",
                inputSchema: runCodeInputSchema,
                execute: async ({ code, language }) => {
                  send("tool_call", {
                    name: "run_code",
                    language,
                    code: code.slice(0, 200) + (code.length > 200 ? "..." : ""),
                  });

                  const result = await runCodeInSandbox(code, language);

                  send("tool_result", { name: "run_code", output: result.slice(0, 500) });
                  return result;
                },
              }),
            },
            // Text emitted alongside a tool call still streams to the client.
            onStepFinish: ({ text, toolCalls }) => {
              if (toolCalls.length > 0 && text.trim()) {
                send("text", { content: text });
              }
            },
          });

          send("message", { content: finalText, done: true });
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
