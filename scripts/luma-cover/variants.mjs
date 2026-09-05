// The Luma cover variants: one WGSL backdrop plus a typography layout each.
// Shared by render-frames.mts (paints the backdrop) and compose.mjs (lays the
// type and logo over it). Colours are uniforms so a variant is a palette plus
// a shader, and `time` is a loop phase in [0, 1) — every animated term goes
// through TAU * time so the GIFs loop without a seam.
import { readFileSync } from "node:fs";

const gpuTs = readFileSync(new URL("../../src/components/landing/gpu.ts", import.meta.url), "utf8");
const WGSL_COMMON = gpuTs.match(/WGSL_COMMON = \/\* wgsl \*\/ `([\s\S]*?)`;/)[1];

const HEADER = /* wgsl */ `
struct Params {
  time: f32,
  aspect: f32,
  seed: f32,
  pad: f32,
  res: vec2f,
  pad2: vec2f,
  c0: vec4f,
  c1: vec4f,
  c2: vec4f,
  c3: vec4f,
}
@group(0) @binding(0) var<uniform> p: Params;
const TAU: f32 = 6.28318530718;
${WGSL_COMMON}

// A point moving on a circle of radius r, one lap per loop: seamless by construction.
fn loopv(t: f32, r: f32) -> vec2f { return r * vec2f(cos(TAU * t), sin(TAU * t)); }
fn grain(px: vec2f, amt: f32) -> f32 { return (hash21(px + 7.0) - 0.5) * amt; }
`;

export function hex(h) {
  const n = parseInt(h.replace("#", ""), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255, 1];
}

const wgsl = (body) => HEADER + /* wgsl */ `
@fragment fn fs_main(@location(0) uv: vec2f) -> @location(0) vec4f {
  let q = uv - 0.5;
  let px = uv * p.res;
  let t = p.time;
  ${body}
  return vec4f(clamp(col, vec3f(0.0), vec3f(1.0)), 1.0);
}`;

export const VARIANTS = [
  {
    id: "01-halftone-sun",
    title: "Halftone sun",
    note: "The site's own hero motif: a flat blue disc whose rim breathes, halftone dots thickening toward the edge.",
    colors: [hex("#FBF8F2"), hex("#CBE4F8"), hex("#1A6FD4"), hex("#1B1B23")],
    layout: "sun",
    wgsl: wgsl(`
      let c = vec2f(0.0, 0.03);
      let d = q - c;
      let r = length(d);
      let dir = d / max(r, 1e-4);
      let off = loopv(t, 0.35);
      let wob = fbm(dir * 1.6 + off) - 0.5;
      let radius = 0.37 * (1.0 + 0.05 * wob);
      let disc = fill(r - radius);
      let cell = 14.0;
      let g = fract(px / cell) - 0.5;
      let id = floor(px / cell);
      let edge = smoothstep(radius * 0.74, radius, r + 0.02 * wob);
      let dotR = 0.44 * edge * (0.75 + 0.25 * vnoise(id * 0.3 + off * 2.0));
      let dotIn = fill(length(g) - dotR) * disc;
      let outside = smoothstep(radius + 0.12, radius, r) * (1.0 - disc);
      let dotOut = fill(length(g) - 0.2 * outside) * step(0.45, hash21(id));
      var col = p.c0.rgb;
      col = mix(col, p.c1.rgb, disc);
      col = mix(col, p.c2.rgb, dotIn);
      col = mix(col, p.c2.rgb, dotOut * 0.9);
      col += grain(px, 0.035);
    `),
  },
  {
    id: "02-liquid-glass",
    title: "Liquid glass",
    note: "Metaballs read as thick glass: the backdrop refracts through them, with a Fresnel rim and a hard specular.",
    colors: [hex("#0B1A3A"), hex("#123E8A"), hex("#6AC4F7"), hex("#FFFFFF")],
    layout: "center-light",
    wgsl: HEADER + /* wgsl */ `
      fn bg(uv: vec2f, t: f32) -> vec3f {
        let n = fbm(uv * 2.5 + loopv(t, 0.3));
        var col = mix(p.c0.rgb, p.c1.rgb, uv.y * 0.8 + 0.3 * n);
        col += p.c2.rgb * 0.12 * smoothstep(0.6, 0.9, fbm(uv * 4.0 - loopv(t, 0.5)));
        return col;
      }
      fn field(q: vec2f, t: f32) -> f32 {
        var f = 0.0;
        let c0 = vec2f(-0.22, -0.18) + loopv(t, 0.10);
        let c1 = vec2f(0.24, -0.08) + loopv(t + 0.33, 0.12);
        let c2 = vec2f(-0.05, 0.26) + loopv(t + 0.66, 0.09);
        let c3 = vec2f(0.30, 0.30) + loopv(t + 0.5, 0.07);
        let c4 = vec2f(-0.32, 0.22) + loopv(t + 0.2, 0.06);
        f += 0.030 / dot(q - c0, q - c0);
        f += 0.028 / dot(q - c1, q - c1);
        f += 0.024 / dot(q - c2, q - c2);
        f += 0.012 / dot(q - c3, q - c3);
        f += 0.010 / dot(q - c4, q - c4);
        return f;
      }
      @fragment fn fs_main(@location(0) uv: vec2f) -> @location(0) vec4f {
        let q = uv - 0.5;
        let px = uv * p.res;
        let t = p.time;
        let f = field(q, t);
        let e = 0.003;
        let gx = field(q + vec2f(e, 0.0), t) - field(q - vec2f(e, 0.0), t);
        let gy = field(q + vec2f(0.0, e), t) - field(q - vec2f(0.0, e), t);
        let grad = vec2f(gx, gy) / (2.0 * e);
        let inside = smoothstep(0.96, 1.04, f);
        let n = normalize(vec3f(-grad * 0.012, 1.0));
        let L = normalize(vec3f(-0.5, -0.7, 0.55));
        let H = normalize(L + vec3f(0.0, 0.0, 1.0));
        let spec = pow(max(dot(n, H), 0.0), 240.0);
        let rim = 1.0 - smoothstep(1.0, 1.22, f);
        let thick = smoothstep(1.0, 2.2, f);
        let refr = bg(uv + n.xy * 0.12, t) * (1.05 + 0.25 * thick) + p.c2.rgb * 0.08;
        let shade = 1.0 - 0.35 * smoothstep(0.6, 0.0, n.z * n.z);
        let glass = refr * shade + p.c3.rgb * (rim * 0.55 + spec * 0.9) + p.c2.rgb * 0.5 * (1.0 - n.z);
        var col = mix(bg(uv, t), glass, inside);
        col += grain(px, 0.03);
        return vec4f(clamp(col, vec3f(0.0), vec3f(1.0)), 1.0);
      }`,
  },
  {
    id: "03-aurora",
    title: "Aurora",
    note: "Three bands of light drift across a deep ink ground, like the string lights over the long table.",
    colors: [hex("#0E0F1A"), hex("#0F2350"), hex("#1A7DE8"), hex("#8FD3FF")],
    layout: "center-light",
    wgsl: wgsl(`
      var col = mix(p.c0.rgb, p.c1.rgb, uv.y * 0.6);
      for (var i = 0; i < 4; i++) {
        let fi = f32(i);
        let off = loopv(t + fi * 0.25, 0.55);
        let w = fbm(vec2f(q.x * 1.5 + fi * 3.1, fi * 2.0) + off);
        let y0 = -0.28 + 0.18 * fi + 0.30 * (w - 0.5);
        let dist = abs(q.y - y0);
        let glow = exp(-dist * 9.0) * 0.35;
        let core = exp(-pow(dist * 40.0, 2.0)) * 0.9;
        let tint = mix(p.c2.rgb, p.c3.rgb, fi / 3.0);
        let tex = 0.5 + 0.5 * fbm(q * 3.0 + off * 2.0);
        col += tint * (glow + core * tex);
      }
      col += grain(px, 0.04);
    `),
  },
  {
    id: "04-chrome-ripple",
    title: "Chrome ripple",
    note: "A ripple lit like brushed metal: rings expand from the centre with diffuse and specular shading.",
    colors: [hex("#0A2A5E"), hex("#1A6FD4"), hex("#DFF1FF"), hex("#FFFFFF")],
    layout: "corner-light",
    wgsl: wgsl(`
      let r = length(q);
      let dir = q / max(r, 1e-4);
      let ph = r * 34.0 - TAU * t * 2.0;
      let env = exp(-r * 2.2) * 0.5;
      let dh = (cos(ph) * 34.0 * env - 2.2 * sin(ph) * env);
      let n = normalize(vec3f(-dh * dir * 0.05, 1.0));
      let L = normalize(vec3f(-0.45, -0.6, 0.66));
      let H = normalize(L + vec3f(0.0, 0.0, 1.0));
      let diff = max(dot(n, L), 0.0);
      let spec = pow(max(dot(n, H), 0.0), 70.0);
      let base = mix(p.c0.rgb, p.c1.rgb, uv.y * 0.9);
      var col = base * (0.5 + 0.55 * diff) + p.c2.rgb * spec * 1.1 + p.c3.rgb * pow(1.0 - n.z, 1.5) * 6.0;
      col += grain(px, 0.03);
    `),
  },
  {
    id: "05-led-board",
    title: "LED board",
    note: "A dot-matrix board on black. A wave rolls out from the centre and single pixels twinkle over it.",
    colors: [hex("#07080D"), hex("#6AC4F7"), hex("#1A7DE8"), hex("#FFFFFF")],
    layout: "center-light",
    wgsl: wgsl(`
      let cell = 30.0;
      let id = floor(px / cell);
      let g = fract(px / cell) - 0.5;
      let centre = (id + 0.5) * cell / p.res - 0.5;
      let wave = 0.5 + 0.5 * sin(TAU * t - length(centre) * 11.0 + vnoise(id * 0.15) * 3.0);
      let twinkle = smoothstep(0.62, 1.0, vnoise(id * 0.7 + loopv(t, 1.2)));
      let b = wave * 0.8 + twinkle * 0.9;
      let dotc = fill(length(g) - 0.26);
      let halo = exp(-length(g) * 3.5) * 0.45;
      var col = p.c0.rgb + (p.c1.rgb * dotc + p.c2.rgb * halo) * b + p.c3.rgb * dotc * twinkle * 0.5;
    `),
  },
  {
    id: "06-paper-cut",
    title: "Paper cut",
    note: "The flat editorial motif straight from the site: hard-edged arcs and blocks in ink, sand and blue, sparkles turning.",
    colors: [hex("#FBF8F2"), hex("#F3EDE2"), hex("#1A6FD4"), hex("#1B1B23")],
    layout: "topleft-dark",
    wgsl: wgsl(`
      var col = p.c0.rgb;
      let d1 = length(q - vec2f(0.45, 0.62)) - 0.60;
      col = mix(col, p.c2.rgb, fill(d1));
      let cell = 12.0;
      let g = fract(px / cell) - 0.5;
      let band = (1.0 - smoothstep(0.0, 0.10, d1)) * step(0.0, d1);
      let dots = fill(length(g) - 0.42 * band);
      col = mix(col, p.c2.rgb, dots * band);
      let d2 = abs(length(q - vec2f(0.30, -0.20)) - 0.17) - 0.04;
      col = mix(col, p.c3.rgb, fill(d2));
      for (var i = 0; i < 3; i++) {
        let ang = TAU * (t + f32(i) / 3.0);
        let pos = vec2f(0.30, -0.20) + 0.28 * vec2f(cos(ang), sin(ang));
        col = mix(col, p.c3.rgb, fill(sdSparkle(q - pos, 0.026)));
      }
      col += grain(px, 0.035);
    `),
  },
  {
    id: "07-frosted-card",
    title: "Frosted card",
    note: "Fluid colour outside, the same field seen through a frosted glass card in the middle where the type sits.",
    colors: [hex("#1A7DE8"), hex("#6AC4F7"), hex("#0B3C8C"), hex("#FFFFFF")],
    layout: "card",
    wgsl: HEADER + /* wgsl */ `
      fn fluid(uv: vec2f, t: f32, detail: f32) -> vec3f {
        let off = loopv(t, 0.45);
        let n1 = fbm(uv * 2.2 * detail + off);
        let n2 = fbm(uv * 3.1 * detail - off.yx + 5.0);
        var col = mix(p.c0.rgb, p.c1.rgb, smoothstep(0.25, 0.75, n1));
        col = mix(col, p.c2.rgb, smoothstep(0.45, 0.75, n2));
        return col;
      }
      @fragment fn fs_main(@location(0) uv: vec2f) -> @location(0) vec4f {
        let q = uv - 0.5;
        let px = uv * p.res;
        let t = p.time;
        let sharp = fluid(uv, t, 1.0);
        let dc = sdBox(q, vec2f(0.34, 0.27)) - 0.05;
        let card = fill(dc);
        let frosted = mix(fluid(uv, t, 0.3), p.c3.rgb, 0.30);
        let rim = fill(abs(dc) - 0.0025);
        let sheen = smoothstep(0.35, -0.35, q.x + q.y) * 0.10;
        var col = mix(sharp, frosted + sheen, card);
        col += p.c3.rgb * rim * 0.55;
        col += grain(px, 0.03) * (1.0 - card * 0.5);
        return vec4f(clamp(col, vec3f(0.0), vec3f(1.0)), 1.0);
      }`,
  },
  {
    id: "08-spotlight",
    title: "Spotlight",
    note: "A stage: one cone of light from above through drifting dust, a glow where the mark sits, a glint on the floor.",
    colors: [hex("#08090F"), hex("#3A9FF3"), hex("#1A7DE8"), hex("#FFFFFF")],
    layout: "stage",
    wgsl: wgsl(`
      let dx = abs(q.x) / (0.10 + uv.y * 0.55);
      let cone = (1.0 - smoothstep(0.55, 1.0, dx)) * (1.0 - uv.y * 0.55);
      let dust = fbm(q * 4.0 + loopv(t, 0.35));
      var col = p.c0.rgb + p.c1.rgb * cone * (0.22 + 0.30 * dust);
      let glow = exp(-length(q - vec2f(0.0, -0.06)) * 5.5);
      col += p.c2.rgb * glow * 1.4 * (0.85 + 0.15 * sin(TAU * t));
      let floorLine = exp(-pow((uv.y - 0.70) * 28.0, 2.0)) * (1.0 - smoothstep(0.0, 0.45, abs(q.x)));
      col += p.c1.rgb * floorLine * 0.55;
      col += grain(px, 0.05);
    `),
  },
  {
    id: "09-brand-gradient",
    title: "Brand gradient",
    note: "Closest to the covers so far: the brand blue gradient, with a slow light sweep and film grain.",
    colors: [hex("#6AC4F7"), hex("#3A9FF3"), hex("#1A7DE8"), hex("#FFFFFF")],
    layout: "center-light",
    wgsl: wgsl(`
      let dgn = (uv.x + uv.y) * 0.5;
      var col = mix(p.c0.rgb, p.c1.rgb, smoothstep(0.0, 0.5, dgn));
      col = mix(col, p.c2.rgb, smoothstep(0.5, 1.0, dgn));
      let sweepPos = 0.5 + 0.42 * sin(TAU * t);
      let sweep = exp(-pow((dot(uv, vec2f(0.8, 0.6)) - sweepPos) * 3.5, 2.0));
      col += p.c3.rgb * sweep * 0.16;
      let soft = fbm(uv * 2.0 + loopv(t, 0.3));
      col += p.c3.rgb * smoothstep(0.55, 0.85, soft) * 0.12;
      col += grain(px, 0.04);
    `),
  },
];
