import { defineTool } from "eve/tools";
import { z } from "zod";

const STEPS = {
  "step-0": {
    title: "Install Cursor",
    instructions:
      "Download Cursor from cursor.com/download, open it, then click 'Open project'.",
    checkpoint:
      "Cursor is installed, open, and its built-in terminal is ready (Ctrl+`).",
  },
  "step-1": {
    title: "Scaffold & run your agent",
    instructions:
      "In Cursor's terminal (Ctrl+`), run: `npx eve@latest init my-agent`, then `cd my-agent && npm run dev`.",
    checkpoint: "A terminal UI opens and your agent is running locally.",
  },
  "step-2": {
    title: "Connect a model",
    instructions:
      "Eve talks to models through the Vercel AI Gateway. From inside the agent folder, run `vercel link` then `npm run dev`. No Vercel account tonight? Paste the shared workshop key into `.env.local` as `AI_GATEWAY_API_KEY=...` instead.",
    checkpoint: "Send your agent a message and get a real response back.",
  },
  "step-3": {
    title: "Know your way around",
    instructions:
      "Eve is filesystem-first: agent/instructions.md is the always-on system prompt, agent/tools/ holds typed functions the model can call, agent/skills/ holds on-demand procedures, agent/channels/ holds HTTP & messaging entry points.",
    checkpoint:
      "Open agent/instructions.md, change the personality, and watch your agent become someone new.",
  },
} as const;

export default defineTool({
  description:
    "Look up the exact instructions and checkpoint for a step of the 'Getting Started with Eve' workshop.",
  inputSchema: z.object({
    step: z
      .enum(["step-0", "step-1", "step-2", "step-3"])
      .describe(
        "Which workshop step: step-0 (Install Cursor), step-1 (Scaffold & run), step-2 (Connect a model), step-3 (Project structure)."
      ),
  }),
  async execute({ step }) {
    return STEPS[step];
  },
});
