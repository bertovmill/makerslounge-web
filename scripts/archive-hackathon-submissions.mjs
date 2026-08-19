#!/usr/bin/env node
/**
 * Download the private `hackathon-submissions` bucket to a local archive.
 *
 * These 45 files (151 MB) are entrants' submissions for the May 2026 hackathon:
 * videos, decks and PDFs that judges reviewed through short-lived signed URLs. They
 * were the only private bucket, and Vercel Blob's access level is a property of the
 * *store*, not of individual blobs — so keeping them private would mean a second
 * Blob store, which cannot be connected alongside the first without an environment
 * variable prefix the CLI does not expose.
 *
 * The event is over, so the decision was to archive them outside the app rather
 * than stand up a second store to serve files nothing reads any more.
 *
 * Writes to ~/makerslounge-archives/ — deliberately outside the repository, both
 * because 151 MB has no business in git and because this is other people's
 * unpublished work.
 *
 * Verifies every file's size against the size Supabase recorded, and exits non-zero
 * if any file is missing or truncated. Do not empty the Supabase bucket until this
 * exits 0.
 *
 * Usage: node scripts/archive-hackathon-submissions.mjs
 */
import { readFileSync, mkdirSync, writeFileSync, statSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { homedir } from "node:os";

const BUCKET = "hackathon-submissions";
const DEST = join(homedir(), "makerslounge-archives", "hackathon-submissions-2026");

function env(name) {
  const line = readFileSync(".env.local", "utf8")
    .split("\n")
    .find((l) => l.startsWith(`${name}=`));
  if (!line) throw new Error(`${name} missing from .env.local`);
  return line.slice(name.length + 1).replace(/^"|"$/g, "");
}

const SUPABASE_URL = env("NEXT_PUBLIC_SUPABASE_URL");
const SERVICE_KEY = env("SUPABASE_SERVICE_ROLE_KEY");

const objects = readFileSync(
  process.env.OBJECT_LIST ?? "/Users/bertomill/.claude/jobs/30dff6a4/tmp/objects.txt",
  "utf8",
)
  .trim()
  .split("\n")
  .map((l) => {
    const [bucket, name, size, mime] = l.split("|");
    return { bucket, name, size: Number(size), mime };
  })
  .filter((o) => o.bucket === BUCKET);

console.log(
  `${objects.length} objects, ${(objects.reduce((a, o) => a + o.size, 0) / 1e6).toFixed(1)} MB → ${DEST}`,
);

const failures = [];
let ok = 0;

for (const o of objects) {
  const target = join(DEST, o.name);

  // Resumable: a file already present at the right size is left alone, so a partial
  // run can simply be repeated.
  if (existsSync(target) && statSync(target).size === o.size) {
    ok += 1;
    continue;
  }

  try {
    const res = await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}/${encodeURI(o.name)}`, {
      headers: { Authorization: `Bearer ${SERVICE_KEY}`, apikey: SERVICE_KEY },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const body = Buffer.from(await res.arrayBuffer());
    if (o.size > 0 && body.byteLength !== o.size) {
      throw new Error(`size mismatch: got ${body.byteLength}, expected ${o.size}`);
    }

    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, body);
    ok += 1;
    console.log(`  ✓ ${o.name} (${(body.byteLength / 1e6).toFixed(2)} MB)`);
  } catch (err) {
    failures.push({ name: o.name, error: String(err) });
    console.error(`  ✗ ${o.name}: ${err}`);
  }
}

// A manifest so the archive is legible without the database.
writeFileSync(
  join(DEST, "MANIFEST.json"),
  JSON.stringify(
    {
      bucket: BUCKET,
      archivedFrom: SUPABASE_URL,
      note: "Submissions for the 2026 Innovation Hackathon. Paths match hackathon_submissions.file_urls in the database.",
      objects: objects.map(({ name, size, mime }) => ({ name, size, mime })),
    },
    null,
    2,
  ),
);

console.log(`\narchived ${ok}/${objects.length}`);
if (failures.length) {
  console.error(`${failures.length} FAILED — do not empty the Supabase bucket`);
  process.exit(1);
}
console.log("all files verified against their recorded sizes");
