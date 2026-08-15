import { generateText, stepCountIs, tool } from "ai";
import { z } from "zod";

export const maxDuration = 300;

interface Participant {
  id: string;
  name: string;
  bio?: string | null;
  skills?: string[] | null;
  currently_building?: string | null;
  company?: string | null;
  role?: string | null;
  notes?: string | null;
  looking_for_help?: string | null;
  custom_fields?: Record<string, string>;
}

interface MatchEntry {
  matched_id: string;
  matched_name: string;
  reason: string;
  conversation_starter: string;
}

interface PersonMatches {
  person_id: string;
  person_name: string;
  matches: MatchEntry[];
}

interface MeetupMatcherRequest {
  meetupName: string;
  participants: Participant[];
  customFieldNames?: string[];
}

const SYSTEM_PROMPT = `You are May, a sharp and warm networking facilitator for MakersLounge — a community of makers, builders, and entrepreneurs in Toronto.

Your mission: For each person at a meetup, find their top 3 most valuable connections within the group.

## Your process (2 steps only)
1. Call survey_group — this returns COMPLETE profiles for all participants. Read them carefully.
2. Call submit_matches with your top 3 matches for every single participant.

That's it. Do not call any other tools. survey_group gives you everything you need.

## Scoring each potential pair
NEED vs OFFER (highest weight)
- Does person A need something person B explicitly offers, or vice versa?
- "looking_for_help" and custom event fields are the strongest signals — a direct need/offer match is near-perfect

COMPLEMENTARY SKILLS
- Engineer meets marketer, designer meets developer, builder meets seller
- Avoid matching people with identical skill sets unless there is another strong reason

SHARED CONTEXT
- Same industry, domain, or problem space
- Similar stage (both early-stage, both exploring AI, etc.)

PRIVATE NOTES
- If notes say "introduce to salespeople" or "needs a technical cofounder" — weight that heavily

## Conversation starters
- Hyper-specific: reference actual project names, skills, or answers they gave
- Warm and natural, not generic
- Action-oriented: "Ask [name] about X", "Tell them about Y"
- One to two sentences max

## Output rules
- Every participant gets exactly 3 matches
- No person matched with themselves
- Prioritize quality — a specific insightful match beats a generic one`;

const personMatchesSchema = z.object({
  person_id: z.string().describe("The participant's ID"),
  person_name: z.string().describe("The participant's name"),
  matches: z
    .array(
      z.object({
        matched_id: z.string().describe("Matched person's ID"),
        matched_name: z.string().describe("Matched person's name"),
        reason: z.string().describe("1-2 sentences: why this is a great match"),
        conversation_starter: z.string().describe("A specific, natural conversation opener"),
      })
    )
    .describe("Top 3 matches for this person"),
});

class MeetupMatcherState {
  private participants: Participant[];

  constructor(participants: Participant[]) {
    this.participants = participants;
  }

  // Returns full profiles — no truncation
  surveyGroup(): { participants: Participant[]; count: number } {
    return { participants: this.participants, count: this.participants.length };
  }

  handleToolCall(toolName: string): unknown {
    if (toolName === "survey_group") return this.surveyGroup();
    return { error: `Unknown tool: ${toolName}` };
  }
}

export async function POST(request: Request) {
  const { meetupName, participants }: MeetupMatcherRequest = await request.json();

  if (!participants || participants.length < 3) {
    return Response.json({ error: "Need at least 3 participants" }, { status: 400 });
  }

  const encoder = new TextEncoder();
  const state = new MeetupMatcherState(participants);

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        try {
          controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
        } catch { /* closed */ }
      };

      const keepalive = setInterval(() => send("ping", { ts: Date.now() }), 15000);

      try {
        send("step", { message: "Starting analysis..." });

        let finalMatches: PersonMatches[] | null = null;

        await generateText({
          model: "anthropic/claude-sonnet-4",
          maxOutputTokens: 32000,
          system: SYSTEM_PROMPT,
          prompt: `Meetup: "${meetupName}" — ${participants.length} participants.

Call survey_group to read all profiles, then call submit_matches with top 3 matches per person.

Prioritise need vs offer signals from "looking_for_help" and any custom event fields. Reference specific details in conversation starters.`,
          stopWhen: stepCountIs(5),
          tools: {
            survey_group: tool({
              description:
                "Get complete profiles for all participants. Call this first — it returns everything you need to generate matches.",
              inputSchema: z.object({}),
              execute: async () => {
                send("step", { message: `Reading all ${participants.length} profiles...` });
                return state.handleToolCall("survey_group");
              },
            }),
            submit_matches: tool({
              description:
                "Submit the final top-3 matches for ALL participants. Must include every participant with exactly 3 matches each.",
              inputSchema: z.object({
                matches: z
                  .array(personMatchesSchema)
                  .describe("Array of match results — one entry per participant"),
              }),
              execute: async ({ matches }) => {
                send("step", { message: `Finalising matches for ${participants.length} people...` });
                finalMatches = matches;
                return { success: true };
              },
            }),
          },
        });

        if (finalMatches) {
          send("complete", { matches: finalMatches, meetupName });
        } else {
          send("error", { error: "Agent did not produce matches" });
        }
      } catch (error) {
        send("error", { error: error instanceof Error ? error.message : "Unknown error" });
      } finally {
        clearInterval(keepalive);
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
