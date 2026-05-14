// One-off generator: restyles the MakersLounge "M" mark in the same
// glass 3D blue style as public/hackathons/mulerun/judging/*.png using
// fal.ai flux/dev image-to-image. Saves to public/logos/logo-glass-blue.png.
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { config as loadEnv } from "dotenv";
import { fal } from "@fal-ai/client";
import sharp from "sharp";

loadEnv({ path: ".env.local" });

const FAL_KEY = process.env.FAL_KEY || process.env.FAL_API_KEY;
if (!FAL_KEY) {
  console.error("FAL_KEY missing in .env.local");
  process.exit(1);
}

fal.config({ credentials: FAL_KEY });

const SOURCE = path.resolve("public/logos/logo.png");
const OUT_DIR = path.resolve("public/logos");
const OUT_FILE = path.join(OUT_DIR, "logo-glass-blue.png");

const PROMPT = [
  "abstract 3D glass sculpture of three flowing rounded vertical strokes forming an upward-leaning M-shaped mark",
  "glossy translucent frosted glass material with subtle internal refractions and bright highlights",
  "vibrant blue color palette, electric cyan and deep azure (#6AC4F7 to #1A7DE8)",
  "soft volumetric studio lighting with rim light catching the edges of each stroke",
  "clean light gradient background, very subtle white to pale blue",
  "premium product render, octane render, hyper detailed, centered floating composition",
].join(", ");

console.log("Compositing logo onto white 1024x1024 canvas...");
const composited = await sharp(SOURCE)
  .resize(720, 720, { fit: "inside", withoutEnlargement: false })
  .extend({
    top: 152,
    bottom: 152,
    left: 152,
    right: 152,
    background: { r: 255, g: 255, b: 255, alpha: 1 },
  })
  .flatten({ background: { r: 255, g: 255, b: 255 } })
  .png()
  .toBuffer();

console.log("Uploading source logo to fal storage...");
const blob = new Blob([composited], { type: "image/png" });
const imageUrl = await fal.storage.upload(blob);
console.log("Uploaded:", imageUrl);

console.log("\nSubmitting canny ControlNet request...");
const result = await fal.subscribe("fal-ai/flux-control-lora-canny", {
  input: {
    control_lora_image_url: imageUrl,
    control_lora_strength: 0.85,
    prompt: PROMPT,
    num_inference_steps: 40,
    guidance_scale: 4.5,
    num_images: 1,
    image_size: { width: 1024, height: 1024 },
    enable_safety_checker: true,
  },
  logs: true,
  onQueueUpdate: (update) => {
    if (update.status === "IN_PROGRESS" && update.logs) {
      for (const l of update.logs) process.stdout.write(`  ${l.message}\n`);
    } else {
      process.stdout.write(`  status: ${update.status}\r`);
    }
  },
});

const images = result?.data?.images || result?.images;
if (!images?.length) {
  console.error("No images returned:", JSON.stringify(result).slice(0, 500));
  process.exit(1);
}
const outUrl = images[0].url;
console.log(`\nDownloading ${outUrl}`);
const dl = await fetch(outUrl);
const outBuf = Buffer.from(await dl.arrayBuffer());
await mkdir(OUT_DIR, { recursive: true });
await writeFile(OUT_FILE, outBuf);
console.log(`Saved -> ${OUT_FILE}`);
