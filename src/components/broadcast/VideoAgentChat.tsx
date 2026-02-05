"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import {
  parseVideoSuggestions,
  type VideoSuggestion,
} from "@/lib/parseVideoSuggestions";

interface Message {
  role: "user" | "assistant";
  content: string;
  suggestions?: VideoSuggestion[];
}

export interface BroadcastIdea {
  id: string;
  title: string;
  notes: string;
  status: string;
  channels: string[];
}

interface VideoAgentChatProps {
  onApplySuggestion: (suggestion: VideoSuggestion) => void;
  broadcastIdeas?: BroadcastIdea[];
}

const INITIAL_MESSAGE: Message = {
  role: "assistant",
  content:
    "Hey! I'm your video assistant. Tell me your video idea and I'll research it and suggest content.\n\nWhat's the idea for your video?",
};

function SuggestionCard({
  suggestion,
  onApply,
}: {
  suggestion: VideoSuggestion;
  onApply: () => void;
}) {
  return (
    <div className="mt-2 border border-gray-200 rounded-lg p-2.5 bg-gray-50 text-xs space-y-1.5">
      {suggestion.title && (
        <div>
          <span className="text-gray-400">Title: </span>
          <span className="text-gray-800 font-medium">{suggestion.title}</span>
        </div>
      )}
      {suggestion.caption && (
        <div>
          <span className="text-gray-400">Caption: </span>
          <span className="text-gray-700">{suggestion.caption}</span>
        </div>
      )}
      {(suggestion.backgroundColor || suggestion.accentColor) && (
        <div className="flex items-center gap-2">
          <span className="text-gray-400">Colors: </span>
          {suggestion.backgroundColor && (
            <span
              className="inline-block w-4 h-4 rounded border border-gray-300"
              style={{ backgroundColor: suggestion.backgroundColor }}
              title={`Background: ${suggestion.backgroundColor}`}
            />
          )}
          {suggestion.accentColor && (
            <span
              className="inline-block w-4 h-4 rounded border border-gray-300"
              style={{ backgroundColor: suggestion.accentColor }}
              title={`Accent: ${suggestion.accentColor}`}
            />
          )}
        </div>
      )}
      {suggestion.aspectRatio && (
        <div>
          <span className="text-gray-400">Ratio: </span>
          <span className="text-gray-700">{suggestion.aspectRatio}</span>
        </div>
      )}
      {suggestion.overlayPosition && (
        <div>
          <span className="text-gray-400">Position: </span>
          <span className="text-gray-700">{suggestion.overlayPosition}</span>
        </div>
      )}
      {suggestion.script && suggestion.script.length > 0 && (
        <div className="flex items-center gap-1.5">
          <span className="text-gray-400">Script: </span>
          <span className="text-gray-700">{suggestion.script.length} segment{suggestion.script.length !== 1 ? "s" : ""}</span>
          <span className="text-gray-400 text-[10px]">({suggestion.script.map(s => s.label).join(", ")})</span>
        </div>
      )}
      <button
        onClick={onApply}
        className="w-full mt-1 py-1.5 bg-primary text-white text-xs font-medium rounded-md hover:bg-primary/90 transition-colors"
      >
        Apply
      </button>
    </div>
  );
}

export function VideoAgentChat({ onApplySuggestion, broadcastIdeas }: VideoAgentChatProps) {
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [searchStatus, setSearchStatus] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const filteredIdeas = broadcastIdeas?.filter(
    (idea) => idea.status === "idea" || idea.status === "in_progress"
  ) ?? [];

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, streamingText, searchStatus]);

  const handleSend = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || isGenerating) return;

    const userMsg: Message = { role: "user", content: trimmed };
    const currentMessages = [...messages, userMsg];
    setMessages(currentMessages);
    setInput("");
    setIsGenerating(true);
    setStreamingText("");
    setSearchStatus(null);

    try {
      // Build API messages (exclude initial assistant greeting from API call)
      const apiMessages = currentMessages
        .filter((_, i) => i > 0) // skip initial greeting
        .map((m) => ({ role: m.role, content: m.content }));

      const response = await fetch("/api/video-agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: apiMessages, ideas: broadcastIdeas }),
      });

      if (!response.ok) throw new Error("Failed to generate");

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No reader");

      const decoder = new TextDecoder();
      let buffer = "";
      let responseText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6);

          try {
            const event = JSON.parse(jsonStr);

            switch (event.type) {
              case "text_delta":
                responseText += event.text;
                setStreamingText(responseText);
                break;
              case "search_status":
                setSearchStatus(event.text);
                break;
              case "done": {
                const { cleanText, suggestions } =
                  parseVideoSuggestions(responseText);
                setMessages((prev) => [
                  ...prev,
                  {
                    role: "assistant",
                    content: cleanText,
                    suggestions:
                      suggestions.length > 0 ? suggestions : undefined,
                  },
                ]);
                setStreamingText("");
                setSearchStatus(null);
                setIsGenerating(false);
                break;
              }
              case "error":
                throw new Error(event.text);
            }
          } catch (e) {
            if (e instanceof SyntaxError) continue;
            throw e;
          }
        }
      }

      // If stream ended without a done event
      if (isGenerating) {
        if (responseText) {
          const { cleanText, suggestions } =
            parseVideoSuggestions(responseText);
          setMessages((prev) => [
            ...prev,
            {
              role: "assistant",
              content: cleanText,
              suggestions:
                suggestions.length > 0 ? suggestions : undefined,
            },
          ]);
        }
        setStreamingText("");
        setSearchStatus(null);
        setIsGenerating(false);
      }
    } catch (error) {
      console.error("Video agent error:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, something went wrong. Please try again.",
        },
      ]);
      setStreamingText("");
      setSearchStatus(null);
      setIsGenerating(false);
    }
  }, [input, isGenerating, messages, broadcastIdeas]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  const handleIdeaClick = useCallback(
    (idea: BroadcastIdea) => {
      if (isGenerating) return;
      const text = `Create a video based on my idea: '${idea.title}'.${idea.notes ? ` Notes: ${idea.notes}` : ""}`;
      setInput(text);
      // Auto-send after a tick so input state is set
      setTimeout(() => {
        const userMsg: Message = { role: "user", content: text };
        const currentMessages = [...messages, userMsg];
        setMessages(currentMessages);
        setInput("");
        setIsGenerating(true);
        setStreamingText("");
        setSearchStatus(null);

        const apiMessages = currentMessages
          .filter((_, i) => i > 0)
          .map((m) => ({ role: m.role, content: m.content }));

        fetch("/api/video-agent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: apiMessages, ideas: broadcastIdeas }),
        })
          .then(async (response) => {
            if (!response.ok) throw new Error("Failed to generate");
            const reader = response.body?.getReader();
            if (!reader) throw new Error("No reader");

            const decoder = new TextDecoder();
            let buffer = "";
            let responseText = "";

            while (true) {
              const { done, value } = await reader.read();
              if (done) break;

              buffer += decoder.decode(value, { stream: true });
              const lines = buffer.split("\n\n");
              buffer = lines.pop() || "";

              for (const line of lines) {
                if (!line.startsWith("data: ")) continue;
                const jsonStr = line.slice(6);
                try {
                  const event = JSON.parse(jsonStr);
                  switch (event.type) {
                    case "text_delta":
                      responseText += event.text;
                      setStreamingText(responseText);
                      break;
                    case "search_status":
                      setSearchStatus(event.text);
                      break;
                    case "done": {
                      const { cleanText, suggestions } = parseVideoSuggestions(responseText);
                      setMessages((prev) => [
                        ...prev,
                        { role: "assistant", content: cleanText, suggestions: suggestions.length > 0 ? suggestions : undefined },
                      ]);
                      setStreamingText("");
                      setSearchStatus(null);
                      setIsGenerating(false);
                      return;
                    }
                    case "error":
                      throw new Error(event.text);
                  }
                } catch (e) {
                  if (e instanceof SyntaxError) continue;
                  throw e;
                }
              }
            }

            if (responseText) {
              const { cleanText, suggestions } = parseVideoSuggestions(responseText);
              setMessages((prev) => [
                ...prev,
                { role: "assistant", content: cleanText, suggestions: suggestions.length > 0 ? suggestions : undefined },
              ]);
            }
            setStreamingText("");
            setSearchStatus(null);
            setIsGenerating(false);
          })
          .catch((error) => {
            console.error("Video agent error:", error);
            setMessages((prev) => [
              ...prev,
              { role: "assistant", content: "Sorry, something went wrong. Please try again." },
            ]);
            setStreamingText("");
            setSearchStatus(null);
            setIsGenerating(false);
          });
      }, 0);
    },
    [isGenerating, messages, broadcastIdeas]
  );

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.map((msg, i) => (
          <div key={i}>
            {msg.role === "user" ? (
              <div className="flex justify-end">
                <div className="max-w-[85%] bg-primary text-white text-sm rounded-2xl rounded-br-sm px-3 py-2">
                  {msg.content}
                </div>
              </div>
            ) : (
              <div className="flex justify-start">
                <div className="max-w-[85%] bg-gray-100 text-gray-800 text-sm rounded-2xl rounded-bl-sm px-3 py-2">
                  <div className="prose prose-sm prose-neutral max-w-none prose-p:my-1.5 prose-ul:my-1.5 prose-ol:my-1.5 prose-li:my-0.5 prose-headings:my-2 prose-headings:text-sm prose-pre:bg-white prose-pre:border prose-pre:border-gray-200 prose-pre:text-xs prose-code:text-primary prose-code:bg-white/60 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-xs prose-code:before:content-none prose-code:after:content-none prose-strong:text-gray-900">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                  {msg.suggestions?.map((s, j) => (
                    <SuggestionCard
                      key={j}
                      suggestion={s}
                      onApply={() => onApplySuggestion(s)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Streaming / generating state */}
        {isGenerating && (
          <div className="flex justify-start">
            <div className="max-w-[85%] bg-gray-100 text-gray-800 text-sm rounded-2xl rounded-bl-sm px-3 py-2">
              {searchStatus && (
                <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1.5">
                  <svg
                    className="w-3 h-3 animate-spin"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  {searchStatus}
                </div>
              )}
              {streamingText ? (
                <div className="prose prose-sm prose-neutral max-w-none prose-p:my-1.5 prose-ul:my-1.5 prose-ol:my-1.5 prose-li:my-0.5 prose-headings:my-2 prose-headings:text-sm prose-pre:bg-white prose-pre:border prose-pre:border-gray-200 prose-pre:text-xs prose-code:text-primary prose-code:bg-white/60 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-xs prose-code:before:content-none prose-code:after:content-none prose-strong:text-gray-900">
                  <ReactMarkdown>{streamingText}</ReactMarkdown>
                  <span className="inline-block w-1 h-3.5 bg-primary/60 animate-pulse ml-0.5 align-middle" />
                </div>
              ) : !searchStatus ? (
                <div className="flex items-center gap-1">
                  <div
                    className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0ms" }}
                  />
                  <div
                    className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: "150ms" }}
                  />
                  <div
                    className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: "300ms" }}
                  />
                </div>
              ) : null}
            </div>
          </div>
        )}
      </div>

      {/* Broadcast Ideas Quick-Select */}
      {filteredIdeas.length > 0 && (
        <div className="border-t border-gray-200 px-2 pt-2 pb-1">
          <div className="text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-1.5 px-0.5">Your Ideas</div>
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {filteredIdeas.map((idea) => (
              <button
                key={idea.id}
                onClick={() => handleIdeaClick(idea)}
                disabled={isGenerating}
                className="flex-shrink-0 flex items-start gap-1.5 px-2.5 py-1.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg text-left transition-colors disabled:opacity-50 disabled:cursor-not-allowed max-w-[160px]"
              >
                <span
                  className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${
                    idea.status === "in_progress" ? "bg-yellow-400" : "bg-blue-400"
                  }`}
                />
                <span className="text-xs text-gray-700 leading-tight line-clamp-2">
                  {idea.title.length > 30 ? idea.title.slice(0, 30) + "..." : idea.title}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="border-t border-gray-200 p-2">
        <div className="flex items-end gap-1.5">
          <textarea
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              e.target.style.height = "auto";
              e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
            }}
            onKeyDown={handleKeyDown}
            placeholder="Describe your video idea..."
            disabled={isGenerating}
            rows={1}
            className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-gray-300 focus:ring-1 focus:ring-gray-200 disabled:opacity-50 resize-none overflow-y-auto"
          />
          <button
            onClick={handleSend}
            disabled={isGenerating || !input.trim()}
            className="p-2 rounded-lg bg-primary text-white hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
