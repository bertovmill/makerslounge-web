/**
 * The field behind Ask May.
 *
 * A quiet grid of halftone dots that sits under the prompt. When the textarea
 * has focus the grid brightens slightly; every keystroke sends a ring out
 * from the box that fades as it travels. It says "May is listening" without
 * a line of copy, and it is dots on paper — the same halftone the hero uses.
 */
import { clock, effect, surface } from "vgpu";
import type { Gpu } from "vgpu";
import { WGSL_COMMON, aspectOf, runWhileVisible, themeColor } from "./gpu";
import type { GpuCanvasHandle } from "./use-gpu-canvas";

const PULSES = 8;

export const MAY_FIELD_WGSL = /* wgsl */ `
struct Params {
  time: f32,
  aspect: f32,
  energy: f32,
  cell: f32,
  res: vec2f,
  pad: vec2f,
  accent: vec4f,
  ${Array.from({ length: PULSES }, (_, i) => `pulse${i}: vec4f,`).join("\n  ")}
}
@group(0) @binding(0) var<uniform> p: Params;

${WGSL_COMMON}

fn ring(pulse: vec4f, q: vec2f) -> f32 {
  let age = p.time - pulse.x;
  if (age <= 0.0 || age > 4.0) { return 0.0; }
  let origin = (pulse.yz - 0.5) * vec2f(p.aspect, 1.0);
  let dist = length(q - origin);
  let r = age * 0.38;
  let band = exp(-pow((dist - r) / 0.04, 2.0));
  return band * exp(-age * 1.5);
}

@fragment fn fs_main(@location(0) uv: vec2f) -> @location(0) vec4f {
  let px = uv * p.res;
  let cell = floor(px / p.cell);
  let centre = (cell + 0.5) * p.cell;
  let cuv = centre / p.res;
  let q = (cuv - 0.5) * vec2f(p.aspect, 1.0);
  let h = hash21(cell + 3.0);

  // Resting density: faint, and fading out toward every edge of the band.
  let edge = smoothstep(0.0, 0.18, cuv.y) * smoothstep(0.0, 0.18, 1.0 - cuv.y)
           * smoothstep(0.0, 0.12, cuv.x) * smoothstep(0.0, 0.12, 1.0 - cuv.x);
  var density = (0.05 + 0.08 * p.energy) * edge;
  density *= 0.8 + 0.2 * sin(p.time * 0.7 + h * 6.2832);

  // Keystroke rings.
  var rings = 0.0;
  ${Array.from({ length: PULSES }, (_, i) => `rings += ring(p.pulse${i}, q);`).join("\n  ")}
  density += min(rings, 1.2) * 0.45 * edge;

  let radius = p.cell * 0.5 * clamp(density, 0.0, 1.0);
  let sd = length(px - centre) - radius;
  let a = fill(sd) * 0.9;
  return vec4f(p.accent.rgb * a, a);
}
`;

export interface MayFieldHandle extends GpuCanvasHandle {
  /** Sends a ring out from a point given in canvas uv (0..1). */
  pulse(x: number, y: number): void;
  setEnergy(level: number): void;
}

export function startMayField(gpu: Gpu, canvas: HTMLCanvasElement): MayFieldHandle {
  const canvasSurface = surface(gpu, canvas, {
    dpr: [1, 2],
    alphaMode: "premultiplied",
    clearColor: [0, 0, 0, 0],
  });

  const colors = () => ({ accent: themeColor("--blue-core", "#1A6FD4") });
  const cellFor = () => Math.max(5, Math.round(canvasSurface.dpr * 7));

  const pulses: number[][] = Array.from({ length: PULSES }, () => [-100, 0.5, 0.5, 0]);
  const pulseBag = () => Object.fromEntries(pulses.map((v, i) => [`pulse${i}`, v]));
  let next = 0;

  const field = effect(gpu, MAY_FIELD_WGSL, {
    label: "may-field",
    blend: "premultiplied",
    set: {
      p: {
        time: 0,
        aspect: aspectOf(canvasSurface.size),
        energy: 0,
        cell: cellFor(),
        res: canvasSurface.size,
        pad: [0, 0],
        ...colors(),
        ...pulseBag(),
      },
    },
  });

  const unResize = canvasSurface.onResize(() => {
    field.set({ p: { aspect: aspectOf(canvasSurface.size), res: canvasSurface.size, cell: cellFor() } });
  });

  const time = clock(gpu);
  let energy = 0;
  let targetEnergy = 0;
  const stopLoop = runWhileVisible(gpu, canvas, (frame) => {
    energy += (targetEnergy - energy) * 0.06;
    field.set({ p: { time: time.time, energy } });
    frame.pass(canvasSurface, field);
  });

  return {
    pulse(x, y) {
      pulses[next] = [time.time, x, y, 0];
      field.set({ p: { [`pulse${next}`]: pulses[next] } });
      next = (next + 1) % PULSES;
    },
    setEnergy(level) {
      targetEnergy = level;
    },
    setColors() {
      field.set({ p: colors() });
    },
    stop() {
      unResize();
      stopLoop();
      canvasSurface.dispose();
    },
  };
}
