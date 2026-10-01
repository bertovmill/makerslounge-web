// Headless check of the hero's member field (src/components/landing/member-light-scene.ts).
// Runs the full radiance-cascade chain on Dawn and writes light and dark PNGs
// at a few points in the loop, so the shader can be judged from real pixels:
//
//   OUT=/tmp node --experimental-strip-types --no-warnings scripts/render-member-light.mts
//   TIMES=1,4,7 MEMBERS=300 ...
//
// Needs `npx vgpu doctor` to report healthy (Dawn on Metal here). The scene
// module takes vgpu as an argument and imports only types, which is what lets
// it load here without the browser build of vgpu.
import { writeFileSync } from "node:fs";
// @ts-expect-error pngjs ships no types; this is a dev-only check script.
import { PNG } from "pngjs";
import { effect, frame, init, sampler, target } from "vgpu/node";
// Node needs the .ts extension; the app's bundler-style tsconfig rejects it.
// @ts-expect-error TS5097
import { CENTRE, DIRECTION_BASE, MAX_SCENE_EDGE, PRESENT_WGSL, createScene, lightingPasses, memberGeometry, memberLook, prepareScene, scaledSize } from "../src/components/landing/member-light-scene.ts";

const out = process.env.OUT ?? ".";
const W = Number(process.env.W ?? 1440);
const H = Number(process.env.H ?? 900);
const members = Number(process.env.MEMBERS ?? 142);
const times = (process.env.TIMES ?? "1.5,4,7,9.8").split(",").map(Number);

const palettes = {
  light: { paper: "#FBF8F2", ink: "#1B1B23", "blue-deep": "#0E3F7E", "blue-core": "#1A6FD4", "blue-light": "#9DCBF2" },
  dark: { paper: "#16171F", ink: "#EFE7D9", "blue-deep": "#0B2F60", "blue-core": "#4A9FE5", "blue-light": "#9DCBF2" },
} as const;

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.replace("#", ""), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

const gpu = await init();
const sceneSize = scaledSize(W, H, MAX_SCENE_EDGE);
const scene = createScene({ effect, target }, gpu, sceneSize);
await prepareScene(scene);
const samp = sampler(gpu, { minFilter: "linear", magFilter: "linear", addressModeU: "clamp-to-edge", addressModeV: "clamp-to-edge" });
const outTarget = target(gpu, { size: [W, H], format: "rgba8unorm" });
const present = effect(gpu, PRESENT_WGSL, { blend: "premultiplied" });

const params = (time: number, res: readonly [number, number]) => ({
  res,
  centre: CENTRE,
  time,
  ...memberGeometry(members, res[0] / res[1]),
});

for (const time of times) {
  const passes = lightingPasses(scene, params(time, scene.size), samp);
  frame(gpu, (f) => {
    for (const p of passes) f.pass({ target: p.target, clear: [0, 0, 0, 0] }, p.effect);
  });

  for (const [name, palette] of Object.entries(palettes)) {
    const read = (v: string) => [...hexToRgb(palette[v.slice(2) as keyof typeof palette]), 1] as [number, number, number, number];
    const look = memberLook(name === "dark", read);
    present.set({
      m: params(time, [W, H]),
      look: {
        glow_lo: look.glow_lo,
        glow_hi: look.glow_hi,
        dot_lit: look.dot_lit,
        dot_idle: look.dot_idle,
        shape: [look.exposure, look.glowAlpha, 1, DIRECTION_BASE],
      },
      cascade_tex: scene.cascades[0],
      emitter_tex: scene.emitter,
    });
    frame(gpu, (f) => f.pass({ target: outTarget, clear: [0, 0, 0, 0] }, present));
    const px = await outTarget.read();

    // Composite over the paper colour so the PNG shows what the page will.
    // Clamp: png.data is a Buffer and an over-255 sum would wrap to near zero.
    const paper = hexToRgb(palette.paper).map((v) => v * 255);
    const png = new PNG({ width: W, height: H });
    let glowPx = 0;
    let maxA = 0;
    for (let i = 0; i < W * H; i++) {
      const a = px[i * 4 + 3] / 255;
      if (a > 0.04) glowPx++;
      maxA = Math.max(maxA, a);
      for (let k = 0; k < 3; k++) png.data[i * 4 + k] = Math.min(255, Math.round(px[i * 4 + k] + paper[k] * (1 - a)));
      png.data[i * 4 + 3] = 255;
    }
    const file = `${out}/member-light-${name}-t${time}.png`;
    writeFileSync(file, PNG.sync.write(png));
    console.log(file, "covered", ((glowPx / (W * H)) * 100).toFixed(1) + "%", "max alpha", maxA.toFixed(2));
  }
}
gpu.dispose();
