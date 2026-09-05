// Renders the shader backgrounds for the Luma cover variants, headlessly, with
// vgpu (Dawn on Metal). Each variant is a fullscreen WGSL effect driven by a
// loop phase `time` in [0, 1); every animated term goes through sin/cos of
// TAU * time, so frame N and frame 0 join seamlessly in a GIF.
//
//   OUT=/tmp/frames FRAMES=36 SIZE=1080 node --experimental-strip-types \
//     --no-warnings scripts/luma-cover/render-frames.mts [variant ...]
//
// Writes <OUT>/<variant>/<frame>.png. Typography and the logo are laid over
// these in compose.mjs; the shader only ever paints the backdrop.
import { mkdirSync, writeFileSync } from "node:fs";
// @ts-expect-error pngjs ships no types; dev-only script.
import { PNG } from "pngjs";
import { init, effect, target } from "vgpu/node";
import { VARIANTS } from "./variants.mjs";

const out = process.env.OUT ?? "./luma-frames";
const FRAMES = Number(process.env.FRAMES ?? 36);
const SIZE = Number(process.env.SIZE ?? 1080);
const only = process.argv.slice(2);

const gpu = await init();
const t = target(gpu, { size: [SIZE, SIZE], format: "rgba8unorm" });

for (const v of VARIANTS) {
  if (only.length && !only.includes(v.id)) continue;
  mkdirSync(`${out}/${v.id}`, { recursive: true });
  const fx = effect(gpu, v.wgsl, {
    // No variant sets `seed` today (the WGSL uniform exists for future use), so the
    // inferred type from variants.mjs lacks it and `next build`'s tsc pass failed here.
    set: { p: { time: 0, aspect: 1, seed: (v as { seed?: number }).seed ?? 0, pad: 0, res: [SIZE, SIZE], pad2: [0, 0], c0: v.colors[0], c1: v.colors[1], c2: v.colors[2], c3: v.colors[3] } },
  });
  const started = Date.now();
  for (let i = 0; i < FRAMES; i++) {
    fx.set({ p: { time: i / FRAMES } });
    fx.draw(t);
    const px = await t.read();
    const png = new PNG({ width: SIZE, height: SIZE });
    png.data.set(px);
    for (let k = 3; k < SIZE * SIZE * 4; k += 4) png.data[k] = 255;
    writeFileSync(`${out}/${v.id}/${String(i).padStart(3, "0")}.png`, PNG.sync.write(png));
  }
  console.log(v.id, FRAMES, "frames", ((Date.now() - started) / 1000).toFixed(1) + "s");
}
gpu.dispose();
