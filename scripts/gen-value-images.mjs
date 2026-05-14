// One-off generator: creates 4 abstract 3D glass images for the landing page
// value cards (Hustle, Learning, Community, Fun) via fal.ai Flux Pro v1.1,
// downloads them to public/values/.
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { config as loadEnv } from "dotenv";

loadEnv({ path: ".env.local" });

const FAL_API_KEY = process.env.FAL_API_KEY;
if (!FAL_API_KEY) {
  console.error("FAL_API_KEY missing in .env.local");
  process.exit(1);
}

const OUT_DIR = path.resolve("public/values");

const STYLE = [
  "3D rendered abstract glass sculpture",
  "glossy translucent frosted glass material with subtle internal refractions",
  "vibrant blue color palette, electric cyan and deep azure (#6AC4F7 to #1A7DE8)",
  "soft volumetric studio lighting with rim light",
  "minimalist composition, centered subject floating",
  "clean light gradient background, very subtle white to pale blue",
  "premium product photography, octane render, hyper detailed",
  "no text, no letters, no people, no faces",
].join(", ");

const PROMPTS = {
  hustle:
    `a sleek lightning bolt sculpture made of flowing liquid glass, sharp dynamic motion lines, energy streaks, ${STYLE}`,
  learning:
    `an open book sculpture made of translucent glass with pages curling upward into a spiral ribbon of light, ${STYLE}`,
  community:
    `three interconnected glossy glass orbs of varying sizes, linked by flowing translucent ribbons forming a network, harmonious arrangement, ${STYLE}`,
  fun:
    `an exploding burst of glass confetti, ribbons and small spheres frozen in mid-air, celebratory motion, joyful composition, ${STYLE}`,
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
