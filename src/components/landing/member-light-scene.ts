/**
 * The landing hero's "people building together" field: one light per member.
 *
 * Every member of MakersLounge is a dot scattered across the whole hero: one
 * per cell of a grid sized so that the cells fill the canvas, each jittered
 * and drifting gently so the field reads as people rather than graph paper.
 * A wave of light travels from the centre outward, holds the pose, then
 * releases and starts again. Before the wave arrives, a few lone dots glint
 * on their own — makers building alone until they connect.
 *
 * Dots never sit on the hero copy: the page measures the text and buttons
 * (HeroField.tsx) and passes the rects in as keep-out zones, and a dot whose
 * centre falls in one neither draws nor emits.
 *
 * The light is real 2D global illumination, adapted from vgpu's "Agent
 * Radiance Cascades" example (`npx vgpu examples pull agent-radiance-cascades`):
 *
 *   members  → emitter + occluder mask (HDR)
 *   jfa      → jump flood to the nearest dot, ceil(log2(size)) passes
 *   sdf      → distance field the tracer steps through
 *   cascades → radiance cascades, coarsest level first, merged downward
 *   present  → resolve cascade 0, then draw on the page
 *
 * Changes from the example, and why:
 *   - Its `.wgsl` modules are inlined as strings (shared helpers concatenated,
 *     `export` dropped), so the `withEve()`-wrapped
 *     `next.config.ts` has no WGSL loader.
 *   - The debug views and lil-gui panel are gone; only the final image ships.
 *   - It shares the page's GPU context (gpu.ts) and sleeps off screen
 *     (`runWhileVisible`) instead of owning a device and a rAF loop.
 *   - Present redraws the dots analytically at output resolution, so they stay
 *     hard-edged per the flat motif while only the light is soft; the scene
 *     itself is solved at a capped resolution, as in the example.
 *   - Present outputs premultiplied colour over a transparent canvas, tinted
 *     from the theme: in light mode the light reads as blue ink on paper, in
 *     dark mode as a glow.
 */
// Type-only imports: this module must load under plain Node for
// scripts/render-member-light.mts, so the vgpu functions are passed in.
import type { Effect, Gpu, Target, effect as effectFn, sampler as samplerFn, target as targetFn } from "vgpu";

/** The vgpu functions the scene needs, injected by the caller. */
export interface VgpuApi {
  effect: typeof effectFn;
  target: typeof targetFn;
}

export type Vec2 = readonly [number, number];

const HDR_FORMAT = "rgba16float";
// Seeds store absolute pixel coordinates, which need f32 precision past 2048.
const SEED_FORMAT = "rgba32float";
export const MAX_SCENE_EDGE = 640;
export const DIRECTION_BASE = 2; // 4 rays at cascade 0, the example's "web" quality
export const LIGHTING_FPS = 24;
const RC_INTERVAL0 = 2;

/** Dot radius, in units of canvas height. */
const DOT_RADIUS = 0.0055;
/** Past this the cells get too small to read. */
const MAX_MEMBERS = 600;
/** Keep-out rects the shader accepts; HeroField merges down to this many. */
export const MAX_CLEAR_RECTS = 16;

// ---------------------------------------------------------------------------
// WGSL. No backticks anywhere inside these strings, comments included.
// ---------------------------------------------------------------------------

/** The member dots, shared by the emitter pass and the present pass. */
const MEMBERS_WGSL = /* wgsl */ `
// q-space: centred on the canvas, in units of canvas height, y down.
struct Members {
  res: vec2f,
  grid: vec2f,
  time: f32,
  count: f32,
  radius: f32,
  clear_count: f32,
  clear: array<vec4f, ${MAX_CLEAR_RECTS}>,
};

const PERIOD: f32 = 16.0;

fn smootherstep01(value: f32) -> f32 {
  let x = clamp(value, 0.0, 1.0);
  return x * x * x * (x * (x * 6.0 - 15.0) + 10.0);
}

fn hash12(p: vec2f) -> f32 {
  var v = fract(p * vec2f(0.1031, 0.1030));
  v += dot(v, v.yx + 33.33);
  return fract((v.x + v.y) * v.x);
}

fn hash22(p: vec2f) -> vec2f {
  return vec2f(hash12(p), hash12(p + vec2f(19.19, 7.31)));
}

fn member_aspect(m: Members) -> f32 {
  return m.res.x / max(m.res.y, 1.0);
}

fn member_q(m: Members, uv: vec2f) -> vec2f {
  return (uv - 0.5) * vec2f(member_aspect(m), 1.0);
}

fn member_cell_size(m: Members) -> vec2f {
  return vec2f(member_aspect(m), 1.0) / m.grid;
}

// The grid has at least count cells; the surplus is switched off evenly
// through the grid so exactly count stay on.
fn member_active(m: Members, cell: vec2f) -> bool {
  let total = m.grid.x * m.grid.y;
  let surplus = total - m.count;
  let k = cell.y * m.grid.x + cell.x;
  return floor(k * surplus / total) == floor((k + 1.0) * surplus / total);
}

fn member_pos(m: Members, cell: vec2f) -> vec2f {
  let size = member_cell_size(m);
  let h = hash22(cell);
  let jitter = (h - 0.5) * 0.5;
  let drift = 0.07 * vec2f(sin(m.time * 0.35 + h.x * 6.28), cos(m.time * 0.29 + h.y * 6.28));
  let origin = vec2f(-0.5 * member_aspect(m), -0.5);
  return origin + (cell + 0.5 + jitter + drift) * size;
}

fn member_clear(m: Members, p: vec2f) -> bool {
  for (var i = 0; i < i32(m.clear_count); i = i + 1) {
    let r = m.clear[i];
    if (p.x > r.x - m.radius && p.x < r.z + m.radius && p.y > r.y - m.radius && p.y < r.w + m.radius) {
      return true;
    }
  }
  return false;
}

fn member_strength(m: Members, cell: vec2f, p: vec2f) -> f32 {
  let phase = fract(m.time / PERIOD);
  let reach = length(p) / length(vec2f(0.5 * member_aspect(m), 0.5));
  let arrival = 0.06 + 0.56 * reach;
  let reached = smootherstep01((phase - arrival) / 0.08);
  let release = 1.0 - smootherstep01((phase - 0.84) / 0.1);
  let h = hash12(cell + vec2f(3.7, 1.3));
  let flicker = 0.84 + 0.16 * sin(m.time * (1.1 + h * 1.8) + h * 17.0);
  // One maker in nine glints alone before the wave reaches them.
  let solo_wave = 0.5 + 0.5 * sin(m.time * (0.6 + h * 1.4) + h * 40.0);
  let solo = select(0.0, 0.4 * solo_wave * solo_wave, h > 0.89);
  return max(reached * release * flicker, solo * (1.0 - reached));
}

// Nearest visible member: x = signed distance to its edge (height units),
// y = its strength, z = 1 when found. Jitter and drift keep every dot inside
// its own cell plus a margin, so the 3x3 neighbourhood is enough.
fn member_nearest(m: Members, q: vec2f) -> vec3f {
  let size = member_cell_size(m);
  let origin = vec2f(-0.5 * member_aspect(m), -0.5);
  let home = floor((q - origin) / size);
  var best = vec3f(1e3, 0.0, 0.0);
  var best_cell = vec2f(-1.0);
  var best_pos = vec2f(0.0);
  for (var y = -1; y <= 1; y = y + 1) {
    for (var x = -1; x <= 1; x = x + 1) {
      let cell = home + vec2f(f32(x), f32(y));
      if (cell.x < 0.0 || cell.y < 0.0 || cell.x >= m.grid.x || cell.y >= m.grid.y) {
        continue;
      }
      if (!member_active(m, cell)) {
        continue;
      }
      let p = member_pos(m, cell);
      if (member_clear(m, p)) {
        continue;
      }
      let d = distance(q, p) - m.radius;
      if (d < best.x) {
        best = vec3f(d, 0.0, 1.0);
        best_cell = cell;
        best_pos = p;
      }
    }
  }
  if (best.z > 0.5) {
    best.y = member_strength(m, best_cell, best_pos);
  }
  return best;
}
`;

const RC_DIRECTIONS_WGSL = /* wgsl */ `
const TAU: f32 = 6.283185307179586;

fn rc_block_size(cascade: f32, direction_base: f32) -> f32 {
  return direction_base * pow(2.0, cascade);
}

fn rc_ray_count(cascade: f32, direction_base: f32) -> f32 {
  let block = rc_block_size(cascade, direction_base);
  return block * block;
}

fn rc_probe_spacing(cascade: f32) -> f32 {
  return pow(2.0, cascade);
}

fn rc_direction(index: f32, rays: f32) -> vec2f {
  let theta = TAU * (index + 0.5) / rays;
  return vec2f(cos(theta), sin(theta));
}

fn rc_atlas_decode(texel: vec2f, block: f32) -> vec3f {
  let probe = floor(texel / block);
  let slot = texel - probe * block;
  return vec3f(probe, slot.y * block + slot.x);
}

fn rc_atlas_texel(probe: vec2f, direction_index: f32, block: f32) -> vec2f {
  let slot = vec2f(direction_index % block, floor(direction_index / block));
  return probe * block + slot;
}

fn rc_probe_origin(probe: vec2f, spacing: f32) -> vec2f {
  return (probe + 0.5) * spacing;
}
`;

const SDF_SAMPLE_WGSL = /* wgsl */ `
const SDF_HIT_EPSILON: f32 = 0.5;
const SDF_MIN_STEP: f32 = 0.35;
const SDF_MAX_STEPS: i32 = 16;

fn sdf_pixel_uv(pixel: vec2f, size: vec2f) -> vec2f {
  let half_texel = 0.5 / size;
  return clamp(pixel / size, half_texel, vec2f(1.0) - half_texel);
}

fn sdf_sample(tex: texture_2d<f32>, samp: sampler, pixel: vec2f, size: vec2f) -> f32 {
  return textureSampleLevel(tex, samp, sdf_pixel_uv(pixel, size), 0.0).r;
}

// Alpha is visibility: zero on a hit, one when the interval stays open.
fn sphere_trace(
  sdf_tex: texture_2d<f32>,
  sdf_samp: sampler,
  emitter_tex: texture_2d<f32>,
  emitter_samp: sampler,
  size: vec2f,
  origin: vec2f,
  direction: vec2f,
  t_start: f32,
  t_end: f32,
) -> vec4f {
  var t = t_start;
  for (var step = 0; step < SDF_MAX_STEPS; step = step + 1) {
    let p = origin + direction * t;
    if (p.x < -1.0 || p.y < -1.0 || p.x > size.x + 1.0 || p.y > size.y + 1.0) {
      break;
    }
    let d = sdf_sample(sdf_tex, sdf_samp, p, size);
    if (d <= SDF_HIT_EPSILON) {
      let emitter = textureSampleLevel(emitter_tex, emitter_samp, sdf_pixel_uv(p, size), 0.0);
      return vec4f(emitter.rgb, 0.0);
    }
    t = t + max(d, SDF_MIN_STEP);
    if (t > t_end) {
      break;
    }
  }
  return vec4f(0.0, 0.0, 0.0, 1.0);
}
`;

// RGB is linear HDR radiance; alpha is the occluder mask, kept independent of
// brightness so an unlit dot still casts a shadow.
const EMIT_WGSL = /* wgsl */ `
${MEMBERS_WGSL}

@group(0) @binding(0) var<uniform> m: Members;

@fragment
fn fs_main(@location(0) uv: vec2f) -> @location(0) vec4f {
  let nearest = member_nearest(m, member_q(m, uv));
  if (nearest.z < 0.5) {
    return vec4f(0.0);
  }
  let px = nearest.x * m.res.y;
  let mask = 1.0 - smoothstep(-0.8, 0.8, px);
  let emission = mix(0.065, 8.5, nearest.y);
  return vec4f(vec3f(emission) * mask, mask);
}
`;

// Seeds the jump flood: every emitter texel points at itself.
const JFA_INIT_WGSL = /* wgsl */ `
@group(0) @binding(0) var emitter: texture_2d<f32>;

@fragment
fn fs_main(@location(0) uv: vec2f) -> @location(0) vec4f {
  let size = vec2f(textureDimensions(emitter));
  let pixel = clamp(floor(uv * size), vec2f(0.0), size - 1.0);
  let mask = textureLoad(emitter, vec2i(pixel), 0).a;
  if (mask > 0.5) {
    return vec4f(pixel + 0.5, 0.0, 1.0);
  }
  return vec4f(0.0);
}
`;

// One jump-flood round: keep the nearest seed in the 3x3 neighbourhood
// that is jump texels away. Out-of-bounds neighbours are skipped, not
// clamped, so edge seeds are not duplicated.
const JFA_PASS_WGSL = /* wgsl */ `
struct JfaStep {
  jump: vec4f,
};

@group(0) @binding(0) var<uniform> jfa: JfaStep;
@group(0) @binding(1) var seeds: texture_2d<f32>;

fn jfa_pick(current: vec4f, candidate: vec4f, position: vec2f) -> vec4f {
  if (candidate.w < 0.5) {
    return current;
  }
  if (current.w < 0.5) {
    return candidate;
  }
  let current_distance = distance(current.xy, position);
  let candidate_distance = distance(candidate.xy, position);
  return select(current, candidate, candidate_distance < current_distance);
}

@fragment
fn fs_main(@location(0) uv: vec2f) -> @location(0) vec4f {
  let size = vec2f(textureDimensions(seeds));
  let pixel = clamp(floor(uv * size), vec2f(0.0), size - 1.0);
  let position = pixel + 0.5;
  let coord = vec2i(pixel);
  let limit = vec2i(size) - vec2i(1);
  let jump = i32(jfa.jump.x);

  var best = textureLoad(seeds, coord, 0);
  for (var y = -1; y <= 1; y = y + 1) {
    for (var x = -1; x <= 1; x = x + 1) {
      let neighbor = coord + vec2i(x, y) * jump;
      if (neighbor.x < 0 || neighbor.y < 0 || neighbor.x > limit.x || neighbor.y > limit.y) {
        continue;
      }
      best = jfa_pick(best, textureLoad(seeds, neighbor, 0), position);
    }
  }
  return best;
}
`;

// Converged seeds to a distance field in scene pixels. rgba16float because
// the tracer wants bilinear filtering, which 32-bit float targets lack.
const SDF_FINALIZE_WGSL = /* wgsl */ `
@group(0) @binding(0) var seeds: texture_2d<f32>;

@fragment
fn fs_main(@location(0) uv: vec2f) -> @location(0) vec4f {
  let size = vec2f(textureDimensions(seeds));
  let pixel = clamp(floor(uv * size), vec2f(0.0), size - 1.0);
  let seed = textureLoad(seeds, vec2i(pixel), 0);
  let distance_px = select(length(size) * 2.0, distance(seed.xy, pixel + 0.5), seed.w >= 0.5);
  return vec4f(distance_px, 0.0, 0.0, 1.0);
}
`;

// Trace one interval per atlas texel, then merge the already-rendered upper level.
const CASCADE_WGSL = /* wgsl */ `
${RC_DIRECTIONS_WGSL}
${SDF_SAMPLE_WGSL}

fn rc_interval_start(cascade: f32, interval0: f32) -> f32 {
  return interval0 * (pow(4.0, cascade) - 1.0) / 3.0;
}

fn rc_interval_length(cascade: f32, interval0: f32) -> f32 {
  return interval0 * pow(4.0, cascade);
}

fn rc_interval_end(cascade: f32, interval0: f32, overlap: f32) -> f32 {
  return rc_interval_start(cascade, interval0) + rc_interval_length(cascade, interval0) * (1.0 + overlap);
}

const RC_BRANCH_WEIGHT: f32 = 0.25;

fn rc_merge(near: vec4f, far: vec4f) -> vec4f {
  return vec4f(near.rgb + near.a * far.rgb, near.a * far.a);
}

fn rc_bilinear_weights(fraction: vec2f) -> vec4f {
  let f = clamp(fraction, vec2f(0.0), vec2f(1.0));
  return vec4f((1.0 - f.x) * (1.0 - f.y), f.x * (1.0 - f.y), (1.0 - f.x) * f.y, f.x * f.y);
}

fn rc_clamp_probe(probe: vec2f, grid: vec2f) -> vec2f {
  return clamp(probe, vec2f(0.0), grid - vec2f(1.0));
}

struct Cascade {
  state: vec4f,
};

@group(0) @binding(0) var<uniform> rc: Cascade;
@group(0) @binding(1) var sdf_tex: texture_2d<f32>;
@group(0) @binding(2) var sdf_samp: sampler;
@group(0) @binding(3) var emitter_tex: texture_2d<f32>;
@group(0) @binding(4) var emitter_samp: sampler;
@group(0) @binding(5) var upper_tex: texture_2d<f32>;

@fragment
fn fs_main(@location(0) uv: vec2f) -> @location(0) vec4f {
  let atlas_size = vec2f(textureDimensions(upper_tex));
  let scene_size = vec2f(textureDimensions(sdf_tex));
  let cascade = rc.state.x;
  let texel = floor(uv * atlas_size);
  let block = rc_block_size(cascade, rc.state.z);
  let rays = rc_ray_count(cascade, rc.state.z);
  let decoded = rc_atlas_decode(texel, block);
  let probe = decoded.xy;
  let direction_index = decoded.z;

  let spacing = rc_probe_spacing(cascade);
  let origin = rc_probe_origin(probe, spacing);
  let direction = rc_direction(direction_index, rays);

  var radiance = sphere_trace(
    sdf_tex, sdf_samp, emitter_tex, emitter_samp, scene_size,
    origin, direction,
    rc_interval_start(cascade, ${RC_INTERVAL0}.0),
    rc_interval_end(cascade, ${RC_INTERVAL0}.0, 0.02),
  );

  if (rc.state.y > 0.5) {
    let upper_block = block * 2.0;
    let upper_spacing = spacing * 2.0;
    let upper_grid = atlas_size / upper_block;

    let position = origin / upper_spacing - 0.5;
    let base = floor(position);
    let weights = rc_bilinear_weights(position - base);
    var weight_array = array<f32, 4>(weights.x, weights.y, weights.z, weights.w);

    var far = vec4f(0.0);
    for (var branch = 0; branch < 4; branch = branch + 1) {
      let upper_direction = direction_index * 4.0 + f32(branch);
      var interpolated = vec4f(0.0);
      for (var corner = 0; corner < 4; corner = corner + 1) {
        let offset = vec2f(f32(corner % 2), f32(corner / 2));
        let neighbor = rc_clamp_probe(base + offset, upper_grid);
        let coord = rc_atlas_texel(neighbor, upper_direction, upper_block);
        interpolated += weight_array[corner] * textureLoad(upper_tex, vec2i(coord), 0);
      }
      far += interpolated * RC_BRANCH_WEIGHT;
    }
    radiance = rc_merge(radiance, far);
  }

  return radiance;
}
`;

export const PRESENT_WGSL = /* wgsl */ `
${MEMBERS_WGSL}
${RC_DIRECTIONS_WGSL}

struct Look {
  glow_lo: vec4f,
  glow_hi: vec4f,
  dot_lit: vec4f,
  dot_idle: vec4f,
  // x: exposure, y: glow max alpha, z: fade, w: direction block side
  shape: vec4f,
};

@group(0) @binding(0) var<uniform> m: Members;
@group(0) @binding(1) var<uniform> look: Look;
@group(0) @binding(2) var cascade_tex: texture_2d<f32>;
@group(0) @binding(3) var emitter_tex: texture_2d<f32>;

fn resolve_probe(probe: vec2f) -> vec3f {
  let block = rc_block_size(0.0, look.shape.w);
  let rays = rc_ray_count(0.0, look.shape.w);
  let atlas_size = vec2f(textureDimensions(cascade_tex));
  let clamped_probe = clamp(probe, vec2f(0.0), atlas_size / block - 1.0);
  var total = vec3f(0.0);
  for (var i = 0.0; i < rays; i = i + 1.0) {
    total += textureLoad(cascade_tex, vec2i(rc_atlas_texel(clamped_probe, i, block)), 0).rgb;
  }
  return total / rays;
}

// Blend the four neighbouring probes so the capped-resolution light field
// stays continuous when stretched over a large canvas.
fn resolve_cascade0(pixel: vec2f) -> vec3f {
  let position = pixel - 0.5;
  let base = floor(position);
  let blend = fract(position);
  let top = mix(resolve_probe(base), resolve_probe(base + vec2f(1.0, 0.0)), blend.x);
  let bottom = mix(resolve_probe(base + vec2f(0.0, 1.0)), resolve_probe(base + vec2f(1.0)), blend.x);
  return mix(top, bottom, blend.y);
}

fn tonemap_aces(x: f32) -> f32 {
  return clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0);
}

fn ign(px: vec2f) -> f32 {
  return fract(52.9829189 * fract(dot(px, vec2f(0.06711056, 0.00583715))));
}

@fragment
fn fs_main(@location(0) uv: vec2f) -> @location(0) vec4f {
  let scene_size = vec2f(textureDimensions(emitter_tex));
  let irradiance = resolve_cascade0(uv * scene_size);

  // Light amount in [0, 1], dithered by a fraction of a level against banding.
  let dither = (ign(uv * m.res) - 0.5) / 255.0;
  let light = clamp(tonemap_aces(irradiance.r * look.shape.x) + dither, 0.0, 1.0);

  let glow_a = light * look.shape.y;
  var rgb = mix(look.glow_lo.rgb, look.glow_hi.rgb, light) * glow_a;
  var a = glow_a;

  // Dots are drawn here at output resolution so their edges stay hard.
  let nearest = member_nearest(m, member_q(m, uv));
  if (nearest.z > 0.5) {
    let aa = 1.0 / max(m.res.y, 1.0);
    let mask = 1.0 - smoothstep(-aa, aa, nearest.x);
    let strength = nearest.y;
    let dot_col = mix(look.dot_idle.rgb, look.dot_lit.rgb, strength);
    let dot_a = mix(look.dot_idle.a, look.dot_lit.a, strength) * mask;
    rgb = dot_col * dot_a + rgb * (1.0 - dot_a);
    a = dot_a + a * (1.0 - dot_a);
  }

  let fade = look.shape.z;
  return vec4f(rgb * fade, a * fade);
}
`;

// ---------------------------------------------------------------------------
// Scene: every render target sized to the (capped) scene resolution.
// ---------------------------------------------------------------------------

export function scaledSize(width: number, height: number, maxEdge: number): Vec2 {
  const scale = Math.min(1, maxEdge / Math.max(width, height, 1));
  return [Math.max(1, Math.round(width * scale)), Math.max(1, Math.round(height * scale))];
}

export function createScene(vg: VgpuApi, gpu: Gpu, requested: Vec2) {
  const width = Math.max(1, Math.floor(requested[0]));
  const height = Math.max(1, Math.floor(requested[1]));
  const size: Vec2 = [width, height];
  const cascadeCount = Math.min(
    6,
    Math.max(5, Math.ceil(Math.log(1 + (3 * Math.hypot(width, height)) / RC_INTERVAL0) / Math.log(4))),
  );
  const coarsest = 2 ** (cascadeCount - 1);
  const atlas: Vec2 = [
    Math.ceil(width / coarsest) * coarsest * DIRECTION_BASE,
    Math.ceil(height / coarsest) * coarsest * DIRECTION_BASE,
  ];
  const jumpCount = Math.ceil(Math.log2(Math.max(width, height, 2)));
  const jumps = [...Array.from({ length: jumpCount }, (_, i) => Math.max(1, 2 ** (jumpCount - i - 1))), 1, 1];

  const created: Target[] = [];
  const own = (t: Target) => (created.push(t), t);
  try {
    return {
      size,
      cascadeCount,
      jumps,
      created,
      emitter: own(vg.target(gpu, { size, format: HDR_FORMAT })),
      jfa: [own(vg.target(gpu, { size, format: SEED_FORMAT })), own(vg.target(gpu, { size, format: SEED_FORMAT }))] as [Target, Target],
      sdf: own(vg.target(gpu, { size, format: HDR_FORMAT })),
      cascades: [own(vg.target(gpu, { size: atlas, format: HDR_FORMAT })), own(vg.target(gpu, { size: atlas, format: HDR_FORMAT }))] as [Target, Target],
      effects: {
        emit: vg.effect(gpu, EMIT_WGSL, { label: "member-emit" }),
        jfaInit: vg.effect(gpu, JFA_INIT_WGSL, { label: "member-jfa-init" }),
        // Uniforms upload immediately, so each encoded pass needs its own effect.
        jfaSteps: jumps.map(() => vg.effect(gpu, JFA_PASS_WGSL, { label: "member-jfa" })),
        sdfFinalize: vg.effect(gpu, SDF_FINALIZE_WGSL, { label: "member-sdf" }),
        cascade: Array.from({ length: cascadeCount }, () => vg.effect(gpu, CASCADE_WGSL, { label: "member-cascade" })),
      },
    };
  } catch (error) {
    destroyTargets(created);
    throw error;
  }
}

export type Scene = ReturnType<typeof createScene>;

export function destroyTargets(targets: readonly Target[]) {
  for (let i = targets.length - 1; i >= 0; i--) {
    try {
      // target() returns an OffscreenTarget, which has destroy(); the Target type omits it.
      (targets[i] as Target & { destroy?: () => void }).destroy?.();
    } catch {
      // Best effort: the device owns them and releases them on dispose anyway.
    }
  }
}

export async function prepareScene(scene: Scene): Promise<void> {
  const { effects } = scene;
  await Promise.all([
    effects.emit.compile({ colors: [HDR_FORMAT] }),
    effects.jfaInit.compile({ colors: [SEED_FORMAT] }),
    ...effects.jfaSteps.map((e) => e.compile({ colors: [SEED_FORMAT] })),
    effects.sdfFinalize.compile({ colors: [HDR_FORMAT] }),
    ...effects.cascade.map((e) => e.compile({ colors: [HDR_FORMAT] })),
  ]);
}

export interface MemberParams {
  res: Vec2;
  grid: Vec2;
  time: number;
  count: number;
  radius: number;
  clear_count: number;
  clear: number[][];
}

/** Keep-out rect in canvas pixels: [left, top, right, bottom]. */
export type ClearRect = readonly [number, number, number, number];

/** Grid that gives `count` members one cell each across a canvas of `aspect`. */
export function memberGeometry(count: number, aspect: number) {
  const n = Math.min(MAX_MEMBERS, Math.max(1, Math.round(count)));
  const rows = Math.max(1, Math.round(Math.sqrt(n / aspect)));
  const cols = Math.max(1, Math.ceil(n / rows));
  return { count: n, grid: [cols, rows] as Vec2, radius: DOT_RADIUS };
}

/** Pixel rects to the shader's q-space, padded out to the fixed array length. */
export function clearUniform(rects: readonly ClearRect[], width: number, height: number) {
  const h = Math.max(1, height);
  const list = rects.slice(0, MAX_CLEAR_RECTS).map(([l, t, r, b]) => [
    (l - width / 2) / h,
    (t - height / 2) / h,
    (r - width / 2) / h,
    (b - height / 2) / h,
  ]);
  const clear = [...list, ...Array.from({ length: MAX_CLEAR_RECTS - list.length }, () => [0, 0, 0, 0])];
  return { clear_count: list.length, clear };
}

/** The same field in plain JS, for the static SVG fallback. */
export function memberDots(count: number, width: number, height: number, rects: readonly ClearRect[]) {
  const { count: n, grid, radius } = memberGeometry(count, width / Math.max(1, height));
  const [cols, rows] = grid;
  const total = cols * rows;
  const surplus = total - n;
  const hash = (x: number, y: number) => {
    const v = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
    return v - Math.floor(v);
  };
  const cw = width / cols;
  const ch = height / rows;
  const r = radius * height;
  const dots: { x: number; y: number; reach: number }[] = [];
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const k = y * cols + x;
      if (Math.floor((k * surplus) / total) !== Math.floor(((k + 1) * surplus) / total)) continue;
      const px = (x + 0.5 + (hash(x, y) - 0.5) * 0.5) * cw;
      const py = (y + 0.5 + (hash(y + 7, x + 3) - 0.5) * 0.5) * ch;
      if (rects.some(([l, t, rr, b]) => px > l - r && px < rr + r && py > t - r && py < b + r)) continue;
      const reach = Math.hypot((px - width / 2) / height, (py - height / 2) / height) / Math.hypot(width / height / 2, 0.5);
      dots.push({ x: px, y: py, reach });
    }
  }
  return { dots, radius: r };
}

type Pass = { target: Target; effect: Effect };

export function lightingPasses(scene: Scene, members: MemberParams, sceneSampler: ReturnType<typeof samplerFn>): Pass[] {
  const { effects } = scene;
  const passes: Pass[] = [];

  effects.emit.set({ m: { ...members, res: scene.size } });
  passes.push({ target: scene.emitter, effect: effects.emit });

  effects.jfaInit.set({ emitter: scene.emitter });
  passes.push({ target: scene.jfa[0], effect: effects.jfaInit });
  let seedRead = scene.jfa[0];
  let seedWrite = scene.jfa[1];
  scene.jumps.forEach((jump, i) => {
    const shader = effects.jfaSteps[i];
    shader.set({ jfa: { jump: [jump, 0, 0, 0] }, seeds: seedRead });
    passes.push({ target: seedWrite, effect: shader });
    [seedRead, seedWrite] = [seedWrite, seedRead];
  });
  scene.jfa = [seedRead, seedWrite];

  effects.sdfFinalize.set({ seeds: seedRead });
  passes.push({ target: scene.sdf, effect: effects.sdfFinalize });

  let atlasWrite = scene.cascades[0];
  let atlasRead = scene.cascades[1];
  for (let cascade = scene.cascadeCount - 1; cascade >= 0; cascade--) {
    const shader = effects.cascade[cascade];
    shader.set({
      rc: { state: [cascade, cascade < scene.cascadeCount - 1 ? 1 : 0, DIRECTION_BASE, 0] },
      sdf_tex: scene.sdf,
      sdf_samp: sceneSampler,
      emitter_tex: scene.emitter,
      emitter_samp: sceneSampler,
      upper_tex: atlasRead,
    });
    passes.push({ target: atlasWrite, effect: shader });
    [atlasRead, atlasWrite] = [atlasWrite, atlasRead];
  }
  scene.cascades = [atlasRead, atlasWrite];
  return passes;
}

// ---------------------------------------------------------------------------
// Theme
// ---------------------------------------------------------------------------

/** Light mode prints the light as blue ink on paper; dark mode lets it glow. */
export function memberLook(dark: boolean, read: (v: string, fallback: string) => [number, number, number, number]) {
  if (dark) {
    return {
      glow_lo: read("--blue-deep", "#0B2F60"),
      glow_hi: read("--blue-light", "#9DCBF2"),
      dot_lit: read("--blue-light", "#9DCBF2"),
      dot_idle: [...read("--ink", "#EFE7D9").slice(0, 3), 0.12] as [number, number, number, number],
      exposure: 0.12,
      glowAlpha: 0.85,
    };
  }
  return {
    glow_lo: read("--blue-light", "#9DCBF2"),
    glow_hi: read("--blue-core", "#1A6FD4"),
    dot_lit: [...read("--blue-core", "#1A6FD4").slice(0, 3), 0.8] as [number, number, number, number],
    dot_idle: [...read("--ink", "#1B1B23").slice(0, 3), 0.1] as [number, number, number, number],
    exposure: 0.09,
    glowAlpha: 0.5,
  };
}
