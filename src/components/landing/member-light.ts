/**
 * Runtime for the hero's member field: owns the canvas surface, rebuilds the
 * scene on resize, solves lighting at a capped rate and presents every frame.
 * The shaders and the pass chain live in member-light-scene.ts.
 */
import { clock, effect, sampler, surface, target } from "vgpu";
import type { Gpu } from "vgpu";
import { runWhileVisible, themeColor } from "./gpu";
import type { GpuCanvasHandle } from "./use-gpu-canvas";
import {
  CENTRE,
  DIRECTION_BASE,
  LIGHTING_FPS,
  MAX_SCENE_EDGE,
  PRESENT_WGSL,
  createScene,
  destroyTargets,
  lightingPasses,
  memberGeometry,
  memberLook,
  prepareScene,
  scaledSize,
  type MemberParams,
  type Scene,
  type Vec2,
} from "./member-light-scene";

const vg = { effect, target };

export interface MemberLightHandle extends GpuCanvasHandle {
  setMembers(count: number): void;
  setScroll(progress: number): void;
}

export function startMemberLight(gpu: Gpu, canvas: HTMLCanvasElement): MemberLightHandle {
  const canvasSurface = surface(gpu, canvas, {
    dpr: [1, 1.5],
    alphaMode: "premultiplied",
    clearColor: [0, 0, 0, 0],
  });
  const sceneSampler = sampler(gpu, {
    minFilter: "linear",
    magFilter: "linear",
    addressModeU: "clamp-to-edge",
    addressModeV: "clamp-to-edge",
  });
  const present = effect(gpu, PRESENT_WGSL, { label: "member-present", blend: "premultiplied" });

  let disposed = false;
  let scene: Scene | undefined;
  let ready = false;
  let generation = 0;
  let count = 142;
  let fade = 1;
  let look = memberLook(false, themeColor);

  const rebuild = () => {
    if (disposed) return;
    const size = scaledSize(canvasSurface.size[0], canvasSurface.size[1], MAX_SCENE_EDGE);
    if (scene && scene.size[0] === size[0] && scene.size[1] === size[1]) return;
    const previous = scene;
    const next = createScene(vg, gpu, size);
    scene = next;
    ready = false;
    const mine = ++generation;
    if (previous) destroyTargets(previous.created);
    prepareScene(next)
      .then(() => {
        if (!disposed && mine === generation) ready = true;
      })
      .catch(() => {
        // A failed compile leaves the canvas transparent rather than throwing
        // into the page; the composed fallback is not shown in that case, but
        // the hero copy still stands on its own.
      });
  };

  rebuild();
  const unResize = canvasSurface.onResize(rebuild);

  const memberParams = (seconds: number, res: Vec2): MemberParams => {
    const aspect = res[1] === 0 ? 1 : res[0] / res[1];
    const geometry = memberGeometry(count, aspect);
    return { res, centre: CENTRE, time: seconds, ...geometry };
  };

  const time = clock(gpu);
  let lastLighting = -Infinity;
  const stopLoop = runWhileVisible(gpu, canvas, (frame) => {
    if (!ready || !scene) return;
    const now = time.time;
    if (now - lastLighting >= 1 / LIGHTING_FPS || now < lastLighting) {
      for (const pass of lightingPasses(scene, memberParams(now, scene.size), sceneSampler)) {
        frame.pass({ target: pass.target, clear: [0, 0, 0, 0] }, pass.effect);
      }
      lastLighting = now;
    }
    present.set({
      m: memberParams(now, canvasSurface.size),
      look: {
        glow_lo: look.glow_lo,
        glow_hi: look.glow_hi,
        dot_lit: look.dot_lit,
        dot_idle: look.dot_idle,
        shape: [look.exposure, look.glowAlpha, fade, DIRECTION_BASE],
      },
      cascade_tex: scene.cascades[0],
      emitter_tex: scene.emitter,
    });
    frame.pass(canvasSurface, present);
  });

  return {
    setColors() {
      look = memberLook(document.documentElement.classList.contains("dark"), themeColor);
    },
    setMembers(next) {
      if (Number.isFinite(next) && next > 0) count = next;
    },
    setScroll(progress) {
      // Fade out over the last stretch of the hero, before Ask May.
      const s = Math.min(1, Math.max(0, (progress - 0.55) / 0.45));
      fade = 1 - s * s * (3 - 2 * s);
    },
    stop() {
      disposed = true;
      unResize();
      stopLoop();
      if (scene) destroyTargets(scene.created);
      scene = undefined;
      canvasSurface.dispose();
    },
  };
}
