import { NextRequest, NextResponse } from "next/server";
import { generateText } from "ai";
import { auth, currentUser } from "@clerk/nextjs/server";
import { desc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { questions } from "@/db/schema";

const SLIDE_CONTEXT: Record<string, string> = {
  hero: "The welcome slide introducing Makers Lounge, a community of builders, founders, and makers.",
  itinerary: "Tonight's itinerary for the Aug 10 Agent-Building Session: intros, state of AI agents talks, a hands-on agent-building session, demos, and wrap-up.",
  "getting-started": "An intro to Eve, Vercel's filesystem-first framework for durable AI agents, and the prerequisites needed (Node.js 24+, a free Vercel account).",
  "install-cursor": "Instructions to download and open Cursor, the AI code editor used for tonight's workshop, and click 'Open project'.",
  "ask-cursor": "Shows how to ask Cursor's built-in AI chat to install the Eve agent framework directly, as an alternative to using the terminal.",
  "build-ui": "Shows how to ask opencode to build a Next.js + shadcn showcase UI with a chat interface for your Eve agent, using Vercel's AI Elements kit — the agent scaffolds and runs the project itself as part of this.",
  "run-dev-server": "Shows how to start the scaffolded Next.js app locally by running `npm run dev` in the project's terminal and opening http://localhost:3000 to see the agent's chat UI.",
  "setup-pam": "While the agent scaffolds the UI, attendees set up PAM Memory (pam.harmix.ai) — an MCP server that self-onboards into company tools and gives agents persistent organizational context. They grab a pam_mkey_ API key and add the pam_memory MCP server to Claude Code or Cursor.",
  "step-1": "Step 1: connecting an AI model via the Vercel AI Gateway, either by running `vercel link` or using a shared workshop API key.",
  "step-2": "Step 2: Eve's filesystem-first project structure — agent/instructions.md, agent/tools/, agent/skills/, agent/channels/.",
};

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const slideId = req.nextUrl.searchParams.get("slideId");
  if (!slideId) return NextResponse.json({ error: "slideId is required" }, { status: 400 });

  const db = getDb();
  const rows = await db
    .select()
    .from(questions)
    .where(eq(questions.slideId, slideId))
    .orderBy(desc(questions.createdAt))
    .limit(50);

  return NextResponse.json({ questions: rows });
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const slideId = typeof body?.slideId === "string" ? body.slideId : "";
  const question = typeof body?.question === "string" ? body.question.trim() : "";

  if (!slideId || !question) {
    return NextResponse.json({ error: "slideId and question are required" }, { status: 400 });
  }
  if (question.length > 500) {
    return NextResponse.json({ error: "Question is too long" }, { status: 400 });
  }

  const user = await currentUser();
  const askerName =
    user?.firstName ?? user?.username ?? user?.primaryEmailAddress?.emailAddress ?? "Attendee";

  const context = SLIDE_CONTEXT[slideId] ?? "A slide in the Makers Lounge Eve Agent Workshop.";

  let answer: string;
  try {
    const result = await generateText({
      model: "anthropic/claude-haiku-4.5",
      system:
        "You are Eve, the friendly AI assistant for the Makers Lounge Eve Agent Workshop. " +
        "Attendees ask you questions live, right on the slide they're looking at. " +
        "Answer briefly and helpfully — 2-4 sentences max, no markdown headers, plain conversational text. " +
        "If you don't know something specific to this event, say so plainly rather than guessing.",
      prompt: `Current slide context: ${context}\n\nAttendee question: ${question}`,
    });
    answer = result.text.trim();
  } catch {
    answer = "Sorry, I couldn't generate an answer just now — a host can help in the meantime.";
  }

  const db = getDb();
  const [row] = await db
    .insert(questions)
    .values({ slideId, question, answer, askerName, userId })
    .returning();

  return NextResponse.json({ question: row });
}
