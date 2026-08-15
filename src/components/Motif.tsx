/**
 * Decorative motif primitives for the flat editorial system.
 *
 * Everything here is presentational and `aria-hidden` — these are colour
 * blocks and sparkles, never content. They are absolutely positioned, so the
 * parent needs `relative` and usually `overflow-hidden`.
 */

import { cn } from "@/lib/utils";

type Tone = "core" | "deep" | "mid" | "light" | "pale" | "sand" | "ink" | "sun";

const TONE_VAR: Record<Tone, string> = {
  core: "var(--blue-core)",
  deep: "var(--blue-deep)",
  mid: "var(--blue-mid)",
  light: "var(--blue-light)",
  pale: "var(--blue-pale)",
  sand: "var(--sand)",
  ink: "var(--ink)",
  // Theme-aware: light tint in light mode, deep navy in dark, so text laid
  // over it keeps contrast in both.
  sun: "var(--motif-sun)",
};

/**
 * The oversized circle that sits behind hero content — the reference's "sun".
 * Size is a CSS length so callers can scale it per breakpoint.
 */
export function Arc({
  tone = "pale",
  size = "34rem",
  className,
  style,
}: {
  tone?: Tone;
  size?: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      aria-hidden
      className={cn("motif-arc", className)}
      style={{ width: size, height: size, background: TONE_VAR[tone], ...style }}
    />
  );
}

/** A hard-edged rectangle of flat colour, layered behind or beside content. */
export function Block({
  tone = "core",
  className,
  style,
}: {
  tone?: Tone;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      aria-hidden
      className={cn("motif-block", className)}
      style={{ background: TONE_VAR[tone], ...style }}
    />
  );
}

/** Single four-point star. `size` is any CSS length. */
export function Sparkle({
  size = "1rem",
  tone = "core",
  twinkle = false,
  className,
  style,
}: {
  size?: string;
  tone?: Tone;
  twinkle?: boolean;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <span
      aria-hidden
      className={cn("sparkle", twinkle && "sparkle-twinkle", className)}
      style={{ width: size, color: TONE_VAR[tone], ...style }}
    />
  );
}

/**
 * A scattered constellation of sparkles, as in the reference's night sky.
 * Positions are hand-placed rather than random so the layout is stable
 * across renders and reads as composed instead of noisy.
 */
const CONSTELLATION: { top: string; left: string; size: string; delay: string }[] = [
  { top: "6%", left: "12%", size: "1.5rem", delay: "0s" },
  { top: "22%", left: "38%", size: "1rem", delay: "0.6s" },
  { top: "10%", left: "62%", size: "2rem", delay: "1.2s" },
  { top: "40%", left: "18%", size: "0.875rem", delay: "1.8s" },
  { top: "34%", left: "82%", size: "1.25rem", delay: "0.3s" },
  { top: "58%", left: "50%", size: "1rem", delay: "2.1s" },
  { top: "66%", left: "8%", size: "1.75rem", delay: "0.9s" },
  { top: "72%", left: "70%", size: "1.125rem", delay: "1.5s" },
];

export function Constellation({
  tone = "light",
  twinkle = true,
  className,
}: {
  tone?: Tone;
  twinkle?: boolean;
  className?: string;
}) {
  return (
    <div aria-hidden className={cn("pointer-events-none absolute inset-0", className)}>
      {CONSTELLATION.map((s, i) => (
        <Sparkle
          key={i}
          tone={tone}
          size={s.size}
          twinkle={twinkle}
          className="absolute"
          style={{ top: s.top, left: s.left, animationDelay: s.delay }}
        />
      ))}
    </div>
  );
}

/** Uppercase mono eyebrow, paired with a sparkle. */
export function Eyebrow({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span className={cn("label-caps inline-flex items-center gap-2", className)}>
      <Sparkle size="0.6rem" tone="core" />
      {children}
    </span>
  );
}
