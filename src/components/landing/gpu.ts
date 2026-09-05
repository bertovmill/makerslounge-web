/**
 * One WebGPU context for every canvas on the landing page.
 *
 * `init()` requests an adapter and a device; several canvases each doing that
 * would mean several devices for one page. Instead the first caller creates
 * the context, later callers share it, and the last `release()` disposes it.
 *
 * `runWhileVisible` wraps `frameLoop` so a canvas that has scrolled out of
 * view (or a tab in the background) stops asking for frames. Seven live
 * canvases at 60fps is fine for a GPU; seven that never sleep is not fine
 * for a laptop battery.
 */
import { frameLoop, init } from "vgpu";
import type { Frame, FrameLoopHandle, Gpu } from "vgpu";

let shared: Promise<Gpu> | undefined;
let refs = 0;

/** True when it is worth trying WebGPU at all. */
export function webgpuAllowed(): boolean {
  if (typeof navigator === "undefined" || !("gpu" in navigator)) return false;
  return !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Resolves the shared context; rejects when WebGPU is unavailable. Pair with `releaseGpu`. */
export function acquireGpu(): Promise<Gpu> {
  refs += 1;
  if (!shared) {
    shared = init().catch((err) => {
      shared = undefined;
      throw err;
    });
  }
  return shared;
}

export function releaseGpu(): void {
  refs = Math.max(0, refs - 1);
  if (refs === 0 && shared) {
    const dying = shared;
    shared = undefined;
    void dying.then((gpu) => gpu.dispose()).catch(() => {});
  }
}

/**
 * Runs `cb` once per frame while `el` is on screen and the tab is visible.
 * Returns a function that stops everything.
 */
export function runWhileVisible(
  gpu: Gpu,
  el: Element,
  cb: (frame: Frame) => void,
): () => void {
  let loop: FrameLoopHandle | undefined;
  let onScreen = false;
  let stopped = false;

  const sync = () => {
    if (stopped) return;
    const shouldRun = onScreen && document.visibilityState === "visible";
    if (shouldRun && !loop) loop = frameLoop(gpu, cb);
    if (!shouldRun && loop) {
      loop.stop();
      loop = undefined;
    }
  };

  const io = new IntersectionObserver(
    (entries) => {
      onScreen = entries.some((e) => e.isIntersecting);
      sync();
    },
    { rootMargin: "80px" },
  );
  io.observe(el);
  document.addEventListener("visibilitychange", sync);

  return () => {
    stopped = true;
    io.disconnect();
    document.removeEventListener("visibilitychange", sync);
    loop?.stop();
    loop = undefined;
  };
}

/** `#rrggbb` → [r, g, b] in 0..1. */
export function hexToRgb(hex: string): [number, number, number] {
  const h = hex.trim().replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const n = parseInt(full, 16);
  if (Number.isNaN(n) || full.length !== 6) return [0.8, 0.9, 0.97];
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

/** Reads a theme colour off `<html>` as an rgba tuple for a uniform. */
export function themeColor(variable: string, fallback: string): [number, number, number, number] {
  const raw = getComputedStyle(document.documentElement).getPropertyValue(variable) || fallback;
  return [...hexToRgb(raw), 1];
}

/** Watches the theme class on `<html>` and calls `cb` when it changes. */
export function onThemeChange(cb: () => void): () => void {
  const observer = new MutationObserver(cb);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
  return () => observer.disconnect();
}

export function aspectOf(size: readonly [number, number]): number {
  return size[1] === 0 ? 1 : size[0] / size[1];
}

/** Shared WGSL helpers: hash, value noise, Bayer threshold, SDFs. */
export const WGSL_COMMON = /* wgsl */ `
fn hash21(q: vec2f) -> f32 {
  var v = fract(q * vec2f(0.1031, 0.1030));
  v += dot(v, v.yx + 33.33);
  return fract((v.x + v.y) * v.x);
}

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

// Signed distance to an axis-aligned box of half-size b, centred at origin.
fn sdBox(p: vec2f, b: vec2f) -> f32 {
  let d = abs(p) - b;
  return length(max(d, vec2f(0.0))) + min(max(d.x, d.y), 0.0);
}

fn rot(a: f32) -> mat2x2f {
  let c = cos(a);
  let s = sin(a);
  return mat2x2f(c, s, -s, c);
}

// Four-point sparkle: the motif's clip-path star, as a distance field.
fn sdSparkle(p: vec2f, size: f32) -> f32 {
  let a = atan2(p.y, p.x);
  let r = size * (0.2 + 0.8 * pow(abs(cos(2.0 * a)), 3.0));
  return length(p) - r;
}

// Hard edge with one pixel of anti-aliasing; d is a signed distance.
fn fill(d: f32) -> f32 {
  let aa = max(fwidth(d), 1e-4);
  return 1.0 - smoothstep(-aa, aa, d);
}
`;
