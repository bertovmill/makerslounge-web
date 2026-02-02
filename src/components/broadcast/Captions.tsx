"use client";

import { useMemo } from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  Sequence,
} from "remotion";
import { createTikTokStyleCaptions } from "@remotion/captions";
import type { Caption, TikTokPage } from "@remotion/captions";

// Caption styling options
export interface CaptionStyle {
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: number | string;
  color?: string;
  highlightColor?: string;
  backgroundColor?: string;
  position?: "top" | "center" | "bottom";
  textShadow?: boolean;
  maxWidth?: string;
}

const DEFAULT_STYLE: CaptionStyle = {
  fontSize: 48,
  fontFamily: "system-ui, -apple-system, sans-serif",
  fontWeight: "bold",
  color: "#ffffff",
  highlightColor: "#39E508",
  backgroundColor: "rgba(0, 0, 0, 0.7)",
  position: "bottom",
  textShadow: true,
  maxWidth: "80%",
};

// How often captions should switch (in milliseconds)
const SWITCH_CAPTIONS_EVERY_MS = 1500;

// Single caption page with word highlighting
interface CaptionPageProps {
  page: TikTokPage;
  style: CaptionStyle;
}

const CaptionPage: React.FC<CaptionPageProps> = ({ page, style }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Current time relative to the start of the sequence
  const currentTimeMs = (frame / fps) * 1000;
  // Convert to absolute time by adding the page start
  const absoluteTimeMs = page.startMs + currentTimeMs;

  const positionStyles: Record<string, React.CSSProperties> = {
    top: { top: 60, bottom: "auto" },
    center: { top: "50%", transform: "translateY(-50%)" },
    bottom: { bottom: 80, top: "auto" },
  };

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        ...positionStyles[style.position || "bottom"],
        position: "absolute",
        left: 0,
        right: 0,
      }}
    >
      <div
        style={{
          fontSize: style.fontSize,
          fontFamily: style.fontFamily,
          fontWeight: style.fontWeight,
          whiteSpace: "pre-wrap",
          textAlign: "center",
          maxWidth: style.maxWidth,
          padding: "12px 24px",
          borderRadius: 8,
          backgroundColor: style.backgroundColor,
          textShadow: style.textShadow
            ? "0 2px 4px rgba(0,0,0,0.8), 0 4px 12px rgba(0,0,0,0.4)"
            : undefined,
        }}
      >
        {page.tokens.map((token, index) => {
          const isActive =
            token.fromMs <= absoluteTimeMs && token.toMs > absoluteTimeMs;

          return (
            <span
              key={`${token.fromMs}-${index}`}
              style={{
                color: isActive ? style.highlightColor : style.color,
                transition: "color 0.1s ease",
              }}
            >
              {token.text}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// Main captions component
interface CaptionsOverlayProps {
  captions: Caption[];
  style?: Partial<CaptionStyle>;
  combineTokensWithinMs?: number;
}

export const CaptionsOverlay: React.FC<CaptionsOverlayProps> = ({
  captions,
  style = {},
  combineTokensWithinMs = SWITCH_CAPTIONS_EVERY_MS,
}) => {
  const { fps } = useVideoConfig();
  const mergedStyle = { ...DEFAULT_STYLE, ...style };

  // Create TikTok-style caption pages
  const { pages } = useMemo(() => {
    if (!captions || captions.length === 0) {
      return { pages: [] };
    }
    return createTikTokStyleCaptions({
      captions,
      combineTokensWithinMilliseconds: combineTokensWithinMs,
    });
  }, [captions, combineTokensWithinMs]);

  if (pages.length === 0) {
    return null;
  }

  return (
    <AbsoluteFill>
      {pages.map((page, index) => {
        const nextPage = pages[index + 1] ?? null;
        const startFrame = Math.round((page.startMs / 1000) * fps);
        const endFrame = Math.min(
          nextPage ? Math.round((nextPage.startMs / 1000) * fps) : Infinity,
          startFrame + Math.round((combineTokensWithinMs / 1000) * fps)
        );
        const durationInFrames = endFrame - startFrame;

        if (durationInFrames <= 0) {
          return null;
        }

        return (
          <Sequence
            key={index}
            from={startFrame}
            durationInFrames={durationInFrames}
          >
            <CaptionPage page={page} style={mergedStyle} />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};

// Helper to convert SRT/VTT to Caption format
export function parseSRT(srtContent: string): Caption[] {
  const captions: Caption[] = [];
  const blocks = srtContent.trim().split(/\n\n+/);

  for (const block of blocks) {
    const lines = block.split("\n");
    if (lines.length < 3) continue;

    // Parse timestamp line (format: 00:00:00,000 --> 00:00:00,000)
    const timestampLine = lines[1];
    const timestampMatch = timestampLine.match(
      /(\d{2}):(\d{2}):(\d{2})[,.](\d{3})\s*-->\s*(\d{2}):(\d{2}):(\d{2})[,.](\d{3})/
    );

    if (!timestampMatch) continue;

    const startMs =
      parseInt(timestampMatch[1]) * 3600000 +
      parseInt(timestampMatch[2]) * 60000 +
      parseInt(timestampMatch[3]) * 1000 +
      parseInt(timestampMatch[4]);

    const endMs =
      parseInt(timestampMatch[5]) * 3600000 +
      parseInt(timestampMatch[6]) * 60000 +
      parseInt(timestampMatch[7]) * 1000 +
      parseInt(timestampMatch[8]);

    // Get the text (remaining lines)
    const text = lines.slice(2).join(" ");

    captions.push({
      text,
      startMs,
      endMs,
      confidence: 1,
      timestampMs: startMs,
    });
  }

  return captions;
}

// Helper to create captions from simple text with auto-timing
export function createAutoCaptions(
  text: string,
  durationMs: number,
  wordsPerCaption: number = 5
): Caption[] {
  const words = text.split(/\s+/).filter((w) => w.length > 0);
  const captions: Caption[] = [];
  const msPerWord = durationMs / words.length;

  for (let i = 0; i < words.length; i += wordsPerCaption) {
    const chunk = words.slice(i, i + wordsPerCaption);
    const startMs = Math.round(i * msPerWord);
    const endMs = Math.round((i + chunk.length) * msPerWord);

    captions.push({
      text: " " + chunk.join(" "), // Space prefix for proper rendering
      startMs,
      endMs,
      confidence: 1,
      timestampMs: startMs,
    });
  }

  return captions;
}

export default CaptionsOverlay;
