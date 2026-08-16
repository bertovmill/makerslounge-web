"use client";

interface TalkPlayerProps {
  videoId: string;
  title: string;
}

export default function TalkPlayer({ videoId, title }: TalkPlayerProps) {
  // youtube-nocookie + rel=0 keeps the frame from turning into a suggested-video
  // wall for other channels when the talk ends.
  const src = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(
    videoId
  )}?rel=0&modestbranding=1`;

  return (
    <div className="relative w-full overflow-hidden rounded-xl border border-border bg-black aspect-video">
      <iframe
        src={src}
        title={title}
        className="absolute inset-0 h-full w-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        referrerPolicy="strict-origin-when-cross-origin"
        allowFullScreen
      />
    </div>
  );
}
