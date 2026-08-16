import { defineConfig } from "drizzle-kit";

// Separate from `drizzle.config.ts` on purpose. That one owns the Eve
// workshop's tables in `public`; this one owns the site's tables in the
// `makerslounge` schema. `schemaFilter` is what keeps them from clobbering each
// other — without it, running either config would see the other's tables as
// "not in my schema file" and generate DROP statements for them.

export default defineConfig({
  schema: "./src/db/site/schema.ts",
  out: "./drizzle/site",
  dialect: "postgresql",
  schemaFilter: ["makerslounge"],
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
