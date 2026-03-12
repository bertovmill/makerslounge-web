import type { DictationAdapter } from "@assistant-ui/react";

type Unsubscribe = () => void;

/**
 * A DictationAdapter that records audio via MediaRecorder,
 * sends it to the Deepgram transcription API route, and
 * returns the transcribed text.
 */
export class DeepgramDictationAdapter implements DictationAdapter {
  disableInputDuringDictation = false;

  listen(): DictationAdapter.Session {
    const speechStartCallbacks = new Set<() => void>();
    const speechEndCallbacks = new Set<
      (result: DictationAdapter.Result) => void
    >();
    const speechCallbacks = new Set<
      (result: DictationAdapter.Result) => void
    >();

    let mediaRecorder: MediaRecorder | null = null;
    let stream: MediaStream | null = null;
    const audioChunks: Blob[] = [];

    const session: DictationAdapter.Session = {
      status: { type: "starting" },

      stop: async () => {
        if (mediaRecorder?.state === "recording") {
          mediaRecorder.stop();
          // Wait for the onstop handler to finish processing
          await new Promise<void>((resolve) => {
            const check = () => {
              if (session.status.type === "ended") {
                resolve();
              } else {
                setTimeout(check, 50);
              }
            };
            check();
          });
        }
      },

      cancel: () => {
        stream?.getTracks().forEach((t) => t.stop());
        if (mediaRecorder?.state === "recording") {
          mediaRecorder.stop();
        }
        session.status = { type: "ended", reason: "cancelled" };
      },

      onSpeechStart: (callback: () => void): Unsubscribe => {
        speechStartCallbacks.add(callback);
        return () => speechStartCallbacks.delete(callback);
      },

      onSpeechEnd: (
        callback: (result: DictationAdapter.Result) => void,
      ): Unsubscribe => {
        speechEndCallbacks.add(callback);
        return () => speechEndCallbacks.delete(callback);
      },

      onSpeech: (
        callback: (result: DictationAdapter.Result) => void,
      ): Unsubscribe => {
        speechCallbacks.add(callback);
        return () => speechCallbacks.delete(callback);
      },
    };

    // Start recording asynchronously
    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });

        const mimeType = MediaRecorder.isTypeSupported(
          "audio/webm;codecs=opus",
        )
          ? "audio/webm;codecs=opus"
          : "audio/webm";

        mediaRecorder = new MediaRecorder(stream, { mimeType });

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunks.push(event.data);
          }
        };

        mediaRecorder.onstart = () => {
          session.status = { type: "running" };
          speechStartCallbacks.forEach((cb) => cb());
        };

        mediaRecorder.onstop = async () => {
          stream?.getTracks().forEach((t) => t.stop());

          if (
            audioChunks.length === 0 ||
            session.status.type === "ended"
          ) {
            session.status = { type: "ended", reason: "stopped" };
            speechEndCallbacks.forEach((cb) =>
              cb({ transcript: "", isFinal: true }),
            );
            return;
          }

          // Show interim feedback
          speechCallbacks.forEach((cb) =>
            cb({ transcript: "Transcribing...", isFinal: false }),
          );

          try {
            const audioBlob = new Blob(audioChunks, { type: mimeType });
            const formData = new FormData();
            formData.append("audio", audioBlob, "recording.webm");

            const response = await fetch("/api/voice/transcribe", {
              method: "POST",
              body: formData,
            });

            if (!response.ok) {
              throw new Error("Transcription failed");
            }

            const data = await response.json();
            const transcript = data.text || "";

            // Send final result
            speechCallbacks.forEach((cb) =>
              cb({ transcript, isFinal: true }),
            );
            session.status = { type: "ended", reason: "stopped" };
            speechEndCallbacks.forEach((cb) =>
              cb({ transcript, isFinal: true }),
            );
          } catch (error) {
            console.error("Deepgram transcription error:", error);
            session.status = { type: "ended", reason: "error" };
            speechEndCallbacks.forEach((cb) =>
              cb({ transcript: "", isFinal: true }),
            );
          }
        };

        mediaRecorder.start(250);
      } catch (error) {
        console.error("Failed to start recording:", error);
        session.status = { type: "ended", reason: "error" };
      }
    })();

    return session;
  }
}
