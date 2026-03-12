"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { formatDistanceToNow } from "@/lib/timeUtils";
import { PenSquare, Search, X } from "lucide-react";

interface ConversationPreview {
  id: string;
  otherUser: {
    id: string;
    name: string | null;
    photo_url: string | null;
  };
  lastMessage: string | null;
  lastMessageAt: string;
  unreadCount: number;
}

interface SearchResult {
  id: string;
  name: string | null;
  username: string | null;
  photo_url: string | null;
}

export default function MessagesPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [conversations, setConversations] = useState<ConversationPreview[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewMessage, setShowNewMessage] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [startingChat, setStartingChat] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push("/auth");
      return;
    }
    loadConversations();

    // Subscribe to new messages for real-time inbox updates
    const channel = supabase
      .channel("inbox")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        () => loadConversations()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, authLoading]);

  async function loadConversations() {
    if (!user) return;

    const { data: convos, error } = await supabase
      .from("conversations")
      .select(`
        id,
        participant_1,
        participant_2,
        last_message_at
      `)
      .or(`participant_1.eq.${user.id},participant_2.eq.${user.id}`)
      .order("last_message_at", { ascending: false });

    if (error || !convos) {
      setLoading(false);
      return;
    }

    const previews: ConversationPreview[] = [];

    for (const convo of convos) {
      const otherId = convo.participant_1 === user.id ? convo.participant_2 : convo.participant_1;

      // Get other user's profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("id, name, photo_url")
        .eq("id", otherId)
        .single();

      // Get last message
      const { data: lastMsg } = await supabase
        .from("messages")
        .select("content, created_at")
        .eq("conversation_id", convo.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      // Get unread count
      const { count } = await supabase
        .from("messages")
        .select("*", { count: "exact", head: true })
        .eq("conversation_id", convo.id)
        .neq("sender_id", user.id)
        .is("read_at", null);

      previews.push({
        id: convo.id,
        otherUser: profile || { id: otherId, name: null, photo_url: null },
        lastMessage: lastMsg?.content || null,
        lastMessageAt: lastMsg?.created_at || convo.last_message_at,
        unreadCount: count || 0,
      });
    }

    setConversations(previews);
    setLoading(false);
  }

  // Search for users to message
  function handleSearch(query: string) {
    setSearchQuery(query);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    if (!query.trim()) {
      setSearchResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    searchTimeoutRef.current = setTimeout(async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id, name, username, photo_url")
        .neq("id", user!.id)
        .or(`name.ilike.%${query}%,username.ilike.%${query}%`)
        .limit(10);
      setSearchResults(data || []);
      setSearching(false);
    }, 300);
  }

  // Start or find existing conversation with a user
  async function startConversation(otherId: string) {
    if (!user || startingChat) return;
    setStartingChat(true);

    const [p1, p2] = [user.id, otherId].sort();

    // Check if conversation already exists
    const { data: existing } = await supabase
      .from("conversations")
      .select("id")
      .eq("participant_1", p1)
      .eq("participant_2", p2)
      .single();

    if (existing) {
      setStartingChat(false);
      setShowNewMessage(false);
      router.push(`/messages/${existing.id}`);
      return;
    }

    // Create new conversation
    const { data: newConvo } = await supabase
      .from("conversations")
      .insert({ participant_1: p1, participant_2: p2 })
      .select("id")
      .single();

    setStartingChat(false);
    setShowNewMessage(false);

    if (newConvo) {
      router.push(`/messages/${newConvo.id}`);
    }
  }

  if (authLoading || loading) {
    return (
      <div className="max-w-lg mx-auto px-4 py-8">
        <h1 className="text-xl font-bold mb-6">Messages</h1>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3 p-3 animate-pulse">
              <div className="w-10 h-10 rounded-full bg-secondary" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-secondary rounded w-24" />
                <div className="h-3 bg-secondary rounded w-48" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6 md:py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold">Messages</h1>
        <button
          onClick={() => {
            setShowNewMessage(true);
            setSearchQuery("");
            setSearchResults([]);
            setTimeout(() => searchInputRef.current?.focus(), 100);
          }}
          className="p-2 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
          aria-label="New message"
        >
          <PenSquare className="w-5 h-5" />
        </button>
      </div>

      {/* New message modal */}
      {showNewMessage && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh]">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setShowNewMessage(false)}
          />
          <div className="relative bg-background border border-border rounded-xl shadow-lg w-full max-w-md mx-4 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <h2 className="text-sm font-semibold">New message</h2>
              <button
                onClick={() => setShowNewMessage(false)}
                className="p-1 text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="px-4 py-3 border-b border-border">
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-muted-foreground shrink-0" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder="Search people..."
                  className="flex-1 bg-transparent text-sm placeholder:text-muted-foreground focus:outline-none"
                />
              </div>
            </div>
            <div className="max-h-64 overflow-y-auto">
              {searching && (
                <p className="text-xs text-muted-foreground text-center py-6">Searching...</p>
              )}
              {!searching && searchQuery && searchResults.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-6">No people found</p>
              )}
              {!searching && !searchQuery && (
                <p className="text-xs text-muted-foreground text-center py-6">Type a name to search</p>
              )}
              {searchResults.map((person) => {
                const initials = person.name
                  ?.split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2) || person.username?.slice(0, 2).toUpperCase() || "?";

                return (
                  <button
                    key={person.id}
                    onClick={() => startConversation(person.id)}
                    disabled={startingChat}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-secondary/50 transition-colors text-left disabled:opacity-50"
                  >
                    <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center text-muted-foreground text-xs font-medium overflow-hidden shrink-0">
                      {person.photo_url ? (
                        <img src={person.photo_url} alt={person.name || ""} className="w-full h-full object-cover" />
                      ) : (
                        initials
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{person.name || person.username || "Anonymous"}</p>
                      {person.username && person.name && (
                        <p className="text-xs text-muted-foreground truncate">@{person.username}</p>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {conversations.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-muted-foreground text-sm">No messages yet</p>
          <p className="text-muted-foreground text-xs mt-1">
            Visit someone&apos;s profile to start a conversation
          </p>
        </div>
      ) : (
        <div className="space-y-0.5">
          {conversations.map((convo) => {
            const initials = convo.otherUser.name
              ?.split(" ")
              .map((n) => n[0])
              .join("")
              .toUpperCase()
              .slice(0, 2) || "?";

            return (
              <button
                key={convo.id}
                onClick={() => router.push(`/messages/${convo.id}`)}
                className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-secondary/50 active:bg-secondary transition-colors text-left"
              >
                <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-muted-foreground text-sm font-medium overflow-hidden shrink-0">
                  {convo.otherUser.photo_url ? (
                    <img
                      src={convo.otherUser.photo_url}
                      alt={convo.otherUser.name || ""}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    initials
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className={`text-sm ${convo.unreadCount > 0 ? "font-semibold" : "font-medium"}`}>
                      {convo.otherUser.name || "Anonymous"}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(convo.lastMessageAt)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className={`text-xs truncate ${convo.unreadCount > 0 ? "text-foreground" : "text-muted-foreground"}`}>
                      {convo.lastMessage || "No messages yet"}
                    </p>
                    {convo.unreadCount > 0 && (
                      <span className="ml-2 w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-medium flex items-center justify-center shrink-0">
                        {convo.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
