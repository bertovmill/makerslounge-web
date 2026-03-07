import { fal } from "@fal-ai/client";
import dotenv from "dotenv";
import { writeFile } from "fs/promises";
import sharp from "sharp";

dotenv.config({ path: "/Users/bertomill/makerslounge-web/.env.local" });
dotenv.config({ path: "/Users/bertomill/makerslounge-web/.env" });

const FAL_KEY = process.env.FAL_KEY;
if (!FAL_KEY) {
  throw new Error("FAL_KEY not found in environment (.env.local/.env).");
}

fal.config({ credentials: FAL_KEY });

const W = 1920;
const H = 1080;

const BASE_DIR = "/Users/bertomill/makerslounge-web/public/linkedin-graphic";
const OUT_BG = `${BASE_DIR}/fal-background-whimsical-v4.png`;
const OUT_FINAL = `${BASE_DIR}/makerslounge-v0-partnership-v7-whimsical-v4.png`;
const PHOTO = `${BASE_DIR}/makerslounge-8-cropped-90h.png`;
const MAKERS_ICON = "/Users/bertomill/makerslounge-web/public/icon-512.png";
const V0_LOGO = `${BASE_DIR}/v0-logo.svg`;

const prompt = `
Minimal whimsical hand-drawn background only.
Large cream off-white canvas with 75% empty space.
Add only small pastel doodles in corners and extreme edges:
tiny stars, sparkles, soft confetti strokes, simple magnifying-glass doodle, tiny lightbulb doodle.
Do NOT place any big object in the center.
Do NOT place any object in center-left text area.
Do NOT draw frames, books, cameras, people, or large shapes.
Use light cheerful colors: mint, peach, sky blue, warm yellow, blush pink, lavender.
Soft watercolor/chalk texture, gentle and playful.
ABSOLUTELY NO TEXT. NO LETTERS. NO WORDS. NO LOGOS. NO WATERMARK.
`.trim();

async function generateBackground() {
  console.log("Generating whimsical background with Fal Recraft...");
  const result = await fal.subscribe("fal-ai/recraft-v3", {
    input: {
      prompt,
      style: "digital_illustration/urban_sketching",
      image_size: { width: W, height: H },
    },
    logs: true,
    onQueueUpdate: (update) => {
      if (update.status === "IN_PROGRESS") {
        update.logs?.forEach((l) => console.log(`  ${l.message}`));
      }
    },
  });

  const imageUrl = result?.data?.images?.[0]?.url;
  if (!imageUrl) throw new Error("No image URL returned by Fal.");

  const response = await fetch(imageUrl);
  if (!response.ok) throw new Error(`Failed to download image: ${response.status}`);
  const buffer = Buffer.from(await response.arrayBuffer());
  await writeFile(OUT_BG, buffer);
  console.log(`Saved background: ${OUT_BG}`);
}

function svgOverlay(photoX, photoY, photoW, photoH, radius) {
  return Buffer.from(`
  <svg width="${W}" height="${H}">
    <defs>
      <linearGradient id="leftPaper" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="rgba(248,244,236,0.74)" />
        <stop offset="55%" stop-color="rgba(248,244,236,0.24)" />
        <stop offset="100%" stop-color="rgba(248,244,236,0.06)" />
      </linearGradient>
      <linearGradient id="rightCream" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="rgba(248,244,236,0.02)" />
        <stop offset="100%" stop-color="rgba(248,244,236,0.35)" />
      </linearGradient>
    </defs>

    <rect x="0" y="0" width="${W}" height="${H}" fill="url(#leftPaper)" />
    <rect x="${W - 760}" y="0" width="760" height="${H}" fill="url(#rightCream)" />

    <style>
      .hero { font-family: Georgia, "Times New Roman", serif; letter-spacing: 0.2px; }
      .label { font-family: "Avenir Next", "Segoe UI", Arial, sans-serif; letter-spacing: 0.8px; }
      .mono { font-family: "Courier New", monospace; letter-spacing: 1px; }
    </style>

    <text x="220" y="130" class="hero" font-size="70" fill="#14213D" opacity="0.95">×</text>
    <text x="88" y="310" class="hero" font-size="148" fill="#111C3A">Makers</text>
    <text x="88" y="460" class="hero" font-size="154" fill="#E54B4B">Lounge</text>

    <text x="92" y="565" class="label" font-size="80" font-weight="700" fill="#111C3A">#8: PARTNER-SHIP</text>
    <line x1="92" y1="586" x2="700" y2="586" stroke="#E54B4B" stroke-width="4" stroke-opacity="0.9"/>
    <text x="92" y="648" class="label" font-size="52" fill="#334E68">40 makers. 20 pairs. 5 demos. One night.</text>

    <text x="92" y="976" class="mono" font-size="30" fill="#5D6D7E">TORONTO  ·  2026</text>
    <text x="${W - 465}" y="976" class="mono" font-size="28" fill="#5D6D7E">v0.dev  ×  makerslounge.ca</text>

    <text x="${photoX + 16}" y="${photoY - 16}" class="mono" font-size="24" fill="#5D6D7E">IN THE ROOM</text>

    <rect x="${photoX + 2}" y="${photoY + 2}" width="${photoW - 4}" height="${photoH - 4}" rx="${radius}" ry="${radius}"
      fill="none" stroke="rgba(20,33,61,0.25)" stroke-width="3" />

    <g stroke="rgba(20,33,61,0.20)" stroke-width="1.4">
      <line x1="34" y1="34" x2="34" y2="76"/><line x1="34" y1="34" x2="76" y2="34"/>
      <line x1="${W - 34}" y1="34" x2="${W - 34}" y2="76"/><line x1="${W - 34}" y1="34" x2="${W - 76}" y2="34"/>
      <line x1="34" y1="${H - 34}" x2="34" y2="${H - 76}"/><line x1="34" y1="${H - 34}" x2="76" y2="${H - 34}"/>
      <line x1="${W - 34}" y1="${H - 34}" x2="${W - 34}" y2="${H - 76}"/><line x1="${W - 34}" y1="${H - 34}" x2="${W - 76}" y2="${H - 34}"/>
    </g>
  </svg>`);
}

async function composeBanner() {
  const photoW = 620;
  const photoH = 900;
  const photoX = 1170;
  const photoY = 90;
  const radius = 32;

  const bg = await sharp(OUT_BG).resize(W, H, { fit: "cover" }).png().toBuffer();
  const makersIcon = await sharp(MAKERS_ICON).resize(96, 96).png().toBuffer();
  const v0Logo = await sharp(V0_LOGO).resize(108, 96).png().toBuffer();

  const photoFit = await sharp(PHOTO).resize(photoW, photoH, { fit: "cover", position: "center" }).png().toBuffer();
  const photoMask = Buffer.from(`
    <svg width="${photoW}" height="${photoH}">
      <rect x="0" y="0" width="${photoW}" height="${photoH}" rx="${radius}" ry="${radius}" fill="white"/>
    </svg>`);
  const roundedPhoto = await sharp(photoFit).composite([{ input: photoMask, blend: "dest-in" }]).png().toBuffer();

  const shadow = Buffer.from(`
    <svg width="${photoW + 34}" height="${photoH + 34}">
      <rect x="17" y="17" width="${photoW}" height="${photoH}" rx="${radius}" ry="${radius}" fill="rgba(20,33,61,0.20)" />
    </svg>`);

  const overlays = svgOverlay(photoX, photoY, photoW, photoH, radius);

  await sharp(bg)
    .composite([
      { input: shadow, left: photoX - 16, top: photoY - 8 },
      { input: roundedPhoto, left: photoX, top: photoY },
      { input: makersIcon, left: 90, top: 76 },
      { input: v0Logo, left: 254, top: 76 },
      { input: overlays, left: 0, top: 0 },
    ])
    .png({ compressionLevel: 9 })
    .toFile(OUT_FINAL);

  console.log(`Saved banner: ${OUT_FINAL}`);
}

await generateBackground();
await composeBanner();
