// Headless check of the landing hero shader (src/components/landing/hero-field.ts).
// Renders one light and one dark frame to PNG so the shader can be judged from
// real pixels without a browser:
//
//   OUT=/tmp node --experimental-strip-types --no-warnings scripts/render-hero-field.mts
//   SCROLL=0.6 ...   renders the sun part-way through setting
//
// Needs `npx vgpu doctor` to report healthy (Dawn on Metal here).
//
// The shader source is read as text rather than imported: the app modules
// import the browser build of vgpu, and running them under Node (via tsx or
// strip-types) either transpiles them to CommonJS, which vgpu's ESM-only
// packages refuse, or fails to resolve extensionless imports. Reading the
// two template literals keeps this script honest without touching the app.
import { readFileSync, writeFileSync } from "node:fs";
// @ts-expect-error pngjs ships no types; this is a dev-only check script.
import { PNG } from "pngjs";
import { init, effect, target } from "vgpu/node";

const out = process.env.OUT ?? ".";
const W = 1440, H = 720;

function template(file: string, name: string): string {
  const src = readFileSync(new URL(`../src/components/landing/${file}`, import.meta.url), "utf8");
  const m = src.match(new RegExp(`${name} = /\\* wgsl \\*/ \`([\\s\\S]*?)\`;`));
  if (!m) throw new Error(`${name} not found in ${file}`);
  return m[1];
}
const common = template("gpu.ts", "WGSL_COMMON");
const HERO_FIELD_WGSL = template("hero-field.ts", "HERO_FIELD_WGSL").replace("${WGSL_COMMON}", common);

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.replace("#", ""), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

const gpu = await init();
const t = target(gpu, { size: [W, H], format: "rgba8unorm" });

const themes = {
  light: { paper: "#FBF8F2", sun: "#CBE4F8", accent: "#1A6FD4" },
  dark: { paper: "#16171F", sun: "#17304E", accent: "#4A9FE5" },
};

for (const [name, th] of Object.entries(themes)) {
  const fx = effect(gpu, HERO_FIELD_WGSL, {
    set: { p: { time: 3.2, aspect: W / H, scroll: Number(process.env.SCROLL ?? 0), pad: 0, pointer: [0.62, 0.4], res: [W, H], sun: [...hexToRgb(th.sun), 1], accent: [...hexToRgb(th.accent), 1] } },
  });
  fx.draw(t);
  const px = await t.read();
  // Composite over the paper colour so the PNG shows what the page will.
  const paper = hexToRgb(th.paper).map((v) => v * 255);
  const png = new PNG({ width: W, height: H });
  for (let i = 0; i < W * H; i++) {
    const a = px[i * 4 + 3] / 255;
    for (let k = 0; k < 3; k++) png.data[i * 4 + k] = Math.round(px[i * 4 + k] + paper[k] * (1 - a));
    png.data[i * 4 + 3] = 255;
  }
  writeFileSync(`${out}/hero-${name}.png`, PNG.sync.write(png));
  const covered = Array.from({ length: W * H }, (_, i) => px[i * 4 + 3] > 128).filter(Boolean).length;
  console.log(name, "coverage", (covered / (W * H) * 100).toFixed(1) + "%");
}
gpu.dispose();
