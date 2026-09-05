/**
 * The landing hero's "sun", drawn on the GPU.
 *
 * This replaces the static `Arc tone="sun"` disc with a WebGPU effect that
 * speaks the same flat editorial language: one hard-edged disc of solid
 * colour, no gradients, no blur. What the GPU adds is life — the rim breathes
 * on a slow noise field, the interior carries a halftone of accent dots that
 * thicken toward the edge (a print-style falloff instead of a gradient), and a
 * faint film grain sits over the whole disc.
 *
 * The shader is an inline WGSL string rather than a `.wgsl` file so the
 * `withEve()`-wrapped `next.config.ts` needs no loader wiring. Colours are
 * uniforms read from the theme's CSS variables, so the disc follows light and
 * dark mode without a second shader.
 *
 * `startHeroField` is a plain function on purpose: the React component only
 * owns the canvas and the fallback decision.
 */
import { clock, effect, frameLoop, init, surface } from "vgpu";
import type { FrameLoopHandle } from "vgpu";

export const HERO_FIELD_WGSL = /* wgsl */ `
struct Params {
  time: f32,
  aspect: f32,
  pointer: vec2f,
  res: vec2f,
  sun: vec4f,
  accent: vec4f,
}
@group(0) @binding(0) var<uniform> p: Params;

fn hash21(q: vec2f) -> f32 {
  var v = fract(q * vec2f(0.1031, 0.1030));
  v += dot(v, v.yx + 33.33);
  return fract((v.x + v.y) * v.x);
}

// Value noise, smooth enough for a rim that breathes rather than jitters.
fn vnoise(q: vec2f) -> f32 {
  let i = floor(q);
  let f = fract(q);
  let u = f * f * (3.0 - 2.0 * f);
  let a = hash21(i);
  let b = hash21(i + vec2f(1.0, 0.0));
  let c = hash21(i + vec2f(0.0, 1.0));
  let d = hash21(i + vec2f(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

fn fbm(q: vec2f) -> f32 {
  var s = 0.0;
  var amp = 0.5;
  var pos = q;
  for (var k = 0; k < 3; k++) {
    s += amp * vnoise(pos);
    pos = pos * 2.1 + vec2f(17.0, 9.0);
    amp *= 0.5;
  }
  return s;
}

// 4x4 ordered (Bayer) threshold in [0, 1). Halftone without a texture.
fn bayer4(px: vec2f) -> f32 {
  var m = array<f32, 16>(
     0.0,  8.0,  2.0, 10.0,
    12.0,  4.0, 14.0,  6.0,
     3.0, 11.0,  1.0,  9.0,
    15.0,  7.0, 13.0,  5.0,
  );
  let x = u32(px.x) % 4u;
  let y = u32(px.y) % 4u;
  return (m[y * 4u + x] + 0.5) / 16.0;
}

@fragment fn fs_main(@location(0) uv: vec2f) -> @location(0) vec4f {
  // Centred, aspect-corrected coordinates: y spans [-0.5, 0.5].
  let q = (uv - 0.5) * vec2f(p.aspect, 1.0);
  let px = uv * p.res;

  // The disc sits high, like the reference "sun", drifts very slowly, and
  // leans a touch toward the pointer.
  let drift = 0.015 * vec2f(sin(p.time * 0.11), cos(p.time * 0.09));
  let lean = (p.pointer - 0.5) * vec2f(p.aspect, 1.0) * 0.035;
  let c = vec2f(0.0, -0.12) + drift + lean;

  let d = q - c;
  let r = length(d);
  let dir = d / max(r, 1e-4);

  // Rim breathes on a noise field sampled around the circle (seamless).
  let wob = fbm(dir * 1.6 + vec2f(p.time * 0.05, -p.time * 0.03)) - 0.5;
  let radius = 0.42 * (1.0 + 0.045 * wob);

  // Hard edge, one pixel of anti-aliasing.
  let aa = max(fwidth(r), 1e-4);
  let inside = 1.0 - smoothstep(radius - aa, radius + aa, r);

  // Halftone: accent dots that thicken toward the rim. Kept sparse — the
  // headline sits on this disc, so the fill has to stay mostly the sun colour.
  let t = clamp(r / radius, 0.0, 1.0);
  let density = smoothstep(0.62, 1.08, t) * 0.2;
  let dots = step(bayer4(px * 0.5), density);

  // Slow film grain: 12 steps a second, so it reads as texture not static.
  let grain = (hash21(floor(px * 0.5) + floor(p.time * 12.0)) - 0.5) * 0.05;

  let col = mix(p.sun.rgb, p.accent.rgb, dots * 0.7) + vec3f(grain);
  let a = inside;
  return vec4f(col * a, a);
}
`;

export interface HeroFieldColors {
  /** Disc fill, `--motif-sun`. */
  sun: readonly [number, number, number];
  /** Halftone dot colour, `--blue-core`. */
  accent: readonly [number, number, number];
}

export interface HeroFieldHandle {
  setColors(colors: HeroFieldColors): void;
  stop(): void;
}

/**
 * Starts the effect on `canvas`. Resolves to a handle once the first frame is
 * scheduled, or rejects when WebGPU is unavailable — the caller then shows
 * the static fallback. Calling `stop()` before init settles is safe.
 */
export async function startHeroField(
  canvas: HTMLCanvasElement,
  colors: HeroFieldColors,
): Promise<HeroFieldHandle> {
  let disposed = false;

  const gpu = await init();
  if (disposed) {
    gpu.dispose();
    throw new Error("hero field stopped before init settled");
  }

  const canvasSurface = surface(gpu, canvas, {
    dpr: [1, 2],
    alphaMode: "premultiplied",
    clearColor: [0, 0, 0, 0],
  });

  const field = effect(gpu, HERO_FIELD_WGSL, {
    label: "hero-field",
    blend: "premultiplied",
    set: {
      p: {
        time: 0,
        aspect: aspectOf(canvasSurface.size),
        pointer: [0.5, 0.5],
        res: canvasSurface.size,
        sun: [...colors.sun, 1],
        accent: [...colors.accent, 1],
      },
    },
  });

  canvasSurface.onResize(() => {
    field.set({ p: { aspect: aspectOf(canvasSurface.size), res: canvasSurface.size } });
  });

  // Pointer, smoothed so the lean feels like weight rather than tracking.
  const target = [0.5, 0.5];
  const pointer = [0.5, 0.5];
  const onPointer = (e: PointerEvent) => {
    target[0] = e.clientX / window.innerWidth;
    target[1] = e.clientY / window.innerHeight;
  };
  window.addEventListener("pointermove", onPointer, { passive: true });

  const time = clock(gpu);
  const loop: FrameLoopHandle = frameLoop(gpu, (frame) => {
    pointer[0] += (target[0] - pointer[0]) * 0.04;
    pointer[1] += (target[1] - pointer[1]) * 0.04;
    field.set({ p: { time: time.time, pointer } });
    frame.pass(canvasSurface, field);
  });

  return {
    setColors(next) {
      field.set({ p: { sun: [...next.sun, 1], accent: [...next.accent, 1] } });
    },
    stop() {
      if (disposed) return;
      disposed = true;
      window.removeEventListener("pointermove", onPointer);
      loop.stop();
      gpu.dispose();
    },
  };
}

function aspectOf(size: readonly [number, number]): number {
  return size[1] === 0 ? 1 : size[0] / size[1];
}

/** `#rrggbb` → linear-ish [r, g, b] in 0..1. sRGB is close enough for flat fills. */
export function hexToRgb(hex: string): [number, number, number] {
  const h = hex.trim().replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const n = parseInt(full, 16);
  if (Number.isNaN(n) || full.length !== 6) return [0.8, 0.9, 0.97];
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}
