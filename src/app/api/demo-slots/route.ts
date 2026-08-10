import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { and, asc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { demoSlots } from "@/db/schema";

export const SLOT_COUNT = 8;
const MAX_NAME_LENGTH = 40;

function toPublic(row: typeof demoSlots.$inferSelect, userId: string) {
  return {
    slot: row.slot,
    name: row.name,
    mine: row.userId === userId,
  };
}

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = getDb();
  const rows = await db.select().from(demoSlots).orderBy(asc(demoSlots.slot));

  return NextResponse.json({ slots: rows.map((row) => toPublic(row, userId)) });
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const slot = Number(body?.slot);
  const name = typeof body?.name === "string" ? body.name.trim() : "";

  if (!Number.isInteger(slot) || slot < 1 || slot > SLOT_COUNT) {
    return NextResponse.json({ error: "Pick one of the 8 slots" }, { status: 400 });
  }
  if (!name) {
    return NextResponse.json({ error: "Add your name" }, { status: 400 });
  }
  if (name.length > MAX_NAME_LENGTH) {
    return NextResponse.json(
      { error: `Keep your name under ${MAX_NAME_LENGTH} characters` },
      { status: 400 },
    );
  }

  const db = getDb();

  // First come first serve: the primary key on `slot` and the unique index on
  // `user_id` are what actually decide the race, not this pre-check.
  const taken = await db.select().from(demoSlots).where(eq(demoSlots.userId, userId));
  if (taken.length > 0 && taken[0].slot !== slot) {
    return NextResponse.json(
      { error: `You're already in slot ${taken[0].slot} — release it first.` },
      { status: 409 },
    );
  }

  try {
    const [row] = await db
      .insert(demoSlots)
      .values({ slot, name, userId })
      .onConflictDoUpdate({
        target: demoSlots.slot,
        set: { name },
        // Only the owner can rewrite their own slot; anyone else conflicts.
        setWhere: eq(demoSlots.userId, userId),
      })
      .returning();

    if (!row) {
      return NextResponse.json({ error: "That slot was just taken — pick another" }, { status: 409 });
    }

    return NextResponse.json({ slot: toPublic(row, userId) });
  } catch {
    return NextResponse.json({ error: "That slot was just taken — pick another" }, { status: 409 });
  }
}

export async function DELETE(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const slot = Number(body?.slot);
  if (!Number.isInteger(slot)) {
    return NextResponse.json({ error: "Which slot?" }, { status: 400 });
  }

  const db = getDb();
  await db.delete(demoSlots).where(and(eq(demoSlots.slot, slot), eq(demoSlots.userId, userId)));

  return NextResponse.json({ ok: true });
}
