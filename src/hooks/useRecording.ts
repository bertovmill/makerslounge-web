"use client";

import { useState, useRef, useCallback, useEffect } from "react";

export type RecordingMode = "webcam" | "screen" | "screen-webcam";
export type RecordingState = "idle" | "previewing" | "recording" | "paused" | "recorded";

export function useRecording() {
  const [mode, setMode] = useState<RecordingMode>("webcam");
  const [state, setState] = useState<RecordingState>("idle");
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Precise elapsed time tracking (for accurate duration)
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const recordingStartRef = useRef<number>(0);
  const accumulatedTimeRef = useRef<number>(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const webcamStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Refs the consumer should attach to DOM elements
  const previewVideoRef = useRef<HTMLVideoElement>(null);
  const pipVideoRef = useRef<HTMLVideoElement>(null);
  const compositingCanvasRef = useRef<HTMLCanvasElement>(null);

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
    if (previewVideoRef.current) {
      previewVideoRef.current.srcObject = null;
    }
    if (pipVideoRef.current) {
      pipVideoRef.current.srcObject = null;
    }
  }, []);

  const startPreview = useCallback(async () => {
    setError(null);
    stopAllStreams();

    try {
      if (mode === "webcam" || mode === "screen-webcam") {
        const webcamStream = await navigator.mediaDevices.getUserMedia({
          video: { width: 1920, height: 1080, facingMode: "user" },
          audio: true,
        });
        webcamStreamRef.current = webcamStream;

        if (mode === "webcam" && previewVideoRef.current) {
          previewVideoRef.current.srcObject = webcamStream;
        } else if (mode === "screen-webcam" && pipVideoRef.current) {
          pipVideoRef.current.srcObject = webcamStream;
        }
      }

      if (mode === "screen" || mode === "screen-webcam") {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: { width: 1920, height: 1080 },
          audio: true,
        });
        screenStreamRef.current = screenStream;

        screenStream.getVideoTracks()[0].onended = () => {
          if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
            stopRecording();
          } else {
            stopAllStreams();
            setState("idle");
          }
        };

        if (previewVideoRef.current) {
          previewVideoRef.current.srcObject = screenStream;
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
  }, [mode, stopAllStreams]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    stopAllStreams();
  }, [stopAllStreams]);

  const startRecording = useCallback(() => {
    chunksRef.current = [];
    setRecordingTime(0);
    setElapsedSeconds(0);
    accumulatedTimeRef.current = 0;
    recordingStartRef.current = Date.now();

    let recordingStream: MediaStream;

    if (mode === "screen-webcam" && screenStreamRef.current && webcamStreamRef.current) {
      const canvas = compositingCanvasRef.current;
      if (!canvas) {
        setError("Canvas not available for compositing");
        return;
      }
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        setError("Could not get canvas context");
        return;
      }

      const screenTrack = screenStreamRef.current.getVideoTracks()[0];
      const screenSettings = screenTrack.getSettings();
      canvas.width = screenSettings.width || 1920;
      canvas.height = screenSettings.height || 1080;

      const webcamTrack = webcamStreamRef.current.getVideoTracks()[0];
      const webcamSettings = webcamTrack.getSettings();
      const webcamWidth = webcamSettings.width || 1920;
      const webcamHeight = webcamSettings.height || 1080;
      const webcamAspect = webcamWidth / webcamHeight;

      const pipWidth = Math.round(canvas.width * 0.2);
      const pipHeight = Math.round(pipWidth / webcamAspect);
      const pipPadding = 24;
      const pipX = canvas.width - pipWidth - pipPadding;
      const pipY = canvas.height - pipHeight - pipPadding;
      const pipRadius = 12;

      const drawFrame = () => {
        if (previewVideoRef.current && previewVideoRef.current.readyState >= 2) {
          ctx.drawImage(previewVideoRef.current, 0, 0, canvas.width, canvas.height);
        }
        if (pipVideoRef.current && pipVideoRef.current.readyState >= 2) {
          ctx.save();
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
          ctx.drawImage(pipVideoRef.current, pipX, pipY, pipWidth, pipHeight);
          ctx.restore();

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
      drawFrame();

      const canvasStream = canvas.captureStream(30);
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

    // Codec fallback
    let mimeType = "video/webm;codecs=vp9";
    if (!MediaRecorder.isTypeSupported(mimeType)) {
      mimeType = "video/webm;codecs=vp8";
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = "video/webm";
      }
    }

    const mediaRecorder = new MediaRecorder(recordingStream, { mimeType });

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        chunksRef.current.push(e.data);
      }
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: "video/webm" });
      const url = URL.createObjectURL(blob);
      // Compute precise elapsed time
      const finalElapsed = accumulatedTimeRef.current + (Date.now() - recordingStartRef.current) / 1000;
      setElapsedSeconds(finalElapsed);
      setRecordedBlob(blob);
      setRecordedUrl(url);
      setState("recorded");
    };

    mediaRecorderRef.current = mediaRecorder;
    mediaRecorder.start(1000);

    timerRef.current = setInterval(() => {
      setRecordingTime((prev) => prev + 1);
    }, 1000);

    setState("recording");
  }, [mode, stopRecording]);

  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.pause();
      // Accumulate elapsed time for this segment
      accumulatedTimeRef.current += (Date.now() - recordingStartRef.current) / 1000;
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setState("paused");
    }
  }, []);

  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "paused") {
      mediaRecorderRef.current.resume();
      recordingStartRef.current = Date.now();
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
      setState("recording");
    }
  }, []);

  const reset = useCallback(() => {
    if (recordedUrl) {
      URL.revokeObjectURL(recordedUrl);
    }
    setRecordedBlob(null);
    setRecordedUrl(null);
    setRecordingTime(0);
    setElapsedSeconds(0);
    accumulatedTimeRef.current = 0;
    setError(null);
    setState("idle");
    chunksRef.current = [];
  }, [recordedUrl]);

  const cleanup = useCallback(() => {
    stopAllStreams();
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (recordedUrl) {
      URL.revokeObjectURL(recordedUrl);
    }
  }, [stopAllStreams, recordedUrl]);

  // Sync streams to video elements when state/mode changes
  useEffect(() => {
    if (state === "previewing" || state === "recording" || state === "paused") {
      if (mode === "webcam" && webcamStreamRef.current && previewVideoRef.current) {
        previewVideoRef.current.srcObject = webcamStreamRef.current;
      } else if (mode === "screen" && screenStreamRef.current && previewVideoRef.current) {
        previewVideoRef.current.srcObject = screenStreamRef.current;
      } else if (mode === "screen-webcam") {
        if (screenStreamRef.current && previewVideoRef.current) {
          previewVideoRef.current.srcObject = screenStreamRef.current;
        }
        if (webcamStreamRef.current && pipVideoRef.current) {
          pipVideoRef.current.srcObject = webcamStreamRef.current;
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

  return {
    // State
    mode,
    state,
    recordingTime,
    elapsedSeconds,
    recordedBlob,
    recordedUrl,
    error,

    // Refs for DOM attachment
    previewVideoRef,
    pipVideoRef,
    compositingCanvasRef,

    // Actions
    setMode,
    startPreview,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    reset,
    cleanup,
  };
}
