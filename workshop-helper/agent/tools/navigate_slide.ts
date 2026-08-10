import { defineTool } from "eve/tools";
import { z } from "zod";

/**
 * The deck's slide anchors, in presentation order. Kept in sync by hand with
 * the `[data-slide]` sections in `src/app/page.tsx`.
 *
 * This tool runs in the app runtime and has no DOM access, so it does not
 * scroll anything itself — it validates and returns a target, and the browser
 * widget scrolls when it sees the tool result.
 */
const SLIDES = [
  { id: "hero", label: "Welcome" },
  { id: "join-slack", label: "Join Slack" },
  { id: "itinerary", label: "Tonight's itinerary" },
  { id: "objectives", label: "Objectives" },
  { id: "thank-you-host", label: "Thank you, TMU Byte" },
  { id: "presenters", label: "Presenters" },
  { id: "attendees", label: "Who's in the room" },
  { id: "install-cursor", label: "Step 0 — Install Cursor" },
  { id: "ask-cursor", label: "Pick your AI agent" },
  { id: "build-ui", label: "Build a UI for it" },
  { id: "run-dev-server", label: "Run the dev server" },
  { id: "open-localhost", label: "Open localhost" },
  { id: "debug-copy-paste-error", label: "Debug by pasting the error" },
  { id: "add-api-key-env-local", label: "Add the API key to .env.local" },
  { id: "setup-pam", label: "Set up PAM" },
  { id: "step-1", label: "Step 1 — Scaffold & run" },
  { id: "poke-around-the-repo", label: "Step 2 — Poke around the repo" },
  { id: "demo-time", label: "Demo time" },
  { id: "stay-in-touch", label: "Stay in touch" },
] as const;

const SLIDE_IDS = SLIDES.map((slide) => slide.id);

export default defineTool({
  description: `Scroll the attendee's screen to a slide in the workshop deck. Use it when they ask to go to, go back to, or be shown a step. Valid slides: ${SLIDE_IDS.join(", ")}.`,
  inputSchema: z.object({
    slideId: z
      .enum(SLIDE_IDS as unknown as [string, ...string[]])
      .describe("The slide anchor to scroll to."),
  }),
  async execute({ slideId }) {
    const slide = SLIDES.find((entry) => entry.id === slideId);
    return {
      slideId,
      label: slide?.label ?? slideId,
      navigated: true,
    };
  },
});
