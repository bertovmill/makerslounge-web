// Lays the typography and the logo over the rendered shader frames, then
// writes a 1080x1080 PNG still and a looping 720x720 GIF per variant.
//
//   FRAMES_DIR=/tmp/frames OUT=branding/luma-covers/meetup-13 node scripts/luma-cover/compose.mjs
//   NUMBER=13 DATE="Mon Sep 14 · 6:00 PM" ...   (DATE is optional)
//
// Run from the repo root so @playwright/test resolves. Uses the installed
// Google Chrome rather than Playwright's pinned build, which is not downloaded
// on this machine. Figtree comes from Google Fonts, so this needs network.
import { chromium } from "@playwright/test";
import { execFileSync } from "node:child_process";
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { VARIANTS } from "./variants.mjs";

const FRAMES_DIR = process.env.FRAMES_DIR ?? "./luma-frames";
const OUT = process.env.OUT ?? "./luma-covers";
const NUMBER = process.env.NUMBER ?? "13";
const DATE = process.env.DATE ?? "";
const FPS = Number(process.env.FPS ?? 18);
const GIF_SIZE = Number(process.env.GIF_SIZE ?? 640);
const only = process.argv.slice(2);

const logoSrc = readFileSync(new URL("../../src/components/AnimatedLogo.tsx", import.meta.url), "utf8");
const LOGO_PATH = logoSrc.match(/LOGO_PATH =\s*"([^"]+)"/)[1];

const page = (variant, bg) => `<!doctype html>
<html><head><meta charset="utf-8">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Figtree:wght@500;600;700;800;900&family=Geist+Mono:wght@500&display=swap">
<style>
  html, body { margin: 0; width: 1080px; height: 1080px; overflow: hidden; }
  body { position: relative; font-family: "Figtree", system-ui, sans-serif; -webkit-font-smoothing: antialiased; }
  .bg { position: absolute; inset: 0; width: 1080px; height: 1080px; }
  .layer { position: absolute; inset: 0; color: var(--fg); }
  .mark { position: absolute; display: flex; align-items: center; gap: 14px; }
  .mark svg { height: 52px; width: auto; display: block; }
  .mark span { font-weight: 700; font-size: 40px; letter-spacing: -0.02em; }
  .eyebrow { font-family: "Geist Mono", ui-monospace, monospace; font-weight: 500; font-size: 22px; letter-spacing: 0.22em; text-transform: uppercase; opacity: 0.9; }
  .num { font-weight: 800; letter-spacing: -0.06em; line-height: 0.82; }
  .word { font-weight: 800; letter-spacing: -0.04em; line-height: 0.9; }
  .tag { font-weight: 600; font-size: 34px; letter-spacing: -0.01em; }
  .rsvp { font-family: "Geist Mono", ui-monospace, monospace; font-size: 22px; letter-spacing: 0.06em; }
  .date { font-weight: 600; font-size: 30px; letter-spacing: -0.01em; }
  .pill { display: inline-block; border: 3px solid currentColor; padding: 10px 22px; border-radius: 999px; }
  .shadow { text-shadow: 0 2px 24px rgba(0,0,0,0.35); }
  .abs { position: absolute; }
</style></head>
<body style="--fg:${variant.fg}">
<img class="bg" src="${bg}">
${LAYOUTS[variant.layout](variant)}
</body></html>`;

const logo = (color) => `<svg viewBox="0 0 246 258" xmlns="http://www.w3.org/2000/svg"><path d="${LOGO_PATH}" fill="${color}" fill-rule="evenodd"/></svg>`;
const mark = (v, x = 72, y = 64) => `<div class="mark" style="left:${x}px;top:${y}px">${logo(v.fg)}<span>makerslounge</span></div>`;
const rsvp = (right = 72, bottom = 72, extra = "") => `<div class="abs rsvp ${extra}" style="right:${right}px;bottom:${bottom}px">RSVP · luma.com/makermonday3</div>`;
const dateLine = (cls = "") => (DATE ? `<div class="date ${cls}">${DATE}</div>` : "");

const LAYOUTS = {
  // Type sits inside the sun, dark ink on cream.
  sun: (v) => `<div class="layer">
    ${mark(v)}
    <div class="abs eyebrow" style="left:0;right:0;top:300px;text-align:center">Maker Mondays · Meetup</div>
    <div class="abs num" style="left:0;right:0;top:350px;text-align:center;font-size:420px">${NUMBER}</div>
    <div class="abs" style="left:0;right:0;top:740px;text-align:center">
      <div class="tag">Build. Connect. Create.</div>
      ${dateLine("")}
    </div>
    <div class="abs rsvp" style="left:72px;bottom:72px">Toronto</div>
    ${rsvp()}
  </div>`,
  // White type, centred, on the dark and gradient backdrops.
  "center-light": (v) => `<div class="layer shadow">
    ${mark(v)}
    <div class="abs eyebrow" style="left:0;right:0;top:236px;text-align:center">Maker Mondays · Meetup</div>
    <div class="abs num" style="left:0;right:0;top:300px;text-align:center;font-size:500px">${NUMBER}</div>
    <div class="abs" style="left:0;right:0;top:770px;text-align:center">
      <div class="tag">Build. Connect. Create.</div>
      ${dateLine("")}
    </div>
    <div class="abs rsvp" style="left:72px;bottom:72px">Toronto</div>
    ${rsvp()}
  </div>`,
  // Big number anchored bottom-left, the backdrop's centre stays clear.
  "corner-light": (v) => `<div class="layer shadow">
    ${mark(v)}
    <div class="abs" style="left:72px;bottom:150px">
      <div class="eyebrow" style="margin-bottom:18px">Maker Mondays</div>
      <div class="word" style="font-size:96px">Meetup</div>
      <div class="num" style="font-size:360px;margin-left:-12px">${NUMBER}</div>
    </div>
    <div class="abs" style="right:72px;top:76px;text-align:right">
      <div class="tag">Build. Connect. Create.</div>
      ${dateLine("")}
    </div>
    ${rsvp(72, 72)}
  </div>`,
  // Ink type in the top-left, the paper-cut shapes fill the rest.
  "topleft-dark": (v) => `<div class="layer">
    ${mark(v)}
    <div class="abs" style="left:72px;top:150px">
      <div class="eyebrow" style="margin-bottom:22px">Maker Mondays</div>
      <div class="word" style="font-size:104px">Meetup</div>
      <div class="num" style="font-size:340px;margin-left:-10px">${NUMBER}</div>
      <div class="tag" style="margin-top:28px">Build. Connect. Create.</div>
      ${dateLine("")}
    </div>
    <div class="abs rsvp" style="left:72px;bottom:72px">RSVP · luma.com/makermonday3</div>
  </div>`,
  // Everything inside the frosted card.
  card: (v) => `<div class="layer">
    <div class="abs" style="left:190px;top:270px;right:190px;bottom:270px;display:flex;flex-direction:column;justify-content:space-between">
      <div style="display:flex;justify-content:space-between;align-items:center">
        ${`<div class="mark" style="position:static">${logo(v.fg)}<span>makerslounge</span></div>`}
        <div class="eyebrow">Meetup</div>
      </div>
      <div class="num" style="font-size:380px;text-align:center">${NUMBER}</div>
      <div style="display:flex;justify-content:space-between;align-items:flex-end">
        <div><div class="tag">Build. Connect. Create.</div>${dateLine("")}</div>
        <div class="rsvp">luma.com/makermonday3</div>
      </div>
    </div>
  </div>`,
  // The mark under the spotlight, the number below it.
  stage: (v) => `<div class="layer shadow">
    <div class="abs eyebrow" style="left:0;right:0;top:64px;text-align:center">makerslounge · Maker Mondays</div>
    <div class="abs" style="left:0;right:0;top:250px;text-align:center;filter:drop-shadow(0 0 40px rgba(58,159,243,0.7))">${logo(v.fg).replace("<svg", '<svg style="height:300px"')}</div>
    <div class="abs" style="left:0;right:0;top:600px;text-align:center">
      <div class="word" style="font-size:88px">Meetup</div>
      <div class="num" style="font-size:230px;margin-top:8px">${NUMBER}</div>
    </div>
    <div class="abs" style="left:0;right:0;bottom:72px;text-align:center">
      <div class="tag" style="margin-bottom:10px">Build. Connect. Create.</div>
      ${dateLine("")}
      <div class="rsvp" style="margin-top:14px">RSVP · luma.com/makermonday3</div>
    </div>
  </div>`,
};

// Foreground colour per layout; the variants' palettes are decided in variants.mjs.
const FG = { sun: "#1B1B23", "center-light": "#FFFFFF", "corner-light": "#FFFFFF", "topleft-dark": "#1B1B23", card: "#0B1A3A", stage: "#FFFFFF" };

const browser = await chromium.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" });
const tab = await browser.newPage({ viewport: { width: 1080, height: 1080 }, deviceScaleFactor: 1 });

mkdirSync(OUT, { recursive: true });
const readme = [];
for (const v of VARIANTS) {
  if (only.length && !only.includes(v.id)) continue;
  const variant = { ...v, fg: FG[v.layout] };
  const dir = `${FRAMES_DIR}/${v.id}`;
  const frames = readdirSync(dir).filter((f) => f.endsWith(".png")).sort();
  const tmp = `${OUT}/.frames-${v.id}`;
  mkdirSync(tmp, { recursive: true });
  for (let i = 0; i < frames.length; i++) {
    const bg = "data:image/png;base64," + readFileSync(`${dir}/${frames[i]}`).toString("base64");
    await tab.setContent(page(variant, bg), { waitUntil: "load" });
    if (i === 0) await tab.evaluate(() => document.fonts.ready);
    const buf = await tab.screenshot({ type: "png" });
    writeFileSync(`${tmp}/${String(i).padStart(3, "0")}.png`, buf);
    if (i === 0) writeFileSync(`${OUT}/${v.id}.png`, buf);
  }
  if (frames.length > 1) {
    execFileSync("ffmpeg", ["-loglevel", "error", "-y", "-framerate", String(FPS), "-i", `${tmp}/%03d.png`,
      // Ordered dither keeps the pattern stable between frames, which is what
      // keeps a grainy gradient loop under a few MB; error diffusion shimmers.
      "-vf", `scale=${GIF_SIZE}:-1:flags=lanczos,split[a][b];[a]palettegen=max_colors=128:stats_mode=full[p];[b][p]paletteuse=dither=bayer:bayer_scale=3`,
      "-loop", "0", `${OUT}/${v.id}.gif`]);
  }
  execFileSync("rm", ["-rf", tmp]);
  readme.push(`- **${v.title}** (\`${v.id}\`) — ${v.note}`);
  console.log(v.id, "still + gif");
}
await browser.close();
writeFileSync(`${OUT}/README.md`, `# Luma covers — Meetup ${NUMBER}\n\nGenerated by \`scripts/luma-cover/\` (vgpu backdrops + Figtree type). Stills are 1080x1080 PNG, loops are ${GIF_SIZE}px GIFs at ${FPS} fps.\n\n${readme.join("\n")}\n`);
