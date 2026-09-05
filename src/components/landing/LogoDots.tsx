"use client";

import { AnimatedLogo } from "@/components/AnimatedLogo";
import { cn } from "@/lib/utils";
import { startLogoDots } from "./logo-dots";
import { useGpuCanvas } from "./use-gpu-canvas";

/**
 * The hero mark: a halftone-dot logo that scatters from the cursor on
 * WebGPU, and the stroke-drawn `AnimatedLogo` everywhere else.
 */
export function LogoDots({ className }: { className?: string }) {
  const { canvasRef, mode } = useGpuCanvas(startLogoDots);

  return (
    <div className={cn("relative", className)} aria-hidden>
      <canvas
        ref={canvasRef}
        className={cn(
          "absolute inset-[-40%] h-[180%] w-[180%] transition-opacity duration-700",
          mode === "gpu" ? "opacity-100" : "opacity-0",
        )}
      />
      {mode !== "gpu" && <AnimatedLogo className="h-full w-full" />}
    </div>
  );
}
