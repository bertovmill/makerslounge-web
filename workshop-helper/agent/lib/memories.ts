import { neon } from "@neondatabase/serverless";

/**
 * Long-term memory, shared with the Next.js app's Neon database (the
 * `agent_memories` table in `src/db/schema.ts`). eve's `defineState` is
 * per-session; these notes have to survive across chats, so they live here.
 */
export type Memory = {
  content: string;
  tag: string | null;
  createdAt: string;
};

function sql() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set, so memories cannot be stored.");
  }
  return neon(url);
}

/** Memories are scoped per attendee so one person's notes stay theirs. */
export function callerId(principalId: string | undefined): string {
  return principalId ?? "anonymous";
}

export async function writeMemory(
  userId: string,
  content: string,
  tag?: string
): Promise<void> {
  const db = sql();
  await db`
    insert into agent_memories (user_id, content, tag)
    values (${userId}, ${content}, ${tag ?? null})
  `;
}

export async function readMemories(userId: string, limit = 20): Promise<Memory[]> {
  const db = sql();
  const rows = await db`
    select content, tag, created_at
    from agent_memories
    where user_id = ${userId}
    order by created_at desc
    limit ${limit}
  `;
  return rows.map((row) => ({
    content: row.content as string,
    tag: (row.tag as string | null) ?? null,
    createdAt: new Date(row.created_at as string).toISOString(),
  }));
}
