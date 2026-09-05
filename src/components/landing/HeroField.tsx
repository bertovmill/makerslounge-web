"use client";

import { useEffect } from "react";
import { Arc } from "@/components/Motif";
import { cn } from "@/lib/utils";
import { startHeroField } from "./hero-field";
import { useGpuCanvas } from "./use-gpu-canvas";

/**
 * The hero's sun. Draws the WebGPU field when the browser can, and the flat
 * `Arc` from the motif system otherwise — so the page looks composed either
 * way, and the shader is an upgrade rather than a dependency.
 *
 * Falls back when: WebGPU is missing (Firefox stable, older Safari), the
 * device refuses an adapter, or the visitor prefers reduced motion.
 */
export function HeroField({ className }: { className?: string }) {
  const { canvasRef, mode, handleRef } = useGpuCanvas(startHeroField);

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
