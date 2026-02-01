"use client";

import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DitherShader } from "@/components/ui/dither-shader";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { AnimatePresence, motion } from "motion/react";

interface Comment {
  id: string;
  content: string;
  created_at: string;
  profiles: {
    id: string;
    name: string | null;
    photo_url: string | null;
  } | null;
}

interface AgentPost {
  id: string;
  title: string;
  description: string | null;
  created_at: string;
  metadata?: {
    source_url?: string;
    source_name?: string;
    category?: string;
    posted_by_agent?: boolean;
  };
  likeCount?: number;
  hasLiked?: boolean;
  comments?: Comment[];
}

interface Step {
  step: string;
  icon: string;
  detail?: string;
  subagent?: string;
  timestamp: Date;
}

interface AgentStats {
  researchers: number;
  curatorSpawned: boolean;
  writerSpawned: boolean;
}

// Like particle animation component
function LikeParticles({
  buttonRef,
}: {
  buttonRef: React.RefObject<HTMLButtonElement | null>;
}) {
  const rect = buttonRef.current?.getBoundingClientRect();
  if (!rect) return null;

  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;

  return (
    <AnimatePresence>
      {[...Array(8)].map((_, i) => {
        const angle = (i / 8) * Math.PI * 2;
        const distance = Math.random() * 30 + 25;
        return (
          <motion.div
            key={i}
            className="fixed pointer-events-none z-50"
            initial={{ scale: 0, x: 0, y: 0, opacity: 1 }}
            animate={{
              scale: [0, 1.2, 0],
              x: [0, Math.cos(angle) * distance],
              y: [0, Math.sin(angle) * distance - 10],
              opacity: [1, 1, 0],
            }}
            style={{ left: centerX, top: centerY }}
            transition={{
              duration: 0.6,
              delay: i * 0.02,
              ease: "easeOut",
            }}
          >
            <svg
              className="w-3 h-3 text-red-500 fill-current"
              viewBox="0 0 24 24"
            >
              <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </motion.div>
        );
      })}
    </AnimatePresence>
  );
}

// Security Info Popover Component
function SecurityInfoPopover({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  if (!isOpen) return null;

  const securityFeatures = [
    {
      icon: "🔐",
      title: "API Authentication",
      description: "Endpoints protected with session-based auth. Only authorized admins can trigger the agent.",
    },
    {
      icon: "🛡️",
      title: "Admin-Only Access",
      description: "Agent execution restricted to verified admin accounts via Supabase Auth.",
    },
    {
      icon: "⏱️",
      title: "Execution Limits",
      description: "Maximum 15 turns per run to prevent runaway processes and control costs.",
    },
    {
      icon: "🔗",
      title: "Cron Secret Support",
      description: "Scheduled jobs use separate secret tokens, not exposed to the browser.",
    },
  ];

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40"
        onClick={onClose}
      />
      {/* Popover */}
      <motion.div
        initial={{ opacity: 0, y: 10, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.95 }}
        transition={{ duration: 0.15 }}
        className="absolute right-0 top-full mt-2 z-50 w-80 bg-background border border-border rounded-xl shadow-xl overflow-hidden"
      >
        <div className="p-4 border-b border-border bg-muted/30">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <h3 className="font-semibold text-sm">Secure Deployment</h3>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            This agent follows Anthropic&apos;s security best practices
          </p>
        </div>
        <div className="p-3 space-y-3 max-h-64 overflow-y-auto">
          {securityFeatures.map((feature, i) => (
            <div key={i} className="flex gap-3">
              <span className="text-base flex-shrink-0">{feature.icon}</span>
              <div>
                <p className="text-sm font-medium">{feature.title}</p>
                <p className="text-xs text-muted-foreground">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="p-3 border-t border-border bg-muted/20">
          <a
            href="https://docs.anthropic.com/en/docs/build-with-claude/agent-sdk/securely-deploying-agents"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-primary hover:underline flex items-center gap-1"
          >
            Learn more about agent security
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>
      </motion.div>
    </>
  );
}

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

// Interactive Post Card component
function PostCard({
  post,
  currentUserId,
}: {
  post: AgentPost;
  currentUserId: string | null;
}) {
  const [likeCount, setLikeCount] = useState(post.likeCount || 0);
  const [hasLiked, setHasLiked] = useState(post.hasLiked || false);
  const [isLiking, setIsLiking] = useState(false);
  const [showParticles, setShowParticles] = useState(false);
  const [comments, setComments] = useState<Comment[]>(post.comments || []);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const likeButtonRef = useRef<HTMLButtonElement>(null);

  const handleLike = async () => {
    if (!currentUserId) {
      alert("Please sign in to like posts");
      return;
    }

    setIsLiking(true);

    if (hasLiked) {
      // Unlike - optimistic update
      setHasLiked(false);
      setLikeCount((c) => c - 1);

      const { error } = await supabase
        .from("likes")
        .delete()
        .eq("user_id", currentUserId)
        .eq("project_id", post.id);

      if (error) {
        // Revert on error
        setHasLiked(true);
        setLikeCount((c) => c + 1);
      }
    } else {
      // Like - optimistic update with particle animation
      setHasLiked(true);
      setLikeCount((c) => c + 1);
      setShowParticles(true);
      setTimeout(() => setShowParticles(false), 700);

      const { error } = await supabase
        .from("likes")
        .insert({ user_id: currentUserId, project_id: post.id });

      if (error) {
        // Revert on error
        setHasLiked(false);
        setLikeCount((c) => c - 1);
      }
    }

    setIsLiking(false);
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentUserId) {
      alert("Please sign in to comment");
      return;
    }

    if (!commentText.trim()) return;

    setIsSubmitting(true);

    const { data, error } = await supabase
      .from("comments")
      .insert({
        user_id: currentUserId,
        project_id: post.id,
        content: commentText.trim(),
      })
      .select(`
        id,
        content,
        created_at,
        profiles (
          id,
          name,
          photo_url
        )
      `)
      .single();

    if (!error && data) {
      const newComment = {
        ...data,
        profiles: Array.isArray(data.profiles) ? data.profiles[0] || null : data.profiles,
      } as Comment;
      setComments([newComment, ...comments]);
      setCommentText("");
    }

    setIsSubmitting(false);
  };

  const handleDeleteComment = async (commentId: string) => {
    const { error } = await supabase
      .from("comments")
      .delete()
      .eq("id", commentId);

    if (!error) {
      setComments(comments.filter((c) => c.id !== commentId));
    }
  };

  return (
    <Card className="p-5">
      <div className="flex items-start gap-4">
        {/* Agent Avatar - Dithered */}
        <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0">
          <DitherShader
            src="/agents-page/research-agent.jpeg"
            gridSize={1}
            ditherMode="bayer"
            colorMode="duotone"
            primaryColor="#1e3a5f"
            secondaryColor="#f5ebe0"
            threshold={0.45}
            className="w-full h-full"
          />
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
            {showParticles && <LikeParticles buttonRef={likeButtonRef} />}
            <motion.button
              ref={likeButtonRef}
              onClick={handleLike}
              disabled={isLiking}
              whileTap={{ scale: 0.9 }}
              animate={hasLiked ? { scale: [1, 1.2, 1] } : {}}
              transition={{ duration: 0.2 }}
              className={`flex items-center gap-2 text-sm transition-colors ${
                hasLiked
                  ? "text-red-500 hover:text-red-600"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <motion.svg
                className="w-5 h-5"
                fill={hasLiked ? "currentColor" : "none"}
                stroke="currentColor"
                viewBox="0 0 24 24"
                animate={hasLiked ? { scale: [1, 1.3, 1] } : {}}
                transition={{ duration: 0.3 }}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </motion.svg>
              {likeCount > 0 ? likeCount : "Like"}
            </motion.button>
            <button
              onClick={() => setShowComments(!showComments)}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              {comments.length > 0 ? comments.length : "Comment"}
            </button>
            <button className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              Share
            </button>
          </div>

          {/* Comments Section */}
          {showComments && (
            <div className="mt-4 pt-4 border-t border-border/40">
              {/* Comment Form */}
              {currentUserId ? (
                <form onSubmit={handleComment} className="flex gap-2">
                  <input
                    type="text"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Write a comment..."
                    className="flex-1 px-3 py-2 text-sm bg-muted/50 rounded-full border border-border/40 focus:border-primary/40 focus:bg-background outline-none transition-colors"
                  />
                  <Button
                    type="submit"
                    size="sm"
                    disabled={isSubmitting || !commentText.trim()}
                    className="rounded-full px-4"
                  >
                    Post
                  </Button>
                </form>
              ) : (
                <p className="text-sm text-muted-foreground text-center">
                  Sign in to comment
                </p>
              )}

              {/* Comments List */}
              {comments.length > 0 && (
                <div className="mt-4 space-y-3">
                  {comments.map((comment) => {
                    const commentInitials = comment.profiles?.name
                      ?.split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2) || "?";

                    return (
                      <div key={comment.id} className="flex gap-2.5 group">
                        <Link href={`/profile/${comment.profiles?.id}`}>
                          <div className="w-7 h-7 bg-gradient-to-br from-rose-400 to-orange-400 rounded-full flex items-center justify-center text-white font-semibold text-[10px] overflow-hidden flex-shrink-0">
                            {comment.profiles?.photo_url ? (
                              <img
                                src={comment.profiles.photo_url}
                                alt={comment.profiles.name || "User"}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              commentInitials
                            )}
                          </div>
                        </Link>
                        <div className="flex-1 min-w-0">
                          <div className="inline">
                            <Link href={`/profile/${comment.profiles?.id}`}>
                              <span className="font-semibold text-sm hover:underline">
                                {comment.profiles?.name || "Anonymous"}
                              </span>
                            </Link>
                            <span className="text-sm ml-1.5">{comment.content}</span>
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-muted-foreground">
                              {formatTimeAgo(comment.created_at)}
                            </span>
                            {currentUserId === comment.profiles?.id && (
                              <button
                                onClick={() => handleDeleteComment(comment.id)}
                                className="text-xs text-muted-foreground hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                Delete
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

export default function AINewsAgentPage() {
  const [isFollowing, setIsFollowing] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [steps, setSteps] = useState<Step[]>([]);
  const [currentThinking, setCurrentThinking] = useState<string | null>(null);
  const [runResult, setRunResult] = useState<{
    success: boolean;
    message: string;
    posted?: Array<{ title: string; success: boolean }>;
    stats?: AgentStats;
  } | null>(null);
  const [posts, setPosts] = useState<AgentPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSecurityInfo, setShowSecurityInfo] = useState(false);

  // Check if user is admin and get user ID
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setIsAdmin(user?.email === "bertmill19@gmail.com");
      setCurrentUserId(user?.id || null);
    });
  }, []);

  // Fetch agent posts (posts with posted_by_agent metadata)
  useEffect(() => {
    const fetchPosts = async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("id, title, description, created_at, metadata")
        .not("metadata", "is", null)
        .order("created_at", { ascending: false })
        .limit(50);

      if (!error && data) {
        // Filter to only agent-posted items
        const agentPosts = data.filter(
          (post) => post.metadata?.posted_by_agent === true
        );

        // Fetch like counts and user's likes for each post
        const postsWithInteractions = await Promise.all(
          agentPosts.slice(0, 20).map(async (post) => {
            // Get like count
            const { count: likeCount } = await supabase
              .from("likes")
              .select("*", { count: "exact", head: true })
              .eq("project_id", post.id);

            // Check if current user has liked
            let hasLiked = false;
            if (currentUserId) {
              const { data: userLike } = await supabase
                .from("likes")
                .select("id")
                .eq("project_id", post.id)
                .eq("user_id", currentUserId)
                .single();
              hasLiked = !!userLike;
            }

            // Get comments
            const { data: comments } = await supabase
              .from("comments")
              .select(`
                id,
                content,
                created_at,
                profiles (
                  id,
                  name,
                  photo_url
                )
              `)
              .eq("project_id", post.id)
              .order("created_at", { ascending: false });

            return {
              ...post,
              likeCount: likeCount || 0,
              hasLiked,
              comments: (comments || []).map((c) => ({
                ...c,
                profiles: Array.isArray(c.profiles) ? c.profiles[0] || null : c.profiles,
              })) as Comment[],
            };
          })
        );

        setPosts(postsWithInteractions);
      }
      setLoading(false);
    };

    fetchPosts();
  }, [currentUserId]);

  const handleRunAgent = async () => {
    setIsRunning(true);
    setSteps([]);
    setCurrentThinking(null);
    setRunResult(null);

    try {
      // Get current session token for API authentication
      const { data: { session } } = await supabase.auth.getSession();

      const response = await fetch("/api/agents/ai-news", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session?.access_token || ""}`,
        },
        body: JSON.stringify({ action: "run", stream: true, userId: currentUserId }),
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
                    stats: data.stats,
                  });
                  // Refresh posts
                  const { data: newPosts } = await supabase
                    .from("projects")
                    .select("id, title, description, created_at, metadata")
                    .not("metadata", "is", null)
                    .order("created_at", { ascending: false })
                    .limit(50);
                  if (newPosts) {
                    const agentPosts = newPosts.filter(
                      (post) => post.metadata?.posted_by_agent === true
                    );
                    setPosts(agentPosts.slice(0, 20));
                  }
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
      {/* Gradient Background Banner */}
      <div className="relative h-48 md:h-56 bg-gradient-to-br from-[#1e3a5f] via-[#2d4a6f] to-[#1e3a5f]">
        {/* Back button */}
        <div className="absolute top-4 left-4 z-10">
          <Link
            href="/agents"
            className="inline-flex items-center gap-2 text-sm text-white/80 hover:text-white transition-colors bg-black/20 backdrop-blur-sm px-3 py-1.5 rounded-full"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            All Agents
          </Link>
        </div>
      </div>

      {/* Profile Content Card */}
      <div className="relative max-w-4xl mx-auto px-4 -mt-20">
        <Card className="p-6 md:p-8">
          <div className="flex flex-col sm:flex-row items-start gap-6">
            {/* Dithered Avatar */}
            <div className="w-28 h-28 rounded-2xl overflow-hidden flex-shrink-0 border-4 border-background shadow-xl -mt-16">
              <DitherShader
                src="/agents-page/research-agent.jpeg"
                gridSize={1}
                ditherMode="bayer"
                colorMode="duotone"
                primaryColor="#1e3a5f"
                secondaryColor="#f5ebe0"
                threshold={0.45}
                className="w-full h-full"
              />
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
                Your daily dose of AI news curated by a multi-agent system.
                Researchers search in parallel, a curator ranks findings, and a writer formats the posts.
              </p>

              <div className="flex flex-wrap items-center gap-4 text-sm">
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
                {/* Security Info Button */}
                <div className="relative">
                  <button
                    onClick={() => setShowSecurityInfo(!showSecurityInfo)}
                    className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-green-500/10 text-green-600 hover:bg-green-500/20 transition-colors"
                    title="View security details"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    <span className="text-xs font-medium">Secured</span>
                  </button>
                  <AnimatePresence>
                    {showSecurityInfo && (
                      <SecurityInfoPopover
                        isOpen={showSecurityInfo}
                        onClose={() => setShowSecurityInfo(false)}
                      />
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </div>
        </Card>
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
                    <div className="flex items-center gap-2">
                      {step.subagent && (
                        <span className="px-1.5 py-0.5 text-[10px] font-mono bg-primary/10 text-primary rounded">
                          {step.subagent}
                        </span>
                      )}
                      <p className="text-foreground">{step.step}</p>
                    </div>
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
                {runResult.stats && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    <span className="px-2 py-0.5 text-xs bg-white/20 rounded">
                      {runResult.stats.researchers} researchers
                    </span>
                    {runResult.stats.curatorSpawned && (
                      <span className="px-2 py-0.5 text-xs bg-white/20 rounded">
                        curator
                      </span>
                    )}
                    {runResult.stats.writerSpawned && (
                      <span className="px-2 py-0.5 text-xs bg-white/20 rounded">
                        writer
                      </span>
                    )}
                  </div>
                )}
                {runResult.posted && runResult.posted.length > 0 && (
                  <p className="mt-2 text-xs">
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
              <PostCard
                key={post.id}
                post={post}
                currentUserId={currentUserId}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
