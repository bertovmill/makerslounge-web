import Anthropic from "@anthropic-ai/sdk";
import type { Group, Contact } from "@/types/matcher";
import type { MessageParam, ContentBlockParam, ToolResultBlockParam, ToolUseBlock } from "@anthropic-ai/sdk/resources/messages";

export const maxDuration = 180; // 3 minutes for agentic multi-turn

// Helper to delay execution
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Retry wrapper for rate limit errors
async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelayMs = 5000,
  onRetry?: (attempt: number, delayMs: number) => void
): Promise<T> {
  let lastError: Error | null = null;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      const isRateLimit =
        error instanceof Anthropic.RateLimitError ||
        (error instanceof Error && error.message.includes("rate_limit"));

      if (isRateLimit && attempt < maxRetries - 1) {
        const delayMs = baseDelayMs * Math.pow(2, attempt);
        console.log(`Rate limited, waiting ${delayMs}ms before retry ${attempt + 1}...`);
        onRetry?.(attempt + 1, delayMs);
        await delay(delayMs);
        continue;
      }
      throw error;
    }
  }
  throw lastError;
}

interface MatcherRequest {
  contacts: Contact[];
  groupSize: number;
  stream?: boolean;
}

interface ProposedGroups {
  groups: Group[];
}

interface VerificationResult {
  valid: boolean;
  issues: string[];
  unplaced: string[];
  duplicates: string[];
  groupSizes: number[];
}

// Request-scoped state class to avoid global state issues in serverless
class MatcherState {
  contacts: Contact[] = [];
  numGroups: number = 4;
  proposedGroups: Group[] = [];

  constructor(contacts: Contact[], numGroups: number) {
    this.contacts = contacts;
    this.numGroups = numGroups;
  }

  getAllContacts(): { contacts: Array<{ name: string; summary: string }>; columns: string[]; count: number } {
    const allColumns = new Set<string>();
    this.contacts.forEach((c) => Object.keys(c).forEach((k) => allColumns.add(k)));

    // Return condensed contact info to reduce token usage
    const condensedContacts = this.contacts.map((c) => {
      const name = c.name || c.Name || Object.values(c)[0] || "Unknown";
      // Create a brief summary of key fields
      const keyFields = ["skills", "needs", "project", "expertise", "looking_for", "help", "interests"];
      const summaryParts: string[] = [];
      for (const key of Object.keys(c)) {
        const lowerKey = key.toLowerCase();
        if (keyFields.some(k => lowerKey.includes(k)) && c[key]) {
          summaryParts.push(`${key}: ${c[key].slice(0, 100)}`);
        }
      }
      return {
        name,
        summary: summaryParts.join("; ") || "No details available",
      };
    });

    return {
      contacts: condensedContacts,
      columns: Array.from(allColumns),
      count: this.contacts.length,
    };
  }

  searchContacts(criteria: { field: string; contains: string }): Contact[] {
    return this.contacts.filter((c) => {
      const value = c[criteria.field];
      return value && value.toLowerCase().includes(criteria.contains.toLowerCase());
    });
  }

  getContactByName(name: string): Contact | null {
    const getName = (c: Contact) => c.name || c.Name || Object.values(c)[0] || "";
    // Try exact match first
    let contact = this.contacts.find(
      (c) => getName(c).toLowerCase() === name.toLowerCase()
    );
    // Try partial match
    if (!contact) {
      contact = this.contacts.find(
        (c) => getName(c).toLowerCase().includes(name.toLowerCase())
      );
    }
    return contact || null;
  }

  proposeGroups(groups: Group[]): { accepted: boolean; message: string } {
    this.proposedGroups = groups;
    return {
      accepted: true,
      message: `Received ${groups.length} proposed groups. Use verify_groups to check validity.`,
    };
  }

  verifyGroups(): VerificationResult {
    // Handle both "name" and "Name" columns, fallback to first value
    const allNames = this.contacts.map((c) => c.name || c.Name || Object.values(c)[0] || "").filter(Boolean);
    const placedNames: string[] = [];
    const duplicates: string[] = [];
    const groupSizes: number[] = [];

    for (const group of this.proposedGroups) {
      groupSizes.push(group.members.length);
      for (const member of group.members) {
        if (placedNames.includes(member)) {
          duplicates.push(member);
        }
        placedNames.push(member);
      }
    }

    const unplaced = allNames.filter(
      (name) => !placedNames.some((p) => p.toLowerCase() === name.toLowerCase())
    );

    const issues: string[] = [];
    if (duplicates.length > 0) {
      issues.push(`Duplicate placements: ${duplicates.join(", ")}`);
    }
    if (unplaced.length > 0) {
      issues.push(`Unplaced contacts: ${unplaced.join(", ")}`);
    }
    if (this.proposedGroups.length !== this.numGroups) {
      issues.push(
        `Expected ${this.numGroups} groups but got ${this.proposedGroups.length}`
      );
    }

    return {
      valid: issues.length === 0,
      issues,
      unplaced,
      duplicates,
      groupSizes,
    };
  }

  submitFinalGroups(): { success: boolean; groups: Group[]; issues?: string[] } {
    const verification = this.verifyGroups();
    if (!verification.valid) {
      return {
        success: false,
        groups: [],
        issues: verification.issues,
      };
    }
    return {
      success: true,
      groups: this.proposedGroups,
    };
  }

  handleToolCall(toolName: string, toolInput: Record<string, unknown>): unknown {
    switch (toolName) {
      case "get_all_contacts":
        return this.getAllContacts();
      case "search_contacts":
        return this.searchContacts(toolInput as { field: string; contains: string });
      case "get_contact_by_name":
        return this.getContactByName(toolInput.name as string);
      case "propose_groups":
        return this.proposeGroups((toolInput as unknown as ProposedGroups).groups);
      case "verify_groups":
        return this.verifyGroups();
      case "submit_final_groups":
        return this.submitFinalGroups();
      default:
        return { error: `Unknown tool: ${toolName}` };
    }
  }
}

// Tool definitions for the Anthropic API
const MATCHER_TOOLS: Anthropic.Tool[] = [
  {
    name: "get_all_contacts",
    description:
      "Get all contacts with their full data. Returns the contact list, available columns, and total count. Use this first to understand the data.",
    input_schema: {
      type: "object" as const,
      properties: {},
      required: [],
    },
  },
  {
    name: "search_contacts",
    description:
      "Search contacts by a field value. Useful for finding people with specific skills or needs.",
    input_schema: {
      type: "object" as const,
      properties: {
        field: {
          type: "string",
          description: "The column/field name to search in (e.g., 'skills', 'needs', 'project')",
        },
        contains: {
          type: "string",
          description: "The text to search for (case-insensitive partial match)",
        },
      },
      required: ["field", "contains"],
    },
  },
  {
    name: "get_contact_by_name",
    description: "Get full details for a specific contact by their name.",
    input_schema: {
      type: "object" as const,
      properties: {
        name: {
          type: "string",
          description: "The name of the contact to look up",
        },
      },
      required: ["name"],
    },
  },
  {
    name: "propose_groups",
    description:
      "Propose a grouping of contacts. After proposing, use verify_groups to check validity.",
    input_schema: {
      type: "object" as const,
      properties: {
        groups: {
          type: "array",
          description: "Array of group objects",
          items: {
            type: "object",
            properties: {
              members: {
                type: "array",
                items: { type: "string" },
                description: "Array of member names (must match exactly)",
              },
              theme: {
                type: "string",
                description: "Short 3-5 word theme for this group",
              },
              reason: {
                type: "string",
                description: "2-3 sentence explanation of why this group works",
              },
              connections: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    from: { type: "string" },
                    to: { type: "string" },
                    reason: { type: "string" },
                    strength: { type: "number" },
                  },
                },
                description: "Important connections between members. Include at least 5-8 connections per group showing who should talk to whom and why.",
              },
            },
            required: ["members", "theme", "reason"],
          },
        },
      },
      required: ["groups"],
    },
  },
  {
    name: "verify_groups",
    description:
      "Verify the proposed groups are valid. Checks that everyone is placed exactly once and group count is correct. ALWAYS call this after propose_groups.",
    input_schema: {
      type: "object" as const,
      properties: {},
      required: [],
    },
  },
  {
    name: "submit_final_groups",
    description:
      "Submit the final verified groups. Only call this after verify_groups returns valid=true.",
    input_schema: {
      type: "object" as const,
      properties: {},
      required: [],
    },
  },
];


const SYSTEM_PROMPT = `You are an efficient networking matchmaker for MakersLounge.

Your task: Create optimal groups for a networking event QUICKLY.

## Tools (use sparingly!)
- get_all_contacts: Call ONCE to see all attendees
- search_contacts: Use only 1-2 times if needed for specific queries
- propose_groups: Submit your grouping
- verify_groups: Check for errors (REQUIRED before submit)
- submit_final_groups: Finalize (or auto-submits after verify passes)

## CRITICAL: Be FAST, not thorough!
You have LIMITED turns. Follow this exact flow:

1. Call get_all_contacts ONCE - you'll see everyone's name + summary
2. Immediately create groups based on what you see (don't search extensively!)
3. Call propose_groups with ALL people assigned
4. Call verify_groups - if valid, you're done!
5. If issues, fix and re-propose

## Matching Principles
- Match people who HAVE skills with those who NEED them
- Create diverse groups with complementary perspectives
- Every person must be in EXACTLY one group (use exact names from contact list)
- Distribute people evenly across the requested number of groups
- For each group, include 5-8 specific connections showing who should talk to whom and why

DO NOT waste turns searching. You have all the info you need from get_all_contacts.
PROPOSE GROUPS WITHIN 3-4 TURNS.`;

export async function POST(request: Request) {
  try {
    const { contacts, groupSize = 4, stream = true }: MatcherRequest =
      await request.json();

    if (!contacts || contacts.length < 2) {
      return Response.json(
        { error: "Need at least 2 contacts" },
        { status: 400 }
      );
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return Response.json(
        { error: "ANTHROPIC_API_KEY not configured" },
        { status: 500 }
      );
    }

    // Create request-scoped state instance (avoids global state issues)
    const state = new MatcherState(contacts, groupSize);
    const peoplePerGroup = Math.ceil(contacts.length / groupSize);

    if (stream) {
      return handleStreamingRequest(state, contacts.length, groupSize, peoplePerGroup);
    }

    return handleNonStreamingRequest(state, contacts.length, groupSize, peoplePerGroup);
  } catch (error) {
    console.error("Matcher Agent error:", error);
    return Response.json(
      { error: error instanceof Error ? error.message : "Failed to run agent" },
      { status: 500 }
    );
  }
}

async function handleStreamingRequest(
  state: MatcherState,
  contactCount: number,
  numGroups: number,
  peoplePerGroup: number
) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        try {
          controller.enqueue(
            encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
          );
        } catch (e) {
          // Controller may be closed, ignore
          console.error("Failed to send SSE event:", e);
        }
      };

      // Send keepalive pings to prevent connection timeout
      const keepaliveInterval = setInterval(() => {
        send("ping", { timestamp: Date.now() });
      }, 15000); // Every 15 seconds

      try {
        const anthropic = new Anthropic();

        const initialPrompt = `Create ${numGroups} groups from ${contactCount} attendees (approximately ${peoplePerGroup} people per group).

Start by calling get_all_contacts to see the data, then analyze, create groups, verify, and submit.

Remember: ALWAYS verify your groups before submitting. If verification fails, fix the issues and try again.`;

        send("step", {
          step: `Starting agentic matcher for ${contactCount} contacts...`,
          phase: "starting",
          icon: "0",
        });

        let currentPhase = "starting";
        let finalGroups: Group[] = [];
        let inputTokens = 0;
        let outputTokens = 0;
        const maxTurns = 20;
        let turn = 0;

        // Build conversation history
        const messages: MessageParam[] = [
          { role: "user", content: initialPrompt }
        ];

        // Agentic loop
        while (turn < maxTurns) {
          turn++;

          // Send turn start event with max turns so UI can show progress
          send("turn_start", { turn, maxTurns });

          // Call Claude with retry logic for rate limits
          const response = await withRetry(
            () =>
              anthropic.messages.create({
                model: "claude-sonnet-4-20250514",
                max_tokens: 4096,
                system: SYSTEM_PROMPT,
                tools: MATCHER_TOOLS,
                messages,
              }),
            3,
            5000,
            (attempt, delayMs) => {
              // Notify client about rate limit retry
              send("thinking", { text: `Rate limited, retrying in ${Math.round(delayMs / 1000)}s (attempt ${attempt}/3)...` });
            }
          );

          // Small delay between turns to avoid rate limits
          if (turn > 1) {
            await delay(1000);
          }

          // Track token usage
          inputTokens += response.usage.input_tokens;
          outputTokens += response.usage.output_tokens;
          send("tokens", { input: inputTokens, output: outputTokens, estimated: false });

          // Process response content
          const toolUses: ToolUseBlock[] = [];
          const contentBlocks: ContentBlockParam[] = [];
          let turnThinking = "";

          for (const block of response.content) {
            if (block.type === "text" && block.text) {
              const text = block.text.trim();
              if (text.length > 20 && !text.startsWith("{")) {
                turnThinking = text;
                const preview = text.slice(0, 200);
                send("thinking", { text: preview + (text.length > 200 ? "..." : "") });
              }
              contentBlocks.push({ type: "text", text: block.text });
            } else if (block.type === "tool_use") {
              toolUses.push(block);
              contentBlocks.push({
                type: "tool_use",
                id: block.id,
                name: block.name,
                input: block.input as Record<string, unknown>,
              });
            }
          }

          // Send turn thinking if any
          if (turnThinking) {
            send("turn_thinking", { turn, thinking: turnThinking.slice(0, 500) });
          }

          // Add assistant response to history
          messages.push({ role: "assistant", content: contentBlocks });

          // If no tool calls and stop_reason is end_turn, we're done
          if (toolUses.length === 0 && response.stop_reason === "end_turn") {
            break;
          }

          // Process tool calls
          if (toolUses.length > 0) {
            const toolResults: ToolResultBlockParam[] = [];

            for (const toolUse of toolUses) {
              const toolName = toolUse.name;
              const toolInput = toolUse.input as Record<string, unknown>;

              // Send tool_call event (before execution)
              send("tool_call", {
                turn,
                id: toolUse.id,
                name: toolName,
                input: toolInput,
                status: "running",
              });

              // Update phase based on tool
              if (toolName === "get_all_contacts" && currentPhase !== "exploring") {
                currentPhase = "exploring";
                send("step", { step: "Exploring contact data...", phase: "exploring", icon: "1" });
              } else if (toolName === "search_contacts") {
                if (currentPhase !== "analyzing") {
                  currentPhase = "analyzing";
                  send("step", { step: "Analyzing patterns...", phase: "analyzing", icon: "2" });
                }
              } else if (toolName === "propose_groups") {
                currentPhase = "proposing";
                send("step", { step: "Proposing groups...", phase: "proposing", icon: "3" });
              } else if (toolName === "verify_groups") {
                currentPhase = "verifying";
                send("step", { step: "Verifying groups...", phase: "verifying", icon: "4" });
              } else if (toolName === "submit_final_groups") {
                currentPhase = "submitting";
                send("step", { step: "Submitting final groups...", phase: "submitting", icon: "5" });
              }

              // Execute the tool
              const result = state.handleToolCall(toolName, toolInput);

              // Send tool_result event (after execution)
              send("tool_result", {
                turn,
                id: toolUse.id,
                name: toolName,
                result,
                status: "complete",
              });

              // Send legacy thinking events for specific tools
              if (toolName === "verify_groups") {
                const verification = result as VerificationResult;
                if (verification.valid) {
                  send("thinking", { text: "✓ Verification passed! All contacts placed correctly." });
                  // Auto-submit if verification passes to ensure completion
                  send("thinking", { text: "Auto-submitting verified groups..." });
                  const submitResult = state.submitFinalGroups();
                  if (submitResult.success) {
                    finalGroups = submitResult.groups;
                    submitResult.groups.forEach((group, idx) => {
                      send("group", { group, index: idx });
                    });
                  }
                } else {
                  send("thinking", { text: `⚠ Issues found: ${verification.issues.join("; ")}` });
                }
              }

              if (toolName === "submit_final_groups") {
                const submission = result as { success: boolean; groups: Group[]; issues?: string[] };
                if (submission.success) {
                  finalGroups = submission.groups;
                  // Send each group
                  submission.groups.forEach((group, idx) => {
                    send("group", { group, index: idx });
                  });
                } else if (submission.issues) {
                  send("thinking", { text: `⚠ Submission failed: ${submission.issues.join("; ")}` });
                }
              }

              toolResults.push({
                type: "tool_result",
                tool_use_id: toolUse.id,
                content: JSON.stringify(result),
              });
            }

            // Add tool results to history
            messages.push({ role: "user", content: toolResults });
          }

          // Check if we got final groups
          if (finalGroups.length > 0) {
            break;
          }
        }

        // Send completion
        if (finalGroups.length > 0) {
          send("complete", {
            groups: finalGroups,
            message: `Created ${finalGroups.length} groups for ${contactCount} people`,
            tokens: { input: inputTokens, output: outputTokens },
          });
        } else {
          send("error", { error: "Agent completed but no groups were submitted" });
        }
      } catch (error) {
        console.error("Agentic matcher error:", error);
        send("error", {
          error: error instanceof Error ? error.message : "Unknown error",
        });
      } finally {
        clearInterval(keepaliveInterval);
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no", // Disable nginx buffering
    },
  });
}

async function handleNonStreamingRequest(
  state: MatcherState,
  contactCount: number,
  numGroups: number,
  peoplePerGroup: number
) {
  const anthropic = new Anthropic();

  const initialPrompt = `Create ${numGroups} groups from ${contactCount} attendees (approximately ${peoplePerGroup} people per group).

Start by calling get_all_contacts to see the data, then analyze, create groups, verify, and submit.`;

  let finalGroups: Group[] = [];
  const maxTurns = 20;
  let turn = 0;

  const messages: MessageParam[] = [
    { role: "user", content: initialPrompt }
  ];

  while (turn < maxTurns) {
    turn++;

    const response = await withRetry(() =>
      anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4096,
        system: SYSTEM_PROMPT,
        tools: MATCHER_TOOLS,
        messages,
      })
    );

    const toolUses: ToolUseBlock[] = [];
    const contentBlocks: ContentBlockParam[] = [];

    for (const block of response.content) {
      if (block.type === "text") {
        contentBlocks.push({ type: "text", text: block.text });
      } else if (block.type === "tool_use") {
        toolUses.push(block);
        contentBlocks.push({
          type: "tool_use",
          id: block.id,
          name: block.name,
          input: block.input as Record<string, unknown>,
        });
      }
    }

    messages.push({ role: "assistant", content: contentBlocks });

    if (toolUses.length === 0 && response.stop_reason === "end_turn") {
      break;
    }

    if (toolUses.length > 0) {
      const toolResults: ToolResultBlockParam[] = [];

      for (const toolUse of toolUses) {
        const result = state.handleToolCall(toolUse.name, toolUse.input as Record<string, unknown>);

        if (toolUse.name === "verify_groups") {
          const verification = result as VerificationResult;
          if (verification.valid) {
            // Auto-submit if verification passes
            const submitResult = state.submitFinalGroups();
            if (submitResult.success) {
              finalGroups = submitResult.groups;
            }
          }
        }

        if (toolUse.name === "submit_final_groups") {
          const submission = result as { success: boolean; groups: Group[]; issues?: string[] };
          if (submission.success) {
            finalGroups = submission.groups;
          }
        }

        toolResults.push({
          type: "tool_result",
          tool_use_id: toolUse.id,
          content: JSON.stringify(result),
        });
      }

      messages.push({ role: "user", content: toolResults });
    }

    if (finalGroups.length > 0) {
      break;
    }
  }

  if (finalGroups.length === 0) {
    return Response.json({
      error: "Agent did not produce valid groups",
      groups: [],
    });
  }

  return Response.json({
    groups: finalGroups,
  });
}
