"use client";

import { useEffect } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useRecording, type RecordingMode } from "@/hooks/useRecording";

interface RecordingPanelProps {
  onRecordingComplete: (blob: Blob, duration: number) => void;
}

const modes: { value: RecordingMode; label: string; icon: React.ReactNode; hideOnMobile?: boolean }[] = [
  {
    value: "webcam",
    label: "Webcam",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    value: "screen",
    label: "Screen",
    hideOnMobile: true,
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    value: "screen-webcam",
    label: "Screen + Cam",
    hideOnMobile: true,
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h12a2 2 0 012 2v7a2 2 0 01-2 2H6a2 2 0 01-2-2V6z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 15a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
  },
];

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export function RecordingPanel({ onRecordingComplete }: RecordingPanelProps) {
  const {
    mode,
    state,
    recordingTime,
    elapsedSeconds,
    recordedBlob,
    recordedUrl,
    error,
    previewVideoRef,
    pipVideoRef,
    compositingCanvasRef,
    setMode,
    startPreview,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    reset,
    cleanup,
  } = useRecording();

  useEffect(() => {
    return () => cleanup();
  }, [cleanup]);

  const handleAddToTimeline = () => {
    if (recordedBlob) {
      onRecordingComplete(recordedBlob, elapsedSeconds);
      reset();
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-gray-900">Record</h3>

      {/* Hidden elements for compositing */}
      <canvas ref={compositingCanvasRef} className="hidden" />
      <video ref={pipVideoRef} autoPlay muted playsInline className="hidden" />

      {/* Error */}
      {error && (
        <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-600 text-xs">
          {error}
        </div>
      )}

      {/* Idle state: mode selector + start preview */}
      {state === "idle" && (
        <div className="space-y-3">
          <div className="space-y-1.5">
            <label className="text-xs text-gray-500">Mode</label>
            <div className="flex flex-col gap-1">
              {modes.map((m) => (
                <button
                  key={m.value}
                  onClick={() => setMode(m.value)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all text-left",
                    m.hideOnMobile && "hidden md:flex",
                    mode === m.value
                      ? "bg-primary/10 text-primary border border-primary/20"
                      : "bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100"
                  )}
                >
                  {m.icon}
                  {m.label}
                </button>
              ))}
            </div>
          </div>
          <Button size="sm" onClick={startPreview} className="w-full">
            <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            Start Preview
          </Button>
        </div>
      )}

      {/* Previewing state */}
      {state === "previewing" && (
        <div className="space-y-3">
          <div className="relative rounded-lg overflow-hidden bg-black aspect-video">
            <video
              ref={previewVideoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-contain"
            />
            {mode === "screen-webcam" && (
              <div className="absolute bottom-2 right-2 w-1/4 rounded-md overflow-hidden border border-white/30 shadow-lg">
                <video ref={pipVideoRef} autoPlay muted playsInline className="w-full" />
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => { cleanup(); reset(); }}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={startRecording}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white"
            >
              <span className="w-2 h-2 rounded-full bg-white mr-1.5" />
              Record
            </Button>
          </div>
        </div>
      )}

      {/* Recording state */}
      {state === "recording" && (
        <div className="space-y-3">
          <div className="relative rounded-lg overflow-hidden bg-black aspect-video">
            <video
              ref={previewVideoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-contain"
            />
            {mode === "screen-webcam" && (
              <div className="absolute bottom-2 right-2 w-1/4 rounded-md overflow-hidden border border-white/30 shadow-lg">
                <video ref={pipVideoRef} autoPlay muted playsInline className="w-full" />
              </div>
            )}
            <div className="absolute top-2 left-2 flex items-center gap-1.5 px-2 py-1 rounded-full bg-red-600 text-white text-xs font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              REC {formatTime(recordingTime)}
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={pauseRecording} className="flex-1">
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
              </svg>
              Pause
            </Button>
            <Button
              size="sm"
              onClick={stopRecording}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white"
            >
              <span className="w-2 h-2 rounded bg-white mr-1.5" />
              Stop
            </Button>
          </div>
        </div>
      )}

      {/* Paused state */}
      {state === "paused" && (
        <div className="space-y-3">
          <div className="relative rounded-lg overflow-hidden bg-black aspect-video">
            <video
              ref={previewVideoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-contain"
            />
            <div className="absolute top-2 left-2 flex items-center gap-1.5 px-2 py-1 rounded-full bg-yellow-500 text-white text-xs font-medium">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
              </svg>
              PAUSED {formatTime(recordingTime)}
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={resumeRecording} className="flex-1">
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
              Resume
            </Button>
            <Button
              size="sm"
              onClick={stopRecording}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white"
            >
              <span className="w-2 h-2 rounded bg-white mr-1.5" />
              Stop
            </Button>
          </div>
        </div>
      )}

      {/* Recorded state */}
      {state === "recorded" && recordedUrl && (
        <div className="space-y-3">
          <div className="rounded-lg overflow-hidden bg-black aspect-video">
            <video
              src={recordedUrl}
              controls
              playsInline
              className="w-full h-full object-contain"
            />
          </div>
          <p className="text-xs text-gray-500 text-center">
            Duration: {formatTime(recordingTime)}
          </p>
          <div className="flex flex-col gap-2">
            <Button size="sm" onClick={handleAddToTimeline} className="w-full">
              Save to Uploads
            </Button>
            <Button size="sm" variant="outline" onClick={reset} className="w-full">
              Record Another
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
