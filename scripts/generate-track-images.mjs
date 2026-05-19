import pkg from "@fal-ai/client";
const { fal } = pkg;
import fs from "fs";
import path from "path";
import https from "https";
import http from "http";

fal.config({ credentials: process.env.FAL_KEY });

const OUTPUT_DIR = path.join(process.cwd(), "public/hackathons/innovation-hackathon");

const tracks = [
  {
    file: "track-idea-validation.png",
    prompt:
      "Minimal abstract digital artwork, dark charcoal background, a luminous funnel made of thin blue gradient lines with glowing idea sparks flowing in at the top and a single refined product crystal emerging at the bottom, geometric precision, clean negative space, tech hackathon aesthetic, 16:9",
  },
  {
    file: "track-market-monitoring.png",
    prompt:
      "Minimal abstract digital artwork, dark charcoal background, a web of interconnected signal nodes and pulsing data streams in electric blue and cyan, radar-like concentric rings overlaid on a global grid, real-time market signals visualized as glowing data pulses, geometric precision, clean negative space, tech hackathon aesthetic, 16:9",
  },
  {
    file: "track-synthetic-customers.png",
    prompt:
      "Minimal abstract digital artwork, dark charcoal background, an array of subtle translucent human silhouettes arranged in a grid, each with a small glowing thought bubble containing abstract product shapes, soft blue and violet gradients, digital simulation aesthetic, geometric precision, clean negative space, tech hackathon aesthetic, 16:9",
  },
];

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

for (const track of tracks) {
  console.log(`Generating: ${track.file}`);
  const result = await fal.subscribe("fal-ai/flux/schnell", {
    input: {
      prompt: track.prompt,
      image_size: "landscape_16_9",
      num_inference_steps: 8,
      num_images: 1,
    },
  });
  const url = result.data.images[0].url;
  const dest = path.join(OUTPUT_DIR, track.file);
  await download(url, dest);
  console.log(`  Saved → ${dest}`);
}

console.log("Done.");
