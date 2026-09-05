"use client";

import { useEffect, useRef, useState } from "react";
import type { Gpu } from "vgpu";
import { acquireGpu, onThemeChange, releaseGpu, webgpuAllowed } from "./gpu";

export type GpuMode = "pending" | "gpu" | "fallback";

export interface GpuCanvasHandle {
  /** Re-read theme colours; called on every theme toggle. */
  setColors?(): void;
  stop(): void;
}

/**
 * Owns the lifecycle of one WebGPU canvas on the page: shared context,
 * start on mount, theme re-colour, stop and release on unmount, and the
 * fallback decision when WebGPU is not available.
 *
 * `start` receives the shared context and the canvas and returns a handle.
 * Keep it referentially stable (module-level or memoised): a new function
 * restarts the canvas.
 */
export function useGpuCanvas<H extends GpuCanvasHandle>(
  start: (gpu: Gpu, canvas: HTMLCanvasElement) => H,
): { canvasRef: React.RefObject<HTMLCanvasElement | null>; mode: GpuMode; handleRef: React.RefObject<H | null> } {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const handleRef = useRef<H | null>(null);
  const [mode, setMode] = useState<GpuMode>("pending");

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let cancelled = false;
    let acquired = false;

    (webgpuAllowed() ? ((acquired = true), acquireGpu()) : Promise.reject(new Error("no webgpu")))
      .then((gpu) => {
        if (cancelled) return;
        const handle = start(gpu, canvas);
        handleRef.current = handle;
        // The theme class can land after mount while init() was pending;
        // re-read now so the first visible frame has the right palette.
        handle.setColors?.();
        setMode("gpu");
      })
      .catch(() => {
        if (!cancelled) setMode("fallback");
      });

    const stopTheme = onThemeChange(() => handleRef.current?.setColors?.());

    return () => {
      cancelled = true;
      stopTheme();
      handleRef.current?.stop();
      handleRef.current = null;
      if (acquired) releaseGpu();
    };
  }, [start]);

  return { canvasRef, mode, handleRef };
}
