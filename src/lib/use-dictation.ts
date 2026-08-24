"use client";

import { useCallback, useRef, useState } from "react";

/**
 * Push-to-talk dictation against `/api/voice/transcribe` (Deepgram).
 *
 * Replaces `DeepgramDictationAdapter`, which implemented assistant-ui's
 * `DictationAdapter` interface. The recording and upload logic is unchanged —
 * only the surface differs, because the composer is now an ai-elements
 * `PromptInput` with no adapter slot to plug into.
 */
export type DictationStatus = "idle" | "recording" | "transcribing";

export function useDictation(onTranscript: (text: string) => void) {
  const [status, setStatus] = useState<DictationStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const cancelledRef = useRef(false);
  // Held in a ref so the MediaRecorder callbacks below always call the latest
  // handler rather than the one captured when recording started.
  const onTranscriptRef = useRef(onTranscript);
  onTranscriptRef.current = onTranscript;

  const stopTracks = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  const start = useCallback(async () => {
    if (status !== "idle") return;
    setError(null);
    cancelledRef.current = false;

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      // Almost always a denied permission prompt, which is a user choice rather
      // than a failure worth shouting about.
      setError("Microphone access was blocked.");
      return;
    }

    streamRef.current = stream;
    const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
      ? "audio/webm;codecs=opus"
      : "audio/webm";

    const recorder = new MediaRecorder(stream, { mimeType });
    recorderRef.current = recorder;
    const chunks: Blob[] = [];

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunks.push(event.data);
    };

    recorder.onstart = () => setStatus("recording");

    recorder.onstop = async () => {
      stopTracks();
      recorderRef.current = null;

      if (cancelledRef.current || chunks.length === 0) {
        setStatus("idle");
        return;
      }

      setStatus("transcribing");
      try {
        const body = new FormData();
        body.append("audio", new Blob(chunks, { type: mimeType }), "recording.webm");

        const response = await fetch("/api/voice/transcribe", { method: "POST", body });
        if (!response.ok) throw new Error("Transcription failed");

        const data = (await response.json()) as { text?: string };
        if (data.text) onTranscriptRef.current(data.text);
      } catch (err) {
        console.error("[dictation] transcription failed:", err);
        setError("Could not transcribe that. Try again?");
      } finally {
        setStatus("idle");
      }
    };

    recorder.start(250);
  }, [status, stopTracks]);

  const stop = useCallback(() => {
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
  }, []);

  /** Discard the recording without transcribing it. */
  const cancel = useCallback(() => {
    cancelledRef.current = true;
    stop();
    stopTracks();
    setStatus("idle");
  }, [stop, stopTracks]);

  return { status, error, start, stop, cancel };
}
