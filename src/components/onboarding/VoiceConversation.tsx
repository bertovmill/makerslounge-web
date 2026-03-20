"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Mic, MicOff, Send, Loader2 } from "lucide-react";
import type { ProfileData } from "./ProfilePreview";

interface Message {
  role: "assistant" | "user";
  content: string;
}

interface VoiceConversationProps {
  onComplete: (data: ProfileData) => void;
  onBack: () => void;
}

export default function VoiceConversation({ onComplete, onBack }: VoiceConversationProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [textInput, setTextInput] = useState("");
  const [showTextInput, setShowTextInput] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  const sendToAI = useCallback(async (userText: string) => {
    const userMessage: Message = { role: "user", content: userText };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setIsProcessing(true);

    try {
      const res = await fetch("/api/onboarding/voice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedMessages.map(m => ({ role: m.role, content: m.content })),
        }),
      });

      if (!res.ok) throw new Error("Failed to get AI response");
      const data = await res.json();

      setMessages(prev => [...prev, { role: "assistant", content: data.reply }]);

      // Play TTS
      playTTS(data.reply);

      if (data.isComplete && data.extractedProfile) {
        // Short delay to let user hear the final message
        setTimeout(() => onComplete(data.extractedProfile), 3000);
      }
    } catch (error) {
      console.error("Voice conversation error:", error);
      setMessages(prev => [...prev, { role: "assistant", content: "Sorry, something went wrong. Could you try again?" }]);
    } finally {
      setIsProcessing(false);
    }
  }, [messages, onComplete]);

  // Start conversation with AI greeting
  useEffect(() => {
    const startConversation = async () => {
      setIsProcessing(true);
      try {
        const res = await fetch("/api/onboarding/voice", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: [] }),
        });
        if (!res.ok) throw new Error("Failed to start conversation");
        const data = await res.json();
        setMessages([{ role: "assistant", content: data.reply }]);
        playTTS(data.reply);
      } catch {
        setMessages([{ role: "assistant", content: "Hey! I'm here to help set up your profile. What's your name and what are you working on?" }]);
      } finally {
        setIsProcessing(false);
      }
    };
    startConversation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const playTTS = async (text: string) => {
    try {
      const res = await fetch("/api/tts/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, voice_id: "21m00Tcm4TlvDq8ikWAM" }), // Rachel voice
      });
      if (!res.ok) return;
      const audioBuffer = await res.arrayBuffer();
      const audioBlob = new Blob([audioBuffer], { type: "audio/mpeg" });
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      audio.play().catch(() => {}); // Autoplay may be blocked
    } catch {
      // TTS is optional, fail silently
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm";

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      // Set up silence detection
      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 512;
      source.connect(analyser);
      analyserRef.current = analyser;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      let silenceStart: number | null = null;

      const checkSilence = () => {
        if (!mediaRecorderRef.current || mediaRecorderRef.current.state !== "recording") return;
        analyser.getByteFrequencyData(dataArray);
        const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;

        if (avg < 10) {
          if (!silenceStart) silenceStart = Date.now();
          else if (Date.now() - silenceStart > 2000) {
            stopRecording();
            return;
          }
        } else {
          silenceStart = null;
        }

        silenceTimerRef.current = setTimeout(checkSilence, 100);
      };

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        audioContext.close();
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);

        if (audioChunksRef.current.length === 0) return;

        setIsProcessing(true);
        try {
          const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
          const formData = new FormData();
          formData.append("audio", audioBlob, "recording.webm");

          const res = await fetch("/api/voice/transcribe", { method: "POST", body: formData });
          if (!res.ok) throw new Error("Transcription failed");
          const { text } = await res.json();

          if (text?.trim()) {
            await sendToAI(text.trim());
          }
        } catch (error) {
          console.error("Recording error:", error);
        } finally {
          setIsProcessing(false);
        }
      };

      mediaRecorder.start(250);
      setIsRecording(true);
      checkSilence();
    } catch (error) {
      console.error("Failed to start recording:", error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  const handleTextSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim() || isProcessing) return;
    const text = textInput.trim();
    setTextInput("");
    await sendToAI(text);
  };

  return (
    <div className="min-h-svh flex flex-col">
      {/* Header */}
      <div className="px-4 pt-6 pb-4">
        <button
          onClick={onBack}
          className="text-sm text-muted-foreground hover:text-foreground mb-4 block"
        >
          &larr; Back to options
        </button>
        <h1 className="text-lg font-semibold tracking-tight">Let&apos;s chat</h1>
        <p className="text-xs text-muted-foreground">Tell me about yourself and I&apos;ll build your profile</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-3">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                msg.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground"
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
        {isProcessing && (
          <div className="flex justify-start">
            <div className="bg-secondary rounded-2xl px-4 py-2.5">
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="border-t border-border px-4 py-4 space-y-3">
        {/* Mic button */}
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={isRecording ? stopRecording : startRecording}
            disabled={isProcessing}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
              isRecording
                ? "bg-destructive text-white animate-pulse"
                : "bg-primary text-primary-foreground hover:opacity-90"
            } disabled:opacity-50`}
          >
            {isRecording ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
          </button>
        </div>

        <p className="text-center text-xs text-muted-foreground">
          {isRecording ? "Listening... (stops after 2s silence)" : "Tap to speak"}
        </p>

        {/* Text fallback */}
        {!showTextInput ? (
          <button
            onClick={() => setShowTextInput(true)}
            className="block mx-auto text-xs text-muted-foreground hover:text-foreground underline"
          >
            Prefer to type?
          </button>
        ) : (
          <form onSubmit={handleTextSubmit} className="flex gap-2">
            <input
              type="text"
              value={textInput}
              onChange={e => setTextInput(e.target.value)}
              placeholder="Type your response..."
              className="flex-1 h-10 px-3 rounded-md border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring"
              disabled={isProcessing}
            />
            <button
              type="submit"
              disabled={!textInput.trim() || isProcessing}
              className="h-10 w-10 rounded-md bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
