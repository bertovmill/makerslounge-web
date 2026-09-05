/**
 * The four value cards, alive.
 *
 * Each panel is the same composition as its CSS `ValueArt` fallback — the
 * bolt, the rising sun, the three circles, the confetti — drawn as signed
 * distance fields so it can move: the bolt flickers, the sun rises and sets,
 * the circles drift and overlap, the sparkles twinkle. Solid brand blues,
 * hard edges, nothing else.
 */
import { clock, effect, surface } from "vgpu";
import type { Gpu } from "vgpu";
import type { ValueKey } from "./ValueArt";
import { WGSL_COMMON, aspectOf, runWhileVisible, themeColor } from "./gpu";
import type { GpuCanvasHandle } from "./use-gpu-canvas";

const HEADER = /* wgsl */ `
struct Params {
  time: f32,
  aspect: f32,
  pad: vec2f,
  res: vec2f,
  pad2: vec2f,
  pale: vec4f,
  core: vec4f,
  mid: vec4f,
  deep: vec4f,
  light: vec4f,
}
@group(0) @binding(0) var<uniform> p: Params;

${WGSL_COMMON}

// Centred, aspect-corrected coordinates: y in [-0.5, 0.5], y down.
fn coords(uv: vec2f) -> vec2f {
  return (uv - 0.5) * vec2f(p.aspect, 1.0);
}
`;

const BODIES: Record<ValueKey, string> = {
  // A bolt: two hard blocks stepped across the panel. Every few seconds the
  // bolt jumps for a frame or two — a flicker, not a wobble.
  hustle: /* wgsl */ `
@fragment fn fs_main(@location(0) uv: vec2f) -> @location(0) vec4f {
  let q = coords(uv);
  let period = 2.7;
  let seg = floor(p.time / period);
  let ph = fract(p.time / period);
  let flick = step(ph, 0.05) + step(ph, 0.11) * step(0.08, ph);
  let jump = (vec2f(hash21(vec2f(seg, 1.0)), hash21(vec2f(seg, 2.0))) - 0.5) * 0.06 * flick;

  let hb = vec2f(0.30, 0.052);
  let a = sdBox(rot(-0.49) * (q - vec2f(-0.15, 0.10) - jump), hb);
  let b = sdBox(rot(-0.49) * (q - vec2f(0.15, -0.14) - jump * 0.6), hb);
  let spark = sdSparkle(q - vec2f(0.46, -0.32), 0.045 * (0.7 + 0.3 * sin(p.time * 2.3)));

  var col = p.pale.rgb;
  col = mix(col, p.core.rgb, fill(a));
  col = mix(col, p.deep.rgb, fill(b));
  col = mix(col, p.core.rgb, fill(spark) * (0.5 + 0.5 * step(0.3, fract(p.time * 0.9))));
  return vec4f(col, 1.0);
}
`,
  // A sun that rises over the horizon, hangs, and sets, on a slow loop. Dots
  // gather where it meets the ground.
  learning: /* wgsl */ `
@fragment fn fs_main(@location(0) uv: vec2f) -> @location(0) vec4f {
  let q = coords(uv);
  let px = uv * p.res;
  let phase = 0.5 + 0.5 * sin(p.time * 0.32);
  let sunY = mix(0.14, -0.20, smoothstep(0.0, 1.0, phase));
  let sun = length(q - vec2f(0.0, sunY)) - 0.27;
  let ground = step(0.16, q.y);
  let spark = sdSparkle(q - vec2f(-0.46, -0.30), 0.04 * (0.6 + 0.4 * sin(p.time * 1.7 + 1.0)));

  // Halftone on the sun, thickening toward the horizon line.
  let near = smoothstep(0.30, 0.0, 0.16 - q.y);
  let dots = step(bayer4(px * 0.5), near * 0.5);

  var col = p.pale.rgb;
  col = mix(col, mix(p.core.rgb, p.deep.rgb, dots), fill(sun));
  col = mix(col, p.deep.rgb, ground);
  col = mix(col, p.light.rgb, fill(spark));
  return vec4f(col, 1.0);
}
`,
  // Three circles drifting on their own paths. Wherever they overlap, the
  // colour deepens — flat boolean, not transparency.
  community: /* wgsl */ `
@fragment fn fs_main(@location(0) uv: vec2f) -> @location(0) vec4f {
  let q = coords(uv);
  let t = p.time;
  let c1 = vec2f(-0.17, -0.07) + 0.05 * vec2f(sin(t * 0.50), cos(t * 0.37));
  let c2 = vec2f(0.15, -0.07) + 0.05 * vec2f(cos(t * 0.43 + 1.0), sin(t * 0.55 + 2.0));
  let c3 = vec2f(0.0, 0.15) + 0.05 * vec2f(sin(t * 0.39 + 3.0), cos(t * 0.47 + 1.5));
  let r = 0.22;
  let f1 = fill(length(q - c1) - r);
  let f2 = fill(length(q - c2) - r);
  let f3 = fill(length(q - c3) - r);
  let n = f1 + f2 + f3;

  var col = p.pale.rgb;
  col = mix(col, p.mid.rgb, f1);
  col = mix(col, p.core.rgb, f2);
  col = mix(col, p.core.rgb, f3 * 0.0 + f3);
  col = mix(col, p.deep.rgb, clamp(n - 1.0, 0.0, 1.0));
  return vec4f(col, 1.0);
}
`,
  // Confetti: sparkles in every size, each twinkling on its own beat.
  fun: /* wgsl */ `
fn twinkle(q: vec2f, at: vec2f, size: f32, speed: f32, phase: f32) -> f32 {
  let s = size * (0.72 + 0.28 * sin(p.time * speed + phase));
  return fill(sdSparkle(q - at, s));
}

@fragment fn fs_main(@location(0) uv: vec2f) -> @location(0) vec4f {
  let q = coords(uv);
  var col = p.pale.rgb;
  col = mix(col, p.core.rgb, twinkle(q, vec2f(-0.02, -0.16), 0.13, 1.3, 0.0));
  col = mix(col, p.deep.rgb, twinkle(q, vec2f(-0.44, -0.30), 0.06, 1.9, 1.1));
  col = mix(col, p.mid.rgb,  twinkle(q, vec2f(0.44, -0.24), 0.07, 1.6, 2.3));
  col = mix(col, p.deep.rgb, twinkle(q, vec2f(-0.36, 0.26), 0.05, 2.2, 3.1));
  col = mix(col, p.core.rgb, twinkle(q, vec2f(0.34, 0.30), 0.08, 1.4, 4.2));
  col = mix(col, p.mid.rgb,  twinkle(q, vec2f(0.08, 0.16), 0.04, 2.6, 5.0));
  return vec4f(col, 1.0);
}
`,
};

export function valueFieldSource(value: ValueKey): string {
  return HEADER + BODIES[value];
}

export function startValueField(value: ValueKey) {
  return (gpu: Gpu, canvas: HTMLCanvasElement): GpuCanvasHandle => {
    const canvasSurface = surface(gpu, canvas, { dpr: [1, 2] });

    const colors = () => ({
      pale: themeColor("--blue-pale", "#DDEBF9"),
      core: themeColor("--blue-core", "#1A6FD4"),
      mid: themeColor("--blue-mid", "#4A9FE5"),
      deep: themeColor("--blue-deep", "#0E3F7E"),
      light: themeColor("--blue-light", "#9DCBF2"),
    });

    const field = effect(gpu, valueFieldSource(value), {
      label: `value-${value}`,
      set: {
        p: {
          time: 0,
          aspect: aspectOf(canvasSurface.size),
          pad: [0, 0],
          res: canvasSurface.size,
          pad2: [0, 0],
          ...colors(),
        },
      },
    });

    const unResize = canvasSurface.onResize(() => {
      field.set({ p: { aspect: aspectOf(canvasSurface.size), res: canvasSurface.size } });
    });

    const time = clock(gpu);
    const stopLoop = runWhileVisible(gpu, canvas, (frame) => {
      field.set({ p: { time: time.time } });
      frame.pass(canvasSurface, field);
    });

    return {
      setColors() {
        field.set({ p: colors() });
      },
      stop() {
        unResize();
        stopLoop();
        canvasSurface.dispose();
      },
    };
  };
}
