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

export const questions = pgTable("questions", {
  id: uuid("id").primaryKey().defaultRandom(),
  slideId: text("slide_id").notNull(),
  question: text("question").notNull(),
  answer: text("answer"),
  askerName: text("asker_name").notNull(),
  userId: text("user_id").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
