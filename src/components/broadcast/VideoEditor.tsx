"use client";

import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { Player, PlayerRef } from "@remotion/player";
import { VideoComposition, type TextSegment } from "./VideoComposition";
import { Timeline, TimelineTrack, TimelineClip } from "./Timeline";
import { createAutoCaptions } from "./Captions";
import type { Caption } from "@remotion/captions";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { VideoAgentChat } from "./VideoAgentChat";
import type { BroadcastIdea } from "./VideoAgentChat";
import type { VideoSuggestion } from "@/lib/parseVideoSuggestions";
import { supabase } from "@/lib/supabase";
import { RecordingPanel } from "./RecordingPanel";

type TextAnimation = "none" | "fade" | "typewriter" | "word-highlight" | "slide-up" | "scale";
type ActiveTool = "text" | "music" | "captions" | "brand" | "layout" | "uploads" | "record" | null;
type CaptionPosition = "top" | "center" | "bottom";

interface ScriptSegment {
  id: string;
  label: string;
  text: string;
}

const SEGMENT_LABEL_COLORS: Record<string, string> = {
  hook: "bg-red-100 text-red-700",
  intro: "bg-blue-100 text-blue-700",
  conclusion: "bg-purple-100 text-purple-700",
  cta: "bg-orange-100 text-orange-700",
};

function getSegmentColor(label: string): string {
  const key = label.toLowerCase();
  if (SEGMENT_LABEL_COLORS[key]) return SEGMENT_LABEL_COLORS[key];
  if (key.startsWith("point")) return "bg-green-100 text-green-700";
  return "bg-gray-100 text-gray-700";
}

const SEGMENT_CLIP_COLORS: Record<string, string> = {
  hook: "#ef4444",
  intro: "#3b82f6",
  conclusion: "#8b5cf6",
  cta: "#f97316",
};

function getSegmentClipColor(label: string): string {
  const key = label.toLowerCase();
  if (SEGMENT_CLIP_COLORS[key]) return SEGMENT_CLIP_COLORS[key];
  if (key.startsWith("point")) return "#22c55e";
  return "#6b7280";
}

function formatTimestamp(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

// Generate unique IDs
const generateId = () => Math.random().toString(36).substring(2, 9);

interface MediaUpload {
  id: string;
  name: string;
  url: string;
  type: "recording" | "file";
  uploading?: boolean;
  supabaseUrl?: string;
}

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
  { value: "16:9", width: 1920, height: 1080, label: "Landscape", desc: "YouTube" },
  { value: "9:16", width: 1080, height: 1920, label: "Portrait", desc: "Shorts / Reels" },
  { value: "1:1", width: 1080, height: 1080, label: "Square", desc: "Instagram" },
  { value: "4:5", width: 1080, height: 1350, label: "Tall", desc: "Instagram / FB" },
];

export function VideoEditor({ className }: VideoEditorProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [playerRef, setPlayerRef] = useState<PlayerRef | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewContainerRef = useRef<HTMLDivElement>(null);

  // UI State
  const [activeTool, setActiveTool] = useState<ActiveTool>("text");
  const [aspectRatio, setAspectRatio] = useState(ASPECT_RATIOS[0]);
  const [showAspectMenu, setShowAspectMenu] = useState(false);

  // Mobile UI State
  const [showLeftPanel, setShowLeftPanel] = useState(false);
  const [showMobileTools, setShowMobileTools] = useState(false);

  // Left panel tab
  const [leftPanelTab, setLeftPanelTab] = useState<"script" | "ai">("ai");

  // Broadcast ideas for AI agent
  const [broadcastIdeas, setBroadcastIdeas] = useState<BroadcastIdea[]>([]);

  useEffect(() => {
    const fetchIdeas = async () => {
      const { data, error } = await supabase
        .from("broadcast_ideas")
        .select("id, title, notes, status, channels")
        .order("created_at", { ascending: false });

      if (!error && data) {
        setBroadcastIdeas(data);
      }
    };
    fetchIdeas();
  }, []);

  // Resizable panels
  const [leftPanelWidth, setLeftPanelWidth] = useState(320);
  const [rightPanelWidth, setRightPanelWidth] = useState(288);
  const [timelineHeight, setTimelineHeight] = useState(200);
  const resizingRef = useRef<"left" | "right" | "timeline" | null>(null);
  const resizeStartXRef = useRef(0);
  const resizeStartYRef = useRef(0);
  const resizeStartWidthRef = useRef(0);
  const resizeStartHeightRef = useRef(0);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!resizingRef.current) return;
      e.preventDefault();
      if (resizingRef.current === "timeline") {
        const delta = resizeStartYRef.current - e.clientY;
        setTimelineHeight(Math.max(120, Math.min(600, resizeStartHeightRef.current + delta)));
      } else {
        const delta = e.clientX - resizeStartXRef.current;
        if (resizingRef.current === "left") {
          setLeftPanelWidth(Math.max(200, Math.min(600, resizeStartWidthRef.current + delta)));
        } else {
          setRightPanelWidth(Math.max(200, Math.min(600, resizeStartWidthRef.current - delta)));
        }
      }
    };
    const handleMouseUp = () => {
      if (resizingRef.current) {
        resizingRef.current = null;
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
      }
    };
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  const startResizeLeft = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    resizingRef.current = "left";
    resizeStartXRef.current = e.clientX;
    resizeStartWidthRef.current = leftPanelWidth;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  }, [leftPanelWidth]);

  const startResizeRight = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    resizingRef.current = "right";
    resizeStartXRef.current = e.clientX;
    resizeStartWidthRef.current = rightPanelWidth;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  }, [rightPanelWidth]);

  const startResizeTimeline = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    resizingRef.current = "timeline";
    resizeStartYRef.current = e.clientY;
    resizeStartHeightRef.current = timelineHeight;
    document.body.style.cursor = "row-resize";
    document.body.style.userSelect = "none";
  }, [timelineHeight]);

  // Export State
  const [showExportModal, setShowExportModal] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportFormat, setExportFormat] = useState<"webm" | "mp4">("webm");
  const [exportedBlob, setExportedBlob] = useState<Blob | null>(null);

  // YouTube Upload State
  const [showYouTubeUpload, setShowYouTubeUpload] = useState(false);
  const [ytTitle, setYtTitle] = useState("");
  const [ytDescription, setYtDescription] = useState("");
  const [ytTags, setYtTags] = useState("");
  const [ytPrivacy, setYtPrivacy] = useState<"private" | "unlisted" | "public">("private");
  const [isUploadingToYouTube, setIsUploadingToYouTube] = useState(false);
  const [ytUploadProgress, setYtUploadProgress] = useState(0);
  const [ytUploadSuccess, setYtUploadSuccess] = useState<string | null>(null);
  const [ytUploadError, setYtUploadError] = useState<string | null>(null);

  // Captions State
  const [captions, setCaptions] = useState<Caption[]>([]);
  const [showCaptions, setShowCaptions] = useState(false);
  const [captionPosition, setCaptionPosition] = useState<CaptionPosition>("bottom");
  const [captionText, setCaptionText] = useState("");
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcriptionSupported, setTranscriptionSupported] = useState(false);

  // Check for Web Speech API support
  useEffect(() => {
    setTranscriptionSupported(
      typeof window !== "undefined" && "webkitSpeechRecognition" in window
    );
  }, []);

  // Subscribe to player events
  // Throttle frame updates to reduce React re-renders (Remotion fires 30x/sec)
  const pendingFrameRef = useRef<number | null>(null);
  const rafIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (!playerRef) return;

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onFrameUpdate = (e: { detail: { frame: number } }) => {
      pendingFrameRef.current = e.detail.frame;
      if (rafIdRef.current === null) {
        rafIdRef.current = requestAnimationFrame(() => {
          rafIdRef.current = null;
          if (pendingFrameRef.current !== null) {
            setCurrentFrame(pendingFrameRef.current);
            pendingFrameRef.current = null;
          }
        });
      }
    };

    playerRef.addEventListener("play", onPlay);
    playerRef.addEventListener("pause", onPause);
    playerRef.addEventListener("frameupdate", onFrameUpdate);

    return () => {
      playerRef.removeEventListener("play", onPlay);
      playerRef.removeEventListener("pause", onPause);
      playerRef.removeEventListener("frameupdate", onFrameUpdate);
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
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

  // Free-form text positioning (percentage-based 0-100)
  const [titlePos, setTitlePos] = useState({ x: 50, y: 45 });
  const [captionPos, setCaptionPos] = useState({ x: 50, y: 60 });
  const [draggingText, setDraggingText] = useState<"title" | "caption" | null>(null);

  // Media uploads library
  const [mediaUploads, setMediaUploads] = useState<MediaUpload[]>([]);

  // Script segments
  const [scriptSegments, setScriptSegments] = useState<ScriptSegment[]>([]);
  const [pendingBuild, setPendingBuild] = useState(false);

  // Animation and media controls
  const [titleAnimation, setTitleAnimation] = useState<TextAnimation>("fade");
  const [captionAnimation, setCaptionAnimation] = useState<TextAnimation>("fade");
  const [volume, setVolume] = useState(1);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [muted, setMuted] = useState(false);

  // TTS State
  const [ttsText, setTtsText] = useState("");
  const [ttsVoices, setTtsVoices] = useState<{ voice_id: string; name: string; preview_url: string; category: string }[]>([]);
  const [selectedVoiceId, setSelectedVoiceId] = useState("");
  const [isLoadingVoices, setIsLoadingVoices] = useState(false);
  const [isGeneratingTts, setIsGeneratingTts] = useState(false);
  const [ttsAudioSrc, setTtsAudioSrc] = useState<string | null>(null);
  const [ttsAudioFileName, setTtsAudioFileName] = useState<string | null>(null);
  const [ttsError, setTtsError] = useState<string | null>(null);
  const [isPreviewingAudio, setIsPreviewingAudio] = useState(false);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);

  // Trim controls
  const [trimStart, setTrimStart] = useState(0); // in seconds
  const [trimEnd, setTrimEnd] = useState(0); // in seconds (0 = no trim)
  const [originalDuration, setOriginalDuration] = useState(0); // original video duration

  // Timeline state
  const [tracks, setTracks] = useState<TimelineTrack[]>([]);
  const [selectedClip, setSelectedClip] = useState<TimelineClip | null>(null);

  // Preview rendering state (FFmpeg-based flat preview after split/delete)
  const originalVideoSrcRef = useRef<string | null>(null); // original blob URL for re-processing
  const previewBlobUrlRef = useRef<string | null>(null); // current preview URL for cleanup
  const previewVersionRef = useRef(0); // monotonic counter to cancel stale renders
  const [isRenderingPreview, setIsRenderingPreview] = useState(false);
  const [previewProgress, setPreviewProgress] = useState(0);

  const fps = 30;

  // Calculate effective duration based on trim, auto-expanding to fit all clips
  const effectiveDuration = trimEnd > trimStart ? trimEnd - trimStart : duration;
  const baseDurationInFrames = Math.round(effectiveDuration * fps);
  const maxClipEndFrame = tracks.reduce((max, track) =>
    Math.max(max, ...track.clips.map(c => c.endFrame)), 0);
  const durationInFrames = Math.max(baseDurationInFrames, maxClipEndFrame);

  // Update duration when trim values change
  useEffect(() => {
    if (trimEnd > trimStart) {
      setDuration(trimEnd - trimStart);
    }
  }, [trimStart, trimEnd]);

  // Update tracks when video is removed (track creation is in handleFileSelect)
  useEffect(() => {
    if (!videoSrc) {
      // Remove video track when video is removed
      setTracks(currentTracks => currentTracks.filter(t => t.type !== "video"));
    }
  }, [videoSrc]);

  // Cleanup preview and original blob URLs on unmount
  useEffect(() => {
    const versionRef = previewVersionRef;
    const previewRef = previewBlobUrlRef;
    const originalRef = originalVideoSrcRef;
    return () => {
      // Cancel any in-flight renders
      versionRef.current++;
      if (previewRef.current) {
        URL.revokeObjectURL(previewRef.current);
        previewRef.current = null;
      }
      if (originalRef.current) {
        URL.revokeObjectURL(originalRef.current);
        originalRef.current = null;
      }
    };
  }, []);

  // Update tracks when title/caption changes
  useEffect(() => {
    setTracks((currentTracks) => {
      // Don't overwrite segment clips with title/caption logic
      const textTrack = currentTracks.find(t => t.type === "text");
      if (textTrack && textTrack.clips.some(c => (c.data as Record<string, unknown>)?.isSegment)) {
        return currentTracks;
      }

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

  // Derive TextSegment[] from text track's segment clips for VideoComposition
  const textSegments: TextSegment[] = useMemo(() => {
    const textTrack = tracks.find(t => t.type === "text");
    if (!textTrack) return [];
    return textTrack.clips
      .filter(c => (c.data as Record<string, unknown>)?.isSegment)
      .map(c => {
        const data = c.data as Record<string, unknown>;
        return {
          id: c.id,
          text: (data.text as string) || "",
          label: (data.segmentLabel as string) || "",
          startFrame: c.startFrame,
          durationInFrames: c.endFrame - c.startFrame,
          animation: (data.animation as TextSegment["animation"]) || "fade",
        };
      });
  }, [tracks]);

  // Build timeline clips from script segments with proportional timing
  const buildTimelineFromSegments = useCallback(() => {
    const validSegments = scriptSegments.filter(s => s.text.trim().length > 0);
    if (validSegments.length === 0) return;

    const totalChars = validSegments.reduce((sum, s) => sum + s.text.length, 0);
    const minFrames = fps; // 1 second minimum per segment

    // Calculate proportional frames
    let remaining = durationInFrames;
    const segmentFrames: number[] = validSegments.map(s => {
      const proportion = s.text.length / totalChars;
      const frames = Math.max(minFrames, Math.round(proportion * durationInFrames));
      return frames;
    });

    // Normalize so they sum to durationInFrames
    const totalAllocated = segmentFrames.reduce((a, b) => a + b, 0);
    if (totalAllocated !== durationInFrames && totalAllocated > 0) {
      const scale = durationInFrames / totalAllocated;
      remaining = durationInFrames;
      for (let i = 0; i < segmentFrames.length - 1; i++) {
        segmentFrames[i] = Math.max(minFrames, Math.round(segmentFrames[i] * scale));
        remaining -= segmentFrames[i];
      }
      segmentFrames[segmentFrames.length - 1] = Math.max(minFrames, remaining);
    }

    // Build clips
    let currentFrame = 0;
    const clips: TimelineClip[] = validSegments.map((seg, i) => {
      const frames = segmentFrames[i];
      const clip: TimelineClip = {
        id: generateId(),
        type: "text" as const,
        name: `${seg.label}: ${seg.text.substring(0, 20)}${seg.text.length > 20 ? "..." : ""}`,
        startFrame: currentFrame,
        endFrame: currentFrame + frames,
        color: getSegmentClipColor(seg.label),
        data: {
          segmentId: seg.id,
          segmentLabel: seg.label,
          text: seg.text,
          isSegment: true,
        },
      };
      currentFrame += frames;
      return clip;
    });

    // Clamp last clip to durationInFrames
    if (clips.length > 0) {
      clips[clips.length - 1].endFrame = durationInFrames;
    }

    // Clear global title/caption since segments take over
    setTitle("");
    setCaption("");

    // Create or replace the text track with segment clips
    setTracks(currentTracks => {
      const nonTextTracks = currentTracks.filter(t => t.type !== "text");
      return [...nonTextTracks, {
        id: generateId(),
        type: "text" as const,
        name: "Script Segments",
        clips,
      }];
    });
  }, [scriptSegments, durationInFrames, fps]);

  // Auto-build timeline when pendingBuild is set (after handleApplySuggestion settles)
  useEffect(() => {
    if (pendingBuild && scriptSegments.length > 0) {
      buildTimelineFromSegments();
      setPendingBuild(false);
    }
  }, [pendingBuild, scriptSegments, buildTimelineFromSegments]);

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

  // Video playback is now handled by Remotion's built-in <Video> component
  // inside VideoComposition. No manual sync needed.

  const [videoWarning, setVideoWarning] = useState<string | null>(null);
  const [isConverting, setIsConverting] = useState(false);
  const [convertProgress, setConvertProgress] = useState(0);
  // Track which operation FFmpeg is performing so progress routes correctly
  const ffmpegOperationRef = useRef<"idle" | "convert" | "export" | "preview">("idle");

  // FFmpeg instance ref (hoisted here so handleFileSelect can use loadFFmpeg)
  const ffmpegRef = useRef<FFmpeg | null>(null);
  const [ffmpegLoaded, setFfmpegLoaded] = useState(false);
  const [ffmpegLoading, setFfmpegLoading] = useState(false);

  // Load FFmpeg WASM
  const loadFFmpeg = useCallback(async () => {
    if (ffmpegRef.current && ffmpegLoaded) return ffmpegRef.current;
    if (ffmpegLoading) return null;

    setFfmpegLoading(true);
    try {
      const ffmpeg = new FFmpeg();

      // Use jsdelivr CDN which has better CORS support
      const baseURL = "https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.6/dist/esm";

      ffmpeg.on("progress", ({ progress }) => {
        if (ffmpegOperationRef.current === "convert") {
          setConvertProgress(Math.round(30 + progress * 60));
        } else if (ffmpegOperationRef.current === "preview") {
          setPreviewProgress(Math.round(30 + progress * 60));
        } else {
          // Export or default
          setExportProgress(Math.round(30 + progress * 60));
        }
      });

      ffmpeg.on("log", ({ message }) => {
        console.log("[FFmpeg]", message);
      });

      // Load with direct URLs - no blob conversion needed
      await ffmpeg.load({
        coreURL: `${baseURL}/ffmpeg-core.js`,
        wasmURL: `${baseURL}/ffmpeg-core.wasm`,
      });

      ffmpegRef.current = ffmpeg;
      setFfmpegLoaded(true);
      setFfmpegLoading(false);
      return ffmpeg;
    } catch (error) {
      console.error("Failed to load FFmpeg:", error);
      setFfmpegLoading(false);
      throw new Error("Failed to load video processing engine. Please try again.");
    }
  }, [ffmpegLoaded, ffmpegLoading]);

  // Helper: set video source and create timeline track from a blob URL
  const applyVideoSource = useCallback((url: string, fileName: string) => {
    setVideoSrc(url);
    setVideoFileName(fileName);
    originalVideoSrcRef.current = url;
    if (previewBlobUrlRef.current) {
      URL.revokeObjectURL(previewBlobUrlRef.current);
      previewBlobUrlRef.current = null;
    }

    const video = document.createElement("video");
    video.preload = "metadata";
    video.onloadedmetadata = () => {
      const videoDuration = video.duration;
      const maxDuration = Math.min(videoDuration, 60);
      setOriginalDuration(videoDuration);
      setDuration(maxDuration);
      setTrimStart(0);
      setTrimEnd(videoDuration);

      const videoFrames = Math.round(videoDuration * fps);
      setTracks(currentTracks => {
        const nonVideoTracks = currentTracks.filter(t => t.type !== "video");
        return [{
          id: generateId(),
          type: "video" as const,
          name: fileName || "Video",
          clips: [{
            id: generateId(),
            type: "video" as const,
            name: fileName || "Video Clip",
            startFrame: 0,
            endFrame: videoFrames,
            color: "#3b82f6",
            sourceOffset: 0,
          }],
        }, ...nonVideoTracks];
      });

      if (video.videoWidth === 0 || video.videoHeight === 0) {
        setVideoWarning("Video codec not supported by browser. Please convert to MP4 (H.264).");
      }
    };
    video.onerror = () => {
      setVideoWarning("Could not load video. Try converting to MP4 (H.264).");
    };
    video.src = url;
  }, [fps]);

  const handleFileSelect = useCallback(async (file: File) => {
    if (!file.type.startsWith("video/")) {
      alert("Please select a video file");
      return;
    }

    const fileName = file.name.toLowerCase();
    const needsConversion = fileName.endsWith(".mov") || fileName.endsWith(".hevc");

    if (needsConversion) {
      // Auto-convert MOV/HEVC to MP4 (H.264) for smooth browser playback
      setVideoWarning(null);
      setIsConverting(true);
      setConvertProgress(0);

      try {
        ffmpegOperationRef.current = "convert";
        const ffmpeg = await loadFFmpeg();
        if (!ffmpeg) throw new Error("Failed to load FFmpeg");

        setConvertProgress(15);

        const inputData = new Uint8Array(await file.arrayBuffer());
        const inputName = "convert_input.mov";
        await ffmpeg.writeFile(inputName, inputData);

        setConvertProgress(30);

        await ffmpeg.exec([
          "-i", inputName,
          "-c:v", "libx264",
          "-preset", "ultrafast",
          "-crf", "23",
          "-c:a", "aac",
          "-movflags", "+faststart",
          "convert_output.mp4",
        ]);

        setConvertProgress(90);

        const outputData = await ffmpeg.readFile("convert_output.mp4");
        const blob = new Blob([outputData as unknown as BlobPart], { type: "video/mp4" });
        const url = URL.createObjectURL(blob);

        // Cleanup FFmpeg temp files
        await ffmpeg.deleteFile(inputName).catch(() => {});
        await ffmpeg.deleteFile("convert_output.mp4").catch(() => {});

        ffmpegOperationRef.current = "idle";
        setConvertProgress(100);
        setIsConverting(false);

        applyVideoSource(url, file.name.replace(/\.(mov|hevc)$/i, ".mp4"));
      } catch (error) {
        console.error("MOV conversion failed:", error);
        ffmpegOperationRef.current = "idle";
        setIsConverting(false);
        // Fall back to original file with warning
        setVideoWarning("Auto-conversion failed. MOV/HEVC files may play choppy in browser.");
        const url = URL.createObjectURL(file);
        applyVideoSource(url, file.name);
      }
    } else {
      setVideoWarning(null);
      const url = URL.createObjectURL(file);
      applyVideoSource(url, file.name);
    }
  }, [fps, loadFFmpeg, applyVideoSource]);

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
    if (previewBlobUrlRef.current) {
      URL.revokeObjectURL(previewBlobUrlRef.current);
      previewBlobUrlRef.current = null;
    }
    if (originalVideoSrcRef.current) {
      URL.revokeObjectURL(originalVideoSrcRef.current);
      originalVideoSrcRef.current = null;
    }
    // Revoke videoSrc only if it's different from the above (shouldn't happen, but be safe)
    if (videoSrc && videoSrc !== previewBlobUrlRef.current && videoSrc !== originalVideoSrcRef.current) {
      URL.revokeObjectURL(videoSrc);
    }
    setVideoSrc(null);
    setVideoFileName(null);
    setVideoWarning(null);
    setTrimStart(0);
    setTrimEnd(0);
    setOriginalDuration(0);
  }, [videoSrc]);

  const handleRecordingComplete = useCallback(async (blob: Blob, recordedDuration: number) => {
    const url = URL.createObjectURL(blob);
    const uploadId = generateId();
    const name = `Recording ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;

    // Add to local uploads immediately
    setMediaUploads(prev => [...prev, { id: uploadId, name, url, type: "recording", uploading: true }]);
    setActiveTool("uploads");

    // Upload to Supabase in background
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const filePath = `${user.id}/${crypto.randomUUID()}.webm`;
        const { error: uploadError } = await supabase.storage
          .from("broadcast-media")
          .upload(filePath, blob, { contentType: "video/webm" });

        if (!uploadError) {
          const { data: { publicUrl } } = supabase.storage
            .from("broadcast-media")
            .getPublicUrl(filePath);
          setMediaUploads(prev => prev.map(u =>
            u.id === uploadId ? { ...u, uploading: false, supabaseUrl: publicUrl } : u
          ));
        } else {
          console.error("Failed to upload recording:", uploadError);
          setMediaUploads(prev => prev.map(u =>
            u.id === uploadId ? { ...u, uploading: false } : u
          ));
        }
      } else {
        // Not authenticated - keep local blob only
        setMediaUploads(prev => prev.map(u =>
          u.id === uploadId ? { ...u, uploading: false } : u
        ));
      }
    } catch (err) {
      console.error("Upload error:", err);
      setMediaUploads(prev => prev.map(u =>
        u.id === uploadId ? { ...u, uploading: false } : u
      ));
    }
  }, []);

  const handleSelectUpload = useCallback((upload: MediaUpload) => {
    const url = upload.supabaseUrl || upload.url;
    setVideoSrc(url);
    setVideoFileName(upload.name);
    setVideoWarning(null);

    // Probe duration and set up timeline
    const probeVideo = document.createElement("video");
    probeVideo.preload = "metadata";

    let applied = false;
    const applyDuration = (dur: number) => {
      if (applied) return;
      applied = true;

      setOriginalDuration(dur);
      setDuration(dur);
      setTrimStart(0);
      setTrimEnd(dur);

      const videoFrames = Math.round(dur * fps);
      setTracks(currentTracks => {
        const nonVideoTracks = currentTracks.filter(t => t.type !== "video");
        return [{
          id: generateId(),
          type: "video" as const,
          name: upload.name,
          clips: [{
            id: generateId(),
            type: "video" as const,
            name: upload.name,
            startFrame: 0,
            endFrame: videoFrames,
            color: "#3b82f6",
            sourceOffset: 0,
          }],
        }, ...nonVideoTracks];
      });
    };

    probeVideo.onloadedmetadata = () => {
      if (isFinite(probeVideo.duration) && probeVideo.duration > 0) {
        applyDuration(probeVideo.duration);
      } else {
        probeVideo.currentTime = 1e101;
      }
    };

    probeVideo.ontimeupdate = () => {
      if (!applied && isFinite(probeVideo.duration) && probeVideo.duration > 0) {
        applyDuration(probeVideo.duration);
      }
    };

    probeVideo.onerror = () => applyDuration(5);
    setTimeout(() => applyDuration(5), 3000);

    probeVideo.src = url;
  }, [fps]);

  const handleRemoveUpload = useCallback((uploadId: string) => {
    setMediaUploads(prev => {
      const upload = prev.find(u => u.id === uploadId);
      if (upload && upload.url.startsWith("blob:")) {
        URL.revokeObjectURL(upload.url);
      }
      return prev.filter(u => u.id !== uploadId);
    });
  }, []);

  // Render a flat preview video from the current video clips using FFmpeg WASM.
  // This replaces the per-frame seeking approach with a single linear video for smooth playback.
  const renderPreview = useCallback(async (clipsSnapshot: TimelineClip[]) => {
    const sourceUrl = originalVideoSrcRef.current;
    if (!sourceUrl || clipsSnapshot.length === 0) return;

    // Increment version to cancel any in-flight renders
    const version = ++previewVersionRef.current;
    setIsRenderingPreview(true);
    setPreviewProgress(0);

    try {
      ffmpegOperationRef.current = "preview";
      const ffmpeg = await loadFFmpeg();
      if (!ffmpeg) throw new Error("Failed to load FFmpeg");
      if (previewVersionRef.current !== version) return; // stale

      setPreviewProgress(10);

      // Fetch original video data
      const videoResponse = await fetch(sourceUrl);
      const videoData = await videoResponse.arrayBuffer();
      if (previewVersionRef.current !== version) return; // stale

      setPreviewProgress(20);

      const inputFileName = "preview_input.mp4";
      await ffmpeg.writeFile(inputFileName, new Uint8Array(videoData));
      if (previewVersionRef.current !== version) return; // stale

      setPreviewProgress(30);

      const sortedClips = clipsSnapshot.slice().sort((a, b) => a.startFrame - b.startFrame);

      if (sortedClips.length === 1) {
        // Single clip - fast trim
        const clip = sortedClips[0];
        const startTime = (clip.sourceOffset ?? 0) / fps;
        const clipDuration = (clip.endFrame - clip.startFrame) / fps;

        await ffmpeg.exec([
          "-i", inputFileName,
          "-ss", startTime.toString(),
          "-t", clipDuration.toString(),
          "-preset", "ultrafast",
          "-crf", "28",
          "-c:a", "aac",
          "-y",
          "preview_output.mp4"
        ]);
      } else {
        // Multiple clips - trim each, then concat
        const clipFileNames: string[] = [];

        for (let i = 0; i < sortedClips.length; i++) {
          if (previewVersionRef.current !== version) return; // stale

          const clip = sortedClips[i];
          const startTime = (clip.sourceOffset ?? 0) / fps;
          const clipDuration = (clip.endFrame - clip.startFrame) / fps;
          const clipFileName = `preview_clip_${i}.mp4`;

          await ffmpeg.exec([
            "-i", inputFileName,
            "-ss", startTime.toString(),
            "-t", clipDuration.toString(),
            "-preset", "ultrafast",
            "-crf", "28",
            "-c:a", "aac",
            "-y",
            clipFileName
          ]);

          clipFileNames.push(clipFileName);
          setPreviewProgress(30 + Math.round((i + 1) / sortedClips.length * 40)); // 30-70%
        }

        if (previewVersionRef.current !== version) return; // stale

        // Create concat list
        const concatContent = clipFileNames.map(f => `file '${f}'`).join("\n");
        await ffmpeg.writeFile("preview_concat.txt", concatContent);

        setPreviewProgress(75);

        // Concatenate with stream copy (fast, since all clips share encoding params)
        await ffmpeg.exec([
          "-f", "concat",
          "-safe", "0",
          "-i", "preview_concat.txt",
          "-c", "copy",
          "-movflags", "+faststart",
          "-y",
          "preview_output.mp4"
        ]);

        // Clean up clip files
        for (const clipFile of clipFileNames) {
          try { await ffmpeg.deleteFile(clipFile); } catch { /* ignore */ }
        }
        try { await ffmpeg.deleteFile("preview_concat.txt"); } catch { /* ignore */ }
      }

      if (previewVersionRef.current !== version) return; // stale

      setPreviewProgress(90);

      // Read output and create blob URL
      const outputData = await ffmpeg.readFile("preview_output.mp4");

      // Clean up FFmpeg FS
      try { await ffmpeg.deleteFile(inputFileName); } catch { /* ignore */ }
      try { await ffmpeg.deleteFile("preview_output.mp4"); } catch { /* ignore */ }

      if (previewVersionRef.current !== version) return; // stale

      const previewBlob = new Blob([outputData as unknown as BlobPart], { type: "video/mp4" });
      const previewUrl = URL.createObjectURL(previewBlob);

      // Revoke old preview
      if (previewBlobUrlRef.current) {
        URL.revokeObjectURL(previewBlobUrlRef.current);
      }
      previewBlobUrlRef.current = previewUrl;
      setVideoSrc(previewUrl);

      setPreviewProgress(100);
    } catch (error) {
      console.error("Preview render failed:", error);
    } finally {
      ffmpegOperationRef.current = "idle";
      if (previewVersionRef.current === version) {
        setIsRenderingPreview(false);
      }
    }
  }, [fps, loadFFmpeg]);

  // Export video using browser-based FFmpeg (ffmpeg.wasm)
  const handleExport = useCallback(async () => {
    if (!videoSrc) {
      alert("No video to export. Please upload a video first.");
      return;
    }

    setIsExporting(true);
    setExportProgress(0);

    try {
      // Get video clips info
      const videoTrack = tracks.find(t => t.type === "video");
      const videoClips = videoTrack?.clips.slice().sort((a, b) => a.startFrame - b.startFrame) || [];

      if (videoClips.length === 0) {
        throw new Error("No clips to export");
      }

      setExportProgress(5);

      // Load FFmpeg if not already loaded
      ffmpegOperationRef.current = "export";
      const ffmpeg = await loadFFmpeg();
      if (!ffmpeg) {
        throw new Error("Failed to initialize video processor");
      }

      setExportProgress(15);

      // Fetch from the original source (not the preview) for full-quality export
      const exportSrc = originalVideoSrcRef.current ?? videoSrc;
      const videoResponse = await fetch(exportSrc);
      const videoData = await videoResponse.arrayBuffer();

      setExportProgress(25);

      // Write input file to FFmpeg virtual filesystem
      const inputFileName = "input.mp4";
      await ffmpeg.writeFile(inputFileName, new Uint8Array(videoData));

      setExportProgress(30);

      // Process based on number of clips
      if (videoClips.length === 1) {
        // Single clip - simple trim
        const clip = videoClips[0];
        const startTime = (clip.sourceOffset ?? 0) / fps;
        const duration = (clip.endFrame - clip.startFrame) / fps;

        await ffmpeg.exec([
          "-i", inputFileName,
          "-ss", startTime.toString(),
          "-t", duration.toString(),
          "-c:v", "libx264",
          "-preset", "fast",
          "-crf", "23",
          "-c:a", "aac",
          "-b:a", "128k",
          "-movflags", "+faststart",
          "-y",
          "output.mp4"
        ]);
      } else {
        // Multiple clips - trim each and concatenate
        const clipFileNames: string[] = [];

        for (let i = 0; i < videoClips.length; i++) {
          const clip = videoClips[i];
          const startTime = (clip.sourceOffset ?? 0) / fps;
          const duration = (clip.endFrame - clip.startFrame) / fps;
          const clipFileName = `clip_${i}.mp4`;

          await ffmpeg.exec([
            "-i", inputFileName,
            "-ss", startTime.toString(),
            "-t", duration.toString(),
            "-c:v", "libx264",
            "-preset", "fast",
            "-crf", "23",
            "-c:a", "aac",
            "-b:a", "128k",
            "-y",
            clipFileName
          ]);

          clipFileNames.push(clipFileName);
          setExportProgress(30 + Math.round((i + 1) / videoClips.length * 40)); // 30-70%
        }

        // Create concat file
        const concatContent = clipFileNames.map(f => `file '${f}'`).join("\n");
        await ffmpeg.writeFile("concat.txt", concatContent);

        setExportProgress(75);

        // Concatenate clips
        await ffmpeg.exec([
          "-f", "concat",
          "-safe", "0",
          "-i", "concat.txt",
          "-c", "copy",
          "-movflags", "+faststart",
          "-y",
          "output.mp4"
        ]);

        // Clean up clip files
        for (const clipFile of clipFileNames) {
          try {
            await ffmpeg.deleteFile(clipFile);
          } catch {
            // Ignore cleanup errors
          }
        }
        try {
          await ffmpeg.deleteFile("concat.txt");
        } catch {
          // Ignore
        }
      }

      setExportProgress(90);

      // Read the output file
      const outputData = await ffmpeg.readFile("output.mp4");

      // Clean up
      try {
        await ffmpeg.deleteFile(inputFileName);
        await ffmpeg.deleteFile("output.mp4");
      } catch {
        // Ignore cleanup errors
      }

      setExportProgress(95);

      // Create download - handle FFmpeg FileData type
      const outputBlob = new Blob([outputData as unknown as BlobPart], { type: "video/mp4" });
      const url = URL.createObjectURL(outputBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `export-${Date.now()}.mp4`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      // Store the blob for potential YouTube upload
      setExportedBlob(outputBlob);

      setExportProgress(100);
      setIsExporting(false);
      ffmpegOperationRef.current = "idle";
      // Don't close modal - keep it open so user can upload to YouTube

    } catch (error) {
      console.error("Export failed:", error);
      setIsExporting(false);
      ffmpegOperationRef.current = "idle";
      alert(`Export failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }, [fps, tracks, videoSrc, loadFFmpeg]);

  // Upload exported video to YouTube
  const handleUploadToYouTube = useCallback(async () => {
    if (!exportedBlob) {
      setYtUploadError("No exported video. Please export first.");
      return;
    }
    if (!ytTitle.trim()) {
      setYtUploadError("Title is required.");
      return;
    }

    setIsUploadingToYouTube(true);
    setYtUploadProgress(0);
    setYtUploadError(null);
    setYtUploadSuccess(null);

    try {
      // Step 1: Get resumable upload URL from our server
      const tags = ytTags.split(",").map(t => t.trim()).filter(Boolean);
      const initResponse = await fetch("/api/auth/youtube/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: ytTitle,
          description: ytDescription,
          tags,
          privacy: ytPrivacy,
        }),
      });

      if (!initResponse.ok) {
        const err = await initResponse.json();
        throw new Error(err.error || "Failed to initialize upload");
      }

      const { uploadUrl } = await initResponse.json();

      // Step 2: Upload blob directly to YouTube using XMLHttpRequest for progress
      const videoId = await new Promise<string>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("PUT", uploadUrl, true);
        xhr.setRequestHeader("Content-Type", "video/mp4");

        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            setYtUploadProgress(Math.round((e.loaded / e.total) * 100));
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const data = JSON.parse(xhr.responseText);
              resolve(data.id);
            } catch {
              reject(new Error("Failed to parse YouTube response"));
            }
          } else {
            reject(new Error(`YouTube upload failed: ${xhr.status}`));
          }
        };

        xhr.onerror = () => reject(new Error("Network error during upload"));
        xhr.send(exportedBlob);
      });

      setYtUploadSuccess(videoId);
      setYtUploadProgress(100);
    } catch (error) {
      console.error("YouTube upload failed:", error);
      setYtUploadError(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setIsUploadingToYouTube(false);
    }
  }, [exportedBlob, ytTitle, ytDescription, ytTags, ytPrivacy]);

  // Generate captions from text input
  const handleGenerateCaptions = useCallback(() => {
    if (!captionText.trim()) return;
    const newCaptions = createAutoCaptions(captionText, duration * 1000, 4);
    setCaptions(newCaptions);
    setShowCaptions(true);
  }, [captionText, duration]);

  // Clear captions
  const handleClearCaptions = useCallback(() => {
    setCaptions([]);
    setCaptionText("");
    setShowCaptions(false);
  }, []);

  // Split a clip at the current playhead position
  const handleSplitClip = useCallback(() => {
    if (!selectedClip) return;

    // Check if playhead is within the selected clip
    if (currentFrame <= selectedClip.startFrame || currentFrame >= selectedClip.endFrame) {
      return; // Playhead must be inside the clip to split
    }

    // Find the track containing this clip
    const trackWithClip = tracks.find(t => t.clips.some(c => c.id === selectedClip.id));
    if (!trackWithClip) return;

    // Calculate how far into the clip the split occurs
    const splitOffset = currentFrame - selectedClip.startFrame;

    // Create two new clips from the split
    const firstClip: TimelineClip = {
      ...selectedClip,
      id: generateId(),
      name: `${selectedClip.name} (1)`,
      endFrame: currentFrame,
      // First clip keeps the same sourceOffset
    };

    const secondClip: TimelineClip = {
      ...selectedClip,
      id: generateId(),
      name: `${selectedClip.name} (2)`,
      startFrame: currentFrame,
      // Second clip's sourceOffset is original offset + split position
      sourceOffset: (selectedClip.sourceOffset ?? 0) + splitOffset,
    };

    // Update tracks with the new clips
    const newTracks = tracks.map(track => {
      if (track.id !== trackWithClip.id) return track;

      const clipIndex = track.clips.findIndex(c => c.id === selectedClip.id);
      if (clipIndex === -1) return track;

      const newClips = [...track.clips];
      newClips.splice(clipIndex, 1, firstClip, secondClip);

      return { ...track, clips: newClips };
    });

    setTracks(newTracks);
    setSelectedClip(secondClip); // Select the second clip after split

    // If we split a video clip, render a flat preview for smooth playback
    if (selectedClip.type === "video") {
      const updatedVideoTrack = newTracks.find(t => t.type === "video");
      if (updatedVideoTrack) {
        renderPreview(updatedVideoTrack.clips);
      }
    }
  }, [selectedClip, currentFrame, tracks, renderPreview]);

  // Check if split is possible (playhead is within selected clip)
  const canSplitClip = !!(selectedClip &&
    currentFrame > selectedClip.startFrame &&
    currentFrame < selectedClip.endFrame);

  // Delete a clip and ripple remaining clips to close the gap
  const handleDeleteClip = useCallback(() => {
    if (!selectedClip) return;

    // Find the track containing this clip
    const trackWithClip = tracks.find(t => t.clips.some(c => c.id === selectedClip.id));
    if (!trackWithClip) return;

    const clipToDelete = selectedClip;
    const clipDuration = clipToDelete.endFrame - clipToDelete.startFrame;

    // Sync underlying state when a clip is deleted so the preview updates
    const clipData = clipToDelete.data as Record<string, unknown> | undefined;
    if (clipToDelete.type === "text" && clipData?.isTitle) {
      setTitle("");
    }
    if (clipToDelete.type === "text" && clipData?.isCaption) {
      setCaption("");
    }
    if (clipToDelete.type === "audio" && ttsAudioSrc) {
      URL.revokeObjectURL(ttsAudioSrc);
      setTtsAudioSrc(null);
    }
    if (clipToDelete.type === "video") {
      // Check if this is the last video clip
      const videoTrack = tracks.find(t => t.type === "video");
      const remainingVideoClips = videoTrack?.clips.filter(c => c.id !== clipToDelete.id) || [];
      if (remainingVideoClips.length === 0 && videoSrc) {
        URL.revokeObjectURL(videoSrc);
        setVideoSrc(null);
        setVideoFileName("");
      }
    }

    // Update tracks: remove clip and shift subsequent clips
    const newTracks = tracks.map(track => {
      if (track.id !== trackWithClip.id) return track;

      // Filter out the deleted clip
      const remainingClips = track.clips.filter(c => c.id !== clipToDelete.id);

      // Ripple: shift all clips that start after the deleted clip
      const shiftedClips = remainingClips.map(clip => {
        if (clip.startFrame >= clipToDelete.endFrame) {
          // This clip is after the deleted one, shift it left
          return {
            ...clip,
            startFrame: clip.startFrame - clipDuration,
            endFrame: clip.endFrame - clipDuration,
          };
        }
        return clip;
      });

      return { ...track, clips: shiftedClips };
    });

    setTracks(newTracks);
    setSelectedClip(null); // Clear selection after delete

    // If we deleted a video clip and clips remain, render a flat preview
    if (clipToDelete.type === "video") {
      const updatedVideoTrack = newTracks.find(t => t.type === "video");
      const remainingClips = updatedVideoTrack?.clips || [];
      if (remainingClips.length > 0) {
        renderPreview(remainingClips);
      }
    }
  }, [selectedClip, tracks, ttsAudioSrc, videoSrc, renderPreview]);

  // Check if delete is possible (a clip is selected)
  const canDeleteClip = !!selectedClip;

  // Keyboard shortcuts for split (S key) and delete (Delete/Backspace)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      // Split: S key
      if (e.key.toLowerCase() === 's' && !e.metaKey && !e.ctrlKey && canSplitClip) {
        e.preventDefault();
        handleSplitClip();
      }

      // Delete: Delete or Backspace key
      if ((e.key === 'Delete' || e.key === 'Backspace') && canDeleteClip) {
        e.preventDefault();
        handleDeleteClip();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [canSplitClip, handleSplitClip, canDeleteClip, handleDeleteClip]);

  // Browser-based transcription using Web Speech API
  const handleTranscribe = useCallback(async () => {
    if (!videoSrc || !transcriptionSupported) return;

    setIsTranscribing(true);
    // Create a temporary video element for audio playback during transcription
    const video = document.createElement("video");
    video.src = videoSrc;
    video.preload = "auto";

    try {
      // Use Web Speech API for transcription
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      if (!SpeechRecognition) {
        throw new Error("Speech recognition not supported");
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      const transcriptParts: { text: string; timestamp: number }[] = [];
      let currentTranscript = "";

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognition.onresult = (event: any) => {
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            transcriptParts.push({
              text: result[0].transcript,
              timestamp: video.currentTime * 1000,
            });
            currentTranscript += result[0].transcript + " ";
            setCaptionText(currentTranscript.trim());
          }
        }
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognition.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        setIsTranscribing(false);
      };

      recognition.onend = () => {
        setIsTranscribing(false);
        // Generate captions from transcription
        if (currentTranscript.trim()) {
          const newCaptions = createAutoCaptions(currentTranscript.trim(), duration * 1000, 4);
          setCaptions(newCaptions);
          setShowCaptions(true);
        }
      };

      // Start video playback and recognition
      video.currentTime = 0;
      video.muted = false;
      await video.play();
      recognition.start();

      // Stop after video ends or duration
      setTimeout(() => {
        recognition.stop();
        video.pause();
      }, duration * 1000 + 1000);

    } catch (error) {
      console.error("Transcription failed:", error);
      setIsTranscribing(false);
    }
  }, [duration, transcriptionSupported, videoSrc]);

  // Helper function to extract audio from video as WebM
  const extractAudioFromVideo = useCallback(async (videoElement: HTMLVideoElement): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      try {
        // Create audio context
        const audioContext = new AudioContext();
        const source = audioContext.createMediaElementSource(videoElement);
        const destination = audioContext.createMediaStreamDestination();
        source.connect(destination);
        source.connect(audioContext.destination);

        // Use MediaRecorder to capture audio
        const mediaRecorder = new MediaRecorder(destination.stream, {
          mimeType: "audio/webm;codecs=opus",
        });

        const chunks: Blob[] = [];

        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
            chunks.push(e.data);
          }
        };

        mediaRecorder.onstop = () => {
          const audioBlob = new Blob(chunks, { type: "audio/webm" });
          audioContext.close();
          resolve(audioBlob);
        };

        mediaRecorder.onerror = (e) => {
          audioContext.close();
          reject(e);
        };

        // Start recording
        mediaRecorder.start();

        // Play the video to capture audio
        videoElement.currentTime = 0;
        videoElement.muted = false;
        videoElement.play();

        // Stop when video ends or after duration
        const stopRecording = () => {
          if (mediaRecorder.state === "recording") {
            mediaRecorder.stop();
            videoElement.pause();
            videoElement.muted = true;
          }
        };

        videoElement.onended = stopRecording;
        setTimeout(stopRecording, (duration + 1) * 1000);

      } catch (error) {
        reject(error);
      }
    });
  }, [duration]);

  // OpenAI Whisper transcription
  const handleWhisperTranscribe = useCallback(async () => {
    if (!videoSrc) return;

    setIsTranscribing(true);

    try {
      const fileName = videoFileName?.toLowerCase() || "";

      // Fetch the video blob
      const response = await fetch(videoSrc);
      const videoBlob = await response.blob();

      // Determine the appropriate format for Whisper
      // Supported: flac, m4a, mp3, mp4, mpeg, mpga, oga, ogg, wav, webm
      let extension = "mp4"; // Default to mp4
      let mimeType = "video/mp4";

      if (fileName.endsWith(".mov")) {
        // MOV files often use same codecs as MP4, try renaming
        extension = "mp4";
        mimeType = "video/mp4";
      } else if (fileName.endsWith(".webm")) {
        extension = "webm";
        mimeType = "video/webm";
      } else if (fileName.endsWith(".mp3")) {
        extension = "mp3";
        mimeType = "audio/mp3";
      } else if (fileName.endsWith(".wav")) {
        extension = "wav";
        mimeType = "audio/wav";
      } else if (fileName.endsWith(".m4a")) {
        extension = "m4a";
        mimeType = "audio/m4a";
      } else if (fileName.endsWith(".ogg") || fileName.endsWith(".oga")) {
        extension = "ogg";
        mimeType = "audio/ogg";
      } else if (fileName.endsWith(".flac")) {
        extension = "flac";
        mimeType = "audio/flac";
      } else if (fileName.endsWith(".mp4") || fileName.endsWith(".m4v")) {
        extension = "mp4";
        mimeType = "video/mp4";
      }

      // Create file with proper extension
      const audioFile = new File([videoBlob], `audio.${extension}`, { type: mimeType });

      // Try transcription
      const formData = new FormData();
      formData.append("audio", audioFile);
      formData.append("language", "en");

      let transcribeResponse = await fetch("/api/transcribe", {
        method: "POST",
        body: formData,
      });

      let result = await transcribeResponse.json();

      // If failed due to format, try extracting audio
      if (!transcribeResponse.ok && result.error?.includes("Invalid file format") && videoSrc) {
        console.log("Falling back to audio extraction...");

        // Create a temporary video element for audio extraction
        const tempVideo = document.createElement("video");
        tempVideo.src = videoSrc;
        tempVideo.preload = "auto";
        const audioBlob = await extractAudioFromVideo(tempVideo);
        const extractedFile = new File([audioBlob], "audio.webm", { type: "audio/webm" });

        const retryFormData = new FormData();
        retryFormData.append("audio", extractedFile);
        retryFormData.append("language", "en");

        transcribeResponse = await fetch("/api/transcribe", {
          method: "POST",
          body: retryFormData,
        });

        result = await transcribeResponse.json();
      }

      if (!transcribeResponse.ok) {
        throw new Error(result.error || "Transcription failed");
      }

      // Set the captions from the API response
      if (result.captions && result.captions.length > 0) {
        setCaptions(result.captions);
        setCaptionText(result.text || "");
        setShowCaptions(true);
      } else if (result.text) {
        // Fallback to auto-generating captions from text
        setCaptionText(result.text);
        const newCaptions = createAutoCaptions(result.text, duration * 1000, 4);
        setCaptions(newCaptions);
        setShowCaptions(true);
      }

      setIsTranscribing(false);
    } catch (error) {
      console.error("Whisper transcription failed:", error);
      setIsTranscribing(false);
      alert(error instanceof Error ? error.message : "Transcription failed. Please try again.");
    }
  }, [videoSrc, videoFileName, duration, extractAudioFromVideo]);

  const accentColors = [
    { value: "#3b82f6", label: "Blue" },
    { value: "#8b5cf6", label: "Purple" },
    { value: "#ec4899", label: "Pink" },
    { value: "#10b981", label: "Green" },
    { value: "#f59e0b", label: "Orange" },
    { value: "#ef4444", label: "Red" },
    { value: "#ffffff", label: "White" },
  ];

  // Apply AI suggestion handler
  const handleApplySuggestion = useCallback((suggestion: VideoSuggestion) => {
    if (suggestion.title) setTitle(suggestion.title);
    if (suggestion.caption) setCaption(suggestion.caption);
    if (suggestion.backgroundColor) setBackgroundColor(suggestion.backgroundColor);
    if (suggestion.accentColor) setAccentColor(suggestion.accentColor);
    if (suggestion.aspectRatio) {
      const ratio = ASPECT_RATIOS.find(r => r.value === suggestion.aspectRatio);
      if (ratio) setAspectRatio(ratio);
    }
    if (suggestion.overlayPosition) {
      setOverlayPosition(suggestion.overlayPosition as "top" | "center" | "bottom");
    }
    if (suggestion.script && suggestion.script.length > 0) {
      setScriptSegments(
        suggestion.script.map(s => ({
          id: generateId(),
          label: s.label,
          text: s.text,
        }))
      );
      setLeftPanelTab("script");
      setPendingBuild(true);
    }
  }, []);

  // Fetch ElevenLabs voices (lazy, only when Music tool is activated)
  const fetchVoices = useCallback(async () => {
    if (ttsVoices.length > 0 || isLoadingVoices) return;
    setIsLoadingVoices(true);
    setTtsError(null);
    try {
      const res = await fetch("/api/tts/voices");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch voices");
      setTtsVoices(data.voices);
      if (data.voices.length > 0) {
        setSelectedVoiceId(data.voices[0].voice_id);
      }
    } catch (err) {
      setTtsError(err instanceof Error ? err.message : "Failed to load voices");
    } finally {
      setIsLoadingVoices(false);
    }
  }, [ttsVoices.length, isLoadingVoices]);

  // Generate TTS audio
  const handleGenerateTts = useCallback(async () => {
    if (!ttsText.trim() || !selectedVoiceId) return;
    setIsGeneratingTts(true);
    setTtsError(null);
    try {
      const res = await fetch("/api/tts/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: ttsText, voice_id: selectedVoiceId }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to generate speech");
      }
      const blob = await res.blob();
      // Revoke previous blob URL if any
      if (ttsAudioSrc) URL.revokeObjectURL(ttsAudioSrc);
      const url = URL.createObjectURL(blob);
      const voiceName = ttsVoices.find(v => v.voice_id === selectedVoiceId)?.name || "voice";
      setTtsAudioSrc(url);
      setTtsAudioFileName(`tts-${voiceName.toLowerCase().replace(/\s+/g, "-")}.mp3`);
    } catch (err) {
      setTtsError(err instanceof Error ? err.message : "Failed to generate speech");
    } finally {
      setIsGeneratingTts(false);
    }
  }, [ttsText, selectedVoiceId, ttsAudioSrc, ttsVoices]);

  // Preview TTS audio via HTML Audio element
  const handlePreviewAudio = useCallback(() => {
    if (!ttsAudioSrc) return;
    if (isPreviewingAudio && previewAudioRef.current) {
      previewAudioRef.current.pause();
      previewAudioRef.current.currentTime = 0;
      setIsPreviewingAudio(false);
      return;
    }
    const audio = new window.Audio(ttsAudioSrc);
    previewAudioRef.current = audio;
    audio.onended = () => setIsPreviewingAudio(false);
    audio.play();
    setIsPreviewingAudio(true);
  }, [ttsAudioSrc, isPreviewingAudio]);

  // Add TTS audio to timeline
  const handleAddTtsToTimeline = useCallback(() => {
    if (!ttsAudioSrc) return;
    // Stop preview if playing
    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
      previewAudioRef.current.currentTime = 0;
      setIsPreviewingAudio(false);
    }
    setTracks(currentTracks => {
      const audioTrack = currentTracks.find(t => t.type === "audio");
      const clip: TimelineClip = {
        id: generateId(),
        type: "audio" as const,
        name: ttsAudioFileName || "TTS Audio",
        startFrame: 0,
        endFrame: durationInFrames,
        color: "#22c55e",
      };
      if (audioTrack) {
        return currentTracks.map(t =>
          t.type === "audio" ? { ...t, clips: [...t.clips, clip] } : t
        );
      }
      return [...currentTracks, {
        id: generateId(),
        type: "audio" as const,
        name: "Audio",
        clips: [clip],
      }];
    });
  }, [ttsAudioSrc, ttsAudioFileName, durationInFrames]);

  // Lazy-load voices when Music tool is activated
  useEffect(() => {
    if (activeTool === "music") {
      fetchVoices();
    }
  }, [activeTool, fetchVoices]);

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
    { id: "record" as const, label: "Record", icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10" strokeWidth={1.5} />
        <circle cx="12" cy="12" r="4" fill="currentColor" stroke="none" />
      </svg>
    )},
  ];

  return (
    <div className={cn("h-[calc(100vh-200px)] min-h-[400px] md:min-h-[600px] flex flex-col bg-gray-50 rounded-xl overflow-hidden border border-border shadow-sm", className)}>
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0 relative">
        {/* Mobile Left Panel Overlay */}
        {showLeftPanel && (
          <div className="absolute inset-0 z-40 md:hidden" onClick={() => setShowLeftPanel(false)}>
            <div className="absolute inset-0 bg-black/50" />
            <div
              className="absolute left-0 top-0 bottom-0 w-72 bg-white shadow-xl flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-3 border-b border-gray-200">
                <div className="flex gap-1">
                  <button
                    onClick={() => setLeftPanelTab("ai")}
                    className={cn(
                      "px-2.5 py-1 text-xs font-medium rounded-md transition-colors",
                      leftPanelTab === "ai" ? "bg-primary text-white" : "text-gray-500 hover:bg-gray-100"
                    )}
                  >
                    AI Assistant
                  </button>
                  <button
                    onClick={() => setLeftPanelTab("script")}
                    className={cn(
                      "px-2.5 py-1 text-xs font-medium rounded-md transition-colors",
                      leftPanelTab === "script" ? "bg-primary text-white" : "text-gray-500 hover:bg-gray-100"
                    )}
                  >
                    Script
                  </button>
                </div>
                <button
                  onClick={() => setShowLeftPanel(false)}
                  className="p-1.5 rounded hover:bg-gray-100 text-gray-500"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              {leftPanelTab === "script" ? (
                <div className="p-3 space-y-3 overflow-y-auto flex-1">
                  <button
                    onClick={() => setScriptSegments(prev => [...prev, { id: generateId(), label: "Point", text: "" }])}
                    className="w-full flex items-center justify-center gap-2 py-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg text-sm text-gray-700 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add
                  </button>
                  {scriptSegments.length > 0 && scriptSegments.some(s => s.text.trim()) && (
                    <button
                      onClick={buildTimelineFromSegments}
                      className="w-full flex items-center justify-center gap-2 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                      </svg>
                      Build Timeline from Script
                    </button>
                  )}
                  {scriptSegments.length > 0 ? (
                    <div className="space-y-3">
                      {scriptSegments.map((seg, i) => {
                        const timePerSegment = duration / scriptSegments.length;
                        const timestamp = formatTimestamp(i * timePerSegment);
                        return (
                          <div key={seg.id} className="flex items-start gap-3 group">
                            <span className="text-xs text-gray-400 font-mono pt-1">{timestamp}</span>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className={cn("text-[10px] font-semibold px-1.5 py-0.5 rounded", getSegmentColor(seg.label))}>
                                  {seg.label}
                                </span>
                                <button
                                  onClick={() => setScriptSegments(prev => prev.filter(s => s.id !== seg.id))}
                                  className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-opacity"
                                >
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              </div>
                              <textarea
                                value={seg.text}
                                onChange={(e) => {
                                  setScriptSegments(prev => prev.map(s => s.id === seg.id ? { ...s, text: e.target.value } : s));
                                  e.target.style.height = "auto";
                                  e.target.style.height = e.target.scrollHeight + "px";
                                }}
                                ref={(el) => {
                                  if (el) {
                                    el.style.height = "auto";
                                    el.style.height = el.scrollHeight + "px";
                                  }
                                }}
                                placeholder="Enter text..."
                                rows={1}
                                className="w-full text-sm text-gray-700 leading-relaxed bg-transparent border-none outline-none resize-none placeholder:text-gray-400"
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400 text-center py-6">Add a segment or use the AI assistant to generate a script.</p>
                  )}
                </div>
              ) : (
                <div className="flex-1 overflow-hidden">
                  <VideoAgentChat onApplySuggestion={handleApplySuggestion} broadcastIdeas={broadcastIdeas} />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Desktop Left Panel - Script/AI Assistant */}
        <div className="hidden md:flex border-r border-gray-200 bg-white flex-col flex-shrink-0" style={{ width: leftPanelWidth }}>
          {/* Tab switcher */}
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setLeftPanelTab("ai")}
              className={cn(
                "flex-1 px-3 py-2.5 text-xs font-medium transition-colors",
                leftPanelTab === "ai"
                  ? "text-primary border-b-2 border-primary"
                  : "text-gray-500 hover:text-gray-700"
              )}
            >
              AI Assistant
            </button>
            <button
              onClick={() => setLeftPanelTab("script")}
              className={cn(
                "flex-1 px-3 py-2.5 text-xs font-medium transition-colors",
                leftPanelTab === "script"
                  ? "text-primary border-b-2 border-primary"
                  : "text-gray-500 hover:text-gray-700"
              )}
            >
              Script
            </button>
          </div>

          {leftPanelTab === "script" ? (
            <>
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

              <div className="p-3 space-y-2">
                <button
                  onClick={() => setScriptSegments(prev => [...prev, { id: generateId(), label: "Point", text: "" }])}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg text-sm text-gray-700 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add
                </button>
                {scriptSegments.length > 0 && scriptSegments.some(s => s.text.trim()) && (
                  <button
                    onClick={buildTimelineFromSegments}
                    className="w-full flex items-center justify-center gap-2 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                    </svg>
                    Build Timeline from Script
                  </button>
                )}
              </div>

              <div className="flex-1 overflow-y-auto p-3 space-y-4">
                {scriptSegments.length > 0 ? (
                  <div className="space-y-3">
                    {scriptSegments.map((seg, i) => {
                      const timePerSegment = duration / scriptSegments.length;
                      const timestamp = formatTimestamp(i * timePerSegment);
                      return (
                        <div key={seg.id} className="flex items-start gap-3 group">
                          <span className="text-xs text-gray-400 font-mono pt-1">{timestamp}</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className={cn("text-[10px] font-semibold px-1.5 py-0.5 rounded", getSegmentColor(seg.label))}>
                                {seg.label}
                              </span>
                              <button
                                onClick={() => setScriptSegments(prev => prev.filter(s => s.id !== seg.id))}
                                className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-opacity"
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                            <textarea
                              value={seg.text}
                              onChange={(e) => {
                                setScriptSegments(prev => prev.map(s => s.id === seg.id ? { ...s, text: e.target.value } : s));
                                e.target.style.height = "auto";
                                e.target.style.height = e.target.scrollHeight + "px";
                              }}
                              ref={(el) => {
                                if (el) {
                                  el.style.height = "auto";
                                  el.style.height = el.scrollHeight + "px";
                                }
                              }}
                              placeholder="Enter text..."
                              rows={1}
                              className="w-full text-sm text-gray-700 leading-relaxed bg-transparent border-none outline-none resize-none placeholder:text-gray-400"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 text-center py-6">Add a segment or use the AI assistant to generate a script.</p>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 overflow-hidden">
              <VideoAgentChat onApplySuggestion={handleApplySuggestion} broadcastIdeas={broadcastIdeas} />
            </div>
          )}
        </div>

        {/* Left resize handle */}
        <div
          className="hidden md:block w-1 cursor-col-resize hover:bg-primary/30 active:bg-primary/50 transition-colors flex-shrink-0"
          onMouseDown={startResizeLeft}
        />

        {/* Center - Video Preview */}
        <div
          className={cn(
            "flex-1 flex items-center justify-center p-2 sm:p-4 bg-gray-100 transition-colors min-h-0 min-w-0 relative",
            isDragging && "bg-primary/10"
          )}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          {/* Floating controls overlay */}
          <div className="absolute top-2 left-2 right-2 z-20 flex items-center justify-between pointer-events-none">
            {/* Mobile: Toggle left panel */}
            <button
              onClick={() => setShowLeftPanel(!showLeftPanel)}
              className="pointer-events-auto p-1.5 rounded-lg bg-white/90 backdrop-blur-sm shadow-sm border border-gray-200 hover:bg-white text-gray-500 hover:text-gray-900 transition-colors md:hidden"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="hidden md:block" />

            <div className="flex items-center gap-1.5 pointer-events-auto">
              {/* Aspect Ratio Selector */}
              <div className="relative">
                <button
                  onClick={() => setShowAspectMenu(!showAspectMenu)}
                  className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white/90 backdrop-blur-sm shadow-sm border border-gray-200 hover:bg-white text-xs text-gray-700 transition-colors"
                >
                  <div
                    className="border border-current rounded-[1px]"
                    style={{
                      width: aspectRatio.width >= aspectRatio.height ? 12 : 12 * (aspectRatio.width / aspectRatio.height),
                      height: aspectRatio.height >= aspectRatio.width ? 10 : 10 * (aspectRatio.height / aspectRatio.width),
                    }}
                  />
                  <span>{aspectRatio.value}</span>
                  <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {showAspectMenu && (
                  <div className="absolute top-full mt-1 right-0 bg-white border border-gray-200 rounded-xl shadow-lg z-50 p-2 min-w-[200px]">
                    {ASPECT_RATIOS.map((ratio) => (
                      <button
                        key={ratio.value}
                        onClick={() => { setAspectRatio(ratio); setShowAspectMenu(false); }}
                        className={cn(
                          "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors",
                          aspectRatio.value === ratio.value
                            ? "bg-primary/10 text-primary"
                            : "text-gray-700 hover:bg-gray-50"
                        )}
                      >
                        <div
                          className={cn(
                            "border-2 rounded-[2px] flex-shrink-0",
                            aspectRatio.value === ratio.value ? "border-primary bg-primary/10" : "border-gray-300 bg-gray-50"
                          )}
                          style={{
                            width: 24 * (ratio.width / Math.max(ratio.width, ratio.height)),
                            height: 24 * (ratio.height / Math.max(ratio.width, ratio.height)),
                          }}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium">{ratio.label}</div>
                          <div className="text-[10px] text-gray-400">{ratio.value} &middot; {ratio.desc}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <Button
                size="sm"
                className="bg-primary hover:bg-primary/90 text-xs h-7 px-2.5 shadow-sm"
                onClick={() => setShowExportModal(true)}
              >
                Export
              </Button>
            </div>
          </div>

          {isDragging ? (
            <div className="text-center text-gray-600">
              <svg className="w-16 h-16 mx-auto mb-4 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p className="text-lg font-medium">Drop your video here</p>
            </div>
          ) : (
            <div
              ref={previewContainerRef}
              className="rounded-sm overflow-hidden border border-gray-300 shadow-xl bg-black relative flex items-center justify-center"
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
              {/* Processing overlay when rendering preview */}
              {isConverting && (
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    zIndex: 10,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: "rgba(0, 0, 0, 0.7)",
                  }}
                >
                  <div className="text-white text-sm font-medium mb-3">Converting MOV to MP4...</div>
                  <div className="w-48 h-1.5 bg-white/20 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500 rounded-full transition-all duration-300"
                      style={{ width: `${convertProgress}%` }}
                    />
                  </div>
                  <div className="text-white/60 text-xs mt-2">{convertProgress}%</div>
                </div>
              )}
              {isRenderingPreview && (
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    zIndex: 10,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: "rgba(0, 0, 0, 0.7)",
                  }}
                >
                  <div className="text-white text-sm font-medium mb-3">Processing preview...</div>
                  <div className="w-48 h-1.5 bg-white/20 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full transition-all duration-300"
                      style={{ width: `${previewProgress}%` }}
                    />
                  </div>
                  <div className="text-white/60 text-xs mt-2">{previewProgress}%</div>
                </div>
              )}
              {/* Remotion Player handles both video and overlays */}
              <Player
                ref={(ref) => setPlayerRef(ref)}
                component={VideoComposition}
                inputProps={{
                  title,
                  caption,
                  backgroundColor,
                  accentColor,
                  videoSrc,
                  overlayPosition,
                  overlayOpacity: videoSrc ? overlayOpacity : 0,
                  titleAnimation,
                  captionAnimation,
                  volume,
                  playbackRate,
                  muted,
                  captions,
                  showCaptions,
                  captionStyle: { position: captionPosition },
                  audioSrc: ttsAudioSrc,
                  audioVolume: 1,
                  titlePosition: titlePos,
                  captionPosition2: captionPos,
                  textSegments,
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
              {/* Drag overlay for repositioning text */}
              {(title || caption) && (
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    zIndex: 20,
                    cursor: draggingText ? "grabbing" : "default",
                  }}
                  onMouseMove={(e) => {
                    if (!draggingText || !previewContainerRef.current) return;
                    const rect = previewContainerRef.current.getBoundingClientRect();
                    const x = Math.max(5, Math.min(95, ((e.clientX - rect.left) / rect.width) * 100));
                    const y = Math.max(5, Math.min(95, ((e.clientY - rect.top) / rect.height) * 100));
                    if (draggingText === "title") setTitlePos({ x, y });
                    else setCaptionPos({ x, y });
                  }}
                  onMouseUp={() => setDraggingText(null)}
                  onMouseLeave={() => setDraggingText(null)}
                  onTouchMove={(e) => {
                    if (!draggingText || !previewContainerRef.current) return;
                    const touch = e.touches[0];
                    const rect = previewContainerRef.current.getBoundingClientRect();
                    const x = Math.max(5, Math.min(95, ((touch.clientX - rect.left) / rect.width) * 100));
                    const y = Math.max(5, Math.min(95, ((touch.clientY - rect.top) / rect.height) * 100));
                    if (draggingText === "title") setTitlePos({ x, y });
                    else setCaptionPos({ x, y });
                  }}
                  onTouchEnd={() => setDraggingText(null)}
                >
                  {/* Title drag handle */}
                  {title && (
                    <div
                      style={{
                        position: "absolute",
                        left: `${titlePos.x}%`,
                        top: `${titlePos.y}%`,
                        transform: "translate(-50%, -50%)",
                        padding: "8px 20px",
                        cursor: "grab",
                        borderRadius: 6,
                        border: "2px dashed transparent",
                        userSelect: "none",
                        WebkitUserSelect: "none",
                      }}
                      className="hover:!border-white/60 transition-colors group"
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        setDraggingText("title");
                      }}
                      onTouchStart={(e) => {
                        e.stopPropagation();
                        setDraggingText("title");
                      }}
                    >
                      <span className="text-transparent group-hover:text-white/70 text-xs pointer-events-none select-none">Title</span>
                    </div>
                  )}
                  {/* Caption drag handle */}
                  {caption && (
                    <div
                      style={{
                        position: "absolute",
                        left: `${captionPos.x}%`,
                        top: `${captionPos.y}%`,
                        transform: "translate(-50%, -50%)",
                        padding: "6px 16px",
                        cursor: "grab",
                        borderRadius: 6,
                        border: "2px dashed transparent",
                        userSelect: "none",
                        WebkitUserSelect: "none",
                      }}
                      className="hover:!border-white/60 transition-colors group"
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        setDraggingText("caption");
                      }}
                      onTouchStart={(e) => {
                        e.stopPropagation();
                        setDraggingText("caption");
                      }}
                    >
                      <span className="text-transparent group-hover:text-white/70 text-xs pointer-events-none select-none">Caption</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Mobile Tool Bar - Fixed at bottom of preview area */}
        <div className="md:hidden absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-30">
          {/* Tool Icons Row */}
          <div className="flex items-center justify-around px-2 py-1.5 border-b border-gray-100">
            {tools.map((tool) => (
              <button
                key={tool.id}
                onClick={() => {
                  setActiveTool(tool.id);
                  setShowMobileTools(true);
                }}
                className={cn(
                  "flex flex-col items-center justify-center p-2 rounded-lg transition-colors min-w-[48px]",
                  activeTool === tool.id
                    ? "bg-primary/10 text-primary"
                    : "text-gray-400 hover:text-gray-700 hover:bg-gray-100"
                )}
              >
                {tool.icon}
                <span className="text-[9px] mt-0.5">{tool.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Mobile Tool Properties - Bottom Sheet */}
        {showMobileTools && (
          <div className="md:hidden fixed inset-0 z-50" onClick={() => setShowMobileTools(false)}>
            <div className="absolute inset-0 bg-black/50" />
            <div
              className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-xl max-h-[70vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Handle */}
              <div className="flex justify-center py-2">
                <div className="w-10 h-1 bg-gray-300 rounded-full" />
              </div>
              {/* Header */}
              <div className="flex items-center justify-between px-4 pb-2 border-b border-gray-200">
                <h3 className="text-sm font-medium text-gray-900 capitalize">{activeTool}</h3>
                <button
                  onClick={() => setShowMobileTools(false)}
                  className="p-1.5 rounded hover:bg-gray-100 text-gray-500"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              {/* Content - Same as desktop but in mobile sheet */}
              <div className="flex-1 overflow-y-auto p-4">
                {/* Render tool content based on activeTool - duplicated for mobile */}
                {activeTool === "text" && (
                  <div className="space-y-4">
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
                    <div>
                      <label className="text-xs text-gray-500 block mb-1.5">Caption</label>
                      <textarea
                        value={caption}
                        onChange={(e) => setCaption(e.target.value)}
                        placeholder="Add caption..."
                        rows={3}
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-gray-300 focus:ring-1 focus:ring-gray-200 resize-none"
                      />
                    </div>
                    {(title || caption) && (
                      <div>
                        <label className="text-xs text-gray-500 block mb-2">Position</label>
                        <p className="text-xs text-gray-400 mb-2">Drag text on the preview to reposition</p>
                        <button
                          onClick={() => {
                            setTitlePos({ x: 50, y: 45 });
                            setCaptionPos({ x: 50, y: 60 });
                          }}
                          className="w-full py-2 text-xs rounded-lg border bg-gray-50 border-gray-200 text-gray-600 hover:border-gray-300 transition-all"
                        >
                          Reset positions
                        </button>
                      </div>
                    )}
                    <div>
                      <label className="text-xs text-gray-500 block mb-2">Accent Color</label>
                      <div className="flex gap-2 flex-wrap">
                        {accentColors.map((color) => (
                          <button
                            key={color.value}
                            onClick={() => setAccentColor(color.value)}
                            className={cn(
                              "w-8 h-8 rounded-full border-2 transition-all",
                              accentColor === color.value ? "border-gray-900 scale-110" : "border-gray-200"
                            )}
                            style={{ backgroundColor: color.value }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                {activeTool === "uploads" && (
                  <div className="space-y-4">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="video/*"
                      onChange={handleInputChange}
                      className="hidden"
                    />

                    {/* Current active video */}
                    {videoSrc && (
                      <div className="space-y-3">
                        <label className="text-xs text-gray-500">Active Video</label>
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
                        <div className="flex items-center gap-1">
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
                    )}

                    {/* Media library */}
                    {mediaUploads.length > 0 && (
                      <div className="space-y-2">
                        <label className="text-xs text-gray-500">Media Library</label>
                        <div className="space-y-1.5">
                          {mediaUploads.map((upload) => (
                            <div key={upload.id} className="flex items-center gap-2 p-2 bg-gray-50 border border-gray-200 rounded-lg group">
                              <div className="w-8 h-8 rounded bg-gray-200 flex items-center justify-center flex-shrink-0">
                                {upload.type === "recording" ? (
                                  <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                                    <circle cx="12" cy="12" r="8" />
                                  </svg>
                                ) : (
                                  <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                  </svg>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs text-gray-700 truncate">{upload.name}</p>
                                {upload.uploading && <p className="text-[10px] text-gray-400">Saving...</p>}
                              </div>
                              <button
                                onClick={() => handleSelectUpload(upload)}
                                className="px-2 py-1 text-[10px] font-medium bg-primary text-white rounded hover:bg-primary/90 transition-colors flex-shrink-0"
                              >
                                Use
                              </button>
                              <button
                                onClick={() => handleRemoveUpload(upload.id)}
                                className="p-1 hover:bg-gray-200 rounded text-gray-400 hover:text-red-500 transition-colors flex-shrink-0"
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Upload button */}
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full p-4 border-2 border-dashed border-gray-300 rounded-xl hover:border-primary/50 transition-colors text-center"
                    >
                      <svg className="w-6 h-6 mx-auto mb-1.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <span className="text-xs text-gray-500">Upload a file</span>
                    </button>
                  </div>
                )}
                {activeTool === "music" && (
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium text-gray-900">Text to Speech</h3>
                    <div>
                      <label className="text-xs text-gray-500 block mb-1.5">Voice</label>
                      {isLoadingVoices ? (
                        <div className="flex items-center gap-2 text-xs text-gray-500 py-2">
                          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          Loading voices...
                        </div>
                      ) : (
                        <select
                          value={selectedVoiceId}
                          onChange={(e) => setSelectedVoiceId(e.target.value)}
                          className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:border-gray-300 focus:ring-1 focus:ring-gray-200"
                        >
                          {ttsVoices.map((v) => (
                            <option key={v.voice_id} value={v.voice_id}>
                              {v.name} ({v.category})
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs text-gray-500">Text</label>
                        {(scriptSegments.length > 0 || title || caption) && (
                          <button
                            onClick={() => setTtsText(
                              scriptSegments.length > 0
                                ? scriptSegments.map(s => s.text).filter(Boolean).join("\n\n")
                                : [title, caption].filter(Boolean).join("\n\n")
                            )}
                            className="text-xs text-primary hover:text-primary/80 font-medium"
                          >
                            Use Script
                          </button>
                        )}
                      </div>
                      <textarea
                        value={ttsText}
                        onChange={(e) => setTtsText(e.target.value)}
                        placeholder="Enter text to convert to speech..."
                        rows={4}
                        maxLength={5000}
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-gray-300 focus:ring-1 focus:ring-gray-200 resize-none"
                      />
                      <p className="text-xs text-gray-400 mt-1">{ttsText.length} chars</p>
                    </div>
                    {ttsError && (
                      <p className="text-xs text-red-500">{ttsError}</p>
                    )}
                    <Button
                      size="sm"
                      onClick={handleGenerateTts}
                      disabled={!ttsText.trim() || !selectedVoiceId || isGeneratingTts}
                      className="w-full gap-2"
                    >
                      {isGeneratingTts ? (
                        <>
                          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          Generating...
                        </>
                      ) : (
                        "Generate Speech"
                      )}
                    </Button>
                    {ttsAudioSrc && (
                      <div className="border-t border-gray-200 pt-4 space-y-3">
                        <span className="text-xs font-medium text-gray-700">Generated Audio</span>
                        <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-2">
                          <span className="text-lg">🎵</span>
                          <span className="text-xs text-gray-600 truncate flex-1">{ttsAudioFileName}</span>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={handlePreviewAudio} className="flex-1">
                            {isPreviewingAudio ? "Stop" : "Preview"}
                          </Button>
                          <Button size="sm" onClick={handleAddTtsToTimeline} className="flex-1">
                            Add to Timeline
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                {(activeTool === "brand" || activeTool === "layout" || activeTool === "captions") && (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3 text-gray-500">
                      {tools.find(t => t.id === activeTool)?.icon}
                    </div>
                    <p className="text-sm text-gray-600 capitalize">{activeTool}</p>
                    <p className="text-xs text-gray-400 mt-1">Coming soon</p>
                  </div>
                )}
                {activeTool === "record" && (
                  <RecordingPanel onRecordingComplete={handleRecordingComplete} />
                )}
              </div>
            </div>
          </div>
        )}

        {/* Right resize handle */}
        <div
          className="hidden md:block w-1 cursor-col-resize hover:bg-primary/30 active:bg-primary/50 transition-colors flex-shrink-0"
          onMouseDown={startResizeRight}
        />

        {/* Desktop Right Panel - Tool Properties */}
        <div className="hidden md:flex border-l border-gray-200 bg-white flex-shrink-0" style={{ width: rightPanelWidth }}>
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

                {(title || caption) && (
                  <div>
                    <label className="text-xs text-gray-500 block mb-2">Position</label>
                    <p className="text-xs text-gray-400 mb-2">Drag text on the preview to reposition</p>
                    <button
                      onClick={() => {
                        setTitlePos({ x: 50, y: 45 });
                        setCaptionPos({ x: 50, y: 60 });
                      }}
                      className="w-full py-2 text-xs rounded-lg border bg-gray-50 border-gray-200 text-gray-600 hover:border-gray-300 transition-all"
                    >
                      Reset positions
                    </button>
                  </div>
                )}

                {(title || caption) && videoSrc && (
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

                {/* Current active video controls */}
                {videoSrc && (
                  <div className="space-y-3">
                    <label className="text-xs text-gray-500">Active Video</label>
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

                    {/* Trim Controls */}
                    {originalDuration > 0 && (
                      <div className="border-t border-gray-200 pt-3 mt-3">
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-xs font-medium text-gray-700">Trim Video</label>
                          <span className="text-xs text-gray-500">
                            {(trimEnd - trimStart).toFixed(1)}s
                          </span>
                        </div>

                        <div className="relative h-8 mb-3">
                          <div className="absolute inset-x-0 top-3 h-2 bg-gray-200 rounded-full" />
                          <div
                            className="absolute top-3 h-2 bg-primary rounded-full"
                            style={{
                              left: `${(trimStart / originalDuration) * 100}%`,
                              right: `${100 - (trimEnd / originalDuration) * 100}%`,
                            }}
                          />
                          <input
                            type="range"
                            min={0}
                            max={originalDuration}
                            step={0.1}
                            value={trimStart}
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              if (val < trimEnd - 0.5) setTrimStart(val);
                            }}
                            className="absolute inset-x-0 top-0 h-8 opacity-0 cursor-pointer z-10"
                          />
                          <input
                            type="range"
                            min={0}
                            max={originalDuration}
                            step={0.1}
                            value={trimEnd}
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              if (val > trimStart + 0.5) setTrimEnd(val);
                            }}
                            className="absolute inset-x-0 top-0 h-8 opacity-0 cursor-pointer z-20"
                            style={{ pointerEvents: "none" }}
                          />
                          <div
                            className="absolute top-1 w-4 h-6 bg-white border-2 border-primary rounded cursor-ew-resize shadow-sm"
                            style={{ left: `calc(${(trimStart / originalDuration) * 100}% - 8px)` }}
                          />
                          <div
                            className="absolute top-1 w-4 h-6 bg-white border-2 border-primary rounded cursor-ew-resize shadow-sm"
                            style={{ left: `calc(${(trimEnd / originalDuration) * 100}% - 8px)` }}
                          />
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="flex-1">
                            <label className="text-xs text-gray-400 block mb-1">Start</label>
                            <input
                              type="number"
                              min={0}
                              max={trimEnd - 0.5}
                              step={0.1}
                              value={trimStart.toFixed(1)}
                              onChange={(e) => setTrimStart(Math.max(0, Number(e.target.value)))}
                              className="w-full px-2 py-1 text-xs bg-gray-50 border border-gray-200 rounded text-center"
                            />
                          </div>
                          <span className="text-gray-400 mt-4">—</span>
                          <div className="flex-1">
                            <label className="text-xs text-gray-400 block mb-1">End</label>
                            <input
                              type="number"
                              min={trimStart + 0.5}
                              max={originalDuration}
                              step={0.1}
                              value={trimEnd.toFixed(1)}
                              onChange={(e) => setTrimEnd(Math.min(originalDuration, Number(e.target.value)))}
                              className="w-full px-2 py-1 text-xs bg-gray-50 border border-gray-200 rounded text-center"
                            />
                          </div>
                        </div>

                        {(trimStart > 0 || trimEnd < originalDuration) && (
                          <button
                            onClick={() => {
                              setTrimStart(0);
                              setTrimEnd(originalDuration);
                            }}
                            className="w-full mt-2 py-1.5 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
                          >
                            Reset Trim
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Media Library */}
                {mediaUploads.length > 0 && (
                  <div className="space-y-2">
                    <label className="text-xs text-gray-500">Media Library</label>
                    <div className="space-y-1.5">
                      {mediaUploads.map((upload) => (
                        <div key={upload.id} className="flex items-center gap-2 p-2.5 bg-gray-50 border border-gray-200 rounded-lg group hover:bg-gray-100 transition-colors">
                          <div className="w-9 h-9 rounded bg-gray-200 flex items-center justify-center flex-shrink-0">
                            {upload.type === "recording" ? (
                              <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                                <circle cx="12" cy="12" r="8" />
                              </svg>
                            ) : (
                              <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-gray-700 truncate">{upload.name}</p>
                            <p className="text-[10px] text-gray-400">
                              {upload.uploading ? "Saving..." : upload.supabaseUrl ? "Saved" : "Local"}
                            </p>
                          </div>
                          <button
                            onClick={() => handleSelectUpload(upload)}
                            className="px-2.5 py-1 text-xs font-medium bg-primary text-white rounded hover:bg-primary/90 transition-colors flex-shrink-0"
                          >
                            Use
                          </button>
                          <button
                            onClick={() => handleRemoveUpload(upload.id)}
                            className="p-1 hover:bg-gray-200 rounded text-gray-400 hover:text-red-500 transition-colors flex-shrink-0 opacity-0 group-hover:opacity-100"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Upload button */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className={cn(
                    "w-full border-2 border-dashed border-gray-300 rounded-xl hover:border-primary/50 transition-colors text-center",
                    videoSrc || mediaUploads.length > 0 ? "p-4" : "p-8"
                  )}
                >
                  <svg className={cn("mx-auto mb-2 text-gray-400", videoSrc || mediaUploads.length > 0 ? "w-6 h-6" : "w-10 h-10")} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <span className="text-sm text-gray-500">{videoSrc || mediaUploads.length > 0 ? "Upload another file" : "Click or drag to upload"}</span>
                </button>
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

            {activeTool === "captions" && (
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-gray-900">Captions</h3>

                {/* Toggle Captions */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Show Captions</span>
                  <button
                    onClick={() => setShowCaptions(!showCaptions)}
                    className={cn(
                      "relative w-10 h-6 rounded-full transition-colors",
                      showCaptions ? "bg-primary" : "bg-gray-200"
                    )}
                  >
                    <div
                      className={cn(
                        "absolute top-1 w-4 h-4 rounded-full bg-white transition-transform shadow-sm",
                        showCaptions ? "translate-x-5" : "translate-x-1"
                      )}
                    />
                  </button>
                </div>

                {/* Caption Position */}
                {showCaptions && (
                  <div>
                    <label className="text-xs text-gray-500 block mb-2">Position</label>
                    <div className="flex gap-1">
                      {(["top", "center", "bottom"] as const).map((pos) => (
                        <button
                          key={pos}
                          onClick={() => setCaptionPosition(pos)}
                          className={cn(
                            "flex-1 py-2 text-xs rounded-lg border transition-all capitalize",
                            captionPosition === pos
                              ? "bg-primary text-white border-primary"
                              : "bg-gray-50 border-gray-200 text-gray-600 hover:border-gray-300"
                          )}
                        >
                          {pos}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="border-t border-gray-200 pt-4">
                  <label className="text-xs text-gray-500 block mb-1.5">Caption Text</label>
                  <textarea
                    value={captionText}
                    onChange={(e) => setCaptionText(e.target.value)}
                    placeholder="Enter caption text or use auto-transcribe..."
                    rows={4}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-gray-300 focus:ring-1 focus:ring-gray-200 resize-none"
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={handleGenerateCaptions}
                    disabled={!captionText.trim()}
                    className="flex-1"
                  >
                    Generate
                  </Button>
                  {captions.length > 0 && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleClearCaptions}
                    >
                      Clear
                    </Button>
                  )}
                </div>

                {/* Auto-Transcribe with OpenAI Whisper */}
                {videoSrc && (
                  <div className="border-t border-gray-200 pt-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-gray-700">Auto-Transcribe</span>
                      <span className="text-xs text-green-600 flex items-center gap-1">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        AI Powered
                      </span>
                    </div>

                    {/* OpenAI Whisper - Primary Option */}
                    <Button
                      size="sm"
                      onClick={handleWhisperTranscribe}
                      disabled={isTranscribing}
                      className="w-full gap-2 bg-primary hover:bg-primary/90"
                    >
                      {isTranscribing ? (
                        <>
                          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          Transcribing with Whisper...
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                          </svg>
                          Transcribe with AI
                        </>
                      )}
                    </Button>
                    <p className="text-xs text-gray-500">
                      Uses OpenAI Whisper for accurate transcription with word-level timestamps.
                    </p>

                    {/* Browser fallback - Secondary Option */}
                    {transcriptionSupported && (
                      <div className="pt-2">
                        <button
                          onClick={handleTranscribe}
                          disabled={isTranscribing}
                          className="text-xs text-gray-500 hover:text-gray-700 underline"
                        >
                          Or use browser speech recognition (Chrome)
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Caption Stats */}
                {captions.length > 0 && (
                  <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-600">
                    <div className="flex justify-between">
                      <span>Captions:</span>
                      <span className="font-medium">{captions.length} segments</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTool === "music" && (
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-gray-900">Text to Speech</h3>

                {/* Voice selector */}
                <div>
                  <label className="text-xs text-gray-500 block mb-1.5">Voice</label>
                  {isLoadingVoices ? (
                    <div className="flex items-center gap-2 text-xs text-gray-500 py-2">
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Loading voices...
                    </div>
                  ) : (
                    <select
                      value={selectedVoiceId}
                      onChange={(e) => setSelectedVoiceId(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:border-gray-300 focus:ring-1 focus:ring-gray-200"
                    >
                      {ttsVoices.map((v) => (
                        <option key={v.voice_id} value={v.voice_id}>
                          {v.name} ({v.category})
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Text input */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs text-gray-500">Text</label>
                    {(scriptSegments.length > 0 || title || caption) && (
                      <button
                        onClick={() => setTtsText(
                          scriptSegments.length > 0
                            ? scriptSegments.map(s => s.text).filter(Boolean).join("\n\n")
                            : [title, caption].filter(Boolean).join("\n\n")
                        )}
                        className="text-xs text-primary hover:text-primary/80 font-medium"
                      >
                        Use Script
                      </button>
                    )}
                  </div>
                  <textarea
                    value={ttsText}
                    onChange={(e) => setTtsText(e.target.value)}
                    placeholder="Enter text to convert to speech..."
                    rows={4}
                    maxLength={5000}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-gray-300 focus:ring-1 focus:ring-gray-200 resize-none"
                  />
                  <p className="text-xs text-gray-400 mt-1">{ttsText.length} chars</p>
                </div>

                {/* Error */}
                {ttsError && (
                  <p className="text-xs text-red-500">{ttsError}</p>
                )}

                {/* Generate button */}
                <Button
                  size="sm"
                  onClick={handleGenerateTts}
                  disabled={!ttsText.trim() || !selectedVoiceId || isGeneratingTts}
                  className="w-full gap-2"
                >
                  {isGeneratingTts ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Generating...
                    </>
                  ) : (
                    "Generate Speech"
                  )}
                </Button>

                {/* Generated audio preview + add to timeline */}
                {ttsAudioSrc && (
                  <div className="border-t border-gray-200 pt-4 space-y-3">
                    <span className="text-xs font-medium text-gray-700">Generated Audio</span>
                    <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-2">
                      <span className="text-lg">🎵</span>
                      <span className="text-xs text-gray-600 truncate flex-1">{ttsAudioFileName}</span>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={handlePreviewAudio} className="flex-1">
                        {isPreviewingAudio ? "Stop" : "Preview"}
                      </Button>
                      <Button size="sm" onClick={handleAddTtsToTimeline} className="flex-1">
                        Add to Timeline
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTool === "brand" && (
              <div className="flex flex-col items-center justify-center h-full text-center py-12">
                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3 text-gray-500">
                  {tools.find(t => t.id === "brand")?.icon}
                </div>
                <p className="text-sm text-gray-600 capitalize">Brand</p>
                <p className="text-xs text-gray-400 mt-1">Coming soon</p>
              </div>
            )}

            {activeTool === "record" && (
              <RecordingPanel onRecordingComplete={handleRecordingComplete} />
            )}
          </div>

          {/* Vertical Tool Icons - Desktop Only */}
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

      {/* Spacer for mobile tool bar */}
      <div className="h-14 md:hidden flex-shrink-0" />

      {/* Timeline resize handle */}
      <div
        className="h-1.5 cursor-row-resize hover:bg-primary/30 active:bg-primary/50 transition-colors flex-shrink-0 bg-gray-200 group relative"
        onMouseDown={startResizeTimeline}
      >
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-center">
          <div className="w-8 h-0.5 rounded-full bg-gray-400 group-hover:bg-primary/60 transition-colors" />
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
        onSplitClip={handleSplitClip}
        canSplitClip={canSplitClip}
        onDeleteClip={handleDeleteClip}
        canDeleteClip={canDeleteClip}
        height={timelineHeight}
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

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 shrink-0">
              <h2 className="text-lg font-semibold text-gray-900">Export Video</h2>
              <button
                onClick={() => {
                  if (isExporting || isUploadingToYouTube) return;
                  setShowExportModal(false);
                  setExportedBlob(null);
                  setShowYouTubeUpload(false);
                  setYtUploadSuccess(null);
                  setYtUploadError(null);
                  setYtUploadProgress(0);
                }}
                className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                disabled={isExporting || isUploadingToYouTube}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-4 space-y-4 overflow-y-auto">
              {/* Export Preview */}
              <div className="aspect-video bg-gray-900 rounded-lg overflow-hidden flex items-center justify-center">
                {videoSrc ? (
                  <video
                    src={videoSrc}
                    className="w-full h-full object-cover"
                    muted
                  />
                ) : (
                  <div className="text-center text-gray-400">
                    <svg className="w-12 h-12 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    <p className="text-sm">Preview</p>
                  </div>
                )}
              </div>

              {/* Export Settings */}
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1.5">Format</label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setExportFormat("webm")}
                      className={cn(
                        "flex-1 py-2 px-3 rounded-lg border text-sm font-medium transition-all",
                        exportFormat === "webm"
                          ? "bg-primary text-white border-primary"
                          : "bg-gray-50 text-gray-700 border-gray-200 hover:border-gray-300"
                      )}
                    >
                      WebM
                    </button>
                    <button
                      onClick={() => setExportFormat("mp4")}
                      className={cn(
                        "flex-1 py-2 px-3 rounded-lg border text-sm font-medium transition-all",
                        exportFormat === "mp4"
                          ? "bg-primary text-white border-primary"
                          : "bg-gray-50 text-gray-700 border-gray-200 hover:border-gray-300"
                      )}
                    >
                      MP4
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {exportFormat === "webm"
                      ? "WebM: Best browser compatibility"
                      : "MP4: Note - browser export produces WebM, convert after download for MP4"}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1.5">Resolution</label>
                  <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-lg">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    {aspectRatio.width} × {aspectRatio.height} ({aspectRatio.value})
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1.5">Duration</label>
                  {(() => {
                    // Calculate edited duration from timeline clips
                    const videoTrack = tracks.find(t => t.type === "video");
                    const videoClips = videoTrack?.clips || [];
                    const editedFrames = videoClips.length > 0
                      ? Math.max(...videoClips.map(c => c.endFrame))
                      : durationInFrames;
                    const editedDuration = editedFrames / fps;
                    return (
                      <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-lg">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {editedDuration.toFixed(1)} seconds ({fps} fps)
                        {videoClips.length > 1 && (
                          <span className="text-xs text-primary">• {videoClips.length} clips</span>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Progress Bar */}
              {isExporting && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Exporting...</span>
                    <span className="text-gray-900 font-medium">{exportProgress}%</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all duration-300"
                      style={{ width: `${exportProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* YouTube Upload Section - shown after export completes */}
              {exportedBlob && !isExporting && (
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setShowYouTubeUpload(!showYouTubeUpload)}
                    className="w-full flex items-center justify-between p-3 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-red-600 font-bold text-lg">▶</span>
                      <span className="text-sm font-medium text-gray-700">Upload to YouTube</span>
                    </div>
                    <svg
                      className={cn("w-4 h-4 text-gray-400 transition-transform", showYouTubeUpload && "rotate-180")}
                      fill="none" stroke="currentColor" viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {showYouTubeUpload && (
                    <div className="p-3 pt-0 space-y-3 border-t border-gray-100">
                      {ytUploadSuccess ? (
                        <div className="text-center py-3">
                          <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-2">
                            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                          <p className="text-sm font-medium text-gray-900">Uploaded to YouTube!</p>
                          <a
                            href={`https://www.youtube.com/watch?v=${ytUploadSuccess}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-red-600 hover:text-red-700 underline mt-1 inline-block"
                          >
                            View on YouTube
                          </a>
                        </div>
                      ) : (
                        <>
                          <div>
                            <label className="text-xs font-medium text-gray-600 block mb-1">Title *</label>
                            <input
                              type="text"
                              value={ytTitle}
                              onChange={(e) => setYtTitle(e.target.value)}
                              placeholder="Video title"
                              className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500"
                              disabled={isUploadingToYouTube}
                            />
                          </div>
                          <div>
                            <label className="text-xs font-medium text-gray-600 block mb-1">Description</label>
                            <textarea
                              value={ytDescription}
                              onChange={(e) => setYtDescription(e.target.value)}
                              placeholder="Video description"
                              rows={2}
                              className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 resize-none"
                              disabled={isUploadingToYouTube}
                            />
                          </div>
                          <div>
                            <label className="text-xs font-medium text-gray-600 block mb-1">Tags (comma-separated)</label>
                            <input
                              type="text"
                              value={ytTags}
                              onChange={(e) => setYtTags(e.target.value)}
                              placeholder="tag1, tag2, tag3"
                              className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500"
                              disabled={isUploadingToYouTube}
                            />
                          </div>
                          <div>
                            <label className="text-xs font-medium text-gray-600 block mb-1">Privacy</label>
                            <div className="flex gap-1.5">
                              {(["private", "unlisted", "public"] as const).map((p) => (
                                <button
                                  key={p}
                                  onClick={() => setYtPrivacy(p)}
                                  disabled={isUploadingToYouTube}
                                  className={cn(
                                    "flex-1 py-1.5 px-2 rounded text-xs font-medium border transition-all capitalize",
                                    ytPrivacy === p
                                      ? "bg-red-600 text-white border-red-600"
                                      : "bg-gray-50 text-gray-600 border-gray-200 hover:border-gray-300"
                                  )}
                                >
                                  {p}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* YouTube Upload Progress */}
                          {isUploadingToYouTube && (
                            <div className="space-y-1.5">
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-gray-600">Uploading to YouTube...</span>
                                <span className="text-gray-900 font-medium">{ytUploadProgress}%</span>
                              </div>
                              <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-red-600 transition-all duration-300"
                                  style={{ width: `${ytUploadProgress}%` }}
                                />
                              </div>
                            </div>
                          )}

                          {ytUploadError && (
                            <p className="text-xs text-red-600">{ytUploadError}</p>
                          )}

                          <Button
                            onClick={handleUploadToYouTube}
                            disabled={isUploadingToYouTube || !ytTitle.trim()}
                            className="w-full bg-red-600 hover:bg-red-700 text-white text-sm"
                            size="sm"
                          >
                            {isUploadingToYouTube ? (
                              <>
                                <svg className="w-3.5 h-3.5 mr-1.5 animate-spin" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                                Uploading...
                              </>
                            ) : (
                              "Upload to YouTube"
                            )}
                          </Button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-200 bg-gray-50 shrink-0">
              <Button
                variant="outline"
                onClick={() => {
                  setShowExportModal(false);
                  setExportedBlob(null);
                  setShowYouTubeUpload(false);
                  setYtUploadSuccess(null);
                  setYtUploadError(null);
                  setYtUploadProgress(0);
                }}
                disabled={isExporting || isUploadingToYouTube}
              >
                {exportedBlob ? "Done" : "Cancel"}
              </Button>
              {!exportedBlob && (
                <Button
                  onClick={handleExport}
                  disabled={isExporting}
                  className="bg-primary hover:bg-primary/90"
                >
                  {isExporting ? (
                    <>
                      <svg className="w-4 h-4 mr-2 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Exporting...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                      </svg>
                      Export Video
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
