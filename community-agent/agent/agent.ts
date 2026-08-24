import { defineAgent } from "eve";

export default defineAgent({
  // Sonnet 5, up from the `anthropic/claude-sonnet-4` the old route pinned.
  model: "anthropic/claude-sonnet-5",
});
