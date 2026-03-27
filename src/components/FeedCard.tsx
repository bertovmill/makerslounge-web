"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { containsObjectionableContent } from "@/lib/content-filter";

// Helper function to convert URLs in text to clickable links
function Linkify({ children }: { children: string }) {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = children.split(urlRegex);

  return (
    <>
      {parts.map((part, index) => {
        if (part.match(urlRegex)) {
          return (
            <a
              key={index}
              href={part}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline break-all"
            >
              {part}
            </a>
          );
        }
        return part;
      })}
    </>
  );
}

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
  onDelete?: (projectId: string) => void;
  onUpdate?: (projectId: string, title: string, description: string | null) => void;
  onBlock?: (blockedUserId: string) => void;
}

export default function FeedCard({
  project,
  currentUserId,
  initialLikeCount = 0,
  initialHasLiked = false,
  initialComments = [],
  onAuthRequired,
  onDelete,
  onUpdate,
  onBlock,
}: FeedCardProps) {
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [hasLiked, setHasLiked] = useState(initialHasLiked);
  const [isLiking, setIsLiking] = useState(false);
  const [showParticles, setShowParticles] = useState(false);
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(project.title);
  const [editDescription, setEditDescription] = useState(project.description || "");
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleted, setIsDeleted] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportDetails, setReportDetails] = useState("");
  const [isReporting, setIsReporting] = useState(false);
  const [reportSubmitted, setReportSubmitted] = useState(false);
  const [isBlocking, setIsBlocking] = useState(false);
  const likeButtonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const isOwner = currentUserId === project.profiles?.id;

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
      // Like - optimistic update with particle animation
      setHasLiked(true);
      setLikeCount((c) => c + 1);
      setShowParticles(true);
      setTimeout(() => setShowParticles(false), 700);

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

    const filterResult = containsObjectionableContent(commentText.trim());
    if (filterResult.flagged) {
      alert(filterResult.reason || "Your comment contains content that violates our community guidelines.");
      return;
    }

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

  const handleDeleteClick = () => {
    setShowMenu(false);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    const { error } = await supabase
      .from("projects")
      .delete()
      .eq("id", project.id);

    if (!error) {
      setIsDeleted(true);
      onDelete?.(project.id);
    }
    setIsDeleting(false);
    setShowDeleteConfirm(false);
  };

  const handleSaveEdit = async () => {
    if (!editTitle.trim()) return;

    setIsSaving(true);
    const { error } = await supabase
      .from("projects")
      .update({
        title: editTitle.trim(),
        description: editDescription.trim() || null,
      })
      .eq("id", project.id);

    if (!error) {
      onUpdate?.(project.id, editTitle.trim(), editDescription.trim() || null);
      setIsEditing(false);
    }
    setIsSaving(false);
  };

  const handleCancelEdit = () => {
    setEditTitle(project.title);
    setEditDescription(project.description || "");
    setIsEditing(false);
  };

  const handleReport = async () => {
    if (!currentUserId || !reportReason) return;
    setIsReporting(true);
    await supabase.from("reports").insert({
      reporter_id: currentUserId,
      reported_user_id: project.profiles?.id,
      project_id: project.id,
      reason: reportReason,
      details: reportDetails.trim() || null,
    });
    setIsReporting(false);
    setReportSubmitted(true);
    setTimeout(() => {
      setShowReportModal(false);
      setReportSubmitted(false);
      setReportReason("");
      setReportDetails("");
    }, 1500);
  };

  const handleBlock = async () => {
    if (!currentUserId || !project.profiles?.id) return;
    setIsBlocking(true);
    await supabase.from("blocked_users").insert({
      blocker_id: currentUserId,
      blocked_id: project.profiles.id,
    });
    setIsBlocking(false);
    setShowMenu(false);
    onBlock?.(project.profiles.id);
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showMenu]);

  if (isDeleted) return null;

  return (
    <article className="py-5 border-b border-border/60 last:border-b-0">
      {/* Author header - inline with name and time */}
      <div className="flex items-center gap-3 mb-3">
        <Link href={`/profile/${project.profiles?.id}`}>
          <div className="w-10 h-10 bg-gradient-to-br from-rose-400 to-orange-400 rounded-full flex items-center justify-center text-white font-semibold text-sm overflow-hidden cursor-pointer hover:opacity-90 transition-opacity">
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
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Link href={`/profile/${project.profiles?.id}`}>
              <span className="font-semibold text-[15px] hover:underline cursor-pointer">
                {project.profiles?.name || "Anonymous"}
              </span>
            </Link>
            <span className="text-muted-foreground">·</span>
            <span className="text-sm text-muted-foreground">{timeAgo(project.created_at)}</span>
          </div>
        </div>

        {/* Menu */}
        {currentUserId && (
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="w-8 h-8 rounded-full hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM16 12a2 2 0 100-4 2 2 0 000 4z" />
              </svg>
            </button>

            {showMenu && (
              <div className="absolute right-0 top-full mt-1 w-40 bg-background border border-border rounded-lg shadow-lg py-1 z-10">
                {isOwner ? (
                  <>
                    <button
                      onClick={() => {
                        setIsEditing(true);
                        setShowMenu(false);
                      }}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-muted transition-colors flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Edit
                    </button>
                    <button
                      onClick={handleDeleteClick}
                      className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Delete
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        setShowReportModal(true);
                      }}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-muted transition-colors flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 21v-13l9-5 9 5v13M3 8l9 4 9-4" />
                      </svg>
                      Report post
                    </button>
                    <button
                      onClick={handleBlock}
                      disabled={isBlocking}
                      className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors flex items-center gap-2 disabled:opacity-50"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                      </svg>
                      {isBlocking ? "Blocking..." : "Block user"}
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Project content */}
      <div className="mb-3">
        {isEditing ? (
          <div className="space-y-3">
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="w-full px-3 py-2 text-[15px] font-semibold bg-muted/50 rounded-lg border border-border/40 focus:border-primary/40 focus:bg-background outline-none transition-colors"
              placeholder="Title"
            />
            <textarea
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 text-[15px] bg-muted/50 rounded-lg border border-border/40 focus:border-primary/40 focus:bg-background outline-none transition-colors resize-none"
              placeholder="Description (optional)"
            />
            <div className="flex gap-2 justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCancelEdit}
                className="rounded-full"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSaveEdit}
                disabled={isSaving || !editTitle.trim()}
                className="rounded-full"
              >
                {isSaving ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        ) : (
          <>
            <h3 className="font-semibold text-[15px] mb-1 whitespace-pre-wrap">{project.title}</h3>
            {project.description && (
              <p className="text-muted-foreground text-[15px] leading-relaxed whitespace-pre-wrap">
                <Linkify>{project.description.replace(/\n?\n?\[podcast-audio:[^\]]+\]/g, "")}</Linkify>
              </p>
            )}
          </>
        )}
      </div>

      {/* Inline podcast player */}
      {(() => {
        const audioMatch = project.description?.match(/\[podcast-audio:(https?:\/\/[^\]]+)\]/);
        if (!audioMatch) return null;
        return (
          <div className="mb-3 rounded-xl border border-border/40 bg-gradient-to-r from-[#6AC4F7]/5 to-[#1A7DE8]/5 p-3">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#6AC4F7] to-[#1A7DE8] flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3zM19 10v2a7 7 0 0 1-14 0v-2H3v2a9 9 0 0 0 8 8.94V23h2v-2.06A9 9 0 0 0 21 12v-2h-2z"/></svg>
              </div>
              <span className="text-xs font-medium text-[#3A9FF3]">Podcast Episode</span>
            </div>
            <audio
              controls
              preload="metadata"
              className="w-full h-10 [&::-webkit-media-controls-panel]:bg-transparent"
              src={audioMatch[1]}
            />
          </div>
        );
      })()}

      {/* Media */}
      {project.media_urls && project.media_urls.length > 0 && (
        <div className="relative mb-3 rounded-xl overflow-hidden border border-border/40">
          <img
            src={project.media_urls[0]}
            alt={project.title}
            className="w-full max-h-[400px] object-cover"
          />
          {project.media_urls.length > 1 && (
            <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-sm text-white text-xs px-2.5 py-1 rounded-full">
              +{project.media_urls.length - 1} more
            </div>
          )}
        </div>
      )}

      {/* Actions - inline stats */}
      <div className="flex items-center gap-6 pt-1">
        {showParticles && <LikeParticles buttonRef={likeButtonRef} />}
        <motion.button
          ref={likeButtonRef}
          onClick={handleLike}
          disabled={isLiking}
          whileTap={{ scale: 0.9 }}
          animate={hasLiked ? { scale: [1, 1.2, 1] } : {}}
          transition={{ duration: 0.2 }}
          className={`flex items-center gap-1.5 text-sm transition-colors ${
            hasLiked
              ? "text-red-500 hover:text-red-600"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <motion.svg
            className="w-[18px] h-[18px]"
            fill={hasLiked ? "currentColor" : "none"}
            stroke="currentColor"
            viewBox="0 0 24 24"
            animate={hasLiked ? { scale: [1, 1.3, 1] } : {}}
            transition={{ duration: 0.3 }}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
            />
          </motion.svg>
          <span>{likeCount > 0 ? likeCount : ""}</span>
        </motion.button>
        <button
          onClick={() => setShowComments(!showComments)}
          className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground text-sm transition-colors"
        >
          <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
          <span>{comments.length > 0 ? comments.length : ""}</span>
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
            <button
              onClick={onAuthRequired}
              className="w-full text-sm text-muted-foreground hover:text-foreground"
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
                        <span className="text-sm ml-1.5"><Linkify>{comment.content}</Linkify></span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
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

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
            onClick={() => !isDeleting && setShowDeleteConfirm(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: "spring", duration: 0.3 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-background rounded-2xl shadow-xl w-full max-w-sm mx-4 overflow-hidden"
            >
              <div className="p-6">
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-center mb-2">Delete post?</h3>
                <p className="text-sm text-muted-foreground text-center">
                  This action cannot be undone. This post will be permanently removed.
                </p>
              </div>
              <div className="flex border-t border-border">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isDeleting}
                  className="flex-1 py-3 text-sm font-medium hover:bg-muted transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDelete}
                  disabled={isDeleting}
                  className="flex-1 py-3 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors border-l border-border disabled:opacity-50"
                >
                  {isDeleting ? "Deleting..." : "Delete"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Report Modal */}
      <AnimatePresence>
        {showReportModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
            onClick={() => !isReporting && setShowReportModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: "spring", duration: 0.3 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-background rounded-2xl shadow-xl w-full max-w-sm mx-4 overflow-hidden"
            >
              {reportSubmitted ? (
                <div className="p-6 text-center">
                  <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold mb-1">Report submitted</h3>
                  <p className="text-sm text-muted-foreground">We&apos;ll review this within 24 hours.</p>
                </div>
              ) : (
                <>
                  <div className="p-6">
                    <h3 className="text-lg font-semibold mb-1">Report this post</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Why are you reporting this content?
                    </p>
                    <div className="space-y-2 mb-4">
                      {["Spam", "Harassment or bullying", "Inappropriate content", "Misinformation", "Other"].map((reason) => (
                        <button
                          key={reason}
                          onClick={() => setReportReason(reason)}
                          className={`w-full px-3 py-2.5 text-left text-sm rounded-lg border transition-colors ${
                            reportReason === reason
                              ? "border-primary bg-primary/5 text-foreground"
                              : "border-border hover:bg-muted"
                          }`}
                        >
                          {reason}
                        </button>
                      ))}
                    </div>
                    {reportReason && (
                      <textarea
                        value={reportDetails}
                        onChange={(e) => setReportDetails(e.target.value)}
                        placeholder="Additional details (optional)"
                        rows={2}
                        className="w-full px-3 py-2 text-sm bg-muted/50 rounded-lg border border-border/40 focus:border-primary/40 focus:bg-background outline-none transition-colors resize-none"
                      />
                    )}
                  </div>
                  <div className="flex border-t border-border">
                    <button
                      onClick={() => {
                        setShowReportModal(false);
                        setReportReason("");
                        setReportDetails("");
                      }}
                      disabled={isReporting}
                      className="flex-1 py-3 text-sm font-medium hover:bg-muted transition-colors disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleReport}
                      disabled={isReporting || !reportReason}
                      className="flex-1 py-3 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors border-l border-border disabled:opacity-50"
                    >
                      {isReporting ? "Submitting..." : "Submit report"}
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </article>
  );
}
