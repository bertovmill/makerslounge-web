"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { cn } from "@/lib/utils";

// Types for timeline layers
export type LayerType = "video" | "text" | "audio" | "image";

export interface TimelineClip {
  id: string;
  type: LayerType;
  name: string;
  startFrame: number;
  endFrame: number;
  color: string;
  data?: Record<string, unknown>;
}

export interface TimelineTrack {
  id: string;
  type: LayerType;
  name: string;
  clips: TimelineClip[];
  muted?: boolean;
  locked?: boolean;
  visible?: boolean;
}

interface TimelineProps {
  tracks: TimelineTrack[];
  currentFrame: number;
  durationInFrames: number;
  fps: number;
  onSeek: (frame: number) => void;
  onTracksChange?: (tracks: TimelineTrack[]) => void;
  onClipSelect?: (clip: TimelineClip | null) => void;
  selectedClipId?: string | null;
  isPlaying?: boolean;
  onPlayPause?: () => void;
  onAddTrack?: (type: LayerType) => void;
  onSplitClip?: () => void;
  canSplitClip?: boolean;
}

// Helper to format time
const formatTime = (frames: number, fps: number) => {
  const seconds = Math.floor(frames / fps);
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const remainingFrames = frames % fps;
  return `${mins}:${secs.toString().padStart(2, "0")}:${remainingFrames.toString().padStart(2, "0")}`;
};

// Track type icons and colors
const TRACK_CONFIG: Record<LayerType, { icon: React.ReactNode; color: string; bgColor: string }> = {
  video: {
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
      </svg>
    ),
    color: "#3b82f6",
    bgColor: "bg-blue-500/20",
  },
  text: {
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
    ),
    color: "#8b5cf6",
    bgColor: "bg-purple-500/20",
  },
  audio: {
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
      </svg>
    ),
    color: "#10b981",
    bgColor: "bg-green-500/20",
  },
  image: {
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    color: "#f59e0b",
    bgColor: "bg-amber-500/20",
  },
};

// Time ruler component
function TimeRuler({ durationInFrames, fps, pixelsPerFrame }: { durationInFrames: number; fps: number; pixelsPerFrame: number }) {
  const totalSeconds = Math.ceil(durationInFrames / fps);
  const markers: { time: number; label: string; major: boolean }[] = [];

  // Generate time markers every second, with major markers every 5 seconds
  for (let s = 0; s <= totalSeconds; s++) {
    markers.push({
      time: s * fps,
      label: `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`,
      major: s % 5 === 0,
    });
  }

  return (
    <div className="relative h-6 bg-gray-100 border-b border-gray-200">
      {markers.map((marker) => (
        <div
          key={marker.time}
          className="absolute top-0 h-full flex flex-col items-center"
          style={{ left: marker.time * pixelsPerFrame }}
        >
          <div
            className={cn(
              "w-px",
              marker.major ? "h-3 bg-gray-400" : "h-2 bg-gray-300"
            )}
          />
          {marker.major && (
            <span className="text-[10px] text-gray-500 mt-0.5">{marker.label}</span>
          )}
        </div>
      ))}
    </div>
  );
}

// Clip component with resize handles
function TimelineClipComponent({
  clip,
  pixelsPerFrame,
  isSelected,
  onSelect,
  onResize,
  onDrag,
}: {
  clip: TimelineClip;
  pixelsPerFrame: number;
  isSelected: boolean;
  onSelect: () => void;
  onResize: (startDelta: number, endDelta: number) => void;
  onDrag: (frameDelta: number) => void;
}) {
  const clipRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizingLeft, setIsResizingLeft] = useState(false);
  const [isResizingRight, setIsResizingRight] = useState(false);
  const startX = useRef(0);
  const startFrame = useRef(0);

  const width = (clip.endFrame - clip.startFrame) * pixelsPerFrame;
  const left = clip.startFrame * pixelsPerFrame;

  const handleMouseDown = useCallback((e: React.MouseEvent, mode: "drag" | "left" | "right") => {
    e.stopPropagation();
    onSelect();
    startX.current = e.clientX;
    startFrame.current = clip.startFrame;

    if (mode === "drag") setIsDragging(true);
    if (mode === "left") setIsResizingLeft(true);
    if (mode === "right") setIsResizingRight(true);
  }, [clip.startFrame, onSelect]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - startX.current;
      const frameDelta = Math.round(deltaX / pixelsPerFrame);

      if (isDragging) {
        onDrag(frameDelta);
      } else if (isResizingLeft) {
        onResize(frameDelta, 0);
      } else if (isResizingRight) {
        onResize(0, frameDelta);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizingLeft(false);
      setIsResizingRight(false);
    };

    if (isDragging || isResizingLeft || isResizingRight) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, isResizingLeft, isResizingRight, pixelsPerFrame, onDrag, onResize]);

  return (
    <div
      ref={clipRef}
      className={cn(
        "absolute top-1 bottom-1 rounded-md cursor-pointer group transition-shadow",
        isSelected ? "ring-2 ring-primary ring-offset-1 shadow-lg" : "hover:shadow-md"
      )}
      style={{
        left,
        width: Math.max(width, 20),
        backgroundColor: clip.color,
      }}
      onClick={(e) => { e.stopPropagation(); onSelect(); }}
      onMouseDown={(e) => handleMouseDown(e, "drag")}
    >
      {/* Left resize handle */}
      <div
        className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-white/30 rounded-l-md"
        onMouseDown={(e) => handleMouseDown(e, "left")}
      />

      {/* Clip content */}
      <div className="absolute inset-x-2 inset-y-0 flex items-center overflow-hidden">
        <span className="text-xs text-white font-medium truncate drop-shadow-sm">
          {clip.name}
        </span>
      </div>

      {/* Right resize handle */}
      <div
        className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-white/30 rounded-r-md"
        onMouseDown={(e) => handleMouseDown(e, "right")}
      />

      {/* Waveform visualization for audio clips */}
      {clip.type === "audio" && (
        <div className="absolute inset-x-2 inset-y-1 flex items-center gap-px opacity-50">
          {Array.from({ length: Math.floor(width / 3) }).map((_, i) => (
            <div
              key={i}
              className="w-0.5 bg-white rounded-full"
              style={{ height: `${20 + Math.random() * 60}%` }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function Timeline({
  tracks,
  currentFrame,
  durationInFrames,
  fps,
  onSeek,
  onTracksChange,
  onClipSelect,
  selectedClipId,
  isPlaying,
  onPlayPause,
  onAddTrack,
  onSplitClip,
  canSplitClip,
}: TimelineProps) {
  const timelineRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [showAddTrackMenu, setShowAddTrackMenu] = useState(false);
  const [isDraggingPlayhead, setIsDraggingPlayhead] = useState(false);

  // Pixels per frame based on zoom
  const basePixelsPerFrame = 4;
  const pixelsPerFrame = basePixelsPerFrame * zoom;

  // Total timeline width
  const timelineWidth = durationInFrames * pixelsPerFrame;

  // Playhead position
  const playheadPosition = currentFrame * pixelsPerFrame;

  // Handle timeline click to seek
  const handleTimelineClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineRef.current) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left + scrollLeft;
    const frame = Math.round(x / pixelsPerFrame);
    onSeek(Math.max(0, Math.min(frame, durationInFrames)));
  }, [pixelsPerFrame, scrollLeft, durationInFrames, onSeek]);

  // Handle clip changes
  const handleClipResize = useCallback((trackId: string, clipId: string, startDelta: number, endDelta: number) => {
    if (!onTracksChange) return;

    const newTracks = tracks.map((track) => {
      if (track.id !== trackId) return track;
      return {
        ...track,
        clips: track.clips.map((clip) => {
          if (clip.id !== clipId) return clip;
          const newStart = Math.max(0, clip.startFrame + startDelta);
          const newEnd = Math.min(durationInFrames, clip.endFrame + endDelta);
          if (newEnd - newStart < fps / 2) return clip; // Minimum half second
          return { ...clip, startFrame: newStart, endFrame: newEnd };
        }),
      };
    });
    onTracksChange(newTracks);
  }, [tracks, durationInFrames, fps, onTracksChange]);

  const handleClipDrag = useCallback((trackId: string, clipId: string, frameDelta: number) => {
    if (!onTracksChange) return;

    const newTracks = tracks.map((track) => {
      if (track.id !== trackId) return track;
      return {
        ...track,
        clips: track.clips.map((clip) => {
          if (clip.id !== clipId) return clip;
          const duration = clip.endFrame - clip.startFrame;
          let newStart = clip.startFrame + frameDelta;
          // Clamp to timeline bounds
          newStart = Math.max(0, Math.min(durationInFrames - duration, newStart));
          return { ...clip, startFrame: newStart, endFrame: newStart + duration };
        }),
      };
    });
    onTracksChange(newTracks);
  }, [tracks, durationInFrames, onTracksChange]);

  // Handle scroll
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollLeft(e.currentTarget.scrollLeft);
  }, []);

  // Keep playhead in view during playback
  useEffect(() => {
    if (!isPlaying || !timelineRef.current) return;
    const container = timelineRef.current;
    const containerWidth = container.clientWidth - 160; // Account for track headers
    const playheadRelative = playheadPosition - scrollLeft;

    if (playheadRelative > containerWidth - 50) {
      container.scrollLeft = playheadPosition - 100;
    }
  }, [isPlaying, playheadPosition, scrollLeft]);

  // Handle playhead dragging
  const handlePlayheadMouseDown = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDraggingPlayhead(true);
  }, []);

  useEffect(() => {
    if (!isDraggingPlayhead) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!timelineRef.current) return;
      const rect = timelineRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left + scrollLeft - 160; // Account for track header width
      const frame = Math.round(x / pixelsPerFrame);
      onSeek(Math.max(0, Math.min(frame, durationInFrames)));
    };

    const handleMouseUp = () => {
      setIsDraggingPlayhead(false);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDraggingPlayhead, pixelsPerFrame, scrollLeft, durationInFrames, onSeek]);

  // Handle pinch-to-zoom on trackpad
  const handleWheel = useCallback((e: React.WheelEvent) => {
    // ctrlKey is true for pinch gestures on Mac trackpad
    if (e.ctrlKey) {
      e.preventDefault();
      // deltaY is negative when pinching out (zoom in), positive when pinching in (zoom out)
      const zoomDelta = -e.deltaY * 0.01;
      setZoom(prevZoom => Math.max(0.25, Math.min(4, prevZoom + zoomDelta)));
    }
  }, []);

  // Also need to prevent default on the native wheel event to stop page zoom
  useEffect(() => {
    const timeline = timelineRef.current;
    if (!timeline) return;

    const preventZoom = (e: WheelEvent) => {
      if (e.ctrlKey) {
        e.preventDefault();
      }
    };

    timeline.addEventListener('wheel', preventZoom, { passive: false });
    return () => timeline.removeEventListener('wheel', preventZoom);
  }, []);

  return (
    <div className="flex flex-col border-t border-gray-200 bg-white flex-shrink-0" style={{ maxHeight: "280px" }}>
      {/* Timeline Controls */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center gap-3">
          {/* Play/Pause */}
          <button
            onClick={onPlayPause}
            className="p-2 rounded-full bg-primary text-white hover:bg-primary/90 transition-colors"
          >
            {isPlaying ? (
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>

          {/* Skip to start */}
          <button
            onClick={() => onSeek(0)}
            className="p-1.5 rounded hover:bg-gray-200 text-gray-500 hover:text-gray-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
          </button>

          {/* Time display */}
          <div className="text-sm text-gray-700 font-mono tabular-nums bg-gray-100 px-2 py-1 rounded">
            {formatTime(currentFrame, fps)}
          </div>

          {/* Split clip button */}
          <button
            onClick={onSplitClip}
            disabled={!canSplitClip}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium transition-colors",
              canSplitClip
                ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
                : "bg-gray-50 text-gray-300 cursor-not-allowed"
            )}
            title={canSplitClip ? "Split clip at playhead (S)" : "Select a clip and position playhead inside it to split"}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
            Split
          </button>
        </div>

        <div className="flex items-center gap-3">
          {/* Zoom controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setZoom(Math.max(0.25, zoom - 0.25))}
              className="p-1 rounded hover:bg-gray-200 text-gray-500 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
              </svg>
            </button>
            <span className="text-xs text-gray-500 w-12 text-center">{Math.round(zoom * 100)}%</span>
            <button
              onClick={() => setZoom(Math.min(4, zoom + 0.25))}
              className="p-1 rounded hover:bg-gray-200 text-gray-500 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>

          {/* Fit to view */}
          <button
            onClick={() => {
              if (timelineRef.current) {
                const containerWidth = timelineRef.current.clientWidth - 160;
                setZoom(containerWidth / (durationInFrames * basePixelsPerFrame));
              }
            }}
            className="p-1.5 rounded hover:bg-gray-200 text-gray-500 hover:text-gray-700 transition-colors"
            title="Fit to view"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
          </button>
        </div>
      </div>

      {/* Timeline Tracks */}
      <div
        ref={timelineRef}
        className="flex-1 overflow-x-auto overflow-y-auto"
        onScroll={handleScroll}
        onWheel={handleWheel}
        style={{ minHeight: "120px" }}
      >
        <div className="relative" style={{ minWidth: timelineWidth + 160, width: "100%" }}>
          {/* Time Ruler */}
          <div className="sticky top-0 z-20 flex">
            <div className="w-40 flex-shrink-0 bg-gray-50 border-r border-b border-gray-200" />
            <div className="flex-1 relative">
              <TimeRuler durationInFrames={durationInFrames} fps={fps} pixelsPerFrame={pixelsPerFrame} />
            </div>
          </div>

          {/* Tracks */}
          <div className="relative">
            {tracks.map((track, index) => (
              <div key={track.id} className="flex h-12 border-b border-gray-100">
                {/* Track Header */}
                <div className="w-40 flex-shrink-0 bg-gray-50 border-r border-gray-200 px-2 flex items-center gap-2">
                  <div className={cn("p-1.5 rounded", TRACK_CONFIG[track.type].bgColor)}>
                    <span style={{ color: TRACK_CONFIG[track.type].color }}>
                      {TRACK_CONFIG[track.type].icon}
                    </span>
                  </div>
                  <span className="text-xs font-medium text-gray-700 truncate flex-1">{track.name}</span>
                  <div className="flex items-center gap-0.5">
                    <button
                      className={cn(
                        "p-1 rounded hover:bg-gray-200 transition-colors",
                        track.muted ? "text-red-500" : "text-gray-400"
                      )}
                      title={track.muted ? "Unmute" : "Mute"}
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        {track.muted ? (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                        ) : (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                        )}
                      </svg>
                    </button>
                    <button
                      className={cn(
                        "p-1 rounded hover:bg-gray-200 transition-colors",
                        track.visible === false ? "text-gray-300" : "text-gray-400"
                      )}
                      title={track.visible === false ? "Show" : "Hide"}
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        {track.visible === false ? (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        ) : (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        )}
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Track Content */}
                <div
                  className="flex-1 relative bg-gray-50/50 hover:bg-gray-100/50 transition-colors"
                  onClick={handleTimelineClick}
                  style={{ width: timelineWidth }}
                >
                  {/* Grid lines every second */}
                  {Array.from({ length: Math.ceil(durationInFrames / fps) + 1 }).map((_, i) => (
                    <div
                      key={i}
                      className="absolute top-0 bottom-0 w-px bg-gray-200/50"
                      style={{ left: i * fps * pixelsPerFrame }}
                    />
                  ))}

                  {/* Clips */}
                  {track.clips.map((clip) => (
                    <TimelineClipComponent
                      key={clip.id}
                      clip={clip}
                      pixelsPerFrame={pixelsPerFrame}
                      isSelected={selectedClipId === clip.id}
                      onSelect={() => onClipSelect?.(clip)}
                      onResize={(startDelta, endDelta) => handleClipResize(track.id, clip.id, startDelta, endDelta)}
                      onDrag={(frameDelta) => handleClipDrag(track.id, clip.id, frameDelta)}
                    />
                  ))}
                </div>
              </div>
            ))}

            {/* Empty state for no tracks */}
            {tracks.length === 0 && (
              <div className="flex items-center justify-center h-24 text-gray-400 text-sm">
                No tracks yet. Upload a video or add text to get started.
              </div>
            )}
          </div>

          {/* Playhead */}
          <div
            className="absolute top-0 bottom-0 w-px bg-primary z-30"
            style={{ left: playheadPosition + 160 }}
          >
            {/* Playhead handle - draggable */}
            <div
              className={cn(
                "absolute -top-1 -left-3 w-6 h-6 cursor-ew-resize group",
                isDraggingPlayhead && "cursor-grabbing"
              )}
              onMouseDown={handlePlayheadMouseDown}
            >
              {/* Diamond shape */}
              <div className={cn(
                "absolute top-1 left-1 w-4 h-4 bg-primary rounded-sm transform rotate-45 transition-transform",
                "group-hover:scale-110",
                isDraggingPlayhead && "scale-110"
              )} />
              {/* Center dot */}
              <div className="absolute top-1 left-1 w-4 h-4 flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-full" />
              </div>
            </div>
            {/* Line extends below for visibility */}
            <div className="absolute top-5 bottom-0 left-0 w-px bg-primary pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Add Track Button */}
      <div className="px-4 py-2 border-t border-gray-200 bg-gray-50">
        <div className="relative">
          <button
            onClick={() => setShowAddTrackMenu(!showAddTrackMenu)}
            className="flex items-center gap-2 px-3 py-1.5 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Track
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {showAddTrackMenu && (
            <div className="absolute bottom-full left-0 mb-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[160px] z-50">
              {([
                { type: "text" as LayerType, label: "Text Overlay", description: "Add titles, captions" },
                { type: "audio" as LayerType, label: "Audio Track", description: "Add music, voiceover" },
                { type: "image" as LayerType, label: "Image Layer", description: "Add images, logos" },
              ]).map((item) => (
                <button
                  key={item.type}
                  onClick={() => {
                    onAddTrack?.(item.type);
                    setShowAddTrackMenu(false);
                  }}
                  className="w-full px-3 py-2 text-left hover:bg-gray-100 transition-colors flex items-center gap-3"
                >
                  <div className={cn("p-1.5 rounded", TRACK_CONFIG[item.type].bgColor)}>
                    <span style={{ color: TRACK_CONFIG[item.type].color }}>
                      {TRACK_CONFIG[item.type].icon}
                    </span>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">{item.label}</div>
                    <div className="text-xs text-gray-500">{item.description}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Timeline;
