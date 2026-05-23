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
      "Editorial scientific poster art. Cool light grey background. A large luminous geometric prism or diamond form, deep navy blue interior with a warm amber and gold atmospheric glow radiating from its core edges, like light refracting through glass. Smooth photorealistic gradient rendering, no texture, minimal, no text, no people. Inspired by astronomical data visualization and editorial design. Cinematic, sophisticated, 16:9.",
  },
  {
    file: "track-market-monitoring-art.png",
    prompt:
      "Editorial scientific poster art. Cool light grey background. A vast deep navy blue sphere — like a planet seen from orbit — with a dramatic warm amber and gold atmospheric halo glowing along one curved edge, fading into the grey void. Smooth photorealistic gradient rendering, no texture, minimal, no text, no people. Inspired by NASA imagery and editorial data visualization. Cinematic, sophisticated, 16:9.",
  },
  {
    file: "track-synthetic-customers-art.png",
    prompt:
      "Editorial scientific poster art. Cool light grey background. Multiple overlapping translucent spheres of varying sizes, deep navy blue with warm amber atmospheric glows, layered and partially intersecting like a Venn diagram seen from a distance. Smooth photorealistic gradient rendering, no texture, minimal, no text, no people. Inspired by scientific visualization and editorial design. Cinematic, sophisticated, 16:9.",
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
      num_inference_steps: 35,
      guidance_scale: 4.5,
      num_images: 1,
    },
  });
  const url = result.data.images[0].url;
  const dest = path.join(OUTPUT_DIR, track.file);
  await download(url, dest);
  console.log(`  Saved → ${dest}`);
}

console.log("Done.");
