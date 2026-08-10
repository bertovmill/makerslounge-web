import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const questions = pgTable("questions", {
  id: uuid("id").primaryKey().defaultRandom(),
  slideId: text("slide_id").notNull(),
  question: text("question").notNull(),
  answer: text("answer"),
  askerName: text("asker_name").notNull(),
  userId: text("user_id").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
