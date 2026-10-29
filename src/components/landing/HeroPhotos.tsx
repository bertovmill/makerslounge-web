import Image from "next/image";

// Real event photos behind the landing hero. The first is the resting frame;
// the others crossfade over it in turn (see `.hero-slide` in globals.css).
const SLIDES = [
  "lounge-networking.jpeg",
  "networking-crowd.jpeg",
  "presentation-audience.jpeg",
] as const;

const SLIDE_SECONDS = 8;

/**
 * Full-bleed photo backdrop with a dark scrim, so white copy reads on any frame.
 * Decorative: the hero's text carries the meaning. Reduced motion holds the
 * first photo still.
 */
export function HeroPhotos() {
  return (
    <div aria-hidden className="absolute inset-0 -z-10 overflow-hidden bg-neutral-950">
      <div className="hero-photos absolute inset-0">
        {SLIDES.map((src, i) => (
          <Image
            key={src}
            src={`/makerslounge-photos/${src}`}
            alt=""
            fill
            priority={i === 0}
            sizes="100vw"
            quality={80}
            className={`object-cover object-[center_60%] ${i > 0 ? "hero-slide" : ""}`}
            style={i > 0 ? { animationDelay: `${i * SLIDE_SECONDS}s` } : undefined}
          />
        ))}
      </div>
      <div className="absolute inset-0 bg-linear-to-t from-black/90 via-black/45 to-black/50" />
    </div>
  );
}
