import { fal } from "@fal-ai/client";
import { writeFile, mkdir } from "fs/promises";

fal.config({
  credentials: process.env.FAL_KEY,
});

const STYLE = "digital_illustration/hand_drawn";

const elements = [
  {
    name: "magnifying-glass",
    prompt:
      "A single magnifying glass with constellation lines and small people icons visible inside the lens. Colorful hand-drawn style. Isolated object on a pure white background, nothing else.",
  },
  {
    name: "makers-table",
    prompt:
      "Two diverse people sitting at a round table collaborating, one sketching and one on a laptop. Colorful hand-drawn style. Isolated on a pure white background, nothing else.",
  },
  {
    name: "lightbulb",
    prompt:
      "A single glowing lightbulb with warm rays of light around it. Colorful hand-drawn style. Isolated object on a pure white background, nothing else.",
  },
  {
    name: "stars",
    prompt:
      "Three small four-pointed stars and a few sparkle marks scattered loosely. Colorful hand-drawn style. Isolated on a pure white background, nothing else.",
  },
];

await mkdir("public/hero-elements", { recursive: true });

for (const element of elements) {
  console.log(`Generating: ${element.name}...`);
  try {
    const result = await fal.subscribe("fal-ai/recraft-v3", {
      input: {
        prompt: element.prompt,
        style: STYLE,
        image_size: {
          width: 1024,
          height: 1024,
        },
      },
      logs: true,
      onQueueUpdate: (update) => {
        if (update.status === "IN_PROGRESS") {
          update.logs.map((log) => log.message).forEach(console.log);
        }
      },
    });

    const imageUrl = result.data.images[0].url;
    const response = await fetch(imageUrl);
    const buffer = Buffer.from(await response.arrayBuffer());
    const filePath = `public/hero-elements/${element.name}.webp`;
    await writeFile(filePath, buffer);
    console.log(`Saved: ${filePath}`);
  } catch (err) {
    console.error(`Failed: ${element.name}`, err.message);
  }
}

console.log("\nDone! All elements saved to public/hero-elements/");
