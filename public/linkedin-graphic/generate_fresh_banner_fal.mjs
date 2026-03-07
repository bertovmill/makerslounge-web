import { fal } from "@fal-ai/client";
import { writeFile } from "fs/promises";
import sharp from "sharp";

const W = 1920;
const H = 1080;

const BASE_DIR = "/Users/bertomill/makerslounge-web/public/linkedin-graphic";
const PHOTO = `${BASE_DIR}/makerslounge-8-cropped-90h.png`;
const MAKERS_ICON = "/Users/bertomill/makerslounge-web/public/icon-512.png";
const V0_LOGO = `${BASE_DIR}/v0-logo.svg`;

const RAW_BG_OUT = `${BASE_DIR}/fal-background-v2.png`;
const FINAL_OUT = `${BASE_DIR}/makerslounge-v0-partnership-v6-fresh.png`;

const FALLBACK_FAL_KEY = "99b57f51-771a-45a6-9783-a1ea834e8b7e:2f878d77e8dd59c9b9c1c63df074149a";

const prompt = [
  "Premium cinematic abstract background for a startup partnership announcement.",
  "Deep navy and near-black atmosphere with elegant electric blue and warm coral light trails.",
  "Subtle particles, soft bloom, and smooth depth-of-field glow.",
  "Clean visual negative space on the left side for typography.",
  "Richer light activity on the right side for photo integration.",
  "No text, no logos, no people, no objects, no watermark.",
  "Modern, high-end, editorial tech aesthetic.",
  "16:9 composition, ultra clean and refined.",
].join(" ");

const falKey = process.env.FAL_KEY || FALLBACK_FAL_KEY;
fal.config({ credentials: falKey });

async function generateBackground() {
  console.log("Generating fresh background with Fal AI...");
  const result = await fal.subscribe("fal-ai/flux/dev", {
    input: {
      prompt,
      image_size: "landscape_16_9",
      num_inference_steps: 38,
      guidance_scale: 3.8,
      num_images: 1,
      output_format: "png",
      seed: 840812,
    },
    logs: true,
    onQueueUpdate: (update) => {
      if (update.status === "IN_PROGRESS") {
        update.logs?.map((log) => log.message).forEach((m) => console.log(`  ${m}`));
      }
    },
  });

  const imageUrl = result?.data?.images?.[0]?.url;
  if (!imageUrl) {
    throw new Error("Fal did not return an image URL.");
  }

  const resp = await fetch(imageUrl);
  if (!resp.ok) {
    throw new Error(`Failed downloading generated image: ${resp.status}`);
  }
  const buffer = Buffer.from(await resp.arrayBuffer());
  await writeFile(RAW_BG_OUT, buffer);
  console.log(`Saved fresh background: ${RAW_BG_OUT}`);
}

function overlaySvg(photoX, photoY, photoW, photoH, radius) {
  return Buffer.from(
    `<svg width="${W}" height="${H}">
      <defs>
        <linearGradient id="leftFade" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stop-color="rgba(5,8,16,0.82)" />
          <stop offset="50%" stop-color="rgba(5,8,16,0.18)" />
          <stop offset="100%" stop-color="rgba(5,8,16,0.04)" />
        </linearGradient>
        <linearGradient id="rightPanel" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stop-color="rgba(8,12,20,0.00)" />
          <stop offset="100%" stop-color="rgba(8,12,20,0.42)" />
        </linearGradient>
        <radialGradient id="vignette" cx="50%" cy="50%" r="70%">
          <stop offset="45%" stop-color="rgba(0,0,0,0.0)" />
          <stop offset="100%" stop-color="rgba(0,0,0,0.28)" />
        </radialGradient>
      </defs>

      <rect x="0" y="0" width="${W}" height="${H}" fill="url(#leftFade)" />
      <rect x="${W - 820}" y="0" width="820" height="${H}" fill="url(#rightPanel)" />
      <rect x="0" y="0" width="${W}" height="${H}" fill="url(#vignette)" />

      <style>
        .display { font-family: "Arial Black", Impact, sans-serif; letter-spacing: 0.6px; }
        .sans { font-family: "Segoe UI", Inter, Arial, sans-serif; }
        .mono { font-family: "Courier New", monospace; letter-spacing: 1px; }
      </style>

      <text x="200" y="146" class="display" font-size="62" fill="#FFFFFF" opacity="0.96">×</text>
      <text x="90" y="330" class="display" font-size="142" fill="#F4F7FF">MAKERS</text>
      <text x="90" y="492" class="display" font-size="148" fill="#E86B52">LOUNGE</text>
      <text x="90" y="602" class="display" font-size="78" fill="#FFFFFF">#8: PARTNER-SHIP</text>
      <line x1="90" y1="624" x2="690" y2="624" stroke="#E86B52" stroke-opacity="0.95" stroke-width="3" />
      <text x="90" y="680" class="sans" font-size="50" fill="#FFFFFF" fill-opacity="0.94">40 makers. 20 pairs. 5 demos. One night.</text>

      <text x="90" y="980" class="mono" font-size="28" fill="#FFFFFF" fill-opacity="0.84">TORONTO  ·  2026</text>
      <text x="${W - 458}" y="980" class="mono" font-size="27" fill="#FFFFFF" fill-opacity="0.74">v0.dev  ×  makerslounge.ca</text>

      <text x="${photoX + 18}" y="${photoY - 18}" class="mono" font-size="24" fill="#FFFFFF" fill-opacity="0.76">IN THE ROOM</text>

      <g stroke="#FFFFFF" stroke-opacity="0.23" stroke-width="1.4">
        <line x1="36" y1="36" x2="36" y2="80"/><line x1="36" y1="36" x2="80" y2="36"/>
        <line x1="${W - 36}" y1="36" x2="${W - 36}" y2="80"/><line x1="${W - 36}" y1="36" x2="${W - 80}" y2="36"/>
        <line x1="36" y1="${H - 36}" x2="36" y2="${H - 80}"/><line x1="36" y1="${H - 36}" x2="80" y2="${H - 36}"/>
        <line x1="${W - 36}" y1="${H - 36}" x2="${W - 36}" y2="${H - 80}"/><line x1="${W - 36}" y1="${H - 36}" x2="${W - 80}" y2="${H - 36}"/>
      </g>

      <rect x="${photoX + 1.5}" y="${photoY + 1.5}" width="${photoW - 3}" height="${photoH - 3}" rx="${radius}" ry="${radius}" fill="none" stroke="#FFFFFF" stroke-opacity="0.33" stroke-width="3"/>
    </svg>`
  );
}

async function composeFinal() {
  const photoW = 620;
  const photoH = 900;
  const photoX = 1188;
  const photoY = 92;
  const radius = 30;

  const baseBg = await sharp(RAW_BG_OUT).resize(W, H, { fit: "cover" }).png().toBuffer();
  const makersIcon = await sharp(MAKERS_ICON).resize(96, 96).png().toBuffer();
  const v0Logo = await sharp(V0_LOGO).resize(108, 96).png().toBuffer();

  const fittedPhoto = await sharp(PHOTO).resize(photoW, photoH, { fit: "cover", position: "center" }).png().toBuffer();
  const mask = Buffer.from(
    `<svg width="${photoW}" height="${photoH}">
      <rect x="0" y="0" width="${photoW}" height="${photoH}" rx="${radius}" ry="${radius}" fill="white"/>
    </svg>`
  );
  const roundedPhoto = await sharp(fittedPhoto).composite([{ input: mask, blend: "dest-in" }]).png().toBuffer();
  const shadow = Buffer.from(
    `<svg width="${photoW + 28}" height="${photoH + 28}">
      <rect x="14" y="14" width="${photoW}" height="${photoH}" rx="${radius}" ry="${radius}" fill="rgba(0,0,0,0.38)"/>
    </svg>`
  );

  const overlays = overlaySvg(photoX, photoY, photoW, photoH, radius);

  await sharp(baseBg)
    .composite([
      { input: shadow, left: photoX - 14, top: photoY - 9 },
      { input: roundedPhoto, left: photoX, top: photoY },
      { input: makersIcon, left: 90, top: 84 },
      { input: v0Logo, left: 254, top: 84 },
      { input: overlays, left: 0, top: 0 },
    ])
    .png({ compressionLevel: 9 })
    .toFile(FINAL_OUT);

  console.log(`Saved final banner: ${FINAL_OUT}`);
}

await generateBackground();
await composeFinal();
