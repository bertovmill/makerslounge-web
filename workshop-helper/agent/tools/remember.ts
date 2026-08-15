import { defineTool } from "eve/tools";
import { z } from "zod";
import { callerId, writeMemory } from "../lib/memories";

export default defineTool({
  description:
    "Save a durable note about this attendee — what they're building, a preference, or a problem they hit — so it's still known in a future conversation. Use it when they tell you something worth remembering, not for every message.",
  inputSchema: z.object({
    content: z
      .string()
      .min(1)
      .max(500)
      .describe("The fact to remember, written as a short standalone sentence."),
    tag: z
      .string()
      .max(40)
      .optional()
      .describe("Optional grouping label, e.g. 'project', 'blocker', 'preference'."),
  }),
  async execute({ content, tag }, ctx) {
    const userId = callerId(ctx.session.auth.current?.principalId);
    await writeMemory(userId, content, tag);
    return { saved: true, content, tag: tag ?? null };
  },
});
