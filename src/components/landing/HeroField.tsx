"use client";

import { useEffect, useRef, useState } from "react";
import { Arc } from "@/components/Motif";
import { cn } from "@/lib/utils";
import { hexToRgb, startHeroField, type HeroFieldColors, type HeroFieldHandle } from "./hero-field";

type Mode = "pending" | "gpu" | "fallback";

/**
 * The hero's sun. Draws the WebGPU field when the browser can, and the flat
 * `Arc` from the motif system otherwise — so the page looks composed either
 * way, and the shader is an upgrade rather than a dependency.
 *
 * Falls back when: WebGPU is missing (Firefox stable, older Safari), the
 * device refuses an adapter, or the visitor prefers reduced motion.
 */
export function HeroField({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mode, setMode] = useState<Mode>("pending");

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const supported = "gpu" in navigator && !reduced;

    let handle: HeroFieldHandle | undefined;
    let cancelled = false;

    (supported ? startHeroField(canvas, readColors()) : Promise.reject(new Error("no webgpu")))
      .then((h) => {
        if (cancelled) return h.stop();
        handle = h;
        setMode("gpu");
      })
      .catch(() => {
        if (!cancelled) setMode("fallback");
      });

    // Follow theme toggles: the colours are CSS variables on <html>.
    const observer = new MutationObserver(() => handle?.setColors(readColors()));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

    return () => {
      cancelled = true;
      observer.disconnect();
      handle?.stop();
    };
  }, []);

  return (
    <div aria-hidden className={cn("pointer-events-none absolute inset-0", className)}>
      <canvas
        ref={canvasRef}
        className={cn(
          "absolute inset-0 h-full w-full transition-opacity duration-700",
          mode === "gpu" ? "opacity-100" : "opacity-0",
        )}
      />
      {mode !== "gpu" && (
        <Arc
          tone="sun"
          size="min(46rem, 120vw)"
          className="left-1/2 top-[-14%] -translate-x-1/2"
        />
      )}
    </div>
  );
}

function readColors(): HeroFieldColors {
  const styles = getComputedStyle(document.documentElement);
  return {
    sun: hexToRgb(styles.getPropertyValue("--motif-sun") || "#CBE4F8"),
    accent: hexToRgb(styles.getPropertyValue("--blue-core") || "#1A6FD4"),
  };
}
