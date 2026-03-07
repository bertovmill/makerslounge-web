#!/usr/bin/env node
const sharp = require("sharp");

const BASE_BG = "/Users/bertomill/makerslounge-web/public/linkedin-graphic/fal-background.png";
const PHOTO = "/Users/bertomill/makerslounge-web/public/linkedin-graphic/makerslounge-8-cropped-90h.png";
const MAKERS_ICON = "/Users/bertomill/makerslounge-web/public/icon-512.png";
const V0_LOGO = "/Users/bertomill/makerslounge-web/public/linkedin-graphic/v0-logo.svg";
const OUT = "/Users/bertomill/makerslounge-web/public/linkedin-graphic/makerslounge-v0-partnership-v5.png";

const W = 1920;
const H = 1080;

async function main() {
  const bg = await sharp(BASE_BG).resize(W, H, { fit: "cover" }).png().toBuffer();

  const photoW = 620;
  const photoH = 900;
  const photoX = 1220;
  const photoY = 90;
  const photoR = 28;

  const photoFit = await sharp(PHOTO)
    .resize(photoW, photoH, { fit: "cover", position: "center" })
    .png()
    .toBuffer();

  const maskSvg = Buffer.from(
    `<svg width="${photoW}" height="${photoH}">
      <rect x="0" y="0" width="${photoW}" height="${photoH}" rx="${photoR}" ry="${photoR}" fill="white"/>
    </svg>`
  );

  const roundedPhoto = await sharp(photoFit)
    .composite([{ input: maskSvg, blend: "dest-in" }])
    .png()
    .toBuffer();

  const makersIcon = await sharp(MAKERS_ICON).resize(94, 94).png().toBuffer();
  const v0Logo = await sharp(V0_LOGO).resize(106, 94).png().toBuffer();

  const overlays = {
    leftGradient: Buffer.from(
      `<svg width="${W}" height="${H}">
        <defs>
          <linearGradient id="g1" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stop-color="rgba(5,7,15,0.78)"/>
            <stop offset="45%" stop-color="rgba(5,7,15,0.22)"/>
            <stop offset="100%" stop-color="rgba(5,7,15,0.06)"/>
          </linearGradient>
          <radialGradient id="v" cx="50%" cy="50%" r="65%">
            <stop offset="40%" stop-color="rgba(0,0,0,0)"/>
            <stop offset="100%" stop-color="rgba(0,0,0,0.28)"/>
          </radialGradient>
        </defs>
        <rect x="0" y="0" width="${W}" height="${H}" fill="url(#g1)"/>
        <rect x="0" y="0" width="${W}" height="${H}" fill="url(#v)"/>
      </svg>`
    ),
    rightPanel: Buffer.from(
      `<svg width="${photoW + 140}" height="${H}">
        <defs>
          <linearGradient id="g2" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stop-color="rgba(7,10,18,0.0)"/>
            <stop offset="100%" stop-color="rgba(7,10,18,0.40)"/>
          </linearGradient>
        </defs>
        <rect x="0" y="0" width="${photoW + 140}" height="${H}" fill="url(#g2)"/>
      </svg>`
    ),
    shadow: Buffer.from(
      `<svg width="${photoW + 30}" height="${photoH + 30}">
        <rect x="15" y="15" width="${photoW}" height="${photoH}" rx="${photoR}" ry="${photoR}" fill="rgba(0,0,0,0.36)"/>
      </svg>`
    ),
    border: Buffer.from(
      `<svg width="${photoW}" height="${photoH}">
        <rect x="1.5" y="1.5" width="${photoW - 3}" height="${photoH - 3}" rx="${photoR}" ry="${photoR}" fill="none" stroke="rgba(255,255,255,0.34)" stroke-width="3"/>
      </svg>`
    ),
    text: Buffer.from(
      `<svg width="${W}" height="${H}">
        <style>
          .display { font-family: Impact, Haettenschweiler, "Arial Narrow Bold", sans-serif; letter-spacing: 0.5px; }
          .sans { font-family: "Segoe UI", Inter, Arial, sans-serif; }
          .mono { font-family: "Courier New", monospace; letter-spacing: 0.8px; }
        </style>

        <text x="212" y="147" class="display" font-size="68" fill="rgba(255,255,255,0.98)">×</text>

        <text x="84" y="338" class="display" font-size="146" fill="#F4F7FF">MAKERS</text>
        <text x="84" y="500" class="display" font-size="152" fill="#E86B52">LOUNGE</text>

        <text x="88" y="612" class="display" font-size="80" fill="#FFFFFF">#8: PARTNER-SHIP</text>
        <line x1="88" y1="634" x2="660" y2="634" stroke="rgba(232,107,82,0.95)" stroke-width="3"/>
        <text x="88" y="687" class="sans" font-size="50" fill="rgba(255,255,255,0.92)">40 makers. 20 pairs. 5 demos. One night.</text>

        <text x="88" y="980" class="mono" font-size="28" fill="rgba(255,255,255,0.86)">TORONTO  ·  2026</text>
        <text x="1514" y="980" class="mono" font-size="27" fill="rgba(255,255,255,0.76)">v0.dev  ×  makerslounge.ca</text>

        <text x="${photoX + 20}" y="${photoY - 18}" class="mono" font-size="24" fill="rgba(255,255,255,0.82)">IN THE ROOM</text>

        <g stroke="rgba(255,255,255,0.25)" stroke-width="1.5">
          <line x1="40" y1="40" x2="40" y2="78"/><line x1="40" y1="40" x2="78" y2="40"/>
          <line x1="${W - 40}" y1="40" x2="${W - 40}" y2="78"/><line x1="${W - 40}" y1="40" x2="${W - 78}" y2="40"/>
          <line x1="40" y1="${H - 40}" x2="40" y2="${H - 78}"/><line x1="40" y1="${H - 40}" x2="78" y2="${H - 40}"/>
          <line x1="${W - 40}" y1="${H - 40}" x2="${W - 40}" y2="${H - 78}"/><line x1="${W - 40}" y1="${H - 40}" x2="${W - 78}" y2="${H - 40}"/>
        </g>
      </svg>`
    ),
  };

  await sharp(bg)
    .composite([
      { input: overlays.leftGradient, left: 0, top: 0 },
      { input: overlays.rightPanel, left: W - (photoW + 140), top: 0 },
      { input: makersIcon, left: 84, top: 84 },
      { input: v0Logo, left: 252, top: 84 },
      { input: overlays.shadow, left: photoX - 15, top: photoY - 10 },
      { input: roundedPhoto, left: photoX, top: photoY },
      { input: overlays.border, left: photoX, top: photoY },
      { input: overlays.text, left: 0, top: 0 },
    ])
    .png({ compressionLevel: 9 })
    .toFile(OUT);

  console.log(`Saved: ${OUT}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
