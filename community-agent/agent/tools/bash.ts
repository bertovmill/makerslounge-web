import { disableTool } from "eve/tools";

// This agent reads Postgres and the public web; it has no reason to touch a
// filesystem or a shell. Disabled rather than left on and unused, so the
// capability is absent from the model's tool list entirely.
export default disableTool();
