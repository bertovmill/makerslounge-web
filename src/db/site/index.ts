import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";
import * as relations from "./relations";

// Drizzle client for the site's own tables, which live in the `makerslounge`
// Postgres schema. Deliberately separate from `src/db/index.ts` — that one is
// bound to the Eve workshop's tables in `public`, and keeping the two clients
// apart means a stray import can't quietly join across the boundary.
//
// Same Neon project and the same DATABASE_URL: the split is by Postgres schema,
// not by database.

function createSiteDb() {
  const sql = neon(process.env.DATABASE_URL!);
  // Relations are passed alongside the tables so `db.query.*.findMany({ with })`
  // works; without them Drizzle's relational API has nothing to join on.
  return drizzle(sql, { schema: { ...schema, ...relations } });
}

let _siteDb: ReturnType<typeof createSiteDb> | null = null;

export function getSiteDb() {
  if (!_siteDb) _siteDb = createSiteDb();
  return _siteDb;
}
