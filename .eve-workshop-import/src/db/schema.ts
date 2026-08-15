import { integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

// "What are you here to learn?" wall. Posts are shown anonymously — userId is
// stored only for rate limiting and moderation, never returned to the client.
export const learningGoals = pgTable("learning_goals", {
  id: uuid("id").primaryKey().defaultRandom(),
  text: text("text").notNull(),
  userId: text("user_id").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// Demo-time signup board: 8 fixed slots, first come first serve. One slot per
// person — `userId` is what stops someone grabbing the whole board.
export const demoSlots = pgTable("demo_slots", {
  slot: integer("slot").primaryKey(),
  name: text("name").notNull(),
  userId: text("user_id").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// Long-term memory for the workshop helper agent. Written by its `remember`
// tool and read back by `recall_memories`, scoped per attendee so one person's
// notes never surface in someone else's chat. Outlives the eve session, which
// is why this lives here rather than in eve's per-session `defineState`.
export const agentMemories = pgTable("agent_memories", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull(),
  content: text("content").notNull(),
  tag: text("tag"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const questions = pgTable("questions", {
  id: uuid("id").primaryKey().defaultRandom(),
  slideId: text("slide_id").notNull(),
  question: text("question").notNull(),
  answer: text("answer"),
  askerName: text("asker_name").notNull(),
  userId: text("user_id").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
