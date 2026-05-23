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
    file: "track-idea-validation-art.png",
    prompt:
      "Light editorial illustration, soft warm cream and terracotta background. Abstract geometric shapes — triangles, diamonds, circles — floating and gently converging into a glowing minimal funnel shape. Watercolor wash texture, painterly, warm gold and blush accents, generous negative space, no text, no people, artistic, beautiful.",
  },
  {
    file: "track-market-monitoring-art.png",
    prompt:
      "Light editorial illustration, pale blue-white background. Delicate signal waves and data arcs emanating from a single glowing point, like ripples on still water or radio waves across a minimal horizon. Soft blue, warm sand, and white tones. Watercolor wash texture, ethereal, airy, generous negative space, no text, no people, artistic, beautiful.",
  },
  {
    file: "track-synthetic-customers-art.png",
    prompt:
      "Light editorial illustration, soft cream background. Multiple translucent human silhouettes arranged in a gentle organic cluster, each dissolving at the edges into soft light and subtle colour. Warm blush, coral, and pale lavender tones. Watercolor wash texture, painterly, generous negative space, no text, artistic, beautiful.",
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
  const result = await fal.subscribe("fal-ai/flux/dev", {
    input: {
      prompt: track.prompt,
      image_size: "landscape_16_9",
      num_inference_steps: 28,
      guidance_scale: 3.5,
      num_images: 1,
    },
  });
  const url = result.data.images[0].url;
  const dest = path.join(OUTPUT_DIR, track.file);
  await download(url, dest);
  console.log(`  Saved → ${dest}`);
}

console.log("Done.");
