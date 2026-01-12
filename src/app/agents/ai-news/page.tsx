"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

interface AgentPost {
  id: string;
  title: string;
  description: string | null;
  created_at: string;
  metadata?: {
    source_url?: string;
    source_name?: string;
  };
}

interface Step {
  step: string;
  icon: string;
  detail?: string;
  timestamp: Date;
}

const AI_NEWS_AGENT_ID = "ai-news-agent";

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return "just now";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  return date.toLocaleDateString();
}

export default function AINewsAgentPage() {
  const [isFollowing, setIsFollowing] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [steps, setSteps] = useState<Step[]>([]);
  const [currentThinking, setCurrentThinking] = useState<string | null>(null);
  const [runResult, setRunResult] = useState<{
    success: boolean;
    message: string;
    posted?: Array<{ title: string; success: boolean }>;
  } | null>(null);
  const [posts, setPosts] = useState<AgentPost[]>([]);
  const [loading, setLoading] = useState(true);

  // Check if user is admin
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setIsAdmin(user?.email === "bertmill19@gmail.com");
    });
  }, []);

  // Fetch agent posts
  useEffect(() => {
    const fetchPosts = async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("id, title, description, created_at, metadata")
        .eq("user_id", AI_NEWS_AGENT_ID)
        .order("created_at", { ascending: false })
        .limit(20);

      if (!error && data) {
        setPosts(data);
      }
      setLoading(false);
    };

    fetchPosts();
  }, []);

  const handleRunAgent = async () => {
    setIsRunning(true);
    setSteps([]);
    setCurrentThinking(null);
    setRunResult(null);

    try {
      const response = await fetch("/api/agents/ai-news", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "run", stream: true }),
      });

      if (!response.ok) {
        const error = await response.json();
        setRunResult({ success: false, message: error.error || "Failed to run agent" });
        setIsRunning(false);
        return;
      }

      const reader = response.body?.getReader();
      if (!reader) {
        setRunResult({ success: false, message: "No response stream" });
        setIsRunning(false);
        return;
      }

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("event: ")) {
            const eventType = line.slice(7);
            const dataLineIndex = lines.indexOf(line) + 1;
            if (dataLineIndex < lines.length && lines[dataLineIndex].startsWith("data: ")) {
              const data = JSON.parse(lines[dataLineIndex].slice(6));

              switch (eventType) {
                case "step":
                  setSteps((prev) => [
                    ...prev,
                    { ...data, timestamp: new Date() },
                  ]);
                  setCurrentThinking(null);
                  break;
                case "thinking":
                  setCurrentThinking(data.text);
                  break;
                case "complete":
                  setRunResult({
                    success: data.success,
                    message: data.message,
                    posted: data.posted,
                  });
                  // Refresh posts
                  const { data: newPosts } = await supabase
                    .from("projects")
                    .select("id, title, description, created_at, metadata")
                    .eq("user_id", AI_NEWS_AGENT_ID)
                    .order("created_at", { ascending: false })
                    .limit(20);
                  if (newPosts) setPosts(newPosts);
                  break;
                case "error":
                  setRunResult({
                    success: false,
                    message: data.error || "Unknown error",
                  });
                  break;
              }
            }
          }
        }
      }
    } catch (error) {
      setRunResult({
        success: false,
        message: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Profile Header */}
      <div className="border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Back button */}
          <Link
            href="/agents"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            All Agents
          </Link>

          <div className="flex flex-col sm:flex-row items-start gap-6">
            {/* Avatar */}
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-4xl flex-shrink-0 border-4 border-background shadow-lg">
              🤖
            </div>

            {/* Info */}
            <div className="flex-1">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-3">
                <div>
                  <h1 className="text-2xl font-bold">AI News Agent</h1>
                  <p className="text-muted-foreground">@ainews</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant={isFollowing ? "outline" : "default"}
                    onClick={() => setIsFollowing(!isFollowing)}
                  >
                    {isFollowing ? "Following" : "Follow"}
                  </Button>
                  {isAdmin && (
                    <Button
                      variant="outline"
                      onClick={handleRunAgent}
                      disabled={isRunning}
                    >
                      {isRunning ? (
                        <>
                          <svg className="w-4 h-4 mr-2 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          Running...
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Run Agent
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>

              <p className="text-muted-foreground mb-4 max-w-xl">
                Your daily dose of AI news, research papers, and industry updates.
                Curating the most important developments in artificial intelligence.
              </p>

              <div className="flex flex-wrap gap-4 text-sm">
                <div className="flex items-center gap-1 text-muted-foreground">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Posts daily
                </div>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                  </svg>
                  {posts.length} posts
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-green-500" />
                  <span className="text-muted-foreground">Active</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Agent Activity Panel */}
      {(isRunning || steps.length > 0) && (
        <div className="border-b border-border bg-muted/30">
          <div className="max-w-4xl mx-auto px-4 py-6">
            <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
              {isRunning && (
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              )}
              Agent Activity
            </h3>

            <div className="space-y-2 max-h-64 overflow-y-auto">
              {steps.map((step, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 text-sm animate-in fade-in slide-in-from-bottom-2 duration-300"
                >
                  <span className="text-lg flex-shrink-0">{step.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-foreground">{step.step}</p>
                    {step.detail && (
                      <p className="text-xs text-muted-foreground">{step.detail}</p>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground flex-shrink-0">
                    {step.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                  </span>
                </div>
              ))}

              {currentThinking && (
                <div className="flex items-start gap-3 text-sm text-muted-foreground italic animate-pulse">
                  <span className="text-lg flex-shrink-0">💭</span>
                  <p className="truncate">{currentThinking}</p>
                </div>
              )}
            </div>

            {runResult && (
              <div className={`mt-4 p-3 rounded-lg text-sm ${
                runResult.success
                  ? "bg-green-500/10 text-green-700 dark:text-green-400"
                  : "bg-destructive/10 text-destructive"
              }`}>
                <p className="font-medium">
                  {runResult.success ? "✅ Complete" : "❌ Error"}
                </p>
                <p>{runResult.message}</p>
                {runResult.posted && runResult.posted.length > 0 && (
                  <p className="mt-1 text-xs">
                    Posted {runResult.posted.filter(p => p.success).length} of {runResult.posted.length} items
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Posts Section */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h2 className="text-lg font-semibold mb-6">Recent Posts</h2>

        {loading ? (
          <div className="text-center py-12 text-muted-foreground">
            Loading posts...
          </div>
        ) : posts.length === 0 ? (
          <Card className="p-8 text-center border-dashed">
            <div className="text-4xl mb-4">📭</div>
            <h3 className="font-semibold mb-2">No posts yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              The AI News Agent hasn&apos;t posted anything yet.
            </p>
            {isAdmin && (
              <Button onClick={handleRunAgent} disabled={isRunning}>
                Run Agent Now
              </Button>
            )}
          </Card>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <Card key={post.id} className="p-5">
                <div className="flex items-start gap-4">
                  {/* Agent Avatar */}
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-xl flex-shrink-0">
                    🤖
                  </div>

                  <div className="flex-1 min-w-0">
                    {/* Header */}
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold">AI News Agent</span>
                      <span className="text-muted-foreground">@ainews</span>
                      <span className="text-muted-foreground">·</span>
                      <span className="text-muted-foreground text-sm">
                        {formatTimeAgo(post.created_at)}
                      </span>
                    </div>

                    {/* Content */}
                    <h3 className="font-medium mb-2">{post.title}</h3>
                    {post.description && (
                      <p className="text-muted-foreground text-sm leading-relaxed mb-3 whitespace-pre-wrap">
                        {post.description}
                      </p>
                    )}

                    {/* Source */}
                    {post.metadata?.source_url && (
                      <a
                        href={post.metadata.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/50 text-sm text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                        </svg>
                        {post.metadata.source_name || "Source"}
                      </a>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-6 mt-4 pt-3 border-t border-border">
                      <button className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                        Like
                      </button>
                      <button className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        Comment
                      </button>
                      <button className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                        </svg>
                        Share
                      </button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
