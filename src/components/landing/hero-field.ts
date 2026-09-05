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
 * Scrolling sets the sun: as `scroll` goes 0 → 1 the disc sinks, shrinks, and
 * its halftone thickens until it is all dots, then fades out under Ask May.
 *
 * The shader is an inline WGSL string rather than a `.wgsl` file so the
 * `withEve()`-wrapped `next.config.ts` needs no loader wiring. Colours are
 * uniforms read from the theme's CSS variables, so the disc follows light and
 * dark mode without a second shader.
 */
import { clock, effect, surface } from "vgpu";
import type { Gpu } from "vgpu";
import { WGSL_COMMON, aspectOf, runWhileVisible, themeColor } from "./gpu";
import type { GpuCanvasHandle } from "./use-gpu-canvas";

export const HERO_FIELD_WGSL = /* wgsl */ `
struct Params {
  time: f32,
  aspect: f32,
  scroll: f32,
  pad: f32,
  pointer: vec2f,
  res: vec2f,
  sun: vec4f,
  accent: vec4f,
}
@group(0) @binding(0) var<uniform> p: Params;

${WGSL_COMMON}

@fragment fn fs_main(@location(0) uv: vec2f) -> @location(0) vec4f {
  // Centred, aspect-corrected coordinates: y spans [-0.5, 0.5].
  let q = (uv - 0.5) * vec2f(p.aspect, 1.0);
  let px = uv * p.res;
  let s = clamp(p.scroll, 0.0, 1.0);

  // The disc sits high, like the reference "sun", drifts very slowly, leans a
  // touch toward the pointer, and sinks as the page scrolls.
  let drift = 0.015 * vec2f(sin(p.time * 0.11), cos(p.time * 0.09));
  let lean = (p.pointer - 0.5) * vec2f(p.aspect, 1.0) * 0.035;
  let c = vec2f(0.0, -0.12 + 0.55 * s * s) + drift + lean;

  let d = q - c;
  let r = length(d);
  let dir = d / max(r, 1e-4);

  // Rim breathes on a noise field sampled around the circle (seamless).
  let wob = fbm(dir * 1.6 + vec2f(p.time * 0.05, -p.time * 0.03)) - 0.5;
  let radius = 0.42 * (1.0 - 0.3 * s) * (1.0 + 0.045 * wob);

  // Hard edge, one pixel of anti-aliasing.
  let aa = max(fwidth(r), 1e-4);
  let inside = 1.0 - smoothstep(radius - aa, radius + aa, r);

  // Halftone: accent dots that thicken toward the rim, and across the whole
  // disc as it sets. Kept sparse at rest — the headline sits on this disc.
  let t = clamp(r / radius, 0.0, 1.0);
  let rim = smoothstep(0.62, 1.08, t) * 0.2;
  let density = mix(rim, 0.55 + 0.35 * t, s);
  let dots = step(bayer4(px * 0.5), density);

  // Slow film grain: 12 steps a second, so it reads as texture not static.
  let grain = (hash21(floor(px * 0.5) + floor(p.time * 12.0)) - 0.5) * 0.05;

  let col = mix(p.sun.rgb, p.accent.rgb, dots * 0.7) + vec3f(grain);
  let a = inside * (1.0 - smoothstep(0.7, 1.0, s));
  return vec4f(col * a, a);
}
`;

export interface HeroFieldHandle extends GpuCanvasHandle {
  setScroll(progress: number): void;
}

export function startHeroField(gpu: Gpu, canvas: HTMLCanvasElement): HeroFieldHandle {
  const canvasSurface = surface(gpu, canvas, {
    dpr: [1, 2],
    alphaMode: "premultiplied",
    clearColor: [0, 0, 0, 0],
  });

  const colors = () => ({
    sun: themeColor("--motif-sun", "#CBE4F8"),
    accent: themeColor("--blue-core", "#1A6FD4"),
  });

  const field = effect(gpu, HERO_FIELD_WGSL, {
    label: "hero-field",
    blend: "premultiplied",
    set: {
      p: {
        time: 0,
        aspect: aspectOf(canvasSurface.size),
        scroll: 0,
        pad: 0,
        pointer: [0.5, 0.5],
        res: canvasSurface.size,
        ...colors(),
      },
    },
  });

  const unResize = canvasSurface.onResize(() => {
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

  let scroll = 0;
  const time = clock(gpu);
  const stopLoop = runWhileVisible(gpu, canvas, (frame) => {
    pointer[0] += (target[0] - pointer[0]) * 0.04;
    pointer[1] += (target[1] - pointer[1]) * 0.04;
    field.set({ p: { time: time.time, pointer, scroll } });
    frame.pass(canvasSurface, field);
  });

  return {
    setColors() {
      field.set({ p: colors() });
    },
    setScroll(progress) {
      scroll = progress;
    },
    stop() {
      window.removeEventListener("pointermove", onPointer);
      unResize();
      stopLoop();
      canvasSurface.dispose();
    },
  };
}
