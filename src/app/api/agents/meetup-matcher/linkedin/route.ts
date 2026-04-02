import Anthropic from "@anthropic-ai/sdk";

export const maxDuration = 60;

interface MatchEntry {
  matched_id: string;
  matched_name: string;
  reason: string;
  conversation_starter: string;
}

interface LinkedInRequest {
  meetupName: string;
  personName: string;
  matches: MatchEntry[];
}

export async function POST(request: Request) {
  const { meetupName, personName, matches }: LinkedInRequest = await request.json();

  if (!personName || !matches?.length) {
    return Response.json({ error: "Missing required fields" }, { status: 400 });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json({ error: "ANTHROPIC_API_KEY not configured" }, { status: 500 });
  }

  const anthropic = new Anthropic();

  const matchSummary = matches
    .map((m, i) => `${i + 1}. ${m.matched_name} — ${m.reason}`)
    .join("\n");

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 512,
    system: `You write short, warm, personal LinkedIn messages on behalf of Berto, the organizer of MakersLounge — a community of makers, builders, and entrepreneurs in Toronto.

Rules:
- Address the recipient by first name only
- Mention 1-2 specific people they should connect with and why (from the matches list)
- Reference the meetup by name
- Offer to make the intro in person at the event or over DM
- Friendly but not overly casual. Genuine, not salesy
- No emdashes (use commas or periods instead)
- No hashtags
- 3-5 sentences max
- Sign off as Berto`,
    messages: [
      {
        role: "user",
        content: `Write a LinkedIn message to ${personName} about their top connections at "${meetupName}".

Their top matches:
${matchSummary}

Pick the 1-2 most compelling matches and mention them specifically. Make it feel personal and genuine.`,
      },
    ],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "";
  return Response.json({ message: text });
}
