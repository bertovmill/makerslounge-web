"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

const VIDEO_ID = "LbBp482681k";

export default function SlideMuleRun() {
  const [playing, setPlaying] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (typeof e.data !== "string") return;
      try {
        const data = JSON.parse(e.data);
        if (
          data.event === "infoDelivery" &&
          data.info?.playerState === 1
        ) {
          setPlaying(true);
        }
      } catch {
        // not a YouTube message
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);

  const onLoad = () => {
    iframeRef.current?.contentWindow?.postMessage(
      JSON.stringify({ event: "listening", id: "mulerun-video" }),
      "*"
    );
  };

  return (
    <div className="grid h-full grid-rows-[auto_1fr] gap-[clamp(1rem,3vh,2rem)]">
      {/* Eyebrow */}
      <div className="flex items-center gap-3 font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
        <span className="text-foreground">03</span>
        <span className="h-px w-8 bg-border" />
        <span>The tool</span>
      </div>

      {/* Body — collapses left column when playing */}
      <div className="flex min-h-0 items-center gap-[clamp(1rem,3vw,3rem)]">
        <div
          className={
            "flex min-w-0 flex-col gap-[clamp(0.75rem,2vh,1.5rem)] overflow-hidden transition-all duration-[700ms] ease-out " +
            (playing
              ? "w-0 opacity-0"
              : "w-[clamp(14rem,38%,40rem)] opacity-100")
          }
        >
          <Image
            src="/partners/mulerun-logo.png"
            alt="MuleRun"
            width={512}
            height={512}
            priority
            className="h-auto w-[clamp(5rem,10vw,9rem)] flex-shrink-0 object-contain"
          />
          <h2 className="font-serif text-[clamp(2.5rem,7vw,6rem)] leading-[0.9] tracking-tight">
            MuleRun.
          </h2>
          <p className="max-w-[40ch] text-[clamp(1rem,1.4vw,1.35rem)] text-muted-foreground">
            A platform for shipping AI agents fast. Everyone tonight gets{" "}
            <span className="text-foreground">$15 in credits</span> to build
            with.
          </p>
          <a
            href="https://mulerun.com/use-cases?tab=featured"
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-start gap-2 no-underline"
          >
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              Scan to browse use cases
            </span>
            <div className="rounded-2xl border border-border bg-white p-[clamp(0.5rem,1.2vw,1rem)] shadow-[0_8px_30px_rgba(0,0,0,0.12)]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=600x600&margin=0&data=${encodeURIComponent(
                  "https://mulerun.com/use-cases?tab=featured"
                )}`}
                alt="Scan to browse MuleRun use cases"
                width={420}
                height={420}
                className="h-[clamp(10rem,18vw,18rem)] w-[clamp(10rem,18vw,18rem)] object-contain"
              />
            </div>
            <span className="font-mono text-sm tracking-tight text-foreground underline-offset-4 hover:underline">
              mulerun.com/use-cases
            </span>
          </a>
        </div>

        <div className="flex min-w-0 flex-1 items-center justify-center">
          <div
            className={
              "aspect-video w-full max-h-full overflow-hidden rounded-lg border border-border bg-card shadow-[0_8px_30px_rgba(0,0,0,0.18)] transition-all duration-[700ms] ease-out will-change-transform " +
              (playing ? "scale-[1.02]" : "scale-100")
            }
          >
            <iframe
              ref={iframeRef}
              onLoad={onLoad}
              src={`https://www.youtube-nocookie.com/embed/${VIDEO_ID}?rel=0&enablejsapi=1`}
              title="What is MuleRun"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              className="h-full w-full"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
