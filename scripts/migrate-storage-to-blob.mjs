#!/usr/bin/env node
/**
 * Copy Supabase Storage into Vercel Blob, then rewrite the URLs held in Neon.
 *
 * Three public buckets, 20 objects, ~43 MB: media, podcasts, broadcast-media.
 *
 * The fourth bucket, `hackathon-submissions`, is NOT copied here. It was private, and
 * Vercel Blob's access level is a property of the *store* rather than of individual
 * blobs — so serving those files privately would need a second Blob store, which
 * cannot be connected alongside the first without an environment-variable prefix the
 * CLI does not expose. The 2026 hackathon is over, so those 45 files are archived
 * outside the app instead: see scripts/archive-hackathon-submissions.mjs.
 *
 * Blob keys keep the bucket as a prefix (`media/profiles/<id>/avatar.jpg`) so the
 * four namespaces cannot collide and an object's origin stays legible.
 *
 * `addRandomSuffix: false` matters: the database stores these URLs, and letting Blob
 * append a random suffix would mean the key it wrote is not the key we can predict,
 * so re-running would duplicate every file instead of overwriting it. With
 * `allowOverwrite` the script is idempotent.
 *
 * Usage:
 *   node scripts/migrate-storage-to-blob.mjs           # dry run: report only
 *   node scripts/migrate-storage-to-blob.mjs --commit  # copy files and rewrite URLs
 */
import { readFileSync } from "node:fs";
import { put } from "@vercel/blob";
import { neon } from "@neondatabase/serverless";

const COMMIT = process.argv.includes("--commit");

const PUBLIC_BUCKETS = new Set(["media", "podcasts", "broadcast-media"]);

function env(name) {
  const line = readFileSync(".env.local", "utf8")
    .split("\n")
    .find((l) => l.startsWith(`${name}=`));
  if (!line) throw new Error(`${name} missing from .env.local`);
  // Values are written quoted in this repo; strip them.
  return line.slice(name.length + 1).replace(/^"|"$/g, "");
}

const SUPABASE_URL = env("NEXT_PUBLIC_SUPABASE_URL");
const SERVICE_KEY = env("SUPABASE_SERVICE_ROLE_KEY");
const BLOB_TOKEN = env("BLOB_READ_WRITE_TOKEN");
const sql = neon(env("DATABASE_URL"));

/** Read an object out of Supabase Storage. Works for private buckets too. */
async function download(bucket, name) {
  const url = `${SUPABASE_URL}/storage/v1/object/${bucket}/${encodeURI(name)}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${SERVICE_KEY}`, apikey: SERVICE_KEY },
  });
  if (!res.ok) throw new Error(`download ${bucket}/${name} → ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

async function main() {
  const objects = readFileSync(
    process.env.OBJECT_LIST ?? "/Users/bertomill/.claude/jobs/30dff6a4/tmp/objects.txt",
    "utf8",
  )
    .trim()
    .split("\n")
    .filter(Boolean)
    .map((l) => {
      const [bucket, name, size, mime] = l.split("|");
      return { bucket, name, size: Number(size), mime };
    })
    // Public buckets only — see the note at the top about hackathon-submissions.
    .filter((o) => PUBLIC_BUCKETS.has(o.bucket));

  console.log(
    `${objects.length} objects, ${(objects.reduce((a, o) => a + o.size, 0) / 1e6).toFixed(1)} MB`,
  );
  if (!COMMIT) console.log("DRY RUN — pass --commit to copy\n");

  /** oldPublicUrl | bucketPath → new blob url */
  const mapping = new Map();
  let copied = 0;
  const failures = [];

  for (const o of objects) {
    const key = `${o.bucket}/${o.name}`;
    const access = "public";
    const oldPublicUrl = `${SUPABASE_URL}/storage/v1/object/public/${o.bucket}/${o.name}`;

    if (!COMMIT) {
      console.log(`  ${access.padEnd(7)} ${key} (${(o.size / 1e6).toFixed(2)} MB)`);
      continue;
    }

    try {
      const body = await download(o.bucket, o.name);
      const blob = await put(key, body, {
        access,
        token: BLOB_TOKEN,
        contentType: o.mime,
        // See the note at the top: predictable keys are what make this idempotent.
        addRandomSuffix: false,
        allowOverwrite: true,
      });
      mapping.set(oldPublicUrl, blob.url);
      mapping.set(key, blob.url);
      copied += 1;
      console.log(`  ✓ ${access.padEnd(7)} ${key}`);
    } catch (err) {
      failures.push({ key, error: String(err) });
      console.error(`  ✗ ${key}: ${err}`);
    }
  }

  if (!COMMIT) return;

  console.log(`\ncopied ${copied}/${objects.length}`);
  if (failures.length) {
    console.error(`\n${failures.length} FAILED — not rewriting URLs while any object is missing`);
    process.exit(1);
  }

  // ---- rewrite the URLs stored in Neon --------------------------------------
  // Only these four columns hold storage URLs; found by scanning every text and
  // text[] column in the schema for '%supabase.co/storage%'.
  // `hackathon_submissions.file_urls` deliberately is NOT here: it stores object
  // *paths*, not URLs, and those paths are still the Blob keys.
  console.log("\nrewriting stored URLs");
  let rewrites = 0;

  for (const [oldUrl, newUrl] of mapping) {
    if (!oldUrl.startsWith("http")) continue;

    // RETURNING, because the Neon driver resolves a bare UPDATE to `[]` — counting
    // its length reported zero rewrites even when every row had been updated.
    const updated = await Promise.all([
      sql`update makerslounge.profiles set photo_url = ${newUrl}
           where photo_url = ${oldUrl} returning id`,
      sql`update makerslounge.feedback set screenshot_url = ${newUrl}
           where screenshot_url = ${oldUrl} returning id`,
      sql`update makerslounge.podcasts set audio_url = ${newUrl}
           where audio_url = ${oldUrl} returning id`,
      // Array column: replace the element in place, preserving order.
      sql`update makerslounge.projects
             set media_urls = array_replace(media_urls, ${oldUrl}, ${newUrl})
           where ${oldUrl} = any(media_urls) returning id`,
    ]);

    rewrites += updated.reduce((n, rows) => n + rows.length, 0);
  }

  const [{ remaining }] = await sql`
    select (
      (select count(*) from makerslounge.profiles where photo_url like '%supabase.co/storage%') +
      (select count(*) from makerslounge.feedback where screenshot_url like '%supabase.co/storage%') +
      (select count(*) from makerslounge.podcasts where audio_url like '%supabase.co/storage%') +
      (select count(*) from makerslounge.projects
         where array_to_string(media_urls, ',') like '%supabase.co/storage%')
    )::int as remaining`;

  console.log(`rewrote ${rewrites} rows; ${remaining} Supabase URLs remain`);
  if (remaining > 0) {
    console.error("Some URLs still point at Supabase — investigate before teardown.");
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
