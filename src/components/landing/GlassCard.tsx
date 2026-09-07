"use client";

import { useCallback, useMemo } from "react";
import type { Gpu } from "vgpu";
import { cn } from "@/lib/utils";
import { startGlassPanel, type GlassPanelHandle, type GlassPanelOptions } from "./glass-panel";
import { useGpuCanvas } from "./use-gpu-canvas";

/** Matches the CSS radius the flat card uses, so the fallback swaps cleanly. */
const CARD_RADIUS = 12;

export interface GlassCardProps extends GlassPanelOptions {
  children: React.ReactNode;
  className?: string;
}

/**
 * A card whose surface is a slab of refractive glass when the browser has
 * WebGPU, and the flat card it has always been when it doesn't.
 *
 * The canvas draws the whole card face — fill, border and corners alike — so on
 * the GPU path the element itself carries no background: `flat-card` is applied
 * only in the fallback. That avoids the seam you get from a rounded canvas
 * sitting inside a rounded, bordered box, where the two radii never quite agree
 * and the border shows as a halo through the anti-aliased corner.
 *
 * The children sit in their own stacking context above the canvas. They are
 * ordinary DOM, so text stays selectable and screen readers see nothing new;
 * the canvas is `aria-hidden` decoration.
 *
 * Cost: one canvas per card, sharing the page's single WebGPU device and asleep
 * whenever the card is off screen. That budget is why this is worth spending on
 * a few feature cards and not on every hoverable tile — the `.halftone-wipe`
 * hover treatment is still the right tool for those.
 */
export function GlassCard({
  children,
  className,
  seed,
  radius = CARD_RADIUS,
  bevel,
  ior,
  dispersion,
}: GlassCardProps) {
  // `useGpuCanvas` restarts whenever `start` changes identity, so the options
  // are folded into one memoised callback rather than passed down live.
  const options = useMemo<GlassPanelOptions>(
    () => ({ seed, radius, bevel, ior, dispersion }),
    [seed, radius, bevel, ior, dispersion],
  );
  const start = useCallback(
    (gpu: Gpu, canvas: HTMLCanvasElement) => startGlassPanel(gpu, canvas, options),
    [options],
  );
  const { canvasRef, mode, handleRef } = useGpuCanvas<GlassPanelHandle>(start);

  return (
    <div
      className={cn(
        "relative isolate",
        mode === "gpu" ? "rounded-xl" : "flat-card halftone-wipe",
        className,
      )}
      onPointerEnter={() => handleRef.current?.setHover(true)}
      onPointerLeave={() => handleRef.current?.setHover(false)}
    >
      <canvas
        ref={canvasRef}
        aria-hidden
        className={cn(
          "absolute inset-0 -z-10 h-full w-full transition-opacity duration-700",
          mode === "gpu" ? "opacity-100" : "opacity-0",
        )}
      />
      {children}
    </div>
  );
}
