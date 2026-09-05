"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { ValueArt, type ValueKey } from "./ValueArt";
import { startValueField } from "./value-fields";
import { useGpuCanvas } from "./use-gpu-canvas";

/** A value card panel that moves on WebGPU and is the static `ValueArt` otherwise. */
export function LiveValueArt({ value, className }: { value: ValueKey; className?: string }) {
  const start = useMemo(() => startValueField(value), [value]);
  const { canvasRef, mode } = useGpuCanvas(start);

  return (
    <div aria-hidden className={cn("relative aspect-[4/3] w-full overflow-hidden bg-[var(--blue-pale)]", className)}>
      <canvas
        ref={canvasRef}
        className={cn(
          "absolute inset-0 h-full w-full transition-opacity duration-500",
          mode === "gpu" ? "opacity-100" : "opacity-0",
        )}
      />
      {mode !== "gpu" && <ValueArt value={value} className="absolute inset-0" />}
    </div>
  );
}
