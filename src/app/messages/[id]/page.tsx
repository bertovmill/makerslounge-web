"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { ArrowLeft, Send, MoreHorizontal, Flag, Ban } from "lucide-react";
import Link from "next/link";
import { containsObjectionableContent } from "@/lib/content-filter";

interface Message {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
  read_at: string | null;
}

interface OtherUser {
  id: string;
  name: string | null;
  photo_url: string | null;
  username: string | null;
}

export default function ConversationPage() {
  const { id: conversationId } = useParams<{ id: string }>();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [otherUser, setOtherUser] = useState<OtherUser | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [limitError, setLimitError] = useState<string | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportDetails, setReportDetails] = useState("");
  const [reportSubmitted, setReportSubmitted] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // Hide mobile bottom tab bar on conversation page so input is accessible
  useEffect(() => {
    const bottomNav = document.querySelector("nav.md\\:hidden.fixed.bottom-0") as HTMLElement | null;
    if (bottomNav) bottomNav.style.display = "none";
    return () => {
      if (bottomNav) bottomNav.style.display = "";
    };
  }, []);

  // Load conversation data
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push("/auth");
      return;
    }

    async function load() {
      // Get conversation
      const { data: convo, error } = await supabase
        .from("conversations")
        .select("*")
        .eq("id", conversationId)
        .single();

      if (error || !convo) {
        router.push("/messages");
        return;
      }

      // Verify user is a participant
      if (convo.participant_1 !== user!.id && convo.participant_2 !== user!.id) {
        router.push("/messages");
        return;
      }

      const otherId = convo.participant_1 === user!.id ? convo.participant_2 : convo.participant_1;

      // Get other user profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("id, name, photo_url, username")
        .eq("id", otherId)
        .single();

      setOtherUser(profile || { id: otherId, name: null, photo_url: null, username: null });

      // Load messages
      const { data: msgs } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      setMessages(msgs || []);
      setLoading(false);

      // Mark unread messages as read
      if (msgs && msgs.length > 0) {
        const unread = msgs.filter((m) => m.sender_id !== user!.id && !m.read_at);
        if (unread.length > 0) {
          await supabase
            .from("messages")
            .update({ read_at: new Date().toISOString() })
            .eq("conversation_id", conversationId)
            .neq("sender_id", user!.id)
            .is("read_at", null);
        }
      }
    }

    load();
  }, [user, authLoading, conversationId]);

  // Subscribe to new messages
  useEffect(() => {
    if (!user || !conversationId) return;

    const channel = supabase
      .channel(`conversation:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const newMsg = payload.new as Message;
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });

          // Mark as read if from other user
          if (newMsg.sender_id !== user.id) {
            supabase
              .from("messages")
              .update({ read_at: new Date().toISOString() })
              .eq("id", newMsg.id)
              .then();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, conversationId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  async function handleReport() {
    if (!user || !otherUser || !reportReason) return;
    await supabase.from("reports").insert({
      reporter_id: user.id,
      reported_user_id: otherUser.id,
      reason: reportReason,
      details: reportDetails || null,
    });
    setReportSubmitted(true);
    setTimeout(() => {
      setShowReportModal(false);
      setReportSubmitted(false);
      setReportReason("");
      setReportDetails("");
    }, 2000);
  }

  async function handleBlock() {
    if (!user || !otherUser) return;
    await supabase.from("blocked_users").insert({
      blocker_id: user.id,
      blocked_id: otherUser.id,
    });
    setBlocked(true);
    setShowMenu(false);
  }

  async function handleSend() {
    if (!newMessage.trim() || sending || !user) return;
    setLimitError(null);

    // Content filter
    const filterResult = containsObjectionableContent(newMessage.trim());
    if (filterResult.flagged) {
      setLimitError(filterResult.reason || "This message violates our community guidelines.");
      return;
    }

    const content = newMessage.trim();
    setNewMessage("");
    // Reset textarea height after clearing
    if (inputRef.current) inputRef.current.style.height = "auto";
    setSending(true);

    // Optimistic update
    const optimisticMsg: Message = {
      id: `temp-${Date.now()}`,
      sender_id: user.id,
      content,
      created_at: new Date().toISOString(),
      read_at: null,
    };
    setMessages((prev) => [...prev, optimisticMsg]);

    const { data, error } = await supabase
      .from("messages")
      .insert({
        conversation_id: conversationId,
        sender_id: user.id,
        content,
      })
      .select()
      .single();

    if (error) {
      // Remove optimistic message on error
      setMessages((prev) => prev.filter((m) => m.id !== optimisticMsg.id));
    } else if (data) {
      // Replace optimistic with real message
      setMessages((prev) =>
        prev.map((m) => (m.id === optimisticMsg.id ? data : m))
      );
    }

    // Update conversation last_message_at
    await supabase
      .from("conversations")
      .update({ last_message_at: new Date().toISOString() })
      .eq("id", conversationId);

    setSending(false);
    inputRef.current?.focus();
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  if (authLoading || loading) {
    return (
      <div className="max-w-lg mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-secondary rounded w-32" />
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className={`flex ${i % 2 === 0 ? "justify-end" : ""}`}>
                <div className="h-10 bg-secondary rounded-xl w-48" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const initials = otherUser?.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "?";

  const profileHref = otherUser?.username ? `/p/${otherUser.username}` : `/profile/${otherUser?.id}`;

  return (
    <div className="max-w-lg mx-auto flex flex-col h-[calc(100dvh-2.75rem-env(safe-area-inset-top,0px))] md:h-[calc(100dvh-3.5rem)]">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
        <button
          onClick={() => router.push("/messages")}
          className="p-1 -ml-1 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <Link href={profileHref} className="flex items-center gap-2.5 min-w-0 flex-1">
          <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-muted-foreground text-xs font-medium overflow-hidden shrink-0">
            {otherUser?.photo_url ? (
              <img
                src={otherUser.photo_url}
                alt={otherUser.name || ""}
                className="w-full h-full object-cover"
              />
            ) : (
              initials
            )}
          </div>
          <span className="text-sm font-medium truncate">
            {otherUser?.name || "Anonymous"}
          </span>
        </Link>
        <div className="relative ml-auto">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-1.5 rounded-lg text-muted-foreground hover:bg-secondary transition-colors"
          >
            <MoreHorizontal className="w-5 h-5" />
          </button>
          {showMenu && (
            <div className="absolute right-0 top-full mt-1 w-48 bg-card border border-border rounded-lg shadow-lg z-10 overflow-hidden">
              <button
                onClick={() => { setShowReportModal(true); setShowMenu(false); }}
                className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-left hover:bg-secondary transition-colors"
              >
                <Flag className="w-4 h-4" />
                Report user
              </button>
              <button
                onClick={handleBlock}
                disabled={blocked}
                className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-left text-red-500 hover:bg-secondary transition-colors disabled:opacity-50"
              >
                <Ban className="w-4 h-4" />
                {blocked ? "Blocked" : "Block user"}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4" onClick={() => setShowReportModal(false)}>
          <div className="bg-card rounded-xl p-5 w-full max-w-sm border border-border" onClick={(e) => e.stopPropagation()}>
            {reportSubmitted ? (
              <p className="text-sm text-center text-muted-foreground py-4">Report submitted. Thank you.</p>
            ) : (
              <>
                <h3 className="text-base font-semibold mb-3">Report {otherUser?.name || "this user"}</h3>
                <div className="space-y-2 mb-3">
                  {["Spam", "Harassment or bullying", "Inappropriate content", "Misinformation", "Other"].map((reason) => (
                    <label key={reason} className="flex items-center gap-2 text-sm cursor-pointer">
                      <input
                        type="radio"
                        name="report-reason"
                        value={reason}
                        checked={reportReason === reason}
                        onChange={() => setReportReason(reason)}
                        className="accent-primary"
                      />
                      {reason}
                    </label>
                  ))}
                </div>
                <textarea
                  placeholder="Additional details (optional)"
                  value={reportDetails}
                  onChange={(e) => setReportDetails(e.target.value)}
                  rows={2}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm mb-3 resize-none focus:outline-none focus:ring-1 focus:ring-primary/50"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleReport}
                    disabled={!reportReason}
                    className="flex-1 py-2 text-sm font-medium rounded-lg bg-red-500 text-white hover:bg-red-600 disabled:opacity-50 transition-colors"
                  >
                    Submit Report
                  </button>
                  <button
                    onClick={() => setShowReportModal(false)}
                    className="flex-1 py-2 text-sm font-medium rounded-lg bg-secondary hover:bg-secondary/80 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
        {messages.length === 0 && (
          <p className="text-center text-muted-foreground text-xs py-8">
            Start the conversation
          </p>
        )}
        {messages.map((msg, i) => {
          const isMe = msg.sender_id === user?.id;
          const showTime =
            i === 0 ||
            new Date(msg.created_at).getTime() -
              new Date(messages[i - 1].created_at).getTime() >
              5 * 60 * 1000;

          return (
            <div key={msg.id}>
              {showTime && (
                <p className="text-center text-[10px] text-muted-foreground my-3">
                  {new Date(msg.created_at).toLocaleString(undefined, {
                    month: "short",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </p>
              )}
              <div className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm whitespace-pre-wrap break-words ${
                    isMe
                      ? "bg-primary text-primary-foreground rounded-br-md"
                      : "bg-secondary text-foreground rounded-bl-md"
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-border px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom,0px))] md:pb-3">
        {limitError && (
          <div className="mb-3 p-3 rounded-lg bg-secondary text-sm text-center">
            <p className="text-muted-foreground">{limitError}</p>
          </div>
        )}
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={newMessage}
            onChange={(e) => {
              setNewMessage(e.target.value);
              setLimitError(null);
              // Auto-resize textarea
              e.target.style.height = "auto";
              e.target.style.height = Math.min(e.target.scrollHeight, 128) + "px";
            }}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            rows={1}
            className="flex-1 resize-none bg-secondary rounded-xl px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 max-h-32"
          />
          <button
            onMouseDown={(e) => {
              e.preventDefault(); // Prevent textarea blur so keyboard stays open
            }}
            onClick={handleSend}
            disabled={!newMessage.trim() || sending}
            className="p-2 rounded-full bg-primary text-primary-foreground disabled:opacity-40 transition-opacity shrink-0 touch-manipulation"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
