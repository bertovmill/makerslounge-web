"use client";

import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Sequence,
} from "remotion";
import { Video } from "@remotion/media";
import type { Caption } from "@remotion/captions";
import { CaptionsOverlay, CaptionStyle } from "./Captions";

// Text animation types
type TextAnimation = "none" | "fade" | "typewriter" | "word-highlight" | "slide-up" | "scale";

interface TextLayerProps {
  text: string;
  fontSize?: number;
  color?: string;
  animation?: TextAnimation;
  highlightColor?: string;
  shadow?: boolean;
  delay?: number;
}

// Typewriter effect helper
const getTypedText = (frame: number, text: string, charFrames: number = 2): string => {
  const typedChars = Math.floor(frame / charFrames);
  return text.slice(0, Math.min(typedChars, text.length));
};

// Blinking cursor component
const Cursor: React.FC<{ frame: number; blinkFrames?: number }> = ({
  frame,
  blinkFrames = 16,
}) => {
  const opacity = interpolate(
    frame % blinkFrames,
    [0, blinkFrames / 2, blinkFrames],
    [1, 0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  return <span style={{ opacity }}>|</span>;
};

// Word highlight component
const WordHighlight: React.FC<{
  text: string;
  frame: number;
  fps: number;
  highlightColor: string;
  wordsPerSecond?: number;
}> = ({ text, frame, fps, highlightColor, wordsPerSecond = 2 }) => {
  const words = text.split(" ");
  const framesPerWord = fps / wordsPerSecond;
  const currentWordIndex = Math.floor(frame / framesPerWord);

  return (
    <span style={{ whiteSpace: "pre-wrap" }}>
      {words.map((word, index) => {
        const isHighlighted = index === currentWordIndex % words.length;
        return (
          <span
            key={index}
            style={{
              color: isHighlighted ? highlightColor : "inherit",
              transition: "none", // CSS transitions forbidden in Remotion
            }}
          >
            {word}
            {index < words.length - 1 ? " " : ""}
          </span>
        );
      })}
    </span>
  );
};

export const TextLayer: React.FC<TextLayerProps> = ({
  text,
  fontSize = 64,
  color = "#ffffff",
  animation = "fade",
  highlightColor = "#39E508",
  shadow = true,
  delay = 0,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const adjustedFrame = Math.max(0, frame - delay);

  // Base styles
  const baseStyle: React.CSSProperties = {
    fontSize,
    color,
    fontWeight: "bold",
    textAlign: "center",
    textShadow: shadow ? "0 2px 10px rgba(0,0,0,0.8), 0 4px 20px rgba(0,0,0,0.5)" : undefined,
    maxWidth: "80%",
    lineHeight: 1.2,
  };

  // Animation-specific rendering
  switch (animation) {
    case "typewriter": {
      const typedText = getTypedText(adjustedFrame, text, 2);
      const isComplete = typedText.length >= text.length;
      return (
        <div style={baseStyle}>
          <span>{typedText}</span>
          {!isComplete && <Cursor frame={adjustedFrame} />}
        </div>
      );
    }

    case "word-highlight": {
      return (
        <div style={baseStyle}>
          <WordHighlight
            text={text}
            frame={adjustedFrame}
            fps={fps}
            highlightColor={highlightColor}
          />
        </div>
      );
    }

    case "slide-up": {
      const translateY = interpolate(adjustedFrame, [0, 20], [50, 0], {
        extrapolateRight: "clamp",
      });
      const opacity = interpolate(adjustedFrame, [0, 15], [0, 1], {
        extrapolateRight: "clamp",
      });
      return (
        <div style={{ ...baseStyle, opacity, transform: `translateY(${translateY}px)` }}>
          {text}
        </div>
      );
    }

    case "scale": {
      const scale = spring({
        frame: adjustedFrame,
        fps,
        config: { mass: 0.5, damping: 10 },
      });
      const opacity = interpolate(adjustedFrame, [0, 10], [0, 1], {
        extrapolateRight: "clamp",
      });
      return (
        <div style={{ ...baseStyle, opacity, transform: `scale(${scale})` }}>
          {text}
        </div>
      );
    }

    case "fade":
    default: {
      const opacity = interpolate(adjustedFrame, [0, 15], [0, 1], {
        extrapolateRight: "clamp",
      });
      return <div style={{ ...baseStyle, opacity }}>{text}</div>;
    }
  }
};

export interface VideoCompositionProps {
  title?: string;
  caption?: string;
  backgroundColor?: string;
  accentColor?: string;
  videoSrc?: string | null;
  showOverlay?: boolean;
  overlayPosition?: "top" | "center" | "bottom";
  overlayOpacity?: number;
  titleAnimation?: TextAnimation;
  captionAnimation?: TextAnimation;
  volume?: number;
  trimStart?: number;
  trimEnd?: number;
  playbackRate?: number;
  muted?: boolean;
  // Captions support
  captions?: Caption[];
  captionStyle?: Partial<CaptionStyle>;
  showCaptions?: boolean;
}

export const VideoComposition: React.FC<VideoCompositionProps> = ({
  title = "",
  caption = "",
  backgroundColor = "#0f0f0f",
  accentColor = "#3b82f6",
  videoSrc = null,
  showOverlay = true,
  overlayPosition = "center",
  overlayOpacity = 0.4,
  titleAnimation = "fade",
  captionAnimation = "fade",
  volume = 1,
  trimStart = 0,
  trimEnd,
  playbackRate = 1,
  muted = false,
  captions = [],
  captionStyle,
  showCaptions = false,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  // Animated gradient background (only when no video)
  const gradientRotation = interpolate(frame, [0, durationInFrames], [0, 360]);

  // Progress bar
  const progress = (frame / durationInFrames) * 100;

  // Position styles for overlay text
  const positionStyles: Record<string, React.CSSProperties> = {
    top: { top: 80, left: 0, right: 0 },
    center: { top: "50%", left: 0, right: 0, transform: "translateY(-50%)" },
    bottom: { bottom: 100, left: 0, right: 0 },
  };

  return (
    <AbsoluteFill style={{ backgroundColor }}>
      {/* Video Background */}
      {videoSrc && (
        <AbsoluteFill style={{ backgroundColor: "#000" }}>
          <Video
            src={videoSrc}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
            volume={muted ? 0 : volume}
            playbackRate={playbackRate}
            muted={muted}
          />
          {/* Dark overlay for text readability */}
          {showOverlay && (title || caption) && (
            <AbsoluteFill
              style={{
                backgroundColor: `rgba(0,0,0,${overlayOpacity})`,
              }}
            />
          )}
        </AbsoluteFill>
      )}

      {/* Animated gradient orb (only when no video) */}
      {!videoSrc && (
        <div
          style={{
            position: "absolute",
            width: 600,
            height: 600,
            borderRadius: "50%",
            background: `conic-gradient(from ${gradientRotation}deg, ${accentColor}, #8b5cf6, #ec4899, ${accentColor})`,
            filter: "blur(100px)",
            opacity: 0.3,
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
          }}
        />
      )}

      {/* Content Overlay */}
      {(title || caption) && (
        <div
          style={{
            position: "absolute",
            ...positionStyles[overlayPosition],
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 20,
            padding: "0 40px",
            zIndex: 10,
          }}
        >
          {title && (
            <Sequence from={0}>
              <TextLayer
                text={title}
                fontSize={videoSrc ? 56 : 72}
                color="#ffffff"
                animation={titleAnimation}
                highlightColor={accentColor}
                shadow={!!videoSrc}
              />
            </Sequence>
          )}

          {caption && (
            <Sequence from={15}>
              <TextLayer
                text={caption}
                fontSize={videoSrc ? 28 : 32}
                color="rgba(255,255,255,0.9)"
                animation={captionAnimation}
                highlightColor={accentColor}
                shadow={!!videoSrc}
                delay={0}
              />
            </Sequence>
          )}
        </div>
      )}

      {/* Captions Overlay */}
      {showCaptions && captions.length > 0 && (
        <CaptionsOverlay
          captions={captions}
          style={{
            highlightColor: accentColor,
            ...captionStyle,
          }}
        />
      )}

      {/* Progress bar */}
      <div
        style={{
          position: "absolute",
          bottom: 40,
          left: 40,
          right: 40,
          height: 4,
          backgroundColor: "rgba(255,255,255,0.2)",
          borderRadius: 2,
          zIndex: 20,
        }}
      >
        <div
          style={{
            width: `${progress}%`,
            height: "100%",
            backgroundColor: accentColor,
            borderRadius: 2,
          }}
        />
      </div>
    </AbsoluteFill>
  );
};

export default VideoComposition;
