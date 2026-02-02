"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Player, PlayerRef } from "@remotion/player";
import { VideoComposition } from "./VideoComposition";
import { Timeline, TimelineTrack, TimelineClip } from "./Timeline";
import { createAutoCaptions } from "./Captions";
import type { Caption } from "@remotion/captions";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type TextAnimation = "none" | "fade" | "typewriter" | "word-highlight" | "slide-up" | "scale";
type ActiveTool = "text" | "music" | "captions" | "brand" | "layout" | "uploads" | null;
type CaptionPosition = "top" | "center" | "bottom";

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
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // UI State
  const [activeTool, setActiveTool] = useState<ActiveTool>("text");
  const [aspectRatio, setAspectRatio] = useState(ASPECT_RATIOS[0]);
  const [showAspectMenu, setShowAspectMenu] = useState(false);

  // Export State
  const [showExportModal, setShowExportModal] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportFormat, setExportFormat] = useState<"webm" | "mp4">("webm");

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

  // Trim controls
  const [trimStart, setTrimStart] = useState(0); // in seconds
  const [trimEnd, setTrimEnd] = useState(0); // in seconds (0 = no trim)
  const [originalDuration, setOriginalDuration] = useState(0); // original video duration

  // Timeline state
  const [tracks, setTracks] = useState<TimelineTrack[]>([]);
  const [selectedClip, setSelectedClip] = useState<TimelineClip | null>(null);

  const fps = 30;

  // Calculate effective duration based on trim
  const effectiveDuration = trimEnd > trimStart ? trimEnd - trimStart : duration;
  const durationInFrames = Math.round(effectiveDuration * fps);

  // Update duration when trim values change
  useEffect(() => {
    if (trimEnd > trimStart) {
      setDuration(trimEnd - trimStart);
    }
  }, [trimStart, trimEnd]);

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
      const videoDuration = video.duration;
      const maxDuration = Math.min(videoDuration, 60);
      setOriginalDuration(videoDuration);
      setDuration(maxDuration);
      setTrimStart(0);
      setTrimEnd(videoDuration);
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
    setTrimStart(0);
    setTrimEnd(0);
    setOriginalDuration(0);
  }, [videoSrc]);

  // Export video function
  const handleExport = useCallback(async () => {
    if (!previewContainerRef.current) return;

    setIsExporting(true);
    setExportProgress(0);

    try {
      // Create a canvas to composite video and overlays
      const canvas = document.createElement("canvas");
      canvas.width = aspectRatio.width;
      canvas.height = aspectRatio.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Could not get canvas context");

      // Get the video element if present
      const videoElement = videoRef.current;

      // Set up MediaRecorder
      const stream = canvas.captureStream(fps);

      // Add audio track if video has audio
      if (videoElement && !muted) {
        try {
          const audioCtx = new AudioContext();
          const source = audioCtx.createMediaElementSource(videoElement);
          const destination = audioCtx.createMediaStreamDestination();
          source.connect(destination);
          source.connect(audioCtx.destination); // Keep audio playing
          destination.stream.getAudioTracks().forEach(track => {
            stream.addTrack(track);
          });
        } catch {
          console.log("Could not capture audio, exporting video only");
        }
      }

      const mimeType = exportFormat === "webm" ? "video/webm;codecs=vp9" : "video/webm"; // Browser support
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported(mimeType) ? mimeType : "video/webm",
        videoBitsPerSecond: 8000000, // 8 Mbps
      });

      const chunks: Blob[] = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: "video/webm" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `export-${Date.now()}.webm`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setIsExporting(false);
        setShowExportModal(false);
        setExportProgress(100);
      };

      // Start recording
      mediaRecorder.start();

      // Reset video to start if present
      if (videoElement) {
        videoElement.currentTime = 0;
        videoElement.play();
      }

      // Also reset Remotion player
      if (playerRef) {
        playerRef.seekTo(0);
        playerRef.play();
      }

      // Render frames
      const totalFrames = durationInFrames;
      let frameCount = 0;

      const renderFrame = () => {
        if (frameCount >= totalFrames) {
          mediaRecorder.stop();
          if (videoElement) videoElement.pause();
          if (playerRef) playerRef.pause();
          return;
        }

        // Clear canvas
        ctx.fillStyle = backgroundColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw video frame if present
        if (videoElement && videoElement.readyState >= 2) {
          ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
        }

        // Draw text overlays
        if (title || caption) {
          // Dark overlay for text readability (if video)
          if (videoElement) {
            ctx.fillStyle = `rgba(0, 0, 0, ${overlayOpacity})`;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
          }

          ctx.textAlign = "center";
          ctx.fillStyle = "#ffffff";
          ctx.shadowColor = "rgba(0, 0, 0, 0.8)";
          ctx.shadowBlur = 10;

          // Calculate position
          let yPos = canvas.height / 2;
          if (overlayPosition === "top") yPos = 120;
          if (overlayPosition === "bottom") yPos = canvas.height - 150;

          // Draw title
          if (title) {
            const titleSize = videoElement ? 56 : 72;
            ctx.font = `bold ${titleSize}px system-ui, -apple-system, sans-serif`;
            ctx.fillText(title, canvas.width / 2, yPos);
          }

          // Draw caption
          if (caption) {
            const captionSize = videoElement ? 28 : 32;
            ctx.font = `${captionSize}px system-ui, -apple-system, sans-serif`;
            ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
            ctx.fillText(caption, canvas.width / 2, yPos + 60);
          }
        }

        // Draw progress bar
        const progress = frameCount / totalFrames;
        ctx.fillStyle = "rgba(255, 255, 255, 0.2)";
        ctx.fillRect(40, canvas.height - 44, canvas.width - 80, 4);
        ctx.fillStyle = accentColor;
        ctx.fillRect(40, canvas.height - 44, (canvas.width - 80) * progress, 4);

        frameCount++;
        setExportProgress(Math.round((frameCount / totalFrames) * 100));

        // Schedule next frame
        requestAnimationFrame(renderFrame);
      };

      // Start rendering
      renderFrame();

    } catch (error) {
      console.error("Export failed:", error);
      setIsExporting(false);
      alert("Export failed. Please try again.");
    }
  }, [aspectRatio, fps, durationInFrames, videoSrc, title, caption, backgroundColor, accentColor, overlayPosition, overlayOpacity, muted, playerRef, exportFormat]);

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

  // Browser-based transcription using Web Speech API
  const handleTranscribe = useCallback(async () => {
    if (!videoRef.current || !transcriptionSupported) return;

    setIsTranscribing(true);
    const video = videoRef.current;

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
  }, [duration, transcriptionSupported]);

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
      if (!transcribeResponse.ok && result.error?.includes("Invalid file format") && videoRef.current) {
        console.log("Falling back to audio extraction...");

        // Extract audio from video
        const audioBlob = await extractAudioFromVideo(videoRef.current);
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
          <Button
            size="sm"
            className="bg-primary hover:bg-primary/90"
            onClick={() => setShowExportModal(true)}
          >
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
              ref={previewContainerRef}
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
                  muted={muted}
                  playsInline
                  ref={(el) => {
                    // Store ref for export
                    (videoRef as React.MutableRefObject<HTMLVideoElement | null>).current = el;
                    // Handle playback state and trim
                    if (el) {
                      el.volume = volume;
                      el.playbackRate = playbackRate;

                      // Handle trim bounds
                      if (trimStart > 0 && el.currentTime < trimStart) {
                        el.currentTime = trimStart;
                      }
                      if (trimEnd > 0 && el.currentTime >= trimEnd) {
                        el.currentTime = trimStart; // Loop back to start
                      }

                      // Playback control
                      if (isPlaying && el.paused) el.play();
                      if (!isPlaying && !el.paused) el.pause();

                      // Handle looping within trim bounds
                      el.ontimeupdate = () => {
                        if (trimEnd > 0 && el.currentTime >= trimEnd) {
                          el.currentTime = trimStart;
                        }
                      };
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
                    captions,
                    showCaptions,
                    captionStyle: { position: captionPosition },
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

                    {/* Trim Controls */}
                    {originalDuration > 0 && (
                      <div className="border-t border-gray-200 pt-3 mt-3">
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-xs font-medium text-gray-700">Trim Video</label>
                          <span className="text-xs text-gray-500">
                            {(trimEnd - trimStart).toFixed(1)}s
                          </span>
                        </div>

                        {/* Trim Range Slider */}
                        <div className="relative h-8 mb-3">
                          {/* Track background */}
                          <div className="absolute inset-x-0 top-3 h-2 bg-gray-200 rounded-full" />

                          {/* Selected range */}
                          <div
                            className="absolute top-3 h-2 bg-primary rounded-full"
                            style={{
                              left: `${(trimStart / originalDuration) * 100}%`,
                              right: `${100 - (trimEnd / originalDuration) * 100}%`,
                            }}
                          />

                          {/* Start handle */}
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

                          {/* End handle */}
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

                          {/* Handle indicators */}
                          <div
                            className="absolute top-1 w-4 h-6 bg-white border-2 border-primary rounded cursor-ew-resize shadow-sm"
                            style={{ left: `calc(${(trimStart / originalDuration) * 100}% - 8px)` }}
                          />
                          <div
                            className="absolute top-1 w-4 h-6 bg-white border-2 border-primary rounded cursor-ew-resize shadow-sm"
                            style={{ left: `calc(${(trimEnd / originalDuration) * 100}% - 8px)` }}
                          />
                        </div>

                        {/* Time inputs */}
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

                        {/* Reset button */}
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

            {(activeTool === "music" || activeTool === "brand") && (
              <div className="flex flex-col items-center justify-center h-full text-center py-12">
                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3 text-gray-500">
                  {activeTool === "music" && tools.find(t => t.id === "music")?.icon}
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

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Export Video</h2>
              <button
                onClick={() => !isExporting && setShowExportModal(false)}
                className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                disabled={isExporting}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-4 space-y-4">
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
                  <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-lg">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {duration} seconds ({fps} fps)
                  </div>
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
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-200 bg-gray-50">
              <Button
                variant="outline"
                onClick={() => setShowExportModal(false)}
                disabled={isExporting}
              >
                Cancel
              </Button>
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
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
