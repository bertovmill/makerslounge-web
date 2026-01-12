"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

type RecordingMode = "webcam" | "screen" | "screen-webcam";
type RecordingState = "idle" | "previewing" | "recording" | "paused" | "recorded";

interface Clip {
  id: string;
  blob: Blob;
  url: string;
  duration: number;
  thumbnail: string | null;
  name: string;
}

export default function RecorderPage() {
  const [mode, setMode] = useState<RecordingMode>("webcam");
  const [state, setState] = useState<RecordingState>("idle");
  const [recordingTime, setRecordingTime] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Clips timeline state
  const [clips, setClips] = useState<Clip[]>([]);
  const [selectedClipId, setSelectedClipId] = useState<string | null>(null);

  // Playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // Get currently selected clip
  const selectedClip = useMemo(() => {
    return clips.find(c => c.id === selectedClipId) || null;
  }, [clips, selectedClipId]);

  // Cleanup blob URLs when component unmounts
  useEffect(() => {
    return () => {
      clips.forEach(clip => {
        URL.revokeObjectURL(clip.url);
        if (clip.thumbnail) {
          URL.revokeObjectURL(clip.thumbnail);
        }
      });
    };
  }, []);

  const videoRef = useRef<HTMLVideoElement>(null);
  const screenVideoRef = useRef<HTMLVideoElement>(null);
  const playbackVideoRef = useRef<HTMLVideoElement>(null);
  const thumbnailCanvasRef = useRef<HTMLCanvasElement>(null);

  // Generate thumbnail from video blob
  const generateThumbnail = useCallback((blob: Blob, url: string): Promise<string | null> => {
    return new Promise((resolve) => {
      const video = document.createElement("video");
      video.src = url;
      video.muted = true;
      video.preload = "metadata";

      video.onloadeddata = () => {
        // Seek to 0.5 seconds or 10% of the video
        video.currentTime = Math.min(0.5, video.duration * 0.1);
      };

      video.onseeked = () => {
        const canvas = thumbnailCanvasRef.current || document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(null);
          return;
        }

        // Set thumbnail size (16:9 aspect ratio)
        canvas.width = 160;
        canvas.height = 90;

        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const thumbnailUrl = canvas.toDataURL("image/jpeg", 0.7);
        resolve(thumbnailUrl);
      };

      video.onerror = () => resolve(null);
    });
  }, []);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const webcamStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);

  const stopAllStreams = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (webcamStreamRef.current) {
      webcamStreamRef.current.getTracks().forEach((track) => track.stop());
      webcamStreamRef.current = null;
    }
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((track) => track.stop());
      screenStreamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    if (screenVideoRef.current) {
      screenVideoRef.current.srcObject = null;
    }
  }, []);

  const startPreview = async () => {
    setError(null);
    stopAllStreams();

    try {
      // Get webcam stream if needed
      if (mode === "webcam" || mode === "screen-webcam") {
        const webcamStream = await navigator.mediaDevices.getUserMedia({
          video: { width: 1920, height: 1080, facingMode: "user" },
          audio: true,
        });
        webcamStreamRef.current = webcamStream;

        // For webcam-only mode, show in main view
        // For screen-webcam mode, show in PIP (screenVideoRef)
        if (mode === "webcam" && videoRef.current) {
          videoRef.current.srcObject = webcamStream;
        } else if (mode === "screen-webcam" && screenVideoRef.current) {
          screenVideoRef.current.srcObject = webcamStream;
        }
      }

      // Get screen stream if needed
      if (mode === "screen" || mode === "screen-webcam") {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: { width: 1920, height: 1080 },
          audio: true,
        });
        screenStreamRef.current = screenStream;

        // Handle screen share stop
        screenStream.getVideoTracks()[0].onended = () => {
          if (state === "recording") {
            stopRecording();
          } else {
            stopAllStreams();
            setState("idle");
          }
        };

        // Screen always goes to main view (videoRef) when screen is involved
        if (videoRef.current) {
          videoRef.current.srcObject = screenStream;
        }
      }

      setState("previewing");
    } catch (err) {
      console.error("Failed to start preview:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to access camera/screen. Please check permissions."
      );
    }
  };

  const startRecording = () => {
    chunksRef.current = [];
    setRecordingTime(0);

    // Combine streams for recording
    let recordingStream: MediaStream;

    if (mode === "screen-webcam" && screenStreamRef.current && webcamStreamRef.current) {
      // Use canvas compositing for screen + webcam
      const canvas = canvasRef.current;
      if (!canvas) {
        setError("Canvas not available for compositing");
        return;
      }

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        setError("Could not get canvas context");
        return;
      }

      // Set canvas size to match screen recording
      const screenTrack = screenStreamRef.current.getVideoTracks()[0];
      const screenSettings = screenTrack.getSettings();
      canvas.width = screenSettings.width || 1920;
      canvas.height = screenSettings.height || 1080;

      // Get webcam dimensions to preserve aspect ratio
      const webcamTrack = webcamStreamRef.current.getVideoTracks()[0];
      const webcamSettings = webcamTrack.getSettings();
      const webcamWidth = webcamSettings.width || 1920;
      const webcamHeight = webcamSettings.height || 1080;
      const webcamAspect = webcamWidth / webcamHeight;

      // Calculate PIP size and position (bottom-right, with padding)
      const pipWidth = Math.round(canvas.width * 0.2); // 20% of screen width
      const pipHeight = Math.round(pipWidth / webcamAspect); // Preserve webcam aspect ratio
      const pipPadding = 24;
      const pipX = canvas.width - pipWidth - pipPadding;
      const pipY = canvas.height - pipHeight - pipPadding;
      const pipRadius = 12;

      // Animation loop to composite both videos onto canvas
      const drawFrame = () => {
        // Draw screen video (full canvas)
        if (videoRef.current && videoRef.current.readyState >= 2) {
          ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        }

        // Draw webcam as rounded PIP overlay
        if (screenVideoRef.current && screenVideoRef.current.readyState >= 2) {
          ctx.save();

          // Create rounded rectangle path for clipping
          ctx.beginPath();
          ctx.moveTo(pipX + pipRadius, pipY);
          ctx.lineTo(pipX + pipWidth - pipRadius, pipY);
          ctx.quadraticCurveTo(pipX + pipWidth, pipY, pipX + pipWidth, pipY + pipRadius);
          ctx.lineTo(pipX + pipWidth, pipY + pipHeight - pipRadius);
          ctx.quadraticCurveTo(pipX + pipWidth, pipY + pipHeight, pipX + pipWidth - pipRadius, pipY + pipHeight);
          ctx.lineTo(pipX + pipRadius, pipY + pipHeight);
          ctx.quadraticCurveTo(pipX, pipY + pipHeight, pipX, pipY + pipHeight - pipRadius);
          ctx.lineTo(pipX, pipY + pipRadius);
          ctx.quadraticCurveTo(pipX, pipY, pipX + pipRadius, pipY);
          ctx.closePath();
          ctx.clip();

          // Draw the webcam video
          ctx.drawImage(screenVideoRef.current, pipX, pipY, pipWidth, pipHeight);

          ctx.restore();

          // Draw border around PIP
          ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(pipX + pipRadius, pipY);
          ctx.lineTo(pipX + pipWidth - pipRadius, pipY);
          ctx.quadraticCurveTo(pipX + pipWidth, pipY, pipX + pipWidth, pipY + pipRadius);
          ctx.lineTo(pipX + pipWidth, pipY + pipHeight - pipRadius);
          ctx.quadraticCurveTo(pipX + pipWidth, pipY + pipHeight, pipX + pipWidth - pipRadius, pipY + pipHeight);
          ctx.lineTo(pipX + pipRadius, pipY + pipHeight);
          ctx.quadraticCurveTo(pipX, pipY + pipHeight, pipX, pipY + pipHeight - pipRadius);
          ctx.lineTo(pipX, pipY + pipRadius);
          ctx.quadraticCurveTo(pipX, pipY, pipX + pipRadius, pipY);
          ctx.closePath();
          ctx.stroke();
        }

        animationFrameRef.current = requestAnimationFrame(drawFrame);
      };

      // Start the compositing loop
      drawFrame();

      // Get canvas stream and combine with audio
      const canvasStream = canvas.captureStream(30); // 30 FPS
      const audioTracks = [
        ...screenStreamRef.current.getAudioTracks(),
        ...webcamStreamRef.current.getAudioTracks(),
      ];
      recordingStream = new MediaStream([
        ...canvasStream.getVideoTracks(),
        ...audioTracks,
      ]);
    } else if (mode === "screen" && screenStreamRef.current) {
      recordingStream = screenStreamRef.current;
    } else if (webcamStreamRef.current) {
      recordingStream = webcamStreamRef.current;
    } else {
      setError("No stream available for recording");
      return;
    }

    const mediaRecorder = new MediaRecorder(recordingStream, {
      mimeType: "video/webm;codecs=vp9",
    });

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        chunksRef.current.push(e.data);
      }
    };

    mediaRecorder.onstop = async () => {
      const blob = new Blob(chunksRef.current, { type: "video/webm" });
      const url = URL.createObjectURL(blob);
      const clipDuration = recordingTime;

      // Generate thumbnail
      const thumbnail = await generateThumbnail(blob, url);

      // Create new clip
      const newClip: Clip = {
        id: `clip-${Date.now()}`,
        blob,
        url,
        duration: clipDuration,
        thumbnail,
        name: `Clip ${clips.length + 1}`,
      };

      setClips(prev => [...prev, newClip]);
      setSelectedClipId(newClip.id);
      setState("recorded");
    };

    mediaRecorderRef.current = mediaRecorder;
    mediaRecorder.start(1000); // Collect data every second

    // Start timer
    timerRef.current = setInterval(() => {
      setRecordingTime((prev) => prev + 1);
    }, 1000);

    setState("recording");
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && state === "recording") {
      mediaRecorderRef.current.pause();
      if (timerRef.current) clearInterval(timerRef.current);
      setState("paused");
    }
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current && state === "paused") {
      mediaRecorderRef.current.resume();
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
      setState("recording");
    }
  };

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    stopAllStreams();
  }, [stopAllStreams]);

  const downloadRecording = () => {
    if (!selectedClip) return;
    const a = document.createElement("a");
    a.href = selectedClip.url;
    a.download = `${selectedClip.name}-${Date.now()}.webm`;
    a.click();
  };

  const deleteClip = (clipId: string) => {
    const clip = clips.find(c => c.id === clipId);
    if (clip) {
      URL.revokeObjectURL(clip.url);
      if (clip.thumbnail) {
        URL.revokeObjectURL(clip.thumbnail);
      }
    }
    setClips(prev => prev.filter(c => c.id !== clipId));
    if (selectedClipId === clipId) {
      const remaining = clips.filter(c => c.id !== clipId);
      setSelectedClipId(remaining.length > 0 ? remaining[remaining.length - 1].id : null);
    }
  };

  const resetRecorder = () => {
    setRecordingTime(0);
    setState("idle");
    chunksRef.current = [];
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Playback controls
  const togglePlayback = async () => {
    const video = playbackVideoRef.current;
    if (!video) return;

    // Check actual video state, not React state
    if (!video.paused) {
      video.pause();
    } else {
      try {
        await video.play();
      } catch (err) {
        console.error("Failed to play video:", err);
        setIsPlaying(false);
      }
    }
  };

  const handlePlay = () => setIsPlaying(true);
  const handlePause = () => setIsPlaying(false);

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!playbackVideoRef.current || !duration || !isFinite(duration)) return;
    const rect = e.currentTarget.getBoundingClientRect();
    if (rect.width === 0) return;
    const clickX = e.clientX - rect.left;
    const percentage = clickX / rect.width;
    const newTime = percentage * duration;
    if (!isFinite(newTime)) return;
    playbackVideoRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleVideoTimeUpdate = () => {
    if (playbackVideoRef.current) {
      setCurrentTime(playbackVideoRef.current.currentTime);
    }
  };

  const handleVideoLoadedMetadata = () => {
    if (playbackVideoRef.current) {
      const videoDuration = playbackVideoRef.current.duration;
      // WebM files often report Infinity duration - use recording time as fallback
      if (isFinite(videoDuration) && videoDuration > 0) {
        setDuration(videoDuration);
      } else if (recordingTime > 0) {
        setDuration(recordingTime);
      }
    }
  };

  // Also update duration when video can play through (more reliable for WebM)
  const handleCanPlayThrough = () => {
    if (playbackVideoRef.current) {
      const videoDuration = playbackVideoRef.current.duration;
      if (isFinite(videoDuration) && videoDuration > 0) {
        setDuration(videoDuration);
      }
    }
  };

  const handleVideoEnded = () => {
    setIsPlaying(false);
  };

  // Sync streams to video elements whenever state changes
  useEffect(() => {
    if (state === "previewing" || state === "recording" || state === "paused") {
      // Assign streams to video elements
      if (mode === "webcam" && webcamStreamRef.current && videoRef.current) {
        videoRef.current.srcObject = webcamStreamRef.current;
      } else if (mode === "screen" && screenStreamRef.current && videoRef.current) {
        videoRef.current.srcObject = screenStreamRef.current;
      } else if (mode === "screen-webcam") {
        if (screenStreamRef.current && videoRef.current) {
          videoRef.current.srcObject = screenStreamRef.current;
        }
        if (webcamStreamRef.current && screenVideoRef.current) {
          screenVideoRef.current.srcObject = webcamStreamRef.current;
        }
      }
    }
  }, [state, mode]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopAllStreams();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [stopAllStreams]);

  const modes: { value: RecordingMode; label: string; icon: React.ReactNode }[] = [
    {
      value: "webcam",
      label: "Webcam",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      value: "screen",
      label: "Screen",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      value: "screen-webcam",
      label: "Screen + Cam",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h12a2 2 0 012 2v7a2 2 0 01-2 2H6a2 2 0 01-2-2V6z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 15a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
    },
  ];

  // Calculate total duration of all clips for timeline scale
  const totalClipsDuration = clips.reduce((acc, clip) => acc + clip.duration, 0);
  const timelineScale = Math.max(60, Math.ceil(totalClipsDuration / 10) * 10 + 20);

  // Generate time markers for the ruler
  const timeMarkers = [];
  for (let i = 0; i <= timelineScale; i += 10) {
    timeMarkers.push(i);
  }

  return (
    <div className="h-screen flex flex-col bg-gray-100 overflow-hidden">
      {/* Hidden canvases */}
      <canvas ref={canvasRef} className="hidden" />
      <canvas ref={thumbnailCanvasRef} className="hidden" />

      {/* Top bar */}
      <div className="flex-shrink-0 flex items-center justify-between px-4 py-2 border-b border-gray-200 bg-white">
        <Link
          href="/video-editing"
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-900 transition-colors"
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </Link>

        <div className="flex items-center gap-2">
          {state === "recorded" && selectedClip && (
            <button
              onClick={downloadRecording}
              className="inline-flex items-center px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Export
            </button>
          )}
        </div>
      </div>

      {/* Error display */}
      {error && (
        <div className="flex-shrink-0 mx-4 mt-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">
          {error}
        </div>
      )}

      {/* Main video preview area */}
      <div className="flex-1 min-h-0 p-4">
        <div className="h-full rounded-xl overflow-hidden bg-white border border-gray-200 shadow-sm">
          {state === "idle" ? (
            <div className="h-full flex flex-col items-center justify-center bg-gray-50">
              <div className="w-16 h-16 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-gray-500 text-sm mb-6">Select a mode and start recording</p>

              {/* Mode selector */}
              <div className="flex items-center gap-1 p-1 rounded-lg bg-gray-100 border border-gray-200 mb-4">
                {modes.map((m) => (
                  <button
                    key={m.value}
                    onClick={() => setMode(m.value)}
                    className={cn(
                      "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all",
                      mode === m.value
                        ? "bg-white text-gray-900 shadow-sm"
                        : "text-gray-500 hover:text-gray-900"
                    )}
                  >
                    {m.icon}
                    {m.label}
                  </button>
                ))}
              </div>

              <button
                onClick={startPreview}
                className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                Start Preview
              </button>
            </div>
          ) : state === "recorded" && selectedClip ? (
            <div className="h-full flex items-center justify-center relative">
              <video
                ref={playbackVideoRef}
                className="max-w-full max-h-full object-contain"
                src={selectedClip.url}
                key={selectedClip.id}
                preload="auto"
                onTimeUpdate={handleVideoTimeUpdate}
                onLoadedMetadata={handleVideoLoadedMetadata}
                onCanPlayThrough={handleCanPlayThrough}
                onPlay={handlePlay}
                onPause={handlePause}
                onEnded={handleVideoEnded}
                onError={(e) => console.error("Video error:", e.currentTarget.error)}
                onClick={togglePlayback}
                playsInline
              />
              {!isPlaying && (
                <button
                  onClick={togglePlayback}
                  className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/30 transition-colors"
                >
                  <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
                    <svg className="w-8 h-8 text-gray-900 ml-1" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                </button>
              )}
            </div>
          ) : (
            <div className="h-full relative">
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-contain"
              />
              {mode === "screen-webcam" && (
                <div className="absolute bottom-4 right-4 w-48 rounded-lg overflow-hidden shadow-xl border-2 border-white/20">
                  <video ref={screenVideoRef} autoPlay muted playsInline className="w-full" />
                </div>
              )}
              {state === "recording" && (
                <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-600 text-white text-xs font-medium">
                  <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                  REC {formatTime(recordingTime)}
                </div>
              )}
              {state === "paused" && (
                <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 rounded-full bg-yellow-500 text-white text-xs font-medium">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                  </svg>
                  PAUSED {formatTime(recordingTime)}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Playback controls bar - Canva style */}
      <div className="flex-shrink-0 flex items-center justify-center gap-4 py-3 border-y border-gray-200 bg-white">
        {state === "recorded" && selectedClip ? (
          <>
            <span className="text-gray-500 text-sm font-mono w-16 text-right">
              {formatTime(Math.floor(currentTime))}
            </span>
            <button
              onClick={togglePlayback}
              className="w-10 h-10 rounded-full bg-gray-900 flex items-center justify-center hover:bg-gray-800 transition-colors"
            >
              {isPlaying ? (
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>
            <span className="text-gray-500 text-sm font-mono w-16">
              {formatTime(Math.floor(duration))}
            </span>
          </>
        ) : state === "previewing" ? (
          <div className="flex items-center gap-3">
            <button
              onClick={() => { stopAllStreams(); setState("idle"); }}
              className="px-4 py-2 rounded-full border border-gray-300 text-gray-500 hover:text-gray-900 hover:border-gray-400 transition-colors text-sm"
            >
              Cancel
            </button>
            <button
              onClick={startRecording}
              className="flex items-center gap-2 px-5 py-2 rounded-full bg-red-600 text-white font-medium hover:bg-red-700 transition-colors text-sm"
            >
              <span className="w-2 h-2 rounded-full bg-white" />
              Start Recording
            </button>
          </div>
        ) : state === "recording" ? (
          <div className="flex items-center gap-3">
            <button
              onClick={pauseRecording}
              className="p-2 rounded-full border border-gray-300 text-gray-500 hover:text-gray-900 hover:border-gray-400 transition-colors"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
              </svg>
            </button>
            <button
              onClick={stopRecording}
              className="flex items-center gap-2 px-5 py-2 rounded-full bg-red-600 text-white font-medium hover:bg-red-700 transition-colors text-sm"
            >
              <span className="w-2.5 h-2.5 rounded bg-white" />
              Stop
            </button>
          </div>
        ) : state === "paused" ? (
          <div className="flex items-center gap-3">
            <button
              onClick={resumeRecording}
              className="flex items-center gap-2 px-5 py-2 rounded-full bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors text-sm"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
              Resume
            </button>
            <button
              onClick={stopRecording}
              className="flex items-center gap-2 px-5 py-2 rounded-full bg-red-600 text-white font-medium hover:bg-red-700 transition-colors text-sm"
            >
              <span className="w-2.5 h-2.5 rounded bg-white" />
              Stop
            </button>
          </div>
        ) : (
          <span className="text-gray-400 text-sm">Start recording to add clips</span>
        )}
      </div>

      {/* Timeline - Canva style */}
      <div className="flex-shrink-0 h-40 bg-gray-50 border-t border-gray-200">
        {/* Time ruler */}
        <div className="h-6 border-b border-gray-200 flex items-end px-4 overflow-x-auto bg-white">
          <div className="flex" style={{ minWidth: `${timelineScale * 10}px` }}>
            {timeMarkers.map((time) => (
              <div
                key={time}
                className="flex-shrink-0 relative"
                style={{ width: '100px' }}
              >
                <span className="absolute -left-3 bottom-1 text-xs text-gray-400">
                  {time}s
                </span>
                <div className="absolute left-0 bottom-0 w-px h-2 bg-gray-300" />
              </div>
            ))}
          </div>
        </div>

        {/* Clips track */}
        <div className="h-[calc(100%-1.5rem)] p-3 overflow-x-auto">
          <div className="h-full flex items-start gap-2" style={{ minWidth: `${timelineScale * 10}px` }}>
            {clips.length === 0 ? (
              <div className="h-full flex-1 rounded-lg border-2 border-dashed border-gray-200 flex items-center justify-center bg-white">
                <span className="text-gray-400 text-sm">Record clips to add them here</span>
              </div>
            ) : (
              <>
                {clips.map((clip, index) => (
                  <div
                    key={clip.id}
                    onClick={() => {
                      setSelectedClipId(clip.id);
                      setIsPlaying(false);
                      setCurrentTime(0);
                    }}
                    className={cn(
                      "relative h-full rounded-lg overflow-hidden cursor-pointer transition-all group flex-shrink-0",
                      "border-2",
                      selectedClipId === clip.id
                        ? "border-primary ring-2 ring-primary/30"
                        : "border-gray-200 hover:border-gray-300"
                    )}
                    style={{ width: Math.max(100, clip.duration * 10) }}
                  >
                    {clip.thumbnail ? (
                      <img src={clip.thumbnail} alt={clip.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                        <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex flex-col justify-end p-2">
                      <span className="text-xs font-medium text-white truncate">{clip.name}</span>
                      <span className="text-xs text-white/80">{formatTime(clip.duration)}</span>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteClip(clip.id); }}
                      className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/50 text-white/80 hover:bg-red-600 hover:text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                    {selectedClipId === clip.id && (
                      <div className="absolute top-1 left-1 w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold">
                        {index + 1}
                      </div>
                    )}
                  </div>
                ))}

                {/* Add clip button */}
                <button
                  onClick={resetRecorder}
                  className="flex-shrink-0 h-full w-16 rounded-lg border-2 border-dashed border-gray-300 hover:border-gray-400 flex flex-col items-center justify-center gap-1 text-gray-400 hover:text-gray-600 transition-colors bg-white"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span className="text-xs">Add</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
