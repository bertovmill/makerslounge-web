/**
 * A slab of refractive glass, drawn on the GPU, sized to whatever card it
 * sits behind.
 *
 * The house style forbids glassmorphism in its usual sense — a blur behind a
 * translucent white rectangle — and this is deliberately not that. There is no
 * blur here. What the panel does instead is physical: a rounded slab with a
 * bevelled edge sits over a hard-edged field of brand colour, and the edge
 * *bends* that field. Light entering the bevel is refracted by Snell's law,
 * split into red, green and blue at slightly different indices so the corners
 * fringe, and the rim carries a Fresnel term that brightens as the surface
 * turns away. The interior is flat and undistorted, so text laid over the
 * middle of the card stays legible; all the event happens in the last few
 * pixels of the border.
 *
 * The refracted subject is the same vocabulary the rest of the page speaks:
 * posterised bands of the blue ramp and a Bayer halftone, no gradients. That
 * is what makes the refraction readable — a bent gradient looks like nothing,
 * a bent dot lattice looks like glass.
 *
 * Each panel owns its own canvas, so there is no array of rectangles to keep
 * in sync with the DOM: the canvas *is* the rectangle. `seed` offsets the
 * field per card so four cards in a row are not four copies of one frame.
 *
 * Inline WGSL for the same reason as `hero-field.ts`: `withEve()` wraps
 * `next.config.ts` and there is no `.wgsl` loader in the chain.
 */
import { clock, effect, surface } from "vgpu";
import type { Gpu } from "vgpu";
import { WGSL_COMMON, aspectOf, runWhileVisible, themeColor } from "./gpu";
import type { GpuCanvasHandle } from "./use-gpu-canvas";

export const GLASS_PANEL_WGSL = /* wgsl */ `
struct Params {
  time: f32,
  aspect: f32,
  radius: f32,
  bevel: f32,
  ior: f32,
  dispersion: f32,
  hover: f32,
  pad: f32,
  res: vec2f,
  seed: vec2f,
  tintA: vec4f,
  tintB: vec4f,
  tintC: vec4f,
  rim: vec4f,
}
@group(0) @binding(0) var<uniform> p: Params;

${WGSL_COMMON}

// Signed distance to a rounded box: negative inside, zero on the edge.
fn sdRoundBox(q: vec2f, b: vec2f, r: f32) -> f32 {
  let d = abs(q) - b + vec2f(r);
  return length(max(d, vec2f(0.0))) + min(max(d.x, d.y), 0.0) - r;
}

// Outward unit normal of that field, by central difference. The slab's
// silhouette is what tilts the surface, so this is the only geometry input
// the lighting needs.
fn boxGrad(q: vec2f, b: vec2f, r: f32) -> vec2f {
  let e = vec2f(0.0018, 0.0);
  let g = vec2f(
    sdRoundBox(q + e.xy, b, r) - sdRoundBox(q - e.xy, b, r),
    sdRoundBox(q + e.yx, b, r) - sdRoundBox(q - e.yx, b, r),
  );
  return g / max(length(g), 1e-5);
}

// What the glass looks at: posterised bands of the blue ramp, ruled with fine
// diagonal hairlines and screened with a halftone.
//
// The detail here is the whole point. Refraction is only visible in the
// displacement of something with structure — bend a smooth gradient and you
// see nothing at all. Straight rules crossing the bevel are the most legible
// subject there is: the eye reads the kink in a line instantly. Hard steps and
// hairlines also keep this inside the page's flat, print-like vocabulary
// rather than turning the card into a soft glow.
fn backdrop(q: vec2f, px: vec2f) -> vec3f {
  let drift = vec2f(p.time * 0.030, -p.time * 0.019);
  let n = fbm(q * 3.4 + p.seed + drift);
  let level = n + 0.16 * sin(q.x * 5.4 + q.y * 3.1 + p.time * 0.11);

  // Mostly the card's own colour. Two hard steps a short way up the ramp give
  // the slab some tonal movement without turning the card into a picture — a
  // headline still has to sit on top of this and win. Kept shallow on purpose:
  // stepping the full distance to tintB made the noise read as camouflage
  // rather than as glass, which is the failure mode this whole panel avoids.
  var col = p.tintA.rgb;
  col = select(col, mix(p.tintA.rgb, p.tintB.rgb, 0.34), level > 0.55);
  col = select(col, mix(p.tintA.rgb, p.tintB.rgb, 0.68), level > 0.74);

  // Diagonal rules, ~16 across the card. These carry the refraction: a
  // straight line that kinks as it crosses the bevel is what the eye reads as
  // thickness. Faint on purpose — they are a ruling, not a stripe pattern.
  // Ruled toward the rim colour rather than up the ramp: blue-core sits at a
  // similar contrast step from the page in both themes, so the ruling reads
  // the same weight in light and dark. Mixing toward the pale end instead made
  // the rules a whisper on paper and a cage on the dark card.
  let rule = fract((q.x + q.y) * 16.0);
  col = mix(col, p.rim.rgb, step(rule, 0.09) * 0.15);

  // Halftone, sparse, thickening only where the field is already brightest.
  // The pixel coordinate is pushed well clear of zero first: it comes from a
  // refracted position that can go negative outside the panel, and bayer4
  // casts to u32, which is undefined for negative floats.
  let density = smoothstep(0.44, 0.86, level) * 0.38;
  let dots = step(bayer4(abs(px) + vec2f(4096.0)), density);
  return mix(col, p.rim.rgb, dots * 0.10);
}

@fragment fn fs_main(@location(0) uv: vec2f) -> @location(0) vec4f {
  // Aspect-corrected and centred: y spans [-0.5, 0.5] whatever the card's shape.
  let q = (uv - 0.5) * vec2f(p.aspect, 1.0);
  // Deliberately not called "half": that is a WGSL reserved word. Dawn lets it
  // through, so a headless render passes while Chrome rejects the shader.
  let extent = vec2f(0.5 * p.aspect, 0.5) - vec2f(0.004);

  let d = sdRoundBox(q, extent, p.radius);
  let aa = max(fwidth(d), 1e-4);
  let inside = 1.0 - smoothstep(-aa, aa, d);
  if (inside <= 0.001) {
    return vec4f(0.0);
  }

  // Bevel profile: 0 at the rim, 1 once we are a bevel's width inside. The
  // slab is flat beyond that, which is what keeps the middle of the card
  // undistorted and readable.
  let bevel = p.bevel * (1.0 + 0.35 * p.hover);
  let t = clamp(-d / max(bevel, 1e-4), 0.0, 1.0);

  // Surface normal: upright in the flat interior, tilting outward through the
  // bevel. The 1.5 exponent gives the edge a rounded shoulder rather than a
  // chamfer, so the fringe spreads over a few pixels instead of one.
  let tilt = pow(1.0 - t, 1.5);
  let outward = boxGrad(q, extent, p.radius);
  let n = normalize(vec3f(outward * tilt * 1.25, 1.0));

  // Orthographic view: every ray arrives straight down the -z axis.
  let incident = vec3f(0.0, 0.0, -1.0);
  let facing = clamp(dot(-incident, n), 0.0, 1.0);

  // How far the bent ray travels before it hits the backdrop. Deepest at the
  // rim and tapering to nothing in the flat interior, so the distortion is a
  // property of the edge rather than a wobble over the whole card.
  //
  // The loop below applies Snell once per channel. Red bends least, blue most —
  // the same ordering real glass has, which is why the corners fringe warm on
  // one side and cool on the other rather than looking like a misregistered
  // print.
  let depth = 0.20 * (1.0 - t) * (1.0 - t) + 0.006;
  let spread = p.dispersion * 0.055;
  var col = vec3f(0.0);
  for (var c = 0; c < 3; c++) {
    let eta = 1.0 / (p.ior + (f32(c) - 1.0) * spread);
    let bent = refract(incident, n, eta);
    // Total internal reflection at a grazing bevel: fall back to the straight
    // ray rather than emitting a black pixel.
    let dir = select(incident, bent, dot(bent, bent) > 1e-6);
    let sq = q + dir.xy * depth;
    let suv = sq / vec2f(p.aspect, 1.0) + 0.5;
    var sampled = backdrop(sq, suv * p.res);
    col[c] = sampled[c];
  }

  // Fresnel: the rim turns away from the viewer, so it reflects the rim colour
  // instead of transmitting the field. Schlick's approximation, with f0 for
  // glass in air. This is the term that makes the border read as a bevelled
  // solid rather than a printed outline, so it is given room to bite.
  let f0 = pow((p.ior - 1.0) / (p.ior + 1.0), 2.0);
  let fresnel = f0 + (1.0 - f0) * pow(1.0 - facing, 5.0);
  col = mix(col, p.rim.rgb, clamp(fresnel * 5.5, 0.0, 0.80));

  // Two specular hits off one key light in the upper left: a tight one for the
  // glint on the top edge, a broad one for the sheen down the whole bevel.
  // Note the negative y: uv runs top-down, so q.y is positive toward the
  // bottom of the card. A positive y here puts the key light underneath and
  // lands the glint on the bottom edge, which reads as wrong without being
  // obviously wrong.
  let light = normalize(vec3f(-0.45, -0.70, 0.55));
  let mirror = reflect(incident, n);
  let glint = pow(max(dot(mirror, light), 0.0), 42.0);
  let sheen = pow(max(dot(mirror, light), 0.0), 6.0);
  col += vec3f(glint * (0.55 + 0.30 * p.hover) + sheen * 0.14);

  // A hairline of the rim colour exactly on the boundary keeps the card's
  // silhouette crisp against the page, the way the 1px border used to.
  let edge = 1.0 - smoothstep(0.0, aa * 2.2, abs(d));
  col = mix(col, p.rim.rgb, edge * 0.55);

  // Fresnel, specular and the rim hairline all pile up in the same few pixels
  // at a corner, which can push the sum past 1. Saturate before premultiplying
  // so that stacks into white rather than wrapping.
  col = clamp(col, vec3f(0.0), vec3f(1.0));

  let a = inside * (0.90 + 0.06 * p.hover);
  return vec4f(col * a, a);
}
`;

export interface GlassPanelHandle extends GpuCanvasHandle {
  setHover(on: boolean): void;
}

/** Per-card variation, so a row of cards is not a row of identical frames. */
export interface GlassPanelOptions {
  /** Offsets the noise field. Any two panels on screen should differ. */
  seed?: [number, number];
  /** Corner radius in CSS pixels, to match the radius the card would have had. */
  radius?: number;
  /** Width of the refracting border in CSS pixels. The interior stays flat. */
  bevel?: number;
  /** Index of refraction. 1.0 is air (no bend); 1.45 is close to crown glass. */
  ior?: number;
  /** How far apart the red and blue indices sit. 0 disables the fringe. */
  dispersion?: number;
}

export function startGlassPanel(
  gpu: Gpu,
  canvas: HTMLCanvasElement,
  options: GlassPanelOptions = {},
): GlassPanelHandle {
  const {
    seed = [0, 0],
    radius = 12,
    bevel = 22,
    ior = 1.42,
    dispersion = 1,
  } = options;

  const canvasSurface = surface(gpu, canvas, {
    dpr: [1, 2],
    alphaMode: "premultiplied",
    clearColor: [0, 0, 0, 0],
  });

  // The shader works in a space where the panel's height is 1, so the two
  // lengths that are authored in pixels convert against the current height.
  // Without this a tall card would get a proportionally fatter corner than a
  // short one sitting beside it.
  const metrics = () => {
    const height = Math.max(1, canvasSurface.size[1]);
    return { radius: radius / height, bevel: bevel / height };
  };

  // The three tints are the card colour and two steps up the blue ramp, so the
  // panel stays inside the palette and re-reads on a theme toggle.
  const colors = () => ({
    tintA: themeColor("--card", "#FFFDF7"),
    tintB: themeColor("--blue-pale", "#DDEBF9"),
    tintC: themeColor("--blue-light", "#9DCBF2"),
    rim: themeColor("--blue-core", "#1A6FD4"),
  });

  const panel = effect(gpu, GLASS_PANEL_WGSL, {
    label: "glass-panel",
    blend: "premultiplied",
    set: {
      p: {
        time: 0,
        aspect: aspectOf(canvasSurface.size),
        ...metrics(),
        ior,
        dispersion,
        hover: 0,
        pad: 0,
        res: canvasSurface.size,
        seed,
        ...colors(),
      },
    },
  });

  const unResize = canvasSurface.onResize(() => {
    panel.set({
      p: { aspect: aspectOf(canvasSurface.size), res: canvasSurface.size, ...metrics() },
    });
  });

  // Hover is eased rather than switched: the bevel widening is the whole
  // gesture, and a step would read as a flicker.
  let hoverTarget = 0;
  let hover = 0;
  const time = clock(gpu);
  const stopLoop = runWhileVisible(gpu, canvas, (frame) => {
    hover += (hoverTarget - hover) * 0.12;
    panel.set({ p: { time: time.time, hover } });
    frame.pass(canvasSurface, panel);
  });

  return {
    setColors() {
      panel.set({ p: colors() });
    },
    setHover(on) {
      hoverTarget = on ? 1 : 0;
    },
    stop() {
      unResize();
      stopLoop();
      canvasSurface.dispose();
    },
  };
}
