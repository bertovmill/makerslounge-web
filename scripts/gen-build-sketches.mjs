// One-off generator: three whimsical hand-drawn ink sketches for the
// Mulerun "Let's build" slide reminders (any room / pizza + water only / no photos)
// via fal.ai Flux Pro v1.1. Saves to public/hackathons/mulerun/build/.
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { config as loadEnv } from "dotenv";

loadEnv({ path: ".env.local" });

const FAL_API_KEY = process.env.FAL_API_KEY;
if (!FAL_API_KEY) {
  console.error("FAL_API_KEY missing in .env.local");
  process.exit(1);
}

const OUT_DIR = path.resolve("public/hackathons/mulerun/build");

const STYLE = [
  "whimsical hand-drawn single-line ink doodle",
  "thin black ink line on a plain pure white background",
  "playful loose sketch style, slightly imperfect strokes",
  "minimal, friendly, charming, illustrative",
  "no color, no shading, no fill, only line work",
  "centered subject, generous white margin around the drawing",
  "no text, no letters, no captions, no labels",
].join(", ");

const PROMPTS = {
  pingpong:
    `a tiny whimsical doodle of a ping pong paddle with a small bouncing ball next to it, motion dots showing the bounce, ${STYLE}`,
  pizza:
    `a tiny whimsical doodle of a single slice of pizza next to a small water bottle, both side by side, ${STYLE}`,
  nophotos:
    `a tiny whimsical doodle of a small vintage camera with a single diagonal line crossed through it like a no-symbol, ${STYLE}`,
};

async function generate(name, prompt) {
  console.log(`\n[${name}] submitting...`);
  const submit = await fetch("https://queue.fal.run/fal-ai/flux-pro/v1.1", {
    method: "POST",
    headers: {
      Authorization: `Key ${FAL_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      prompt,
      image_size: { width: 1024, height: 1024 },
      num_images: 1,
      enable_safety_checker: true,
      safety_tolerance: "2",
    }),
  });

  if (!submit.ok) {
    const err = await submit.text();
    throw new Error(`Submit failed for ${name}: ${submit.status} ${err}`);
  }
  const submitData = await submit.json();

  let images = submitData.images;
  if (!images) {
    const { status_url, response_url } = submitData;
    for (let i = 0; i < 120; i++) {
      await new Promise((r) => setTimeout(r, 1000));
      const s = await fetch(status_url, {
        headers: { Authorization: `Key ${FAL_API_KEY}` },
      });
      if (!s.ok) continue;
      const sd = await s.json();
      process.stdout.write(`[${name}] poll ${i + 1}: ${sd.status}\r`);
      if (sd.status === "COMPLETED") {
        const r = await fetch(response_url, {
          headers: { Authorization: `Key ${FAL_API_KEY}` },
        });
        const rd = await r.json();
        images = rd.images;
        break;
      }
      if (sd.status === "FAILED") throw new Error(`[${name}] failed`);
    }
  }

  if (!images?.length) throw new Error(`[${name}] no images returned`);
  const url = images[0].url;
  console.log(`\n[${name}] downloading ${url}`);
  const img = await fetch(url);
  const buf = Buffer.from(await img.arrayBuffer());
  const out = path.join(OUT_DIR, `${name}.png`);
  await writeFile(out, buf);
  console.log(`[${name}] saved -> ${out}`);
}

await mkdir(OUT_DIR, { recursive: true });
for (const [name, prompt] of Object.entries(PROMPTS)) {
  await generate(name, prompt);
}
console.log("\n✓ all done");
