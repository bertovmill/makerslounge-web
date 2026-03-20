import Anthropic from "@anthropic-ai/sdk";

export const maxDuration = 30;

interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
}

const SYSTEM_PROMPT = `You are a friendly onboarding assistant for MakersLounge, a platform that connects makers and builders.

Your goal: have a natural 3-5 exchange conversation to learn enough to fill out the user's profile.

You need to extract:
- First name and last name
- What they're building (projects)
- Their skills
- Who they want to meet (looking_for_skills)
- Social links (LinkedIn, Twitter/X, Instagram, website) — optional

Guidelines:
- Be warm, brief, and conversational
- Ask 1-2 things at a time, not all at once
- If this is the first message (empty conversation), introduce yourself and ask their name + what they're working on
- After 3-5 exchanges, you should have enough info

When you have enough information to fill the profile, include a JSON block at the end of your message in this exact format:
\`\`\`profile
{
  "firstName": "...",
  "lastName": "...",
  "projects": ["..."],
  "skills": ["..."],
  "lookingForSkills": ["..."],
  "linkedin": "",
  "twitter": "",
  "instagram": "",
  "website": ""
}
\`\`\`

Only include the profile JSON when you're confident you have enough info. The skills should be from common categories like: AI/ML, Web Dev, Mobile Dev, Backend, Frontend, DevOps, Data Science, Design, UX/UI, Marketing, Sales, Growth, Product, etc.`;

export async function POST(request: Request) {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      return Response.json({ error: "ANTHROPIC_API_KEY not configured" }, { status: 500 });
    }

    const { messages }: { messages: ConversationMessage[] } = await request.json();

    const anthropic = new Anthropic();

    const anthropicMessages = messages.length === 0
      ? [{ role: "user" as const, content: "Hi! I just signed up." }]
      : messages.map(m => ({ role: m.role as "user" | "assistant", content: m.content }));

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: anthropicMessages,
    });

    const reply = response.content
      .filter(b => b.type === "text")
      .map(b => b.type === "text" ? b.text : "")
      .join("");

    // Check if profile data was extracted
    const profileMatch = reply.match(/```profile\n([\s\S]*?)\n```/);
    let extractedProfile = null;
    let isComplete = false;
    let cleanReply = reply;

    if (profileMatch) {
      try {
        extractedProfile = JSON.parse(profileMatch[1]);
        isComplete = true;
        // Remove the JSON block from the displayed reply
        cleanReply = reply.replace(/```profile\n[\s\S]*?\n```/, "").trim();
      } catch {
        // JSON parse failed, continue conversation
      }
    }

    return Response.json({
      reply: cleanReply,
      extractedProfile,
      isComplete,
    });
  } catch (error) {
    console.error("Voice onboarding error:", error);
    return Response.json(
      { error: error instanceof Error ? error.message : "Failed to process" },
      { status: 500 }
    );
  }
}
