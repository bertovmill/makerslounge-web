import { webSearch } from "eve/tools";

/**
 * Real web search, replacing the `web_search_person` tool from the old route —
 * which never searched anything. It took URLs the *model guessed*, fetched them
 * raw, stripped the tags and kept the first 2000 characters, so LinkedIn and X
 * (which block unauthenticated bots) reliably came back as "Could not access".
 *
 * eve resolves this through the model provider, so there is no extra vendor key
 * to hold: AI Gateway models default to Parallel, and this picks Exa, which
 * indexes personal sites, GitHub and writing far better for "who is this builder"
 * questions. Pair it with the built-in `web_fetch` to read a promising result in
 * full.
 */
export default webSearch({ provider: "exa" });
