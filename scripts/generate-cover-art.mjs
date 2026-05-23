import pkg from "@fal-ai/client";
const { fal } = pkg;
import fs from "fs";
import path from "path";
import https from "https";
import http from "http";

fal.config({ credentials: process.env.FAL_KEY });

const OUTPUT_DIR = path.join(process.cwd(), "public/hackathons/innovation-hackathon");

const PROMPT =
  "Editorial scientific poster art. Very light cool grey-white background, almost white, soft subtle vignette. A single deep navy blue form — a sphere whose surface transitions into sharp geometric diamond facets along its upper half, as if crystallizing — floats in the center of the frame. A warm amber glow radiates from the point where the smooth sphere becomes geometric crystal. Two smaller deep navy blue spheres of varying sizes float nearby, overlapping gently in the lower right, each with a faint amber highlight. All forms have smooth photorealistic gradient rendering, matte-satin finish, no particles, no sparkle, no reflective floor, no dark background. Soft ground shadows beneath each form. Minimal, clean, editorial. Inspired by scientific visualization and editorial design. Sophisticated, 16:9.";

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    const client = url.startsWith("https") ? https : http;
    client.get(url, (res) => {
      res.pipe(file);
      file.on("finish", () => file.close(resolve));
    }).on("error", (err) => {
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
}

console.log("Generating cover art…");
const result = await fal.subscribe("fal-ai/flux/dev", {
  input: {
    prompt: PROMPT,
    image_size: "landscape_16_9",
    num_inference_steps: 40,
    guidance_scale: 4.5,
    num_images: 1,
  },
});

const url = result.data.images[0].url;
const dest = path.join(OUTPUT_DIR, "cover-art.png");
await download(url, dest);
console.log(`Saved → ${dest}`);
