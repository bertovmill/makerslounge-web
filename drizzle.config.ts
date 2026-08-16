import { defineConfig } from "drizzle-kit";

// The Eve workshop's tables, in `public`. The site's own tables live in the
// `makerslounge` schema and are owned by `drizzle.site.config.ts`.
// `schemaFilter` is drizzle-kit's default, but it is spelled out here so the
// boundary between the two configs is visible rather than implied.

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  schemaFilter: ["public"],
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
