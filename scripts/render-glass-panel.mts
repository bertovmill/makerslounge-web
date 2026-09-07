// Headless check of the glass panel shader (src/components/landing/glass-panel.ts).
// Renders a light and a dark card to PNG so the refraction can be judged from
// real pixels without a browser:
//
//   OUT=/tmp node --experimental-strip-types --no-warnings scripts/render-glass-panel.mts
//   IOR=1.6 DISPERSION=2 ...   pushes the bend and the colour fringe
//
// Needs `npx vgpu doctor` to report healthy (Dawn on Metal here).
//
// Shader source is read as text rather than imported, for the same reason as
// render-hero-field.mts: the app modules import the browser build of vgpu.
import { readFileSync, writeFileSync } from "node:fs";
// @ts-expect-error pngjs ships no types; this is a dev-only check script.
import { PNG } from "pngjs";
import { init, effect, target } from "vgpu/node";

const out = process.env.OUT ?? ".";
const W = 520, H = 340;

function template(file: string, name: string): string {
  const src = readFileSync(new URL(`../src/components/landing/${file}`, import.meta.url), "utf8");
  const m = src.match(new RegExp(`${name} = /\\* wgsl \\*/ \`([\\s\\S]*?)\`;`));
  if (!m) throw new Error(`${name} not found in ${file}`);
  return m[1];
}
const common = template("gpu.ts", "WGSL_COMMON");
const GLASS_PANEL_WGSL = template("glass-panel.ts", "GLASS_PANEL_WGSL").replace("${WGSL_COMMON}", common);

function rgba(hex: string): [number, number, number, number] {
  const n = parseInt(hex.replace("#", ""), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255, 1];
}

const gpu = await init();
const t = target(gpu, { size: [W, H], format: "rgba8unorm" });

const themes = {
  light: { paper: "#FBF8F2", card: "#FFFDF7", pale: "#DDEBF9", lightBlue: "#9DCBF2", core: "#1A6FD4" },
  dark: { paper: "#16171F", card: "#1B1D26", pale: "#1D2E44", lightBlue: "#9DCBF2", core: "#4A9FE5" },
};

for (const [name, th] of Object.entries(themes)) {
  // No `blend` here, unlike the app: this draws to a fresh offscreen target
  // rather than compositing onto a page, and blending against an uninitialised
  // target loses the alpha we want to read back.
  const fx = effect(gpu, GLASS_PANEL_WGSL, {
    set: {
      p: {
        time: 4.1,
        aspect: W / H,
        radius: Number(process.env.RADIUS ?? 0.12),
        bevel: Number(process.env.BEVEL ?? 0.1),
        ior: Number(process.env.IOR ?? 1.42),
        dispersion: Number(process.env.DISPERSION ?? 1),
        hover: Number(process.env.HOVER ?? 0),
        pad: 0,
        res: [W, H],
        seed: [1.7, 0.4],
        tintA: rgba(th.card),
        tintB: rgba(th.pale),
        tintC: rgba(th.lightBlue),
        rim: rgba(th.core),
      },
    },
  });
  fx.draw(t);
  const px = await t.read();

  // Composite over the paper colour so the PNG shows what the page will.
  const paper = rgba(th.paper).slice(0, 3).map((v) => v * 255);
  const png = new PNG({ width: W, height: H });
  for (let i = 0; i < W * H; i++) {
    const a = px[i * 4 + 3] / 255;
    // Clamp: png.data is a Buffer, so an over-255 sum would wrap to near zero
    // and show up as saturated colour speckle that looks like a shader bug.
    for (let k = 0; k < 3; k++) {
      png.data[i * 4 + k] = Math.min(255, Math.round(px[i * 4 + k] + paper[k] * (1 - a)));
    }
    png.data[i * 4 + 3] = 255;
  }
  writeFileSync(`${out}/glass-${name}.png`, PNG.sync.write(png));

  // Two assertions worth making from pixels rather than eyes: the rounded
  // corner is actually cut (corner pixel transparent), and the bevel is doing
  // something the flat interior is not (edge band varies more than the middle).
  const at = (x: number, y: number) => px.slice((y * W + x) * 4, (y * W + x) * 4 + 4);
  const spread = (xs: number[][]) => {
    const lum = xs.map(([r, g, b]) => 0.2126 * r + 0.7152 * g + 0.0722 * b);
    return Math.max(...lum) - Math.min(...lum);
  };
  const band = Array.from({ length: 60 }, (_, i) => [...at(6 + i, Math.round(H / 2))]);
  const middle = Array.from({ length: 60 }, (_, i) => [...at(Math.round(W / 2) - 30 + i, Math.round(H / 2))]);
  console.log(
    name,
    "corner alpha", at(1, 1)[3],
    "| edge spread", spread(band).toFixed(1),
    "| interior spread", spread(middle).toFixed(1),
  );
}
gpu.dispose();
