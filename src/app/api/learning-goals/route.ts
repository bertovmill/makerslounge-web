import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { desc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { learningGoals } from "@/db/schema";

const MAX_LENGTH = 280;
const MAX_PER_USER = 5;

// Posts are anonymous: userId is stored for rate limiting and moderation but is
// never included in a response. `mine` lets the client highlight its own posts.
function toPublic(row: typeof learningGoals.$inferSelect, userId: string) {
  return {
    id: row.id,
    text: row.text,
    createdAt: row.createdAt,
    mine: row.userId === userId,
  };
}

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = getDb();
  const rows = await db
    .select()
    .from(learningGoals)
    .orderBy(desc(learningGoals.createdAt))
    .limit(200);

  return NextResponse.json({ goals: rows.map((row) => toPublic(row, userId)) });
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const text = typeof body?.text === "string" ? body.text.trim() : "";

  if (!text) {
    return NextResponse.json({ error: "Say what you're here to learn" }, { status: 400 });
  }
  if (text.length > MAX_LENGTH) {
    return NextResponse.json(
      { error: `Keep it under ${MAX_LENGTH} characters` },
      { status: 400 },
    );
  }

  const db = getDb();
  const existing = await db
    .select({ id: learningGoals.id })
    .from(learningGoals)
    .where(eq(learningGoals.userId, userId));

  if (existing.length >= MAX_PER_USER) {
    return NextResponse.json(
      { error: "You've posted plenty — give someone else a turn!" },
      { status: 429 },
    );
  }

  const [row] = await db.insert(learningGoals).values({ text, userId }).returning();

  return NextResponse.json({ goal: toPublic(row, userId) });
}
