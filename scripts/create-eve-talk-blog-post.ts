/**
 * Publish the write-up of Matias Gonzalez Fernandez's Eve talk to /blog.
 *
 * The article links to /talks/building-durable-agents-with-eve, so publish the
 * talk first (scripts/create-eve-talk.ts) or that link 404s.
 *
 *   npx tsx scripts/create-eve-talk-blog-post.ts            # publish
 *   npx tsx scripts/create-eve-talk-blog-post.ts --draft    # save as draft
 */

import * as dotenv from "dotenv";
import * as path from "path";
import * as fs from "fs";

import { upsertPostBySlug } from "./lib/blog-post-db";

// Only Next.js loads .env.local automatically; a script has to ask.
dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

const SLUG = "building-durable-agents-with-eve";
const isDraft = process.argv.includes("--draft");

const content = fs.readFileSync(
  path.resolve(__dirname, `../content/blog/${SLUG}.md`),
  "utf-8",
);

const post = {
  slug: SLUG,
  title: "An agent is just a folder: Matias Gonzalez on building durable agents with Eve",
  excerpt:
    "A design engineer from Vercel built an agent from scratch in front of us — gateway, " +
    "sandbox, scoped credentials, chat, checkpointed workflows — to show why Eve collapses " +
    "all of it into a folder full of files. Plus the idea worth stealing: run your evals " +
    "against your own documentation.",
  content,
  coverImage: null,
  tags: ["AI", "AI Agents", "Vercel", "Eve", "Developer Tools", "Workshops"],
  readTimeMinutes: 8,
  isPublished: !isDraft,
  isFeatured: false,
  publishedAt: isDraft ? null : new Date().toISOString(),
  authorId: "4bf42cee-a293-4cb8-a979-d80e0f81644e", // Berto Mill
};

async function main() {
  await upsertPostBySlug(post);

  console.log(`\n✅ ${post.isPublished ? "Published" : "Saved as draft"}: ${post.title}`);
  console.log(`   Tags:      ${post.tags.join(", ")}`);
  console.log(`   Read time: ${post.readTimeMinutes} min`);
  console.log(`\n   Live at:   https://makerslounge.ca/blog/${SLUG}`);
  console.log(`   Local:     http://localhost:3000/blog/${SLUG}`);
  console.log(`   Edit at:   http://localhost:3000/admin/blog\n`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });
