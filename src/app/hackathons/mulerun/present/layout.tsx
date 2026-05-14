"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Wifi } from "lucide-react";
import { SLIDE_COUNT, pad2 } from "./slides";

export default function PresentationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  // Parse current slide number from URL: /hackathons/mulerun/present/<n>
  const match = pathname.match(/\/present\/(\d+)(?:\/|$)/);
  const currentSlide = match ? Number(match[1]) : 1;

  const go = (n: number) => {
    const target = Math.max(1, Math.min(SLIDE_COUNT, n));
    router.push(`/hackathons/mulerun/present/${target}`);
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (
        e.key === "ArrowRight" ||
        e.key === "ArrowDown" ||
        e.key === "PageDown" ||
        e.key === " "
      ) {
        e.preventDefault();
        go(currentSlide + 1);
      } else if (
        e.key === "ArrowLeft" ||
        e.key === "ArrowUp" ||
        e.key === "PageUp"
      ) {
        e.preventDefault();
        go(currentSlide - 1);
      } else if (e.key === "Home") {
        e.preventDefault();
        go(1);
      } else if (e.key === "End") {
        e.preventDefault();
        go(SLIDE_COUNT);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSlide]);

  const prev = Math.max(1, currentSlide - 1);
  const next = Math.min(SLIDE_COUNT, currentSlide + 1);
  const atStart = currentSlide <= 1;
  const atEnd = currentSlide >= SLIDE_COUNT;

  return (
    <div className="relative h-svh w-full overflow-hidden bg-background text-foreground">
      {/* Slide counter — top left */}
      <div className="pointer-events-none fixed left-[max(1.25rem,env(safe-area-inset-left))] top-[max(1.25rem,env(safe-area-inset-top))] z-40 font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
        <span className="text-foreground">{pad2(currentSlide)}</span>
        <span className="text-foreground/30"> / </span>
        <span>{pad2(SLIDE_COUNT)}</span>
      </div>

      {/* WiFi badge — top right, on every slide */}
      <div className="pointer-events-none fixed right-[max(1.25rem,env(safe-area-inset-right))] top-[max(1.1rem,env(safe-area-inset-top))] z-40 flex items-start gap-2.5 rounded-lg border border-border bg-card/70 backdrop-blur-sm px-3 py-2 font-mono text-[10px] uppercase tracking-[0.18em] sm:text-xs">
        <Wifi className="mt-0.5 size-3.5 text-foreground" />
        <div className="flex flex-col gap-0.5">
          <div className="flex items-baseline gap-2">
            <span className="text-muted-foreground">Network</span>
            <span className="text-foreground">Disruptive Edge</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-muted-foreground">Password</span>
            <span className="text-foreground">Innovation</span>
          </div>
        </div>
      </div>

      {/* Slide content fills the screen */}
      <div className="h-full w-full overflow-y-auto">{children}</div>

      {/* Prev / Next buttons — bottom right */}
      <div className="fixed bottom-[max(1.25rem,env(safe-area-inset-bottom))] right-[max(1.25rem,env(safe-area-inset-right))] z-40 flex items-center gap-2">
        <Link
          href={`/hackathons/mulerun/present/${prev}`}
          aria-label="Previous slide"
          className={
            "inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card/70 backdrop-blur-sm transition-opacity " +
            (atStart
              ? "pointer-events-none opacity-30"
              : "opacity-90 hover:opacity-100")
          }
        >
          <ChevronLeft className="size-4" />
        </Link>
        <Link
          href={`/hackathons/mulerun/present/${next}`}
          aria-label="Next slide"
          className={
            "inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card/70 backdrop-blur-sm transition-opacity " +
            (atEnd
              ? "pointer-events-none opacity-30"
              : "opacity-90 hover:opacity-100")
          }
        >
          <ChevronRight className="size-4" />
        </Link>
      </div>
    </div>
  );
}
