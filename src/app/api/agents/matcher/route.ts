import Anthropic from "@anthropic-ai/sdk";
import type { Group, Contact } from "@/types/matcher";
import type { MessageParam, ContentBlockParam, ToolResultBlockParam, ToolUseBlock } from "@anthropic-ai/sdk/resources/messages";

export const maxDuration = 180; // 3 minutes for agentic multi-turn

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

// Store contacts for tool access (request-scoped)
let currentContacts: Contact[] = [];
let currentNumGroups: number = 4;
let proposedGroups: Group[] = [];

// Tool implementations
function getAllContacts(): { contacts: Contact[]; columns: string[]; count: number } {
  const allColumns = new Set<string>();
  currentContacts.forEach((c) => Object.keys(c).forEach((k) => allColumns.add(k)));
  return {
    contacts: currentContacts,
    columns: Array.from(allColumns),
    count: currentContacts.length,
  };
}

function searchContacts(criteria: { field: string; contains: string }): Contact[] {
  return currentContacts.filter((c) => {
    const value = c[criteria.field];
    return value && value.toLowerCase().includes(criteria.contains.toLowerCase());
  });
}

function getContactByName(name: string): Contact | null {
  // Try exact match first
  let contact = currentContacts.find(
    (c) => c.name?.toLowerCase() === name.toLowerCase()
  );
  // Try partial match
  if (!contact) {
    contact = currentContacts.find(
      (c) => c.name?.toLowerCase().includes(name.toLowerCase())
    );
  }
  return contact || null;
}

function proposeGroups(groups: Group[]): { accepted: boolean; message: string } {
  proposedGroups = groups;
  return {
    accepted: true,
    message: `Received ${groups.length} proposed groups. Use verify_groups to check validity.`,
  };
}

function verifyGroups(): VerificationResult {
  const allNames = currentContacts.map((c) => c.name || "").filter(Boolean);
  const placedNames: string[] = [];
  const duplicates: string[] = [];
  const groupSizes: number[] = [];

  for (const group of proposedGroups) {
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
  if (proposedGroups.length !== currentNumGroups) {
    issues.push(
      `Expected ${currentNumGroups} groups but got ${proposedGroups.length}`
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

function submitFinalGroups(): { success: boolean; groups: Group[] } {
  const verification = verifyGroups();
  if (!verification.valid) {
    return {
      success: false,
      groups: [],
    };
  }
  return {
    success: true,
    groups: proposedGroups,
  };
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
                description: "Key connections between members",
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

// Handle tool calls
function handleToolCall(
  toolName: string,
  toolInput: Record<string, unknown>
): unknown {
  switch (toolName) {
    case "get_all_contacts":
      return getAllContacts();
    case "search_contacts":
      return searchContacts(toolInput as { field: string; contains: string });
    case "get_contact_by_name":
      return getContactByName(toolInput.name as string);
    case "propose_groups":
      return proposeGroups((toolInput as unknown as ProposedGroups).groups);
    case "verify_groups":
      return verifyGroups();
    case "submit_final_groups":
      return submitFinalGroups();
    default:
      return { error: `Unknown tool: ${toolName}` };
  }
}

const SYSTEM_PROMPT = `You are an agentic networking matchmaker for MakersLounge, a community of makers and builders.

Your task is to create optimal groups for a networking event using a systematic, verifiable approach.

## Your Tools
- get_all_contacts: Start here to see all attendees and available data columns
- search_contacts: Find people by skills, needs, interests, etc.
- get_contact_by_name: Look up specific person's details
- propose_groups: Submit your proposed grouping
- verify_groups: ALWAYS verify after proposing (checks for errors)
- submit_final_groups: Submit once verified

## Your Process

1. EXPLORE: Call get_all_contacts to understand the data structure and see everyone
2. ANALYZE: Search for patterns - common skills, complementary needs, themes
3. STRATEGIZE: Plan your grouping approach based on synergies found
4. CREATE: Form groups by matching complementary skills/needs
5. PROPOSE: Call propose_groups with your grouping
6. VERIFY: Call verify_groups to check for issues
7. FIX: If issues found, adjust and re-propose
8. SUBMIT: Once valid, call submit_final_groups

## Matching Principles
- Match people who HAVE skills with those who NEED them
- Create diverse groups with complementary perspectives
- Consider project phases and interests for common ground
- Every person must be in exactly one group
- Distribute people evenly across groups

Be thorough. Use the tools to explore the data, verify your work, and iterate if needed.`;

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

    // Set up request-scoped state
    currentContacts = contacts;
    currentNumGroups = groupSize;
    proposedGroups = [];

    const peoplePerGroup = Math.ceil(contacts.length / groupSize);

    if (stream) {
      return handleStreamingRequest(contacts.length, groupSize, peoplePerGroup);
    }

    return handleNonStreamingRequest(contacts.length, groupSize, peoplePerGroup);
  } catch (error) {
    console.error("Matcher Agent error:", error);
    return Response.json(
      { error: error instanceof Error ? error.message : "Failed to run agent" },
      { status: 500 }
    );
  }
}

async function handleStreamingRequest(
  contactCount: number,
  numGroups: number,
  peoplePerGroup: number
) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        controller.enqueue(
          encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
        );
      };

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

          // Send turn start event
          send("turn_start", { turn });

          // Call Claude
          const response = await anthropic.messages.create({
            model: "claude-sonnet-4-20250514",
            max_tokens: 8192,
            system: SYSTEM_PROMPT,
            tools: MATCHER_TOOLS,
            messages,
          });

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
            send("turn_thinking", { turn, thinking: turnThinking.slice(0, 300) });
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
              const result = handleToolCall(toolName, toolInput);

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
                } else {
                  send("thinking", { text: `⚠ Issues found: ${verification.issues.join("; ")}` });
                }
              }

              if (toolName === "submit_final_groups") {
                const submission = result as { success: boolean; groups: Group[] };
                if (submission.success) {
                  finalGroups = submission.groups;
                  // Send each group
                  submission.groups.forEach((group, idx) => {
                    send("group", { group, index: idx });
                  });
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
}

async function handleNonStreamingRequest(
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

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 8192,
      system: SYSTEM_PROMPT,
      tools: MATCHER_TOOLS,
      messages,
    });

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
        const result = handleToolCall(toolUse.name, toolUse.input as Record<string, unknown>);

        if (toolUse.name === "submit_final_groups") {
          const submission = result as { success: boolean; groups: Group[] };
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
