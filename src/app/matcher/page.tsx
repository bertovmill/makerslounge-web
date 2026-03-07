"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowUp, Sparkles, RotateCcw } from "lucide-react";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const SUGGESTIONS = [
  "I need a technical co-founder for my startup",
  "Who has design skills in the community?",
  "I'm looking for someone to collaborate on an AI project",
  "Who should I talk to about marketing?",
];

export default function MatcherPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 120)}px`;
    }
  }, [input]);

  const sendMessage = async (text?: string) => {
    const messageText = text || input.trim();
    if (!messageText || isStreaming) return;

    const userMessage: ChatMessage = { role: "user", content: messageText };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setIsStreaming(true);

    // Add placeholder assistant message
    setMessages([...newMessages, { role: "assistant", content: "" }]);

    try {
      const response = await fetch("/api/matcher-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response");
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No stream");

      const decoder = new TextDecoder();
      let buffer = "";
      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") break;
            try {
              const parsed = JSON.parse(data);
              if (parsed.text) {
                fullText += parsed.text;
                setMessages((prev) => [
                  ...prev.slice(0, -1),
                  { role: "assistant", content: fullText },
                ]);
              }
            } catch {
              // skip parse errors
            }
          }
        }
      }
    } catch (err) {
      console.error("Chat error:", err);
      setMessages((prev) => [
        ...prev.slice(0, -1),
        {
          role: "assistant",
          content: "Sorry, something went wrong. Please try again.",
        },
      ]);
    } finally {
      setIsStreaming(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const resetChat = () => {
    setMessages([]);
    setInput("");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex-1 max-w-2xl mx-auto w-full px-4 flex flex-col">
        {/* Messages or empty state */}
        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center py-12">
            <div className="w-12 h-12 rounded-2xl bg-foreground/5 flex items-center justify-center mb-6">
              <Sparkles className="w-6 h-6 text-foreground/40" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight mb-2">
              Find Your Match
            </h1>
            <p className="text-muted-foreground text-center max-w-md mb-8">
              Describe what you&apos;re looking for and I&apos;ll connect you
              with the right people in the community.
            </p>

            {/* Suggestion chips */}
            <div className="flex flex-wrap gap-2 justify-center max-w-lg">
              {SUGGESTIONS.map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => sendMessage(suggestion)}
                  className="px-4 py-2 text-sm border border-border rounded-full hover:bg-muted/50 transition-colors text-muted-foreground hover:text-foreground"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto py-6 space-y-6">
            {/* Reset button */}
            <div className="flex justify-end">
              <button
                onClick={resetChat}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                New chat
              </button>
            </div>

            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] ${
                    msg.role === "user"
                      ? "bg-foreground text-background rounded-2xl rounded-br-md px-4 py-3"
                      : "text-foreground"
                  }`}
                >
                  {msg.role === "assistant" ? (
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      {msg.content ? (
                        <AssistantMessage content={msg.content} />
                      ) : (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <div className="flex gap-1">
                            <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce [animation-delay:0ms]" />
                            <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce [animation-delay:150ms]" />
                            <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce [animation-delay:300ms]" />
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}

        {/* Input area */}
        <div className="sticky bottom-0 pb-6 pt-2 bg-background">
          <div className="flex items-end gap-2 border border-border rounded-2xl px-4 py-3 focus-within:border-foreground/30 transition-colors">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="What are you looking for?"
              rows={1}
              className="flex-1 bg-transparent resize-none text-sm focus:outline-none placeholder:text-muted-foreground/60"
              disabled={isStreaming}
            />
            <Button
              size="icon"
              onClick={() => sendMessage()}
              disabled={!input.trim() || isStreaming}
              className="h-8 w-8 rounded-full shrink-0"
            >
              <ArrowUp className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-[11px] text-muted-foreground/50 text-center mt-2">
            AI matches are based on community profiles and may not be perfect.
          </p>
        </div>
      </div>
    </div>
  );
}

// Simple markdown-like rendering for assistant messages
function AssistantMessage({ content }: { content: string }) {
  // Split into paragraphs and render with basic formatting
  const parts = content.split("\n");

  return (
    <>
      {parts.map((line, i) => {
        if (!line.trim()) return <br key={i} />;

        // Render bold text and links
        const formatted = line
          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
          .replace(/@(\w+)/g, '<a href="/p/$1" class="text-foreground underline underline-offset-2 hover:opacity-70 font-medium">@$1</a>');

        return (
          <p
            key={i}
            className="text-sm leading-relaxed mb-1"
            dangerouslySetInnerHTML={{ __html: formatted }}
          />
        );
      })}
    </>
  );
}
