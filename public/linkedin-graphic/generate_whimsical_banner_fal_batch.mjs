import { fal } from "@fal-ai/client";
import dotenv from "dotenv";
import { writeFile } from "fs/promises";
import sharp from "sharp";

dotenv.config({ path: "/Users/bertomill/makerslounge-web/.env.local" });
dotenv.config({ path: "/Users/bertomill/makerslounge-web/.env" });

if (!process.env.FAL_KEY) {
  throw new Error("FAL_KEY missing in env.");
}
fal.config({ credentials: process.env.FAL_KEY });

const W = 1920;
const H = 1080;
const BASE_DIR = "/Users/bertomill/makerslounge-web/public/linkedin-graphic";
const PHOTO = `${BASE_DIR}/makerslounge-8-cropped-90h.png`;
const MAKERS_ICON = "/Users/bertomill/makerslounge-web/public/icon-512.png";
const V0_LOGO = `${BASE_DIR}/v0-logo.svg`;

const styles = [
  "digital_illustration/hand_drawn",
  "digital_illustration/infantile_sketch",
  "digital_illustration/2d_art_poster",
];

const prompt = `
Whimsical happy hand-drawn editorial background with cream paper texture.
Pastel corner doodles only: stars, sparkles, soft shapes, tiny magnifying glass and tiny lightbulb.
Keep at least 70 percent of canvas open and bright.
No large objects in center. No dark heavy areas. No black fill.
No text, no letters, no logos, no watermark.
`.trim();

function overlaySvg(photoX, photoY, photoW, photoH, radius) {
  return Buffer.from(`<svg width="${W}" height="${H}">
    <defs>
      <linearGradient id="leftWash" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="rgba(248,244,236,0.68)"/>
        <stop offset="100%" stop-color="rgba(248,244,236,0.08)"/>
      </linearGradient>
    </defs>
    <rect x="0" y="0" width="${W}" height="${H}" fill="url(#leftWash)"/>
    <style>
      .hero { font-family: Georgia, "Times New Roman", serif; }
      .sans { font-family: "Segoe UI", Arial, sans-serif; letter-spacing: .5px; }
      .mono { font-family: "Courier New", monospace; letter-spacing: 1px; }
    </style>
    <text x="220" y="132" class="hero" font-size="66" fill="#122042">×</text>
    <text x="90" y="314" class="hero" font-size="150" fill="#122042">Makers</text>
    <text x="90" y="466" class="hero" font-size="154" fill="#E54B4B">Lounge</text>
    <text x="92" y="568" class="sans" font-size="80" font-weight="700" fill="#122042">#8: PARTNER-SHIP</text>
    <line x1="92" y1="588" x2="700" y2="588" stroke="#E54B4B" stroke-width="4"/>
    <text x="92" y="650" class="sans" font-size="52" fill="#334E68">40 makers. 20 pairs. 5 demos. One night.</text>
    <text x="92" y="976" class="mono" font-size="30" fill="#5D6D7E">TORONTO  ·  2026</text>
    <text x="${W - 465}" y="976" class="mono" font-size="28" fill="#5D6D7E">v0.dev  ×  makerslounge.ca</text>
    <text x="${photoX + 16}" y="${photoY - 16}" class="mono" font-size="24" fill="#5D6D7E">IN THE ROOM</text>
    <rect x="${photoX + 2}" y="${photoY + 2}" width="${photoW - 4}" height="${photoH - 4}" rx="${radius}" ry="${radius}"
      fill="none" stroke="rgba(20,33,61,0.26)" stroke-width="3"/>
  </svg>`);
}

async function compose(bgPath, outPath) {
  const photoW = 620;
  const photoH = 900;
  const photoX = 1170;
  const photoY = 90;
  const radius = 32;

  const bg = await sharp(bgPath).resize(W, H, { fit: "cover" }).png().toBuffer();
  const makersIcon = await sharp(MAKERS_ICON).resize(96, 96).png().toBuffer();
  const v0Logo = await sharp(V0_LOGO).resize(108, 96).png().toBuffer();
  const photoFit = await sharp(PHOTO).resize(photoW, photoH, { fit: "cover", position: "center" }).png().toBuffer();
  const mask = Buffer.from(`<svg width="${photoW}" height="${photoH}">
    <rect x="0" y="0" width="${photoW}" height="${photoH}" rx="${radius}" ry="${radius}" fill="white"/>
  </svg>`);
  const roundedPhoto = await sharp(photoFit).composite([{ input: mask, blend: "dest-in" }]).png().toBuffer();
  const shadow = Buffer.from(`<svg width="${photoW + 34}" height="${photoH + 34}">
    <rect x="17" y="17" width="${photoW}" height="${photoH}" rx="${radius}" ry="${radius}" fill="rgba(20,33,61,0.2)"/>
  </svg>`);

  await sharp(bg)
    .composite([
      { input: shadow, left: photoX - 16, top: photoY - 8 },
      { input: roundedPhoto, left: photoX, top: photoY },
      { input: makersIcon, left: 90, top: 76 },
      { input: v0Logo, left: 254, top: 76 },
      { input: overlaySvg(photoX, photoY, photoW, photoH, radius), left: 0, top: 0 },
    ])
    .png({ compressionLevel: 9 })
    .toFile(outPath);
}

for (let i = 0; i < styles.length; i++) {
  const style = styles[i];
  const idx = i + 1;
  console.log(`Generating style ${idx}/${styles.length}: ${style}`);
  const result = await fal.subscribe("fal-ai/recraft-v3", {
    input: { prompt, style, image_size: { width: W, height: H } },
    logs: true,
  });
  const url = result?.data?.images?.[0]?.url;
  if (!url) continue;
  const res = await fetch(url);
  if (!res.ok) continue;
  const bgBuf = Buffer.from(await res.arrayBuffer());
  const bgPath = `${BASE_DIR}/fal-background-whimsical-batch-${idx}.png`;
  const outPath = `${BASE_DIR}/makerslounge-v0-partnership-v7-whimsical-batch-${idx}.png`;
  await writeFile(bgPath, bgBuf);
  await compose(bgPath, outPath);
  console.log(`Saved ${outPath}`);
}

console.log("Batch complete.");
