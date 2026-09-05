"use client";

import { forwardRef, useImperativeHandle } from "react";
import { cn } from "@/lib/utils";
import { startMayField } from "./may-field";
import { useGpuCanvas } from "./use-gpu-canvas";

export interface MayFieldRef {
  /** Ring out from the centre of `el` (usually the textarea). */
  pulseFrom(el: Element | null): void;
  setEnergy(level: number): void;
}

/**
 * The listening field behind Ask May. Nothing renders without WebGPU — the
 * section reads fine on plain paper, so there is no fallback to draw.
 */
export const MayField = forwardRef<MayFieldRef, { className?: string }>(function MayField(
  { className },
  ref,
) {
  const { canvasRef, mode, handleRef } = useGpuCanvas(startMayField);

  useImperativeHandle(ref, () => ({
    pulseFrom(el) {
      const canvas = canvasRef.current;
      const handle = handleRef.current;
      if (!canvas || !handle) return;
      const c = canvas.getBoundingClientRect();
      const r = el?.getBoundingClientRect() ?? c;
      handle.pulse((r.left + r.width / 2 - c.left) / c.width, (r.top + r.height / 2 - c.top) / c.height);
    },
    setEnergy(level) {
      handleRef.current?.setEnergy(level);
    },
  }));

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-0 h-full w-full transition-opacity duration-700",
        mode === "gpu" ? "opacity-100" : "opacity-0",
        className,
      )}
    />
  );
});
