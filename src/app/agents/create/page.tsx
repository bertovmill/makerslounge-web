"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { User } from "@supabase/supabase-js";

interface Message {
  role: "user" | "assistant";
  content: string;
  thinking?: string;
}

function ThinkingBlock({ thinking }: { thinking: string }) {
  const [isOpen, setIsOpen] = useState(false);

  if (!thinking) return null;

  return (
    <button
      onClick={() => setIsOpen(!isOpen)}
      className="w-full text-left mb-2"
    >
      <div className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors">
        <svg
          className={`w-3 h-3 transition-transform duration-200 ${isOpen ? "rotate-90" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
        <span className="font-medium">Agent Thinking</span>
      </div>
      {isOpen && (
        <div className="mt-2 pl-5 border-l-2 border-primary/20 text-xs text-muted-foreground whitespace-pre-wrap max-h-48 overflow-y-auto">
          {thinking}
        </div>
      )}
    </button>
  );
}

function StreamingThinkingIndicator({ thinking }: { thinking: string }) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <button
      onClick={() => setIsOpen(!isOpen)}
      className="w-full text-left mb-2"
    >
      <div className="flex items-center gap-2 text-xs text-primary">
        <svg
          className={`w-3 h-3 transition-transform duration-200 ${isOpen ? "rotate-90" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        <svg className="w-3.5 h-3.5 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
        <span className="font-medium animate-pulse">Thinking...</span>
      </div>
      {isOpen && thinking && (
        <div className="mt-2 pl-5 border-l-2 border-primary/30 text-xs text-muted-foreground whitespace-pre-wrap max-h-48 overflow-y-auto">
          {thinking}
          <span className="inline-block w-1.5 h-3.5 bg-primary/50 animate-pulse ml-0.5 align-middle" />
        </div>
      )}
    </button>
  );
}

export default function CreateAgentPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: `Hey! I'm here to help you create a new AI agent for MakersLounge.

What kind of agent do you want to build? Some ideas:

**Content Agents** - Post tips, news, or inspiration to the community
**Research Agents** - Gather and summarize information on topics
**Assistant Agents** - Help with tasks like drafting, organizing, or answering questions
**Automation Agents** - Monitor things and take actions based on triggers

Tell me what you need help with and I'll design the perfect agent for you!`,
    },
  ]);
  const [input, setInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [streamingThinking, setStreamingThinking] = useState("");
  const [streamingText, setStreamingText] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (!user) {
        router.push("/auth");
        return;
      }

      setLoading(false);
    };

    checkAuth();
  }, [router]);

  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [messages, streamingText, streamingThinking]);

  const processStream = useCallback(async (currentMessages: Message[]) => {
    setIsGenerating(true);
    setStreamingThinking("");
    setStreamingText("");
    setIsThinking(false);
    setIsStreaming(false);

    let thinkingText = "";
    let responseText = "";

    try {
      const response = await fetch("/api/agent-builder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: currentMessages }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate");
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No reader");

      const decoder = new TextDecoder();
      let buffer = "";

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
              case "thinking_start":
                setIsThinking(true);
                break;
              case "thinking_delta":
                thinkingText += event.text;
                setStreamingThinking(thinkingText);
                break;
              case "text_start":
                setIsThinking(false);
                setIsStreaming(true);
                break;
              case "text_delta":
                responseText += event.text;
                setStreamingText(responseText);
                break;
              case "done":
                setMessages((prev) => [
                  ...prev,
                  {
                    role: "assistant",
                    content: responseText,
                    thinking: thinkingText || undefined,
                  },
                ]);
                setStreamingThinking("");
                setStreamingText("");
                setIsThinking(false);
                setIsStreaming(false);
                setIsGenerating(false);
                break;
              case "error":
                throw new Error(event.text);
            }
          } catch (e) {
            if (e instanceof SyntaxError) continue;
            throw e;
          }
        }
      }
    } catch (error) {
      console.error("Error:", error);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, something went wrong. Please try again." },
      ]);
      setStreamingThinking("");
      setStreamingText("");
      setIsThinking(false);
      setIsStreaming(false);
      setIsGenerating(false);
    }
  }, []);

  const handleSend = async () => {
    if (!input.trim() || isGenerating) return;

    const userMessage = input.trim();
    setInput("");

    const newMessages: Message[] = [...messages, { role: "user", content: userMessage }];
    setMessages(newMessages);

    await processStream(newMessages);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSuggestionClick = async (suggestion: string) => {
    if (isGenerating) return;

    const newMessages: Message[] = [...messages, { role: "user", content: suggestion }];
    setMessages(newMessages);
    setInput("");

    await processStream(newMessages);
  };

  const suggestions = [
    "Content agent for daily tips",
    "Research assistant for market trends",
    "Customer support helper",
    "Task automation agent",
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="h-[100dvh] flex flex-col overflow-hidden">
      {/* Header */}
      <div className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/agents"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <div>
              <h1 className="text-lg font-semibold flex items-center gap-2">
                Agent Builder
                <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary font-medium">
                  AI
                </span>
              </h1>
              <p className="text-sm text-muted-foreground">
                Describe your agent and I&apos;ll help you build it
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Messages */}
      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-6 py-6 space-y-6">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {message.role === "assistant" && (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-sm flex-shrink-0">
                  🤖
                </div>
              )}
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  message.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted/50 border border-border"
                }`}
              >
                {message.role === "user" ? (
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                ) : (
                  <>
                    {message.thinking && <ThinkingBlock thinking={message.thinking} />}
                    <div className="text-sm prose prose-sm prose-neutral dark:prose-invert max-w-none prose-p:my-2 prose-ul:my-2 prose-li:my-0.5 prose-headings:my-2 prose-pre:bg-muted prose-pre:border prose-pre:border-border prose-code:text-primary prose-code:bg-muted/50 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none">
                      <ReactMarkdown>{message.content}</ReactMarkdown>
                    </div>
                  </>
                )}
              </div>
              {message.role === "user" && (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-rose-400 to-orange-400 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                  {user?.email?.charAt(0).toUpperCase() || "?"}
                </div>
              )}
            </div>
          ))}

          {/* Suggestion chips - only show on initial message */}
          {messages.length === 1 && !isGenerating && (
            <div className="flex flex-wrap gap-2 ml-11">
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="px-4 py-2 text-sm rounded-full border border-border bg-background hover:bg-muted hover:border-primary/50 transition-all duration-200 text-muted-foreground hover:text-foreground"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}

          {/* Streaming response */}
          {isGenerating && (
            <div className="flex gap-3 justify-start">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-sm flex-shrink-0">
                🤖
              </div>
              <div className="max-w-[80%] bg-muted/50 border border-border rounded-2xl px-4 py-3">
                {/* Thinking phase */}
                {isThinking && (
                  <StreamingThinkingIndicator thinking={streamingThinking} />
                )}

                {/* Finished thinking, show collapsed */}
                {!isThinking && streamingThinking && (
                  <ThinkingBlock thinking={streamingThinking} />
                )}

                {/* Streaming text */}
                {isStreaming && streamingText ? (
                  <div className="text-sm prose prose-sm prose-neutral dark:prose-invert max-w-none prose-p:my-2 prose-ul:my-2 prose-li:my-0.5 prose-headings:my-2 prose-pre:bg-muted prose-pre:border prose-pre:border-border prose-code:text-primary prose-code:bg-muted/50 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none">
                    <ReactMarkdown>{streamingText}</ReactMarkdown>
                    <span className="inline-block w-1.5 h-4 bg-primary/60 animate-pulse ml-0.5 align-middle" />
                  </div>
                ) : !isStreaming && !streamingText && isThinking ? null : !streamingText ? (
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                ) : null}
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="border-t border-border bg-background/80 backdrop-blur-sm sticky bottom-0 pb-16 md:pb-0">
        <div className="max-w-3xl mx-auto px-6 py-4">
          <div className="flex gap-3">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Describe your agent idea..."
              rows={1}
              className="flex-1 px-4 py-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none text-sm"
              style={{ minHeight: "48px", maxHeight: "120px" }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = "auto";
                target.style.height = Math.min(target.scrollHeight, 120) + "px";
              }}
            />
            <Button
              onClick={handleSend}
              disabled={!input.trim() || isGenerating}
              className="rounded-xl px-4"
            >
              {isGenerating ? (
                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            Press Enter to send, Shift+Enter for new line
          </p>
        </div>
      </div>
    </div>
  );
}
