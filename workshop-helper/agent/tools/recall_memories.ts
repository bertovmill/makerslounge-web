import { defineTool } from "eve/tools";
import { z } from "zod";
import { callerId, readMemories } from "../lib/memories";

export default defineTool({
  description:
    "Look up what you already know about this attendee from previous conversations. Call this when they refer to earlier work, or at the start of a chat when their history would change your answer.",
  inputSchema: z.object({
    limit: z
      .number()
      .int()
      .min(1)
      .max(50)
      .default(20)
      .describe("How many of the most recent memories to return."),
  }),
  async execute({ limit }, ctx) {
    const userId = callerId(ctx.session.auth.current?.principalId);
    const memories = await readMemories(userId, limit);
    return { count: memories.length, memories };
  },
});
