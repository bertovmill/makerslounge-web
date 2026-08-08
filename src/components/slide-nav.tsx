"use client";

import { useEffect, useRef, useState } from "react";

export function SlideNav() {
  const [index, setIndex] = useState(0);
  const [total, setTotal] = useState(0);
  const indexRef = useRef(0);
  const slidesRef = useRef<HTMLElement[]>([]);

  useEffect(() => {
    const slides = Array.from(document.querySelectorAll<HTMLElement>("[data-slide]"));
    slidesRef.current = slides;
    setTotal(slides.length);

    const goTo = (i: number) => {
      const clamped = Math.max(0, Math.min(slidesRef.current.length - 1, i));
      slidesRef.current[clamped]?.scrollIntoView({ behavior: "smooth", block: "start" });
    };

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const i = slides.indexOf(entry.target as HTMLElement);
            if (i !== -1) {
              indexRef.current = i;
              setIndex(i);
            }
          }
        }
      },
      { threshold: 0.6 }
    );
    slides.forEach((s) => observer.observe(s));

    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;

      if (e.key === "ArrowDown" || e.key === "PageDown" || e.key === " ") {
        e.preventDefault();
        goTo(indexRef.current + 1);
      } else if (e.key === "ArrowUp" || e.key === "PageUp") {
        e.preventDefault();
        goTo(indexRef.current - 1);
      }
    };
    window.addEventListener("keydown", onKeyDown);

    return () => {
      observer.disconnect();
      window.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  if (total === 0) return null;

  return (
    <div className="fixed top-1/2 right-5 z-50 hidden -translate-y-1/2 flex-col gap-2.5 rounded-full bg-ink/60 px-2 py-3 backdrop-blur-sm md:flex">
      {Array.from({ length: total }).map((_, i) => (
        <button
          key={i}
          type="button"
          aria-label={`Go to slide ${i + 1}`}
          onClick={() => slidesRef.current[i]?.scrollIntoView({ behavior: "smooth", block: "start" })}
          className={`w-2 cursor-pointer rounded-full transition-all ${
            i === index ? "h-5 bg-white" : "h-2 bg-white/30 hover:bg-white/50"
          }`}
        />
      ))}
    </div>
  );
}
