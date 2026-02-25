"use client";

import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ToolEvent {
  type: "tool_call" | "tool_result";
  name: string;
  language?: string;
  code?: string;
  output?: string;
  timestamp: Date;
}

const QUICK_STARTERS = [
  { label: "Solo project", icon: "1", description: "Just me", groupSize: "1" },
  { label: "Pair project", icon: "2", description: "Group of 2", groupSize: "2" },
  { label: "Small team", icon: "3", description: "Group of 3-4", groupSize: "3-4" },
  { label: "Hackathon team", icon: "H", description: "5+ people, time-boxed", groupSize: "5+" },
];

export default function FindIdeaPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [toolEvents, setToolEvents] = useState<ToolEvent[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, toolEvents]);

  useEffect(() => {
    if (!isLoading && hasStarted) {
      inputRef.current?.focus();
    }
  }, [isLoading, hasStarted]);

  const sendMessage = async (userMessage: string, allMessages: Message[]) => {
    setIsLoading(true);
    setToolEvents([]);

    const newMessages: Message[] = [...allMessages, { role: "user", content: userMessage }];
    setMessages(newMessages);

    try {
      const response = await fetch("/api/agents/find-idea", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages }),
      });

      if (!response.ok) {
        const error = await response.json();
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: `Sorry, something went wrong: ${error.error || "Unknown error"}` },
        ]);
        setIsLoading(false);
        return;
      }

      const reader = response.body?.getReader();
      if (!reader) {
        setIsLoading(false);
        return;
      }

      const decoder = new TextDecoder();
      let buffer = "";
      let assistantContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        let currentEvent = "";
        for (const line of lines) {
          if (line.startsWith("event: ")) {
            currentEvent = line.slice(7);
          } else if (line.startsWith("data: ") && currentEvent) {
            try {
              const data = JSON.parse(line.slice(6));

              switch (currentEvent) {
                case "message":
                  assistantContent = data.content;
                  setMessages((prev) => {
                    const updated = [...prev];
                    // Replace or add assistant message
                    if (updated[updated.length - 1]?.role === "assistant") {
                      updated[updated.length - 1] = { role: "assistant", content: assistantContent };
                    } else {
                      updated.push({ role: "assistant", content: assistantContent });
                    }
                    return updated;
                  });
                  break;

                case "text":
                  // Partial text alongside tool use
                  assistantContent += data.content;
                  break;

                case "tool_call":
                  setToolEvents((prev) => [
                    ...prev,
                    { type: "tool_call", ...data, timestamp: new Date() },
                  ]);
                  break;

                case "tool_result":
                  setToolEvents((prev) => [
                    ...prev,
                    { type: "tool_result", ...data, timestamp: new Date() },
                  ]);
                  break;

                case "error":
                  setMessages((prev) => [
                    ...prev,
                    { role: "assistant", content: `Error: ${data.error}` },
                  ]);
                  break;
              }
            } catch {
              // Invalid JSON, skip
            }
            currentEvent = "";
          }
        }
      }
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `Connection error: ${error instanceof Error ? error.message : "Unknown error"}`,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickStart = (groupSize: string, description: string) => {
    setHasStarted(true);
    const message = `I'm working in a ${description.toLowerCase()}. Help me find a project idea!`;
    sendMessage(message, []);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    const msg = input.trim();
    setInput("");
    sendMessage(msg, messages);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleReset = () => {
    setMessages([]);
    setToolEvents([]);
    setHasStarted(false);
    setInput("");
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <div className="border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/agents"
              className="p-1.5 rounded-md hover:bg-accent transition-colors text-muted-foreground"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <div>
              <h1 className="text-lg font-semibold flex items-center gap-2">
                Find an Idea
                <span className="px-2 py-0.5 text-[10px] font-medium bg-primary/10 text-primary rounded-full">
                  AI Agent
                </span>
              </h1>
              <p className="text-xs text-muted-foreground">
                Discover project ideas tailored to your team
              </p>
            </div>
          </div>
          {hasStarted && (
            <Button variant="ghost" size="sm" onClick={handleReset}>
              Start over
            </Button>
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 max-w-3xl mx-auto w-full px-4">
        {!hasStarted ? (
          /* Quick Start Screen */
          <div className="flex flex-col items-center justify-center min-h-[60vh] py-12">
            <div className="text-center mb-10">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold mb-2">What are you building?</h2>
              <p className="text-muted-foreground max-w-md">
                Tell me about your team and I&apos;ll help you find the perfect project idea.
                I can even test APIs and validate concepts in a sandbox.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 w-full max-w-md mb-8">
              {QUICK_STARTERS.map((starter) => (
                <button
                  key={starter.groupSize}
                  onClick={() => handleQuickStart(starter.groupSize, starter.description)}
                  className="group p-4 rounded-xl border border-border hover:border-primary/50 hover:bg-accent/50 transition-all duration-200 text-left"
                >
                  <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary font-bold text-lg flex items-center justify-center mb-3 group-hover:bg-primary/20 transition-colors">
                    {starter.icon}
                  </div>
                  <div className="font-medium text-sm">{starter.label}</div>
                  <div className="text-xs text-muted-foreground">{starter.description}</div>
                </button>
              ))}
            </div>

            <div className="w-full max-w-md">
              <form onSubmit={(e) => { e.preventDefault(); if (!input.trim()) return; setHasStarted(true); sendMessage(input.trim(), []); setInput(""); }} className="relative">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Or describe your situation..."
                  rows={2}
                  className="w-full px-4 py-3 pr-12 rounded-xl border border-border bg-background resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 text-sm"
                />
                <button
                  type="submit"
                  disabled={!input.trim()}
                  className="absolute right-3 bottom-3 p-1.5 rounded-lg bg-primary text-primary-foreground disabled:opacity-30 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19V5m0 0l-7 7m7-7l7 7" />
                  </svg>
                </button>
              </form>
            </div>
          </div>
        ) : (
          /* Chat Interface */
          <div className="py-6 space-y-6 pb-32">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={cn(
                  "flex gap-3",
                  msg.role === "user" ? "justify-end" : "justify-start"
                )}
              >
                {msg.role === "assistant" && (
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                )}
                <div
                  className={cn(
                    "max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground rounded-br-md"
                      : "bg-muted/60 rounded-bl-md"
                  )}
                >
                  <div className="whitespace-pre-wrap">{msg.content}</div>
                </div>
              </div>
            ))}

            {/* Tool events */}
            {toolEvents.length > 0 && (
              <Card className="p-4 border-dashed bg-muted/20">
                <div className="flex items-center gap-2 mb-3 text-xs font-medium text-muted-foreground">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                  </svg>
                  Sandbox Activity
                </div>
                <div className="space-y-2">
                  {toolEvents.map((event, i) => (
                    <div key={i} className="text-xs">
                      {event.type === "tool_call" ? (
                        <div className="flex items-start gap-2">
                          <span className="px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-600 font-mono text-[10px]">
                            RUN
                          </span>
                          <div className="flex-1 min-w-0">
                            <span className="text-muted-foreground">{event.language}</span>
                            {event.code && (
                              <pre className="mt-1 p-2 rounded bg-background/80 overflow-x-auto text-[11px] font-mono">
                                {event.code}
                              </pre>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start gap-2">
                          <span className="px-1.5 py-0.5 rounded bg-green-500/10 text-green-600 font-mono text-[10px]">
                            OUT
                          </span>
                          <pre className="flex-1 p-2 rounded bg-background/80 overflow-x-auto text-[11px] font-mono whitespace-pre-wrap">
                            {event.output}
                          </pre>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Loading indicator */}
            {isLoading && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-primary animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <div className="bg-muted/60 rounded-2xl rounded-bl-md px-4 py-3">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce [animation-delay:-0.3s]" />
                    <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce [animation-delay:-0.15s]" />
                    <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input bar (shown when chat is active) */}
      {hasStarted && (
        <div className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-md border-t border-border z-10">
          <div className="max-w-3xl mx-auto px-4 py-3">
            <form onSubmit={handleSubmit} className="relative">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Tell me more about what you're interested in..."
                rows={1}
                disabled={isLoading}
                className="w-full px-4 py-3 pr-12 rounded-xl border border-border bg-background resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 text-sm disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg bg-primary text-primary-foreground disabled:opacity-30 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19V5m0 0l-7 7m7-7l7 7" />
                </svg>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
