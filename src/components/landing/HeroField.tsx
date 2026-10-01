"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { startMemberLight } from "./member-light";
import { MAX_CLEAR_RECTS, memberDots, type ClearRect } from "./member-light-scene";
import { useGpuCanvas } from "./use-gpu-canvas";

/** Breathing room between a dot and the copy it steers around, in CSS px. */
const CLEAR_PADDING = 14;

/**
 * The hero's field: one light per member across the whole header, lit by
 * WebGPU radiance cascades (see member-light-scene.ts). Dots stay off the hero
 * copy: every element inside `[data-hero-content]`, and the page header
 * (`[data-hero-clear]`, which the canvas runs up behind), is measured line by
 * line and handed to the shader as a keep-out zone.
 *
 * Falls back to the same field as static SVG when WebGPU is missing (Firefox
 * stable, older Safari), the adapter is refused, or the visitor prefers
 * reduced motion, so the page looks composed either way.
 */
export function HeroField({ className, members }: { className?: string; members: number | null }) {
  const { canvasRef, mode, handleRef } = useGpuCanvas(startMemberLight);
  const rootRef = useRef<HTMLDivElement>(null);
  const [layout, setLayout] = useState<{ rects: ClearRect[]; width: number; height: number } | null>(null);

  // Measure the copy whenever the hero reflows: resize, web fonts landing, or
  // the member count line filling in.
  useEffect(() => {
    const root = rootRef.current;
    const section = root?.closest("section");
    const content = section?.querySelector<HTMLElement>("[data-hero-content]");
    if (!root || !section || !content) return;

    let frame = 0;
    const measure = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const box = root.getBoundingClientRect();
        const blocks = [
          ...Array.from(content.children),
          ...Array.from(document.querySelectorAll("[data-hero-clear]")).flatMap((el) => Array.from(el.children)),
        ];
        setLayout({ rects: measureCopy(blocks, box), width: box.width, height: box.height });
      });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(section);
    observer.observe(content);
    void document.fonts?.ready.then(measure);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [members]);

  useEffect(() => {
    if (mode === "gpu" && layout) handleRef.current?.setClear(layout.rects, layout.width, layout.height);
  }, [mode, layout, handleRef]);

  useEffect(() => {
    if (mode === "gpu" && members) handleRef.current?.setMembers(members);
  }, [mode, members, handleRef]);

  // Scroll progress across the hero: 0 at the top, 1 once the hero has left.
  useEffect(() => {
    if (mode !== "gpu") return;
    const section = canvasRef.current?.closest("section");
    const onScroll = () => {
      const span = Math.max(1, (section?.offsetHeight ?? window.innerHeight) * 0.9);
      handleRef.current?.setScroll(Math.min(1, window.scrollY / span));
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [mode, canvasRef, handleRef]);

  return (
    <div ref={rootRef} aria-hidden className={cn("pointer-events-none absolute inset-0", className)}>
      <canvas
        ref={canvasRef}
        className={cn(
          "absolute inset-0 h-full w-full transition-opacity duration-700",
          mode === "gpu" ? "opacity-100" : "opacity-0",
        )}
      />
      {mode === "fallback" && layout && <MemberField count={members ?? 142} {...layout} />}
    </div>
  );
}

/** The member field as flat SVG: the inner part lit in brand blue. */
function MemberField({ count, rects, width, height }: { count: number; rects: ClearRect[]; width: number; height: number }) {
  const { dots, radius } = memberDots(count, width, height, rects);
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="absolute inset-0 h-full w-full">
      {dots.map((d, i) => (
        <circle
          key={i}
          cx={d.x}
          cy={d.y}
          r={radius}
          fill={d.reach < 0.55 ? "var(--blue-core)" : "var(--ink)"}
          fillOpacity={d.reach < 0.55 ? 0.8 : 0.14}
        />
      ))}
    </svg>
  );
}

/**
 * Keep-out rects for the hero copy, in px relative to `box`. Text is measured
 * per line (a Range's client rects hug the glyphs, not the block), and links,
 * buttons and canvases by their boxes so borders and the logo are covered.
 * Rects on the same line are merged, then everything is padded.
 */
function measureCopy(blocks: Element[], box: DOMRect): ClearRect[] {
  const raw: DOMRect[] = [];
  for (const child of blocks) {
    const range = document.createRange();
    range.selectNodeContents(child);
    raw.push(...Array.from(range.getClientRects()));
    for (const el of Array.from(child.querySelectorAll("a, button, canvas, svg"))) {
      raw.push(el.getBoundingClientRect());
    }
  }

  const rects: [number, number, number, number][] = raw
    .filter((r) => r.width > 1 && r.height > 1)
    .map((r) => [r.left - box.left, r.top - box.top, r.right - box.left, r.bottom - box.top]);

  // Union anything that overlaps or sits within a padding of another, until stable.
  const gap = CLEAR_PADDING * 2;
  let merged = true;
  while (merged) {
    merged = false;
    outer: for (let i = 0; i < rects.length; i++) {
      for (let j = i + 1; j < rects.length; j++) {
        const [a, b] = [rects[i], rects[j]];
        if (a[0] - gap < b[2] && b[0] - gap < a[2] && a[1] - 4 < b[3] && b[1] - 4 < a[3]) {
          rects[i] = [Math.min(a[0], b[0]), Math.min(a[1], b[1]), Math.max(a[2], b[2]), Math.max(a[3], b[3])];
          rects.splice(j, 1);
          merged = true;
          break outer;
        }
      }
    }
  }

  // Still too many for the shader: fold the shortest into its vertical neighbour.
  rects.sort((a, b) => a[1] - b[1]);
  while (rects.length > MAX_CLEAR_RECTS) {
    let k = 0;
    for (let i = 1; i < rects.length - 1; i++) if (rects[i][3] - rects[i][1] < rects[k][3] - rects[k][1]) k = i;
    const [a, b] = [rects[k], rects[k + 1]];
    rects.splice(k, 2, [Math.min(a[0], b[0]), Math.min(a[1], b[1]), Math.max(a[2], b[2]), Math.max(a[3], b[3])]);
  }

  return rects.map(([l, t, r, b]) => [l - CLEAR_PADDING, t - CLEAR_PADDING, r + CLEAR_PADDING, b + CLEAR_PADDING]);
}
