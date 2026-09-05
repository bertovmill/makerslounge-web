/**
 * Flat motif art for the four value cards on the landing page.
 *
 * These replaced glossy 3D renders that fought the editorial system. Each
 * panel is a solid `--blue-pale` field with a small composition of the
 * existing `Motif` primitives — arcs, blocks, sparkles — in the brand blues.
 * Nothing here is content: every panel is `aria-hidden`.
 */
import { Arc, Block, Sparkle } from "@/components/Motif";
import { cn } from "@/lib/utils";

export type ValueKey = "hustle" | "learning" | "community" | "fun";

export function ValueArt({ value, className }: { value: ValueKey; className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        "relative aspect-[4/3] w-full overflow-hidden bg-[var(--blue-pale)]",
        className,
      )}
    >
      {ART[value]}
    </div>
  );
}

const ART: Record<ValueKey, React.ReactNode> = {
  // A bolt: two hard blocks stepped across the panel, moving up and right.
  hustle: (
    <>
      <Block tone="core" className="left-[14%] top-[54%] h-[16%] w-[52%] -rotate-[28deg]" />
      <Block tone="deep" className="left-[40%] top-[26%] h-[16%] w-[52%] -rotate-[28deg]" />
      <Sparkle tone="core" size="0.9rem" className="absolute right-[12%] top-[14%]" />
    </>
  ),
  // A rising sun over a horizon: a half-disc clipped by a flat ground block.
  learning: (
    <>
      <Arc tone="core" size="62%" className="left-1/2 top-[30%] -translate-x-1/2" />
      <Block tone="deep" className="bottom-0 left-0 h-[34%] w-full" />
      <Sparkle tone="light" size="0.8rem" className="absolute left-[16%] top-[18%]" />
    </>
  ),
  // Three overlapping circles, one for each of us.
  community: (
    <>
      <Arc tone="mid" size="48%" className="left-[14%] top-[22%]" />
      <Arc tone="core" size="48%" className="left-[38%] top-[22%]" />
      <Arc tone="deep" size="48%" className="left-[26%] top-[46%]" />
    </>
  ),
  // Confetti: sparkles in every size, hand-placed so it reads as composed.
  fun: (
    <>
      <Sparkle tone="core" size="2.4rem" className="absolute left-[38%] top-[26%]" />
      <Sparkle tone="deep" size="1.1rem" className="absolute left-[16%] top-[18%]" />
      <Sparkle tone="mid" size="1.3rem" className="absolute right-[14%] top-[22%]" />
      <Sparkle tone="deep" size="0.9rem" className="absolute left-[22%] bottom-[20%]" />
      <Sparkle tone="core" size="1.5rem" className="absolute right-[22%] bottom-[16%]" />
      <Sparkle tone="mid" size="0.7rem" className="absolute left-[54%] bottom-[30%]" />
    </>
  ),
};
