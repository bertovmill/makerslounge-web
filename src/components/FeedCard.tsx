"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";

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

interface FeedCardProps {
  project: {
    id: string;
    title: string;
    description: string | null;
    media_urls: string[] | null;
    created_at: string;
    profiles: {
      id: string;
      name: string | null;
      photo_url: string | null;
    } | null;
  };
  currentUserId?: string | null;
  initialLikeCount?: number;
  initialHasLiked?: boolean;
  initialComments?: Comment[];
  onAuthRequired?: () => void;
}

export default function FeedCard({
  project,
  currentUserId,
  initialLikeCount = 0,
  initialHasLiked = false,
  initialComments = [],
  onAuthRequired,
}: FeedCardProps) {
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [hasLiked, setHasLiked] = useState(initialHasLiked);
  const [isLiking, setIsLiking] = useState(false);
  const [showParticles, setShowParticles] = useState(false);
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const likeButtonRef = useRef<HTMLButtonElement>(null);
  const initials = project.profiles?.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "?";

  const timeAgo = (date: string) => {
    const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return "just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const handleLike = async () => {
    if (!currentUserId) {
      onAuthRequired?.();
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
        .eq("project_id", project.id);

      if (error) {
        // Revert on error
        setHasLiked(true);
        setLikeCount((c) => c + 1);
      }
    } else {
      // Like - optimistic update
      setHasLiked(true);
      setLikeCount((c) => c + 1);

      const { error } = await supabase
        .from("likes")
        .insert({ user_id: currentUserId, project_id: project.id });

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
      onAuthRequired?.();
      return;
    }

    if (!commentText.trim()) return;

    setIsSubmitting(true);

    const { data, error } = await supabase
      .from("comments")
      .insert({
        user_id: currentUserId,
        project_id: project.id,
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
    <Card className="glass-card overflow-hidden">
      {/* Author header */}
      <div className="p-4 flex items-center gap-3">
        <Link href={`/profile/${project.profiles?.id}`}>
          <div className="w-10 h-10 bg-gradient-to-br from-rose-400 to-orange-400 rounded-full flex items-center justify-center text-white font-bold text-sm overflow-hidden cursor-pointer hover:opacity-90 transition-opacity">
            {project.profiles?.photo_url ? (
              <img
                src={project.profiles.photo_url}
                alt={project.profiles.name || "User"}
                className="w-full h-full object-cover"
              />
            ) : (
              initials
            )}
          </div>
        </Link>
        <div className="flex-1">
          <Link href={`/profile/${project.profiles?.id}`}>
            <p className="font-semibold text-sm hover:underline cursor-pointer">
              {project.profiles?.name || "Anonymous"}
            </p>
          </Link>
          <p className="text-xs text-muted-foreground">{timeAgo(project.created_at)}</p>
        </div>
      </div>

      {/* Project content */}
      <div className="px-4 pb-3">
        <h3 className="font-semibold text-lg mb-1">{project.title}</h3>
        {project.description && (
          <p className="text-muted-foreground text-sm line-clamp-3">{project.description}</p>
        )}
      </div>

      {/* Media */}
      {project.media_urls && project.media_urls.length > 0 && (
        <div className="relative">
          <img
            src={project.media_urls[0]}
            alt={project.title}
            className="w-full aspect-video object-cover"
          />
          {project.media_urls.length > 1 && (
            <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full">
              +{project.media_urls.length - 1} more
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="p-4 border-t border-border flex items-center gap-4">
        <button
          onClick={handleLike}
          disabled={isLiking}
          className={`flex items-center gap-2 text-sm transition-colors ${
            hasLiked
              ? "text-red-500 hover:text-red-600"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <svg
            className="w-5 h-5"
            fill={hasLiked ? "currentColor" : "none"}
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
            />
          </svg>
          {likeCount > 0 ? likeCount : "Like"}
        </button>
        <button
          onClick={() => setShowComments(!showComments)}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
          {comments.length > 0 ? `${comments.length} Comments` : "Comment"}
        </button>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="px-4 pb-4 border-t border-border">
          {/* Comment Form */}
          {currentUserId ? (
            <form onSubmit={handleComment} className="flex gap-2 pt-4">
              <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Write a comment..."
                className="flex-1 px-3 py-2 text-sm bg-muted rounded-lg border-0 focus:ring-2 focus:ring-primary/20 outline-none"
              />
              <Button
                type="submit"
                size="sm"
                disabled={isSubmitting || !commentText.trim()}
                className="rounded-lg"
              >
                Post
              </Button>
            </form>
          ) : (
            <button
              onClick={onAuthRequired}
              className="w-full pt-4 text-sm text-muted-foreground hover:text-foreground"
            >
              Sign in to comment
            </button>
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
                  <div key={comment.id} className="flex gap-3 group">
                    <Link href={`/profile/${comment.profiles?.id}`}>
                      <div className="w-8 h-8 bg-gradient-to-br from-rose-400 to-orange-400 rounded-full flex items-center justify-center text-white font-bold text-xs overflow-hidden flex-shrink-0">
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
                      <div className="bg-muted rounded-lg px-3 py-2">
                        <Link href={`/profile/${comment.profiles?.id}`}>
                          <span className="font-semibold text-sm hover:underline">
                            {comment.profiles?.name || "Anonymous"}
                          </span>
                        </Link>
                        <p className="text-sm mt-0.5">{comment.content}</p>
                      </div>
                      <div className="flex items-center gap-2 mt-1 px-1">
                        <span className="text-xs text-muted-foreground">
                          {timeAgo(comment.created_at)}
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
    </Card>
  );
}
