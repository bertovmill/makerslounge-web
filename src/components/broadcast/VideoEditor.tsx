"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Player, PlayerRef } from "@remotion/player";
import { VideoComposition } from "./VideoComposition";
import { Timeline, TimelineTrack, TimelineClip } from "./Timeline";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type TextAnimation = "none" | "fade" | "typewriter" | "word-highlight" | "slide-up" | "scale";
type ActiveTool = "text" | "music" | "captions" | "brand" | "layout" | "uploads" | null;

// Generate unique IDs
const generateId = () => Math.random().toString(36).substring(2, 9);

interface VideoEditorProps {
  className?: string;
}

const TEXT_ANIMATIONS: { value: TextAnimation; label: string }[] = [
  { value: "none", label: "None" },
  { value: "fade", label: "Fade" },
  { value: "typewriter", label: "Typewriter" },
  { value: "word-highlight", label: "Word Highlight" },
  { value: "slide-up", label: "Slide Up" },
  { value: "scale", label: "Scale" },
];

const ASPECT_RATIOS = [
  { value: "16:9", width: 1920, height: 1080 },
  { value: "9:16", width: 1080, height: 1920 },
  { value: "1:1", width: 1080, height: 1080 },
  { value: "4:5", width: 1080, height: 1350 },
];

export function VideoEditor({ className }: VideoEditorProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [playerRef, setPlayerRef] = useState<PlayerRef | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // UI State
  const [activeTool, setActiveTool] = useState<ActiveTool>("text");
  const [aspectRatio, setAspectRatio] = useState(ASPECT_RATIOS[0]);
  const [showAspectMenu, setShowAspectMenu] = useState(false);

  // Subscribe to player events
  useEffect(() => {
    if (!playerRef) return;

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onFrameUpdate = (e: { detail: { frame: number } }) => {
      setCurrentFrame(e.detail.frame);
    };

    playerRef.addEventListener("play", onPlay);
    playerRef.addEventListener("pause", onPause);
    playerRef.addEventListener("frameupdate", onFrameUpdate);

    return () => {
      playerRef.removeEventListener("play", onPlay);
      playerRef.removeEventListener("pause", onPause);
      playerRef.removeEventListener("frameupdate", onFrameUpdate);
    };
  }, [playerRef]);

  // Video settings
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const [videoFileName, setVideoFileName] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [caption, setCaption] = useState("");
  const [backgroundColor, setBackgroundColor] = useState("#0f0f0f");
  const [accentColor, setAccentColor] = useState("#3b82f6");
  const [duration, setDuration] = useState(5);
  const [overlayPosition, setOverlayPosition] = useState<"top" | "center" | "bottom">("center");
  const [overlayOpacity, setOverlayOpacity] = useState(0.4);
  const [isDragging, setIsDragging] = useState(false);

  // Animation and media controls
  const [titleAnimation, setTitleAnimation] = useState<TextAnimation>("fade");
  const [captionAnimation, setCaptionAnimation] = useState<TextAnimation>("fade");
  const [volume, setVolume] = useState(1);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [muted, setMuted] = useState(false);

  // Timeline state
  const [tracks, setTracks] = useState<TimelineTrack[]>([]);
  const [selectedClip, setSelectedClip] = useState<TimelineClip | null>(null);

  const fps = 30;
  const durationInFrames = duration * fps;

  // Update tracks when video is added
  useEffect(() => {
    setTracks((currentTracks) => {
      const hasVideoTrack = currentTracks.some(t => t.type === "video");

      if (videoSrc && !hasVideoTrack) {
        // Add video track
        return [{
          id: generateId(),
          type: "video" as const,
          name: videoFileName || "Video",
          clips: [{
            id: generateId(),
            type: "video" as const,
            name: videoFileName || "Video Clip",
            startFrame: 0,
            endFrame: durationInFrames,
            color: "#3b82f6",
          }],
        }, ...currentTracks.filter(t => t.type !== "video")];
      } else if (!videoSrc && hasVideoTrack) {
        // Remove video track
        return currentTracks.filter(t => t.type !== "video");
      } else if (videoSrc && hasVideoTrack) {
        // Update existing video track duration
        return currentTracks.map(t => {
          if (t.type === "video") {
            return {
              ...t,
              name: videoFileName || "Video",
              clips: t.clips.map(c => ({
                ...c,
                name: videoFileName || "Video Clip",
                endFrame: durationInFrames,
              })),
            };
          }
          return t;
        });
      }
      return currentTracks;
    });
  }, [videoSrc, videoFileName, durationInFrames]);

  // Update tracks when title/caption changes
  useEffect(() => {
    setTracks((currentTracks) => {
      const hasTextTrack = currentTracks.some(t => t.type === "text");
      const hasTitle = title.trim().length > 0;
      const hasCaption = caption.trim().length > 0;
      const hasText = hasTitle || hasCaption;

      if (hasText && !hasTextTrack) {
        // Add text track
        const textClips: TimelineClip[] = [];
        if (hasTitle) {
          textClips.push({
            id: generateId(),
            type: "text" as const,
            name: `Title: ${title.substring(0, 20)}${title.length > 20 ? "..." : ""}`,
            startFrame: 0,
            endFrame: Math.min(fps * 3, durationInFrames), // 3 seconds
            color: "#8b5cf6",
            data: { text: title, isTitle: true },
          });
        }
        if (hasCaption) {
          textClips.push({
            id: generateId(),
            type: "text" as const,
            name: `Caption: ${caption.substring(0, 20)}${caption.length > 20 ? "..." : ""}`,
            startFrame: fps, // Start at 1 second
            endFrame: durationInFrames,
            color: "#a855f7",
            data: { text: caption, isCaption: true },
          });
        }
        return [...currentTracks.filter(t => t.type !== "text"), {
          id: generateId(),
          type: "text" as const,
          name: "Text Overlays",
          clips: textClips,
        }];
      } else if (!hasText && hasTextTrack) {
        // Remove text track
        return currentTracks.filter(t => t.type !== "text");
      } else if (hasText && hasTextTrack) {
        // Update text track
        return currentTracks.map(t => {
          if (t.type === "text") {
            const newClips: TimelineClip[] = [];
            if (hasTitle) {
              const existingTitleClip = t.clips.find(c => (c.data as Record<string, unknown>)?.isTitle);
              newClips.push({
                id: existingTitleClip?.id || generateId(),
                type: "text" as const,
                name: `Title: ${title.substring(0, 20)}${title.length > 20 ? "..." : ""}`,
                startFrame: existingTitleClip?.startFrame ?? 0,
                endFrame: existingTitleClip?.endFrame ?? Math.min(fps * 3, durationInFrames),
                color: "#8b5cf6",
                data: { text: title, isTitle: true },
              });
            }
            if (hasCaption) {
              const existingCaptionClip = t.clips.find(c => (c.data as Record<string, unknown>)?.isCaption);
              newClips.push({
                id: existingCaptionClip?.id || generateId(),
                type: "text" as const,
                name: `Caption: ${caption.substring(0, 20)}${caption.length > 20 ? "..." : ""}`,
                startFrame: existingCaptionClip?.startFrame ?? fps,
                endFrame: existingCaptionClip?.endFrame ?? durationInFrames,
                color: "#a855f7",
                data: { text: caption, isCaption: true },
              });
            }
            return { ...t, clips: newClips };
          }
          return t;
        });
      }
      return currentTracks;
    });
  }, [title, caption, fps, durationInFrames]);

  const togglePlayback = useCallback(() => {
    if (!playerRef) return;
    if (isPlaying) {
      playerRef.pause();
    } else {
      playerRef.play();
    }
  }, [playerRef, isPlaying]);

  const seekTo = useCallback((frame: number) => {
    if (!playerRef) return;
    playerRef.seekTo(frame);
  }, [playerRef]);

  const [videoWarning, setVideoWarning] = useState<string | null>(null);

  const handleFileSelect = useCallback((file: File) => {
    if (!file.type.startsWith("video/")) {
      alert("Please select a video file");
      return;
    }

    // Check for potentially unsupported formats
    const fileName = file.name.toLowerCase();
    if (fileName.endsWith(".mov") || fileName.endsWith(".hevc")) {
      setVideoWarning("MOV/HEVC files may not display in browser. If video doesn't appear, convert to MP4 (H.264).");
    } else {
      setVideoWarning(null);
    }

    const url = URL.createObjectURL(file);
    setVideoSrc(url);
    setVideoFileName(file.name);

    const video = document.createElement("video");
    video.preload = "metadata";
    video.onloadedmetadata = () => {
      const videoDuration = Math.ceil(video.duration);
      setDuration(Math.min(videoDuration, 60));
      // Check if video has valid dimensions (indicates codec support)
      if (video.videoWidth === 0 || video.videoHeight === 0) {
        setVideoWarning("Video codec not supported by browser. Please convert to MP4 (H.264).");
      }
    };
    video.onerror = () => {
      setVideoWarning("Could not load video. Try converting to MP4 (H.264).");
    };
    video.src = url;
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
  }, [handleFileSelect]);

  const removeVideo = useCallback(() => {
    if (videoSrc) URL.revokeObjectURL(videoSrc);
    setVideoSrc(null);
    setVideoFileName(null);
    setVideoWarning(null);
  }, [videoSrc]);

  const accentColors = [
    { value: "#3b82f6", label: "Blue" },
    { value: "#8b5cf6", label: "Purple" },
    { value: "#ec4899", label: "Pink" },
    { value: "#10b981", label: "Green" },
    { value: "#f59e0b", label: "Orange" },
    { value: "#ef4444", label: "Red" },
    { value: "#ffffff", label: "White" },
  ];

  // Tool icons for the vertical toolbar
  const tools = [
    { id: "text" as const, label: "Text", icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
    )},
    { id: "captions" as const, label: "Captions", icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
      </svg>
    )},
    { id: "music" as const, label: "Music", icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
      </svg>
    )},
    { id: "brand" as const, label: "Brand", icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
      </svg>
    )},
    { id: "layout" as const, label: "Layout", icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
      </svg>
    )},
    { id: "uploads" as const, label: "Uploads", icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
      </svg>
    )},
  ];

  return (
    <div className={cn("h-[calc(100vh-200px)] min-h-[600px] flex flex-col bg-gray-50 rounded-xl overflow-hidden border border-border shadow-sm", className)}>
      {/* Top Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <button className="p-1.5 rounded hover:bg-gray-100 text-gray-500 hover:text-gray-900 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <span className="text-sm font-medium text-gray-900">Untitled Project</span>
          </div>
          <div className="flex items-center gap-1">
            <button className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
              </svg>
            </button>
            <button className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6" />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Aspect Ratio Selector */}
          <div className="relative">
            <button
              onClick={() => setShowAspectMenu(!showAspectMenu)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 border border-gray-200 text-sm text-gray-700 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
              </svg>
              {aspectRatio.value}
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {showAspectMenu && (
              <div className="absolute top-full mt-1 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-50 py-1 min-w-[120px]">
                {ASPECT_RATIOS.map((ratio) => (
                  <button
                    key={ratio.value}
                    onClick={() => { setAspectRatio(ratio); setShowAspectMenu(false); }}
                    className={cn(
                      "w-full px-3 py-2 text-left text-sm hover:bg-gray-100 transition-colors",
                      aspectRatio.value === ratio.value ? "text-primary" : "text-gray-700"
                    )}
                  >
                    {ratio.value}
                  </button>
                ))}
              </div>
            )}
          </div>

          <Button variant="outline" size="sm">
            Share
          </Button>
          <Button size="sm" className="bg-primary hover:bg-primary/90">
            Export
          </Button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Left Panel - Script/Transcript */}
        <div className="w-80 border-r border-gray-200 bg-white flex flex-col">
          <div className="p-3 border-b border-gray-200">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search"
                className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-gray-300 focus:ring-1 focus:ring-gray-200"
              />
            </div>
          </div>

          <div className="p-3">
            <button className="w-full flex items-center justify-center gap-2 py-2.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg text-sm text-gray-700 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-4">
            {/* Script segments */}
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <span className="text-xs text-gray-400 font-mono pt-1">00:00</span>
                <div className="flex-1">
                  <span className="text-xs font-medium text-primary mb-1 block">Title</span>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {title || <span className="text-gray-400 italic">Add a title...</span>}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="text-xs text-gray-400 font-mono pt-1">00:01</span>
                <div className="flex-1">
                  <span className="text-xs font-medium text-purple-500 mb-1 block">Caption</span>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {caption || <span className="text-gray-400 italic">Add a caption...</span>}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Center - Video Preview */}
        <div
          className={cn(
            "flex-1 flex items-center justify-center p-4 bg-gray-100 transition-colors min-h-0 min-w-0",
            isDragging && "bg-primary/10"
          )}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          {isDragging ? (
            <div className="text-center text-gray-600">
              <svg className="w-16 h-16 mx-auto mb-4 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p className="text-lg font-medium">Drop your video here</p>
            </div>
          ) : (
            <div
              className="rounded-lg overflow-hidden border border-gray-300 shadow-xl bg-black relative flex items-center justify-center"
              style={{
                aspectRatio: `${aspectRatio.width}/${aspectRatio.height}`,
                maxHeight: "calc(100% - 2rem)",
                maxWidth: "calc(100% - 2rem)",
                width: aspectRatio.width >= aspectRatio.height ? "auto" : "100%",
                height: aspectRatio.height > aspectRatio.width ? "auto" : "100%",
                minWidth: "200px",
                minHeight: "150px",
              }}
            >
              {/* Native video layer for preview (works with blob URLs) */}
              {videoSrc && (
                <video
                  src={videoSrc}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    zIndex: 1,
                  }}
                  autoPlay={isPlaying}
                  loop
                  muted={muted}
                  playsInline
                  ref={(el) => {
                    if (el) {
                      el.volume = volume;
                      el.playbackRate = playbackRate;
                      if (isPlaying && el.paused) el.play();
                      if (!isPlaying && !el.paused) el.pause();
                    }
                  }}
                />
              )}
              {/* Remotion composition layer for text overlays */}
              <div style={{ position: "absolute", inset: 0, zIndex: 2 }}>
                <Player
                  ref={(ref) => setPlayerRef(ref)}
                  component={VideoComposition}
                  inputProps={{
                    title,
                    caption,
                    backgroundColor: videoSrc ? "transparent" : backgroundColor,
                    accentColor,
                    videoSrc: null, // Don't pass video to Remotion, we handle it natively
                    overlayPosition,
                    overlayOpacity: videoSrc ? overlayOpacity : 0,
                    titleAnimation,
                    captionAnimation,
                    volume,
                    playbackRate,
                    muted,
                  }}
                  durationInFrames={durationInFrames}
                  fps={fps}
                  compositionWidth={aspectRatio.width}
                  compositionHeight={aspectRatio.height}
                  style={{ width: "100%", height: "100%" }}
                  controls={false}
                  loop
                  autoPlay={false}
                />
              </div>
            </div>
          )}
        </div>

        {/* Right Panel - Tool Properties */}
        <div className="w-72 border-l border-gray-200 bg-white flex">
          {/* Properties Panel */}
          <div className="flex-1 overflow-y-auto p-4">
            {activeTool === "text" && (
              <div className="space-y-5">
                <h3 className="text-sm font-medium text-gray-900">Text Overlay</h3>

                <div>
                  <label className="text-xs text-gray-500 block mb-1.5">Title</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Add title..."
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-gray-300 focus:ring-1 focus:ring-gray-200"
                  />
                </div>

                {title && (
                  <div>
                    <label className="text-xs text-gray-500 block mb-1.5">Title Animation</label>
                    <select
                      value={titleAnimation}
                      onChange={(e) => setTitleAnimation(e.target.value as TextAnimation)}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:border-gray-300"
                    >
                      {TEXT_ANIMATIONS.map((anim) => (
                        <option key={anim.value} value={anim.value}>{anim.label}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="text-xs text-gray-500 block mb-1.5">Caption</label>
                  <textarea
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    placeholder="Add caption..."
                    rows={4}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-gray-300 focus:ring-1 focus:ring-gray-200 resize-none"
                  />
                </div>

                {caption && (
                  <div>
                    <label className="text-xs text-gray-500 block mb-1.5">Caption Animation</label>
                    <select
                      value={captionAnimation}
                      onChange={(e) => setCaptionAnimation(e.target.value as TextAnimation)}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:border-gray-300"
                    >
                      {TEXT_ANIMATIONS.map((anim) => (
                        <option key={anim.value} value={anim.value}>{anim.label}</option>
                      ))}
                    </select>
                  </div>
                )}

                {(title || caption) && videoSrc && (
                  <>
                    <div>
                      <label className="text-xs text-gray-500 block mb-2">Position</label>
                      <div className="flex gap-1">
                        {(["top", "center", "bottom"] as const).map((pos) => (
                          <button
                            key={pos}
                            onClick={() => setOverlayPosition(pos)}
                            className={cn(
                              "flex-1 py-2 text-xs rounded-lg border transition-all capitalize",
                              overlayPosition === pos
                                ? "bg-primary text-white border-primary"
                                : "bg-gray-50 border-gray-200 text-gray-600 hover:border-gray-300"
                            )}
                          >
                            {pos}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="text-xs text-gray-500 block mb-1.5">
                        Overlay: {Math.round(overlayOpacity * 100)}%
                      </label>
                      <input
                        type="range"
                        min={0}
                        max={0.8}
                        step={0.1}
                        value={overlayOpacity}
                        onChange={(e) => setOverlayOpacity(Number(e.target.value))}
                        className="w-full accent-primary"
                      />
                    </div>
                  </>
                )}

                <div className="pt-2 border-t border-gray-200">
                  <label className="text-xs text-gray-500 block mb-2">Accent Color</label>
                  <div className="flex gap-2 flex-wrap">
                    {accentColors.map((color) => (
                      <button
                        key={color.value}
                        onClick={() => setAccentColor(color.value)}
                        className={cn(
                          "w-7 h-7 rounded-full border-2 transition-all",
                          accentColor === color.value ? "border-gray-900 scale-110" : "border-gray-200 hover:scale-105"
                        )}
                        style={{ backgroundColor: color.value }}
                        title={color.label}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTool === "uploads" && (
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-gray-900">Uploads</h3>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/*"
                  onChange={handleInputChange}
                  className="hidden"
                />
                {videoSrc ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                      <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      <span className="text-xs text-gray-700 truncate flex-1">{videoFileName}</span>
                      <button onClick={removeVideo} className="p-1 hover:bg-gray-100 rounded">
                        <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>

                    {videoWarning && (
                      <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                        <svg className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <span className="text-xs text-amber-700">{videoWarning}</span>
                      </div>
                    )}

                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs text-gray-500">Volume</label>
                        <button onClick={() => setMuted(!muted)} className={cn("p-1 rounded", muted ? "text-red-500" : "text-gray-500")}>
                          {muted ? (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                            </svg>
                          ) : (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                            </svg>
                          )}
                        </button>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={1}
                        step={0.1}
                        value={volume}
                        onChange={(e) => setVolume(Number(e.target.value))}
                        disabled={muted}
                        className="w-full accent-primary"
                      />
                    </div>

                    <div>
                      <label className="text-xs text-gray-500 block mb-1.5">Speed: {playbackRate}x</label>
                      <div className="flex gap-1">
                        {[0.5, 1, 1.5, 2].map((rate) => (
                          <button
                            key={rate}
                            onClick={() => setPlaybackRate(rate)}
                            className={cn(
                              "flex-1 py-1.5 text-xs rounded border transition-all",
                              playbackRate === rate
                                ? "bg-primary text-white border-primary"
                                : "bg-gray-50 border-gray-200 text-gray-600"
                            )}
                          >
                            {rate}x
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full p-8 border-2 border-dashed border-gray-300 rounded-xl hover:border-primary/50 transition-colors text-center"
                  >
                    <svg className="w-10 h-10 mx-auto mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <span className="text-sm text-gray-500">Click or drag to upload</span>
                  </button>
                )}
              </div>
            )}

            {activeTool === "layout" && (
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-gray-900">Layout</h3>
                <div>
                  <label className="text-xs text-gray-500 block mb-1.5">Duration: {duration}s</label>
                  <input
                    type="range"
                    min={1}
                    max={60}
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value))}
                    className="w-full accent-primary"
                  />
                </div>
                {!videoSrc && (
                  <div>
                    <label className="text-xs text-gray-500 block mb-2">Background</label>
                    <div className="grid grid-cols-5 gap-2">
                      {["#0f0f0f", "#1a1a2e", "#16213e", "#1f1f1f", "#0d1117"].map((color) => (
                        <button
                          key={color}
                          onClick={() => setBackgroundColor(color)}
                          className={cn(
                            "aspect-square rounded-lg border-2 transition-all",
                            backgroundColor === color ? "border-gray-900" : "border-gray-200"
                          )}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {(activeTool === "music" || activeTool === "captions" || activeTool === "brand") && (
              <div className="flex flex-col items-center justify-center h-full text-center py-12">
                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3 text-gray-500">
                  {activeTool === "music" && tools.find(t => t.id === "music")?.icon}
                  {activeTool === "captions" && tools.find(t => t.id === "captions")?.icon}
                  {activeTool === "brand" && tools.find(t => t.id === "brand")?.icon}
                </div>
                <p className="text-sm text-gray-600 capitalize">{activeTool}</p>
                <p className="text-xs text-gray-400 mt-1">Coming soon</p>
              </div>
            )}
          </div>

          {/* Vertical Tool Icons */}
          <div className="w-14 border-l border-gray-200 bg-gray-50 py-3 flex flex-col items-center gap-1">
            {tools.map((tool) => (
              <button
                key={tool.id}
                onClick={() => setActiveTool(tool.id)}
                className={cn(
                  "w-10 h-10 rounded-lg flex flex-col items-center justify-center gap-0.5 transition-colors",
                  activeTool === tool.id
                    ? "bg-primary/10 text-primary"
                    : "text-gray-400 hover:text-gray-700 hover:bg-gray-100"
                )}
                title={tool.label}
              >
                {tool.icon}
                <span className="text-[9px]">{tool.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Multi-Layer Timeline */}
      <Timeline
        tracks={tracks}
        currentFrame={currentFrame}
        durationInFrames={durationInFrames}
        fps={fps}
        onSeek={seekTo}
        onTracksChange={setTracks}
        onClipSelect={setSelectedClip}
        selectedClipId={selectedClip?.id}
        isPlaying={isPlaying}
        onPlayPause={togglePlayback}
        onAddTrack={(type) => {
          const trackColors: Record<string, string> = {
            text: "#8b5cf6",
            audio: "#10b981",
            image: "#f59e0b",
            video: "#3b82f6",
          };
          const trackNames: Record<string, string> = {
            text: "Text Overlay",
            audio: "Audio Track",
            image: "Image Layer",
            video: "Video",
          };
          const newTrack: TimelineTrack = {
            id: generateId(),
            type,
            name: `${trackNames[type]} ${tracks.filter(t => t.type === type).length + 1}`,
            clips: [],
          };
          setTracks([...tracks, newTrack]);
        }}
      />
    </div>
  );
}
