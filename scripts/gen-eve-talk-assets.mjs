/**
 * Regenerate the speaker headshot for the Eve talk from the source recording.
 *
 * Zoom composites the presenter's camera into a tile on the right of the frame
 * with a name label burned into the bottom of it, so the crop is deliberately
 * shorter than the tile — 235px of a 271px-tall tile — to cut the label off.
 * Change the numbers and you will get "nzalez Fernandez" across the chin.
 *
 * The recording is not in the repo (207 MB), so this only runs if you still have
 * it. Pass a path if it lives somewhere other than the default.
 *
 *   node scripts/gen-eve-talk-assets.mjs [path/to/agent-building-workshop.mp4]
 */

import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { homedir } from "node:os";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "..");

const source =
  process.argv[2] ?? resolve(homedir(), "Downloads/agent-building-workshop.mp4");

if (!existsSync(source)) {
  console.error(`Source recording not found: ${source}`);
  console.error("Pass the path as an argument, or re-download the Aug 10 workshop recording.");
  process.exit(1);
}

const outDir = resolve(repoRoot, "public/talks");
mkdirSync(outDir, { recursive: true });

const out = resolve(outDir, "matias-gonzalez.jpg");

// t=480s: looking at camera, mouth closed, hands out of frame.
execFileSync(
  "ffmpeg",
  [
    "-y", "-v", "error",
    "-ss", "480",
    "-i", source,
    "-frames:v", "1",
    "-vf", "crop=235:235:1558:405,scale=400:400:flags=lanczos",
    "-q:v", "3",
    out,
  ],
  { stdio: "inherit" },
);

console.log(`✅ ${out}`);
