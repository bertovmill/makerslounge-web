/**
 * The MakersLounge mark as a field of halftone dots.
 *
 * The idea comes from vgpu's instancing and flare examples — a mark made of
 * many small elements that respond to the viewer — translated into the flat
 * motif: no glow, no gradient, just a grid of solid dots in two brand blues
 * that breathe gently, scatter away from the cursor, and settle back.
 *
 * The mark itself is rasterised once from the logo's SVG path into a small
 * coverage mask (a storage buffer of floats), so the shader stays a single
 * fullscreen pass with no texture upload.
 */
import { clock, effect, storage, surface } from "vgpu";
import type { Gpu } from "vgpu";
import { LOGO_PATH, LOGO_VIEWBOX } from "@/components/AnimatedLogo";
import { WGSL_COMMON, aspectOf, runWhileVisible, themeColor } from "./gpu";
import type { GpuCanvasHandle } from "./use-gpu-canvas";

const MASK = 160;

export const LOGO_DOTS_WGSL = /* wgsl */ `
struct Params {
  time: f32,
  aspect: f32,
  strength: f32,
  cell: f32,
  pointer: vec2f,
  res: vec2f,
  a: vec4f,
  b: vec4f,
}
@group(0) @binding(0) var<uniform> p: Params;
@group(0) @binding(1) var<storage, read> mask: array<f32>;

${WGSL_COMMON}

const N: f32 = ${MASK}.0;

fn maskAt(uv: vec2f) -> f32 {
  if (uv.x < 0.0 || uv.y < 0.0 || uv.x >= 1.0 || uv.y >= 1.0) { return 0.0; }
  let ix = u32(uv.x * N);
  let iy = u32(uv.y * N);
  return mask[iy * u32(N) + ix];
}

@fragment fn fs_main(@location(0) uv: vec2f) -> @location(0) vec4f {
  let px = uv * p.res;
  let cell = floor(px / p.cell);
  let h = hash21(cell + 7.0);
  var centre = (cell + 0.5) * p.cell;          // cell centre, device px
  let cuv = centre / p.res;                    // and in uv

  // Push away from the pointer. Sampling the mask *toward* the pointer moves
  // the drawn mark outward, so dots near the cursor scatter.
  let asp = vec2f(p.aspect, 1.0);
  let d = (cuv - p.pointer) * asp;
  let dist = length(d);
  let push = p.strength * 0.16 * exp(-dist * dist / 0.05);
  let dir = d / max(dist, 1e-4);
  let sampleUv = cuv - dir * push / asp;

  let m = maskAt(sampleUv);

  // Dots breathe, and the scattered ones jitter a little as they fly.
  let breathe = 0.82 + 0.18 * sin(p.time * 1.4 + h * 6.2832);
  let jitter = (vec2f(hash21(cell + 1.0), hash21(cell + 2.0)) - 0.5) * push * 40.0;
  centre += jitter;
  let radius = p.cell * 0.5 * (0.55 + 0.45 * m) * breathe;

  // No early return above: fill() takes a derivative, and WGSL's uniformity
  // analysis rejects derivatives after non-uniform control flow.
  let sd = length(px - centre) - radius;
  let a = fill(sd) * step(0.5, m);
  let col = select(p.a.rgb, p.b.rgb, h > 0.6);
  return vec4f(col * a, a);
}
`;

/** Rasterises the logo path into an N×N coverage mask in [0, 1]. */
function buildMask(): Float32Array {
  const canvas = document.createElement("canvas");
  canvas.width = MASK;
  canvas.height = MASK;
  const ctx = canvas.getContext("2d");
  const out = new Float32Array(MASK * MASK);
  if (!ctx) return out;

  const [vw, vh] = LOGO_VIEWBOX;
  const scale = (MASK * 0.92) / Math.max(vw, vh);
  ctx.translate((MASK - vw * scale) / 2, (MASK - vh * scale) / 2);
  ctx.scale(scale, scale);
  ctx.fillStyle = "#000";
  ctx.fill(new Path2D(LOGO_PATH), "evenodd");

  const data = ctx.getImageData(0, 0, MASK, MASK).data;
  for (let i = 0; i < MASK * MASK; i++) out[i] = data[i * 4 + 3] / 255;
  return out;
}

export function startLogoDots(gpu: Gpu, canvas: HTMLCanvasElement): GpuCanvasHandle {
  const canvasSurface = surface(gpu, canvas, {
    dpr: [1, 2],
    alphaMode: "premultiplied",
    clearColor: [0, 0, 0, 0],
  });

  const maskBuffer = storage(gpu, MASK * MASK * 4, "read");
  maskBuffer.write(buildMask().buffer as ArrayBuffer);

  const colors = () => ({
    a: themeColor("--blue-core", "#1A6FD4"),
    b: themeColor("--blue-mid", "#4A9FE5"),
  });

  const cellFor = () => Math.max(3, Math.round(canvasSurface.size[0] / 34));

  const dots = effect(gpu, LOGO_DOTS_WGSL, {
    label: "logo-dots",
    blend: "premultiplied",
    set: {
      p: {
        time: 0,
        aspect: aspectOf(canvasSurface.size),
        strength: 0,
        cell: cellFor(),
        pointer: [-10, -10],
        res: canvasSurface.size,
        ...colors(),
      },
      mask: maskBuffer,
    },
  });

  const unResize = canvasSurface.onResize(() => {
    dots.set({ p: { aspect: aspectOf(canvasSurface.size), res: canvasSurface.size, cell: cellFor() } });
  });

  // Pointer in canvas uv. Strength rises while the cursor is near the mark
  // and eases back to zero when it leaves, so the dots settle home.
  const pointer = [-10, -10];
  let targetStrength = 0;
  let strength = 0;
  const onPointer = (e: PointerEvent) => {
    const r = canvas.getBoundingClientRect();
    pointer[0] = (e.clientX - r.left) / r.width;
    pointer[1] = (e.clientY - r.top) / r.height;
    const near = pointer[0] > -0.8 && pointer[0] < 1.8 && pointer[1] > -0.8 && pointer[1] < 1.8;
    targetStrength = near ? 1 : 0;
  };
  const onLeave = () => {
    targetStrength = 0;
  };
  window.addEventListener("pointermove", onPointer, { passive: true });
  document.addEventListener("pointerleave", onLeave);

  const time = clock(gpu);
  const stopLoop = runWhileVisible(gpu, canvas, (frame) => {
    strength += (targetStrength - strength) * (targetStrength > strength ? 0.12 : 0.05);
    dots.set({ p: { time: time.time, pointer, strength } });
    frame.pass(canvasSurface, dots);
  });

  return {
    setColors() {
      dots.set({ p: colors() });
    },
    stop() {
      window.removeEventListener("pointermove", onPointer);
      document.removeEventListener("pointerleave", onLeave);
      unResize();
      stopLoop();
      canvasSurface.dispose();
    },
  };
}
