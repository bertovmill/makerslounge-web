/**
 * Publish "Building durable agents with Eve" to /talks.
 *
 * Matias Gonzalez Fernandez's segment from the Aug 10 2026 agent-building
 * workshop. Follows docs/publishing-a-gated-talk.md: the teaser goes in `talks`
 * (world-readable), the YouTube id and transcript go in `talk_content`, which
 * `fetchTalkContent` only hands to a signed-in viewer.
 *
 * Usage — the YouTube id is required because there is nothing sensible to
 * default it to, and a talk row without a playable video is worse than no row:
 *
 *   npx tsx scripts/create-eve-talk.ts <YOUTUBE_ID>
 *   npx tsx scripts/create-eve-talk.ts <YOUTUBE_ID> --draft   # is_published = false
 *
 * Re-runnable: it deletes any existing talk at this slug first, which cascades
 * to talk_content.
 */

import * as dotenv from "dotenv";
import * as path from "path";
import * as fs from "fs";
import { eq } from "drizzle-orm";

import { getSiteDb } from "../src/db/site";
import { talkContent, talks } from "../src/db/site/schema";

// Only Next.js loads .env.local automatically; a script has to ask.
dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

const SLUG = "building-durable-agents-with-eve";

const videoId = process.argv[2];
const isDraft = process.argv.includes("--draft");

if (!videoId || videoId.startsWith("--")) {
  console.error("Usage: npx tsx scripts/create-eve-talk.ts <YOUTUBE_ID> [--draft]");
  console.error("");
  console.error("Upload the recording to YouTube as *Unlisted* first (not Private —");
  console.error("private videos can't be embedded for other viewers), then pass the id");
  console.error("from youtube.com/watch?v=THIS_PART.");
  process.exit(1);
}

// A YouTube id is 11 chars of [A-Za-z0-9_-]. Catching a pasted full URL here is
// worth it: the wrong value produces a talk page that renders an empty iframe
// rather than an error, so it fails silently and looks like a styling bug.
if (!/^[A-Za-z0-9_-]{11}$/.test(videoId)) {
  console.error(`"${videoId}" doesn't look like a YouTube video id.`);
  console.error("Expected 11 characters of A-Z a-z 0-9 _ - — the bit after ?v= in the URL.");
  process.exit(1);
}

const transcript = fs.readFileSync(
  path.resolve(__dirname, `../content/talks/${SLUG}.transcript.txt`),
  "utf-8",
);

const talk = {
  title: "Building durable agents with Eve",
  slug: SLUG,
  description:
    "Matias Gonzalez Fernandez, a design engineer at Vercel, builds an agent from " +
    "scratch one primitive at a time — gateway, sandbox, scoped credentials, chat, " +
    "checkpointed workflows — to show why Eve reduces all of it to a folder full of " +
    "files. Plus the best idea in the talk: pointing your evals at your own docs.",
  speaker_name: "Matias Gonzalez Fernandez",
  speaker_title: "Design Engineer",
  speaker_company: "Vercel",
  // The circular avatar Zoom composites onto the slide, cropped out of the
  // recording — see scripts/gen-eve-talk-assets.mjs.
  speaker_photo_url: "/talks/matias-gonzalez.jpg",
  // Free and needs no API key. Swap for a branded image if you make one.
  thumbnail_url: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
  duration_seconds: 1061, // 17:41
  recorded_at: "2026-08-10T18:18:00-04:00",
  is_published: !isDraft,
  published_at: isDraft ? null : new Date().toISOString(),
};

async function main() {
  const db = getSiteDb();

  const removed = await db
    .delete(talks)
    .where(eq(talks.slug, SLUG))
    .returning({ id: talks.id });
  if (removed.length > 0) console.log(`   (replaced the existing talk at /talks/${SLUG})`);

  const [created] = await db
    .insert(talks)
    .values({
      title: talk.title,
      slug: talk.slug,
      description: talk.description,
      speakerName: talk.speaker_name,
      speakerTitle: talk.speaker_title,
      speakerCompany: talk.speaker_company,
      speakerPhotoUrl: talk.speaker_photo_url,
      thumbnailUrl: talk.thumbnail_url,
      durationSeconds: talk.duration_seconds,
      recordedAt: talk.recorded_at,
      isPublished: talk.is_published,
      publishedAt: talk.published_at,
    })
    .returning({ id: talks.id });

  await db.insert(talkContent).values({
    talkId: created.id,
    provider: "youtube",
    videoId,
    transcript,
  });

  console.log(`\n✅ ${talk.is_published ? "Published" : "Saved as draft"}: ${talk.title}`);
  console.log(`   Speaker:    ${talk.speaker_name}, ${talk.speaker_title} at ${talk.speaker_company}`);
  console.log(`   Video:      ${videoId} (unlisted YouTube)`);
  console.log(`   Transcript: ${transcript.split(/\s+/).length} words`);
  console.log(`\n   Live at:    https://makerslounge.ca/talks/${SLUG}`);
  console.log(`   Local:      http://localhost:3000/talks/${SLUG}`);
  console.log(`\n   Verify the gate: open it in a private window. You should see the`);
  console.log(`   signup prompt, and no "${videoId}" anywhere in the page source.\n`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });
