import Image from "next/image";

// Real photos from MakersLounge events. Dimensions are the files' own, so
// next/image can reserve the right box before each one loads.
const PHOTOS = [
  { src: "team-photo.jpeg", w: 1182, h: 666, alt: "MakersLounge members posing together at an event" },
  { src: "lounge-working.jpeg", w: 1086, h: 724, alt: "Makers working on laptops around the lounge" },
  { src: "presenting-matcher.jpeg", w: 1086, h: 724, alt: "A member demoing a project to the room" },
  { src: "networking-crowd.jpeg", w: 1086, h: 724, alt: "A packed room of builders chatting" },
  { src: "hackathon-working.jpeg", w: 1086, h: 724, alt: "Teams heads-down at a hackathon" },
  { src: "presentation-audience.jpeg", w: 1086, h: 724, alt: "An audience watching a talk" },
  { src: "coworking-space.jpeg", w: 1086, h: 724, alt: "A long co-working table full of makers" },
  { src: "demo-day.jpeg", w: 1086, h: 724, alt: "A speaker presenting on demo day" },
  { src: "lounge-networking.jpeg", w: 1086, h: 724, alt: "Members relaxing and talking on the lounge sofas" },
  { src: "presenting-slides.jpeg", w: 1086, h: 724, alt: "A presenter walking through slides" },
] as const;

/**
 * A slow, endless strip of community photos.
 *
 * The list is rendered twice and the track slides by exactly half its width,
 * so the loop has no seam. Spacing is padding on each item rather than `gap`,
 * which keeps the two halves identical in width. Hover pauses it; reduced
 * motion turns it into a plain horizontal scroller (see `.photo-marquee` in
 * globals.css).
 */
export function PhotoMarquee() {
  return (
    <div className="photo-marquee overflow-hidden">
      <ul className="photo-marquee-track flex w-max">
        {[0, 1].map((copy) =>
          PHOTOS.map((photo) => (
            <li
              key={`${copy}-${photo.src}`}
              aria-hidden={copy === 1 || undefined}
              className="shrink-0 pr-4 sm:pr-5"
            >
              <Image
                src={`/makerslounge-photos/${photo.src}`}
                width={photo.w}
                height={photo.h}
                alt={copy === 1 ? "" : photo.alt}
                sizes="(min-width: 640px) 340px, 260px"
                className="h-44 w-auto border-[1.5px] border-[var(--ink)] object-cover shadow-[var(--shadow-card)] sm:h-56"
              />
            </li>
          )),
        )}
      </ul>
    </div>
  );
}
