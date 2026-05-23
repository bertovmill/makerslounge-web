import pkg from "@fal-ai/client";
const { fal } = pkg;
import fs from "fs";
import path from "path";
import https from "https";
import http from "http";

fal.config({ credentials: process.env.FAL_KEY });

const OUTPUT_DIR = path.join(process.cwd(), "public/hackathons/innovation-hackathon");

const PROMPT =
  "Editorial scientific poster art. Cool light grey background. A single colossal crystalline prism — geometric and monumental — suspended in deep navy blue space. A narrow beam of pure white light enters from the left and refracts inside the crystal into three distinct internal paths: one resolves into a glowing planetary sphere with a warm amber atmospheric halo; another scatters outward into a loose constellation of luminous amber nodes; the third continues as a focused gold beam exiting the far edge. The entire crystal glows from within — deep navy blue with warm amber and gold light radiating through its facets. Smooth photorealistic gradient rendering, no texture, minimal, no text, no people. Inspired by scientific visualization, optics, and editorial design. Cinematic, sophisticated, 16:9.";

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
