"use client";

import { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface Hook {
  style: string;
  text: string;
  visual: string;
  why: string;
}

export default function HookGeneratorPage() {
  const [topic, setTopic] = useState("");
  const [videoType, setVideoType] = useState("tutorial");
  const [hooks, setHooks] = useState<Hook[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const generateHooks = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim() || loading) return;

    setLoading(true);
    setError("");
    setHooks([]);

    try {
      const response = await fetch("/api/hook-generator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: topic.trim(), videoType }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate hooks");
      }

      setHooks(data.hooks || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string, index: number) => {
    await navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const styleColors: Record<string, string> = {
    "Curiosity Gap": "from-purple-500 to-indigo-500",
    "Problem/Solution": "from-orange-500 to-red-500",
    "Bold Claim": "from-yellow-500 to-orange-500",
    "Story Hook": "from-green-500 to-teal-500",
    "Direct Value": "from-blue-500 to-cyan-500",
  };

  return (
    <div className="min-h-screen">
      <main className="max-w-4xl mx-auto px-4 sm:px-8 py-12">
        <div className="space-y-8">
          {/* Back link */}
          <Link
            href="/video-editing"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Video Editing
          </Link>

          {/* Header */}
          <div className="space-y-3 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 text-white mb-4">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-8 h-8">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
            <h1 className="text-4xl font-bold tracking-tight">Hook Generator</h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Generate attention-grabbing video hooks that keep viewers watching
            </p>
          </div>

          {/* Input Form */}
          <form onSubmit={generateHooks} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="topic" className="text-sm font-medium">
                What&apos;s your video about?
              </label>
              <input
                id="topic"
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g., How to build a Chrome extension, Setting up a home workshop..."
                className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="videoType" className="text-sm font-medium">
                Video type
              </label>
              <select
                id="videoType"
                value={videoType}
                onChange={(e) => setVideoType(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                disabled={loading}
              >
                <option value="tutorial">Tutorial</option>
                <option value="how-to guide">How-to Guide</option>
                <option value="product demo">Product Demo</option>
                <option value="explainer">Explainer</option>
                <option value="vlog">Vlog</option>
                <option value="review">Review</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={!topic.trim() || loading}
              className="w-full px-6 py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Generating hooks...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Generate Hooks
                </>
              )}
            </button>
          </form>

          {/* Error */}
          {error && (
            <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-600">
              {error}
            </div>
          )}

          {/* Results */}
          {hooks.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Your Hooks</h2>
              <div className="space-y-4">
                {hooks.map((hook, index) => (
                  <div
                    key={index}
                    className="group relative overflow-hidden rounded-xl border border-border bg-card p-6 transition-all duration-300 hover:shadow-lg"
                  >
                    {/* Style badge */}
                    <div className="flex items-center justify-between mb-4">
                      <span
                        className={cn(
                          "inline-flex px-3 py-1 rounded-full text-xs font-medium text-white bg-gradient-to-r",
                          styleColors[hook.style] || "from-gray-500 to-gray-600"
                        )}
                      >
                        {hook.style}
                      </span>
                      <button
                        onClick={() => copyToClipboard(hook.text, index)}
                        className="text-muted-foreground hover:text-foreground transition-colors"
                        title="Copy hook"
                      >
                        {copiedIndex === index ? (
                          <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        )}
                      </button>
                    </div>

                    {/* Hook text */}
                    <p className="text-lg font-medium mb-4 leading-relaxed">
                      &ldquo;{hook.text}&rdquo;
                    </p>

                    {/* Visual suggestion */}
                    <div className="flex items-start gap-2 text-sm text-muted-foreground mb-2">
                      <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      <span><strong>Visual:</strong> {hook.visual}</span>
                    </div>

                    {/* Why it works */}
                    <div className="flex items-start gap-2 text-sm text-muted-foreground">
                      <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                      <span><strong>Why it works:</strong> {hook.why}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tips section */}
          <div className="glass-card rounded-xl p-6">
            <h3 className="font-semibold mb-3">Tips for great hooks</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary">1.</span>
                <span>Deliver the hook in the first 3-5 seconds - viewers decide fast</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">2.</span>
                <span>Match your energy to the hook style - bold claims need confident delivery</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">3.</span>
                <span>Test different hooks on the same video topic to see what resonates</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">4.</span>
                <span>The visual should reinforce the hook, not distract from it</span>
              </li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}
