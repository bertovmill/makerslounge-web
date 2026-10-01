"use client";

import { useEffect } from "react";
import { cn } from "@/lib/utils";
import { startMemberLight } from "./member-light";
import { useGpuCanvas } from "./use-gpu-canvas";

const GOLDEN_ANGLE = 2.399963229728653;

/**
 * The hero's field: one light per member, lit by WebGPU radiance cascades
 * (see member-light.ts). Falls back to the same spiral drawn as static SVG
 * when WebGPU is missing (Firefox stable, older Safari), the adapter is
 * refused, or the visitor prefers reduced motion, so the page looks composed
 * either way and the shader is an upgrade rather than a dependency.
 */
export function HeroField({ className, members }: { className?: string; members: number | null }) {
  const { canvasRef, mode, handleRef } = useGpuCanvas(startMemberLight);

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
    <div aria-hidden className={cn("pointer-events-none absolute inset-0", className)}>
      <canvas
        ref={canvasRef}
        className={cn(
          "absolute inset-0 h-full w-full transition-opacity duration-700",
          mode === "gpu" ? "opacity-100" : "opacity-0",
        )}
      />
      {mode === "fallback" && <MemberSpiral count={members ?? 142} />}
    </div>
  );
}

/** The member spiral as flat SVG: the inner two thirds lit in brand blue. */
function MemberSpiral({ count }: { count: number }) {
  const n = Math.min(600, Math.max(1, Math.round(count)));
  const spacing = 1 / Math.sqrt(n);
  const dots = Array.from({ length: n }, (_, i) => {
    const r = spacing * Math.sqrt(i + 0.5);
    const a = i * GOLDEN_ANGLE;
    return { x: Math.cos(a) * r, y: Math.sin(a) * r, lit: (i + 0.5) / n < 0.45 };
  });
  return (
    <svg
      viewBox="-1.05 -1.05 2.1 2.1"
      className="absolute left-1/2 top-[42%] h-[min(80%,92vw)] -translate-x-1/2 -translate-y-1/2"
    >
      {dots.map((d, i) => (
        <circle
          key={i}
          cx={d.x}
          cy={d.y}
          r={spacing * 0.22}
          fill={d.lit ? "var(--blue-core)" : "var(--ink)"}
          fillOpacity={d.lit ? 0.85 : 0.14}
        />
      ))}
    </svg>
  );
}
