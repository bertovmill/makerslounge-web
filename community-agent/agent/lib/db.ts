import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
// `site-schema.ts` is a generated copy of the app's `src/db/site/schema.ts`,
// refreshed by `scripts/sync-agent-schema.mjs` on every predev/prebuild. The
// import cannot simply reach across into the app: eve's dev bundler refuses
// specifiers that escape the agent root, so a relative `../../../src/...` import
// builds but breaks `eve dev`. Never edit the copy — edit the source.
import * as schema from "./site-schema";

export * from "./site-schema";

function createDb() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set, so the community agent cannot read profiles.");
  }
  return drizzle(neon(url), { schema });
}

let cached: ReturnType<typeof createDb> | null = null;

/** Same Neon database and same `makerslounge` schema the site's API routes use. */
export function getDb() {
  if (!cached) cached = createDb();
  return cached;
}
