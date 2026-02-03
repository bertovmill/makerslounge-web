"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { User } from "@supabase/supabase-js";

type Status = "idea" | "in_progress" | "published";

interface BroadcastAccount {
  id: string;
  name: string;
  type: "personal" | "business";
  avatar_url: string | null;
}

interface BroadcastIdea {
  id: string;
  title: string;
  notes: string;
  media_urls: string[];
  status: Status;
  created_at: string;
  account_id: string | null;
  channels: string[];
  account?: BroadcastAccount;
}

interface CustomChannel {
  id: string;
  name: string;
  icon: string;
}

interface SocialConnection {
  id: string;
  platform: string;
  platform_username: string;
  platform_name: string;
  platform_avatar_url: string | null;
}

// Platforms that can be connected
const CONNECTABLE_PLATFORMS = [
  { id: "x", name: "X", icon: "𝕏", available: true },
  { id: "linkedin", name: "LinkedIn", icon: "in", available: false },
  { id: "instagram", name: "Instagram", icon: "📷", available: false },
  { id: "threads", name: "Threads", icon: "@", available: false },
] as const;

const DEFAULT_CHANNELS = [
  { id: "x", name: "X", icon: "𝕏" },
  { id: "linkedin", name: "LinkedIn", icon: "in" },
  { id: "instagram", name: "Instagram", icon: "📷" },
  { id: "youtube", name: "YouTube", icon: "▶" },
  { id: "tiktok", name: "TikTok", icon: "♪" },
  { id: "threads", name: "Threads", icon: "@" },
] as const;

const COLUMNS: { id: Status; title: string; color: string }[] = [
  { id: "idea", title: "Ideas", color: "bg-blue-500/20 border-blue-500/30" },
  { id: "in_progress", title: "In Progress", color: "bg-yellow-500/20 border-yellow-500/30" },
  { id: "published", title: "Published", color: "bg-green-500/20 border-green-500/30" },
];

export default function BroadcastPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [ideas, setIdeas] = useState<BroadcastIdea[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newNotes, setNewNotes] = useState("");
  const [newMedia, setNewMedia] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<Status | null>(null);
  const [accounts, setAccounts] = useState<BroadcastAccount[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [selectedChannels, setSelectedChannels] = useState<string[]>([]);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [newAccountName, setNewAccountName] = useState("");
  const [newAccountType, setNewAccountType] = useState<"personal" | "business">("business");
  const [customChannels, setCustomChannels] = useState<CustomChannel[]>([]);
  const [showChannelModal, setShowChannelModal] = useState(false);
  const [newChannelName, setNewChannelName] = useState("");
  const [newChannelIcon, setNewChannelIcon] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Generate Post Modal State
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [selectedIdea, setSelectedIdea] = useState<BroadcastIdea | null>(null);
  const [generateIdeaTitle, setGenerateIdeaTitle] = useState("");
  const [generateIdeaNotes, setGenerateIdeaNotes] = useState("");
  const [generateChannel, setGenerateChannel] = useState<string>("x");
  const [generateTone, setGenerateTone] = useState<string>("casual");
  const [generateMediaType, setGenerateMediaType] = useState<string>("none");
  const [generatedContent, setGeneratedContent] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [useWebSearch, setUseWebSearch] = useState(false);
  const [customSearchQuery, setCustomSearchQuery] = useState("");
  const [webSources, setWebSources] = useState<{ title: string; url: string }[]>([]);
  const [debugInfo, setDebugInfo] = useState<{ request: unknown; response: unknown } | null>(null);
  const [showDebugInfo, setShowDebugInfo] = useState(false);

  // Refinement State
  const [refinementPrompt, setRefinementPrompt] = useState("");
  const [isRefining, setIsRefining] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<{ role: "user" | "assistant"; content: string }[]>([]);

  // Social Connections State
  const [socialConnections, setSocialConnections] = useState<SocialConnection[]>([]);
  const [isPostingToX, setIsPostingToX] = useState(false);
  const [postToXSuccess, setPostToXSuccess] = useState<string | null>(null);

  // Scheduling State
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");
  const [isScheduling, setIsScheduling] = useState(false);
  const [scheduleSuccess, setScheduleSuccess] = useState<string | null>(null);

  // Edit Idea Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingIdea, setEditingIdea] = useState<BroadcastIdea | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [editAccountId, setEditAccountId] = useState<string | null>(null);
  const [editChannels, setEditChannels] = useState<string[]>([]);
  const [isAdjusting, setIsAdjusting] = useState(false);
  const [adjustResult, setAdjustResult] = useState("");
  const [customAiPrompt, setCustomAiPrompt] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  // Combine default and custom channels
  const allChannels = [...DEFAULT_CHANNELS, ...customChannels];

  // Check auth and load ideas
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (!user) {
        router.push("/auth");
        return;
      }

      // Set loading false immediately after auth check - data loads in background
      setLoading(false);

      // Load data in parallel but don't block the UI
      loadIdeas();
      loadAccounts();
      loadCustomChannels();
      loadSocialConnections();
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (!session?.user) {
        router.push("/auth");
      }
    });

    return () => subscription.unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadIdeas = async () => {
    const { data, error } = await supabase
      .from("broadcast_ideas")
      .select("*, account:broadcast_accounts(*)")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading ideas:", error.message, error.code, error.details, error.hint);
      return;
    }

    setIdeas(data || []);
  };

  const loadAccounts = async () => {
    const { data, error } = await supabase
      .from("broadcast_accounts")
      .select("*")
      .order("type", { ascending: true });

    if (error) {
      console.error("Error loading accounts:", error.message, error.code, error.details, error.hint);
      return;
    }

    setAccounts(data || []);
  };

  const handleAddAccount = async () => {
    if (!newAccountName.trim() || !user) return;

    const { data, error } = await supabase
      .from("broadcast_accounts")
      .insert({
        user_id: user.id,
        name: newAccountName,
        type: newAccountType,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating account:", error.message, error.code, error.details, error.hint);
      return;
    }

    setAccounts([...accounts, data]);
    setSelectedAccountId(data.id);
    setNewAccountName("");
    setNewAccountType("business");
    setShowAccountModal(false);
  };

  const loadCustomChannels = async () => {
    const { data, error } = await supabase
      .from("broadcast_channels")
      .select("*")
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error loading custom channels:", error.message, error.code, error.details, error.hint);
      return;
    }

    setCustomChannels(data || []);
  };

  const loadSocialConnections = async () => {
    const { data, error } = await supabase
      .from("social_connections")
      .select("id, platform, platform_username, platform_name, platform_avatar_url")
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error loading social connections:", error.message, error.code, error.details, error.hint);
      return;
    }

    setSocialConnections(data || []);
  };

  const handleConnectX = () => {
    window.location.href = "/api/auth/x/authorize";
  };

  const handleDisconnectX = async () => {
    if (!confirm("Are you sure you want to disconnect your X account?")) return;

    try {
      const response = await fetch("/api/auth/x/disconnect", {
        method: "POST",
      });

      if (response.ok) {
        setSocialConnections((prev) => prev.filter((c) => c.platform !== "x"));
      } else {
        alert("Failed to disconnect X account");
      }
    } catch (error) {
      console.error("Disconnect error:", error);
      alert("Failed to disconnect X account");
    }
  };

  const handlePostToX = async () => {
    if (!generatedContent || generatedContent.length > 280) {
      alert("Content must be 280 characters or less to post to X");
      return;
    }

    const xConnection = socialConnections.find((c) => c.platform === "x");
    if (!xConnection) {
      alert("Please connect your X account first");
      return;
    }

    setIsPostingToX(true);
    setPostToXSuccess(null);

    try {
      const response = await fetch("/api/auth/x/post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: generatedContent }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to post");
      }

      setPostToXSuccess(data.url);
    } catch (error) {
      console.error("Post to X error:", error);
      alert(error instanceof Error ? error.message : "Failed to post to X");
    } finally {
      setIsPostingToX(false);
    }
  };

  const handleSchedulePost = async () => {
    if (!generatedContent || !scheduleDate || !scheduleTime) {
      alert("Please select a date and time for scheduling");
      return;
    }

    const scheduledFor = new Date(`${scheduleDate}T${scheduleTime}`);
    if (scheduledFor <= new Date()) {
      alert("Scheduled time must be in the future");
      return;
    }

    setIsScheduling(true);
    setScheduleSuccess(null);

    try {
      const response = await fetch("/api/schedule-post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: generatedContent,
          platform: generateChannel,
          scheduledFor: scheduledFor.toISOString(),
          ideaId: selectedIdea?.id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to schedule");
      }

      setScheduleSuccess(scheduledFor.toLocaleString());
      setShowScheduleModal(false);
      setScheduleDate("");
      setScheduleTime("");
    } catch (error) {
      console.error("Schedule error:", error);
      alert(error instanceof Error ? error.message : "Failed to schedule post");
    } finally {
      setIsScheduling(false);
    }
  };

  const handleAddChannel = async () => {
    if (!newChannelName.trim() || !newChannelIcon.trim() || !user) return;

    const { data, error } = await supabase
      .from("broadcast_channels")
      .insert({
        user_id: user.id,
        name: newChannelName,
        icon: newChannelIcon,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating channel:", error.message, error.code, error.details, error.hint);
      return;
    }

    setCustomChannels([...customChannels, data]);
    setSelectedChannels([...selectedChannels, data.id]);
    setNewChannelName("");
    setNewChannelIcon("");
    setShowChannelModal(false);
  };

  const toggleChannel = (channelId: string) => {
    setSelectedChannels((prev) =>
      prev.includes(channelId)
        ? prev.filter((id) => id !== channelId)
        : [...prev, channelId]
    );
  };

  const handleAddIdea = async () => {
    if (!newTitle.trim() || !user) return;

    setSaving(true);

    // Upload media files to Supabase Storage
    const uploadedUrls: string[] = [];
    for (const mediaData of newMedia) {
      try {
        // Convert base64 to blob
        const response = await fetch(mediaData);
        const blob = await response.blob();
        const ext = blob.type.split("/")[1] || "png";
        const fileName = `${user.id}/${crypto.randomUUID()}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from("broadcast-media")
          .upload(fileName, blob);

        if (uploadError) {
          console.error("Upload error:", uploadError);
          continue;
        }

        const { data: { publicUrl } } = supabase.storage
          .from("broadcast-media")
          .getPublicUrl(fileName);

        uploadedUrls.push(publicUrl);
      } catch (err) {
        console.error("Error uploading media:", err);
      }
    }

    const { data, error } = await supabase
      .from("broadcast_ideas")
      .insert({
        user_id: user.id,
        title: newTitle,
        notes: newNotes,
        media_urls: uploadedUrls,
        status: "idea",
        account_id: selectedAccountId,
        channels: selectedChannels,
      })
      .select("*, account:broadcast_accounts(*)")
      .single();

    setSaving(false);

    if (error) {
      console.error("Error creating idea:", error.message, error.code, error.details, error.hint);
      return;
    }

    setIdeas([data, ...ideas]);
    setNewTitle("");
    setNewNotes("");
    setNewMedia([]);
    setSelectedAccountId(null);
    setSelectedChannels([]);
    setShowModal(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          setNewMedia((prev) => [...prev, e.target!.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedId(id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, columnId: Status) => {
    e.preventDefault();
    setDragOverColumn(columnId);
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleDrop = async (e: React.DragEvent, newStatus: Status) => {
    e.preventDefault();
    setDragOverColumn(null);

    if (!draggedId) return;

    // Optimistic update
    setIdeas((prev) =>
      prev.map((idea) =>
        idea.id === draggedId ? { ...idea, status: newStatus } : idea
      )
    );

    // Update in database
    const { error } = await supabase
      .from("broadcast_ideas")
      .update({ status: newStatus })
      .eq("id", draggedId);

    if (error) {
      console.error("Error updating status:", error);
      // Revert on error
      await loadIdeas();
    }

    setDraggedId(null);
  };

  const handleDeleteIdea = async (id: string) => {
    // Optimistic delete
    setIdeas((prev) => prev.filter((idea) => idea.id !== id));

    const { error } = await supabase
      .from("broadcast_ideas")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting idea:", error);
      // Revert on error
      await loadIdeas();
    }
  };

  const removeMedia = (index: number) => {
    setNewMedia((prev) => prev.filter((_, i) => i !== index));
  };

  // Generate post content
  const handleGeneratePost = async () => {
    if (!selectedIdea || !generateIdeaTitle.trim()) return;

    setIsGenerating(true);
    setGeneratedContent("");
    setWebSources([]);

    // Find the channel name for custom channels
    const channelInfo = allChannels.find((c) => c.id === generateChannel);
    const channelName = channelInfo?.name;

    try {
      const response = await fetch("/api/generate-post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: generateIdeaTitle,
          notes: generateIdeaNotes,
          channel: generateChannel,
          tone: generateTone,
          channelName: channelName,
          mediaType: generateMediaType,
          useWebSearch: useWebSearch,
          searchQuery: customSearchQuery || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate");
      }

      setGeneratedContent(data.content);
      if (data.sources) {
        setWebSources(data.sources);
      }
      if (data.debug) {
        setDebugInfo(data.debug);
      }
    } catch (error) {
      console.error("Generate error:", error);
      setGeneratedContent("Error generating content. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  // Copy to clipboard
  const handleCopyContent = async () => {
    try {
      await navigator.clipboard.writeText(generatedContent);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error("Copy failed:", err);
    }
  };

  // Open generate modal for an idea
  const openGenerateModal = (idea: BroadcastIdea) => {
    setSelectedIdea(idea);
    setGenerateIdeaTitle(idea.title);
    setGenerateIdeaNotes(idea.notes || "");
    // Pre-select channel if the idea has one
    if (idea.channels && idea.channels.length > 0) {
      setGenerateChannel(idea.channels[0]);
    } else {
      setGenerateChannel("x");
    }
    setGenerateTone("casual");
    setGenerateMediaType("none");
    setGeneratedContent("");
    setUseWebSearch(false);
    setCustomSearchQuery("");
    setWebSources([]);
    setDebugInfo(null);
    setShowDebugInfo(false);
    setPostToXSuccess(null);
    setRefinementPrompt("");
    setConversationHistory([]);
    setScheduleSuccess(null);
    setScheduleDate("");
    setScheduleTime("");
    setShowScheduleModal(false);
    setShowGenerateModal(true);
  };

  // Handle post refinement
  const handleRefinePost = async (quickAction?: string) => {
    const prompt = quickAction || refinementPrompt;
    if (!prompt.trim() || !generatedContent) return;

    setIsRefining(true);

    try {
      const response = await fetch("/api/refine-post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          originalIdea: {
            title: generateIdeaTitle,
            notes: generateIdeaNotes,
          },
          currentContent: generatedContent,
          refinementRequest: prompt,
          channel: generateChannel,
          tone: generateTone,
          conversationHistory: conversationHistory,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to refine");
      }

      setGeneratedContent(data.content);
      setConversationHistory(data.conversationHistory || []);
      setRefinementPrompt("");
    } catch (error) {
      console.error("Refine error:", error);
    } finally {
      setIsRefining(false);
    }
  };

  // Open edit modal for an idea
  const openEditModal = (idea: BroadcastIdea) => {
    setEditingIdea(idea);
    setEditTitle(idea.title);
    setEditNotes(idea.notes || "");
    setEditAccountId(idea.account_id);
    setEditChannels(idea.channels || []);
    setAdjustResult("");
    setCustomAiPrompt("");
    setShowEditModal(true);
  };

  // Handle AI adjustment
  const handleAiAdjust = async (action: string) => {
    setIsAdjusting(true);
    setAdjustResult("");

    try {
      const response = await fetch("/api/adjust-idea", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editTitle,
          notes: editNotes,
          action,
          customPrompt: action === "custom" ? customAiPrompt : undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to adjust");
      }

      setAdjustResult(data.result);
    } catch (error) {
      console.error("Adjust error:", error);
      setAdjustResult("Error processing request. Please try again.");
    } finally {
      setIsAdjusting(false);
    }
  };

  // Apply AI suggestion to notes
  const applyToNotes = () => {
    setEditNotes(adjustResult);
    setAdjustResult("");
  };

  // Apply first line as title (for improve_title action)
  const applyAsTitle = (text: string) => {
    // Remove numbering if present (e.g., "1. " or "1) ")
    const cleanTitle = text.replace(/^\d+[\.\)]\s*/, "").trim();
    setEditTitle(cleanTitle);
  };

  // Save edited idea
  const handleSaveEdit = async () => {
    if (!editingIdea || !editTitle.trim()) return;

    setSavingEdit(true);

    const { error } = await supabase
      .from("broadcast_ideas")
      .update({
        title: editTitle,
        notes: editNotes,
        account_id: editAccountId,
        channels: editChannels,
      })
      .eq("id", editingIdea.id);

    setSavingEdit(false);

    if (error) {
      console.error("Error saving idea:", error);
      return;
    }

    // Update local state
    setIdeas((prev) =>
      prev.map((idea) =>
        idea.id === editingIdea.id
          ? { ...idea, title: editTitle, notes: editNotes, account_id: editAccountId, channels: editChannels }
          : idea
      )
    );

    setShowEditModal(false);
  };

  // Toggle channel in edit mode
  const toggleEditChannel = (channelId: string) => {
    setEditChannels((prev) =>
      prev.includes(channelId)
        ? prev.filter((id) => id !== channelId)
        : [...prev, channelId]
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <h1 className="text-3xl font-bold">Broadcast</h1>
              <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary font-medium">
                Beta
              </span>
            </div>
            <p className="text-muted-foreground">
              Capture content ideas, develop them, and track what you&apos;ve published.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Connected Accounts */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/50 border border-border">
              <span className="text-xs text-muted-foreground mr-1">Connected:</span>
              {CONNECTABLE_PLATFORMS.map((platform) => {
                const connection = socialConnections.find((c) => c.platform === platform.id);
                const isConnected = !!connection;

                return (
                  <div key={platform.id} className="relative group">
                    {isConnected ? (
                      <button
                        onClick={() => platform.id === "x" && handleDisconnectX()}
                        className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-background border border-green-500/30 hover:border-red-500/50 transition-colors"
                        title={`Connected as @${connection.platform_username}`}
                      >
                        {connection.platform_avatar_url ? (
                          <img
                            src={connection.platform_avatar_url}
                            alt=""
                            className="w-4 h-4 rounded-full"
                          />
                        ) : (
                          <span className="text-sm">{platform.icon}</span>
                        )}
                        <span className="text-xs text-green-600">@{connection.platform_username}</span>
                        <svg className="w-3 h-3 text-muted-foreground group-hover:text-red-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    ) : (
                      <button
                        onClick={() => platform.id === "x" && platform.available && handleConnectX()}
                        disabled={!platform.available}
                        className={cn(
                          "flex items-center gap-1.5 px-2 py-1 rounded-md border transition-colors",
                          platform.available
                            ? "bg-background border-border hover:border-primary/50 cursor-pointer"
                            : "bg-muted/30 border-border/50 cursor-not-allowed opacity-50"
                        )}
                        title={platform.available ? `Connect ${platform.name}` : "Coming soon"}
                      >
                        <span className="text-sm">{platform.icon}</span>
                        <span className="text-xs text-muted-foreground">
                          {platform.available ? "Connect" : "Soon"}
                        </span>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            <Link href="/broadcast/build">
              <Button className="gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                Build Content
              </Button>
            </Link>
          </div>
        </div>

        {/* Ideas Board */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {COLUMNS.map((column) => {
            const columnIdeas = ideas.filter((idea) => idea.status === column.id);
            const isOver = dragOverColumn === column.id;

            return (
              <div
                key={column.id}
                className={cn(
                  "rounded-xl border-2 border-dashed p-4 min-h-[500px] transition-all duration-200",
                  column.color,
                  isOver && "scale-[1.02] border-solid"
                )}
                onDragOver={(e) => handleDragOver(e, column.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, column.id)}
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold text-lg">{column.title}</h2>
                  <span className="text-sm text-muted-foreground bg-background/50 px-2 py-0.5 rounded-full">
                    {columnIdeas.length}
                  </span>
                </div>

                <div className="space-y-3">
                  {columnIdeas.map((idea) => (
                    <div
                      key={idea.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, idea.id)}
                      onClick={() => openEditModal(idea)}
                      className={cn(
                        "bg-background border border-border rounded-lg p-4 cursor-pointer hover:shadow-md hover:border-primary/30 transition-all",
                        draggedId === idea.id && "opacity-50 cursor-grabbing"
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-medium text-sm">{idea.title}</h3>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openGenerateModal(idea);
                            }}
                            className="text-muted-foreground hover:text-primary transition-colors p-1 -m-1"
                            title="Generate post"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteIdea(idea.id);
                            }}
                            className="text-muted-foreground hover:text-destructive transition-colors p-1 -m-1"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      </div>

                      {/* Account & Channels */}
                      {(idea.account || (idea.channels && idea.channels.length > 0)) && (
                        <div className="mt-2 flex flex-wrap items-center gap-1.5">
                          {idea.account && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted text-xs">
                              {idea.account.type === "personal" ? "👤" : "🏢"}
                              {idea.account.name}
                            </span>
                          )}
                          {idea.channels?.map((channelId) => {
                            const channel = allChannels.find((c) => c.id === channelId);
                            return channel ? (
                              <span
                                key={channelId}
                                className="inline-flex items-center px-1.5 py-0.5 rounded bg-muted/50 text-xs"
                                title={channel.name}
                              >
                                {channel.icon}
                              </span>
                            ) : null;
                          })}
                        </div>
                      )}

                      {idea.notes && (
                        <p className="text-xs text-muted-foreground mt-2 line-clamp-3">
                          {idea.notes}
                        </p>
                      )}

                      {idea.media_urls && idea.media_urls.length > 0 && (
                        <div className="mt-3 flex gap-2 overflow-x-auto">
                          {idea.media_urls.slice(0, 3).map((url, i) => (
                            <div
                              key={i}
                              className="w-16 h-16 rounded-md overflow-hidden flex-shrink-0 bg-muted"
                            >
                              {url.includes("video") ? (
                                <video src={url} className="w-full h-full object-cover" />
                              ) : (
                                <img src={url} alt="" className="w-full h-full object-cover" />
                              )}
                            </div>
                          ))}
                          {idea.media_urls.length > 3 && (
                            <div className="w-16 h-16 rounded-md bg-muted flex items-center justify-center flex-shrink-0">
                              <span className="text-xs text-muted-foreground">
                                +{idea.media_urls.length - 3}
                              </span>
                            </div>
                          )}
                        </div>
                      )}

                      <div className="mt-3 text-xs text-muted-foreground">
                        {new Date(idea.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  ))}

                  {columnIdeas.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      {column.id === "idea" ? "Add your first idea!" : "Drag ideas here"}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Floating Action Button */}
      <button
        onClick={() => setShowModal(true)}
        className="fixed bottom-24 right-6 z-50 group flex items-center gap-2 h-12 px-4 rounded-full bg-foreground text-background shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
      >
        <svg className="w-5 h-5 transition-transform duration-200 group-hover:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        <span className="text-sm font-medium pr-1">New Idea</span>
      </button>

      {/* Add Idea Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-background border border-border rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="text-lg font-semibold">New Idea</h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-4 space-y-4">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium mb-1.5">
                  Title <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="What's your idea?"
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>

              {/* Account */}
              <div>
                <label className="block text-sm font-medium mb-1.5">Account</label>
                <div className="flex gap-2">
                  <select
                    value={selectedAccountId || ""}
                    onChange={(e) => setSelectedAccountId(e.target.value || null)}
                    className="flex-1 px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                  >
                    <option value="">No account selected</option>
                    {accounts.map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.type === "personal" ? "👤" : "🏢"} {account.name}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setShowAccountModal(true)}
                    className="px-3 py-2 rounded-lg border border-border bg-background hover:bg-muted transition-colors"
                    title="Add account"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Channels */}
              <div>
                <label className="block text-sm font-medium mb-1.5">Channels</label>
                <div className="flex flex-wrap gap-2">
                  {allChannels.map((channel) => (
                    <button
                      key={channel.id}
                      type="button"
                      onClick={() => toggleChannel(channel.id)}
                      className={cn(
                        "px-3 py-1.5 rounded-full text-sm font-medium border transition-all",
                        selectedChannels.includes(channel.id)
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background border-border hover:border-primary/50"
                      )}
                    >
                      <span className="mr-1">{channel.icon}</span>
                      {channel.name}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setShowChannelModal(true)}
                    className="px-3 py-1.5 rounded-full text-sm font-medium border border-dashed border-border hover:border-primary/50 transition-all flex items-center gap-1"
                    title="Add custom channel"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add
                  </button>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium mb-1.5">Notes</label>
                <textarea
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="Add your notes, ideas, or context..."
                  rows={4}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                />
              </div>

              {/* Media Upload */}
              <div>
                <label className="block text-sm font-medium mb-1.5">
                  Screenshots / Videos
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,video/*"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors"
                >
                  <svg className="w-8 h-8 mx-auto mb-2 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-sm text-muted-foreground">
                    Click to upload images or videos
                  </span>
                </button>

                {/* Preview uploaded media */}
                {newMedia.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {newMedia.map((url, i) => (
                      <div key={i} className="relative group">
                        <div className="w-20 h-20 rounded-lg overflow-hidden bg-muted">
                          {url.startsWith("data:video") ? (
                            <video src={url} className="w-full h-full object-cover" />
                          ) : (
                            <img src={url} alt="" className="w-full h-full object-cover" />
                          )}
                        </div>
                        <button
                          onClick={() => removeMedia(i)}
                          className="absolute -top-2 -right-2 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 p-4 border-t border-border">
              <Button variant="outline" onClick={() => setShowModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddIdea} disabled={!newTitle.trim() || saving}>
                {saving ? "Saving..." : "Create Idea"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Add Account Modal */}
      {showAccountModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-background border border-border rounded-xl w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="text-lg font-semibold">Add Account</h2>
              <button
                onClick={() => setShowAccountModal(false)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Account Name</label>
                <input
                  type="text"
                  value={newAccountName}
                  onChange={(e) => setNewAccountName(e.target.value)}
                  placeholder="e.g., My Business or Personal"
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">Account Type</label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setNewAccountType("personal")}
                    className={cn(
                      "flex-1 p-3 rounded-lg border-2 transition-all text-left",
                      newAccountType === "personal"
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    <span className="text-xl mb-1 block">👤</span>
                    <span className="font-medium text-sm">Personal</span>
                    <p className="text-xs text-muted-foreground mt-0.5">Your personal brand</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewAccountType("business")}
                    className={cn(
                      "flex-1 p-3 rounded-lg border-2 transition-all text-left",
                      newAccountType === "business"
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    <span className="text-xl mb-1 block">🏢</span>
                    <span className="font-medium text-sm">Business</span>
                    <p className="text-xs text-muted-foreground mt-0.5">A company or project</p>
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 p-4 border-t border-border">
              <Button variant="outline" onClick={() => setShowAccountModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddAccount} disabled={!newAccountName.trim()}>
                Add Account
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Add Channel Modal */}
      {showChannelModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-background border border-border rounded-xl w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="text-lg font-semibold">Add Channel</h2>
              <button
                onClick={() => setShowChannelModal(false)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Channel Name</label>
                <input
                  type="text"
                  value={newChannelName}
                  onChange={(e) => setNewChannelName(e.target.value)}
                  placeholder="e.g., Newsletter, Blog, Podcast"
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">Icon (emoji)</label>
                <input
                  type="text"
                  value={newChannelIcon}
                  onChange={(e) => setNewChannelIcon(e.target.value)}
                  placeholder="e.g., 📧, 📝, 🎙️"
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                  maxLength={4}
                />
                <p className="text-xs text-muted-foreground mt-1.5">
                  Pick an emoji to represent this channel
                </p>
              </div>

              {/* Preview */}
              {newChannelName && newChannelIcon && (
                <div>
                  <label className="block text-sm font-medium mb-1.5">Preview</label>
                  <div className="inline-flex px-3 py-1.5 rounded-full text-sm font-medium border border-border bg-background">
                    <span className="mr-1">{newChannelIcon}</span>
                    {newChannelName}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 p-4 border-t border-border">
              <Button variant="outline" onClick={() => setShowChannelModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddChannel} disabled={!newChannelName.trim() || !newChannelIcon.trim()}>
                Add Channel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Idea Modal */}
      {showEditModal && editingIdea && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-background border border-border rounded-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="text-lg font-semibold">Edit Idea</h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left: Edit Fields */}
                <div className="space-y-4">
                  {/* Title */}
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Title</label>
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      placeholder="What's your idea?"
                      className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Notes</label>
                    <textarea
                      value={editNotes}
                      onChange={(e) => setEditNotes(e.target.value)}
                      placeholder="Add your notes, ideas, or context..."
                      rows={6}
                      className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                    />
                  </div>

                  {/* Account */}
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Account</label>
                    <select
                      value={editAccountId || ""}
                      onChange={(e) => setEditAccountId(e.target.value || null)}
                      className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                    >
                      <option value="">No account selected</option>
                      {accounts.map((account) => (
                        <option key={account.id} value={account.id}>
                          {account.type === "personal" ? "👤" : "🏢"} {account.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Channels */}
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Channels</label>
                    <div className="flex flex-wrap gap-2">
                      {allChannels.map((channel) => (
                        <button
                          key={channel.id}
                          type="button"
                          onClick={() => toggleEditChannel(channel.id)}
                          className={cn(
                            "px-2.5 py-1 rounded-full text-xs font-medium border transition-all",
                            editChannels.includes(channel.id)
                              ? "bg-primary text-primary-foreground border-primary"
                              : "bg-background border-border hover:border-primary/50"
                          )}
                        >
                          <span className="mr-1">{channel.icon}</span>
                          {channel.name}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right: AI Tools */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">AI Adjust</label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: "expand", label: "Expand", icon: "📝", desc: "Add more details" },
                        { id: "improve_title", label: "Better Titles", icon: "✨", desc: "Generate options" },
                        { id: "clarify", label: "Clarify", icon: "🎯", desc: "Make it clearer" },
                        { id: "shorten", label: "Shorten", icon: "✂️", desc: "Condense it" },
                        { id: "angles", label: "Find Angles", icon: "💡", desc: "Different perspectives" },
                        { id: "brainstorm", label: "Brainstorm", icon: "🧠", desc: "Related ideas" },
                      ].map((action) => (
                        <button
                          key={action.id}
                          onClick={() => handleAiAdjust(action.id)}
                          disabled={isAdjusting}
                          className="flex items-start gap-2 p-3 rounded-lg border border-border hover:border-primary/50 hover:bg-muted/50 transition-all text-left disabled:opacity-50"
                        >
                          <span className="text-lg">{action.icon}</span>
                          <div>
                            <div className="text-sm font-medium">{action.label}</div>
                            <div className="text-xs text-muted-foreground">{action.desc}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Custom Prompt */}
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Custom Prompt</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={customAiPrompt}
                        onChange={(e) => setCustomAiPrompt(e.target.value)}
                        placeholder="Ask AI to do something specific..."
                        className="flex-1 px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                      />
                      <Button
                        size="sm"
                        onClick={() => handleAiAdjust("custom")}
                        disabled={isAdjusting || !customAiPrompt.trim()}
                      >
                        {isAdjusting ? "..." : "Go"}
                      </Button>
                    </div>
                  </div>

                  {/* AI Result */}
                  {(isAdjusting || adjustResult) && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="block text-sm font-medium">AI Suggestion</label>
                        {adjustResult && (
                          <div className="flex gap-2">
                            <button
                              onClick={applyToNotes}
                              className="text-xs px-2 py-1 rounded bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                            >
                              Apply to Notes
                            </button>
                          </div>
                        )}
                      </div>
                      <div className="bg-muted/30 border border-border rounded-lg p-3 max-h-[200px] overflow-y-auto">
                        {isAdjusting ? (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            Thinking...
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {adjustResult.split("\n").map((line, i) => {
                              // Check if line looks like a title suggestion (numbered)
                              const isTitleOption = /^\d+[\.\)]/.test(line.trim());
                              return line.trim() ? (
                                <div key={i} className="flex items-start gap-2">
                                  <p className="text-sm flex-1">{line}</p>
                                  {isTitleOption && (
                                    <button
                                      onClick={() => applyAsTitle(line)}
                                      className="text-xs px-2 py-0.5 rounded bg-muted hover:bg-primary/10 hover:text-primary transition-colors flex-shrink-0"
                                    >
                                      Use
                                    </button>
                                  )}
                                </div>
                              ) : null;
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 border-t border-border">
              <Button
                variant="outline"
                onClick={() => openGenerateModal(editingIdea)}
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Generate Post
              </Button>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setShowEditModal(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveEdit} disabled={!editTitle.trim() || savingEdit}>
                  {savingEdit ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Generate Post Modal */}
      {showGenerateModal && selectedIdea && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-background border border-border rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <h2 className="text-lg font-semibold">Generate Post</h2>
              </div>
              <button
                onClick={() => setShowGenerateModal(false)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-4 space-y-4">
              {/* Editable Idea */}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Your Idea</label>
                  <input
                    type="text"
                    value={generateIdeaTitle}
                    onChange={(e) => setGenerateIdeaTitle(e.target.value)}
                    placeholder="What's your idea?"
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 font-medium"
                  />
                </div>
                <div>
                  <textarea
                    value={generateIdeaNotes}
                    onChange={(e) => setGenerateIdeaNotes(e.target.value)}
                    placeholder="Add notes or context..."
                    rows={2}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm text-muted-foreground resize-none"
                  />
                </div>
              </div>

              {/* Channel Selection */}
              <div>
                <label className="block text-sm font-medium mb-2">Platform</label>
                <div className="flex flex-wrap gap-2">
                  {allChannels.map((channel) => (
                    <button
                      key={channel.id}
                      type="button"
                      onClick={() => setGenerateChannel(channel.id)}
                      className={cn(
                        "px-3 py-1.5 rounded-full text-sm font-medium border transition-all",
                        generateChannel === channel.id
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background border-border hover:border-primary/50"
                      )}
                    >
                      <span className="mr-1">{channel.icon}</span>
                      {channel.name}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setShowChannelModal(true)}
                    className="px-3 py-1.5 rounded-full text-sm font-medium border border-dashed border-border hover:border-primary/50 transition-all flex items-center gap-1"
                    title="Add custom channel"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add
                  </button>
                </div>
              </div>

              {/* Tone Selection */}
              <div>
                <label className="block text-sm font-medium mb-2">Tone</label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: "casual", name: "Casual", emoji: "😊" },
                    { id: "professional", name: "Professional", emoji: "💼" },
                    { id: "educational", name: "Educational", emoji: "📚" },
                    { id: "inspiring", name: "Inspiring", emoji: "✨" },
                    { id: "humorous", name: "Humorous", emoji: "😄" },
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setGenerateTone(t.id)}
                      className={cn(
                        "px-3 py-1.5 rounded-full text-sm font-medium border transition-all",
                        generateTone === t.id
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background border-border hover:border-primary/50"
                      )}
                    >
                      <span className="mr-1">{t.emoji}</span>
                      {t.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Media Type Selection */}
              <div>
                <label className="block text-sm font-medium mb-2">Includes Media</label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: "none", name: "Text Only", emoji: "📝" },
                    { id: "image", name: "Image", emoji: "🖼️" },
                    { id: "video", name: "Video", emoji: "🎬" },
                    { id: "carousel", name: "Carousel", emoji: "📸" },
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setGenerateMediaType(m.id)}
                      className={cn(
                        "px-3 py-1.5 rounded-full text-sm font-medium border transition-all",
                        generateMediaType === m.id
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background border-border hover:border-primary/50"
                      )}
                    >
                      <span className="mr-1">{m.emoji}</span>
                      {m.name}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-1.5">
                  Let the AI know if you plan to attach media to your post
                </p>
              </div>

              {/* Web Search Toggle */}
              <div className="border border-border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                    </svg>
                    <span className="text-sm font-medium">Web Research</span>
                  </div>
                  <button
                    onClick={() => setUseWebSearch(!useWebSearch)}
                    className={cn(
                      "relative w-11 h-6 rounded-full transition-colors",
                      useWebSearch ? "bg-primary" : "bg-muted"
                    )}
                  >
                    <div
                      className={cn(
                        "absolute top-1 w-4 h-4 rounded-full bg-white transition-transform shadow-sm",
                        useWebSearch ? "translate-x-6" : "translate-x-1"
                      )}
                    />
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Search the web for current trends, news, and context to inform your post
                </p>
                {useWebSearch && (
                  <div>
                    <input
                      type="text"
                      value={customSearchQuery}
                      onChange={(e) => setCustomSearchQuery(e.target.value)}
                      placeholder={`Search for: "${generateIdeaTitle || "your topic"}"`}
                      className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Leave empty to search using your idea title
                    </p>
                  </div>
                )}
              </div>

              {/* Generate Button */}
              <Button
                onClick={handleGeneratePost}
                disabled={isGenerating || !generateIdeaTitle.trim()}
                className="w-full gap-2"
              >
                {isGenerating ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    {useWebSearch ? "Researching & Generating..." : "Generating..."}
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    {useWebSearch ? "Research & Generate" : "Generate Post"}
                  </>
                )}
              </Button>

              {/* Generated Content */}
              {generatedContent && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <label className="block text-sm font-medium">Generated Content</label>
                      {debugInfo && (
                        <button
                          onClick={() => setShowDebugInfo(!showDebugInfo)}
                          className={cn(
                            "p-1 rounded transition-colors",
                            showDebugInfo
                              ? "bg-primary/10 text-primary"
                              : "text-muted-foreground hover:text-foreground hover:bg-muted"
                          )}
                          title="View API call details"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </button>
                      )}
                    </div>
                    <button
                      onClick={handleCopyContent}
                      className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                        copySuccess
                          ? "bg-green-500/20 text-green-600"
                          : "bg-muted hover:bg-muted/80"
                      )}
                    >
                      {copySuccess ? (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Copied!
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                          Copy
                        </>
                      )}
                    </button>
                  </div>
                  <div className="bg-muted/30 border border-border rounded-lg p-4">
                    <pre className="whitespace-pre-wrap text-sm font-sans">{generatedContent}</pre>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">
                      Character count: {generatedContent.length}
                      {generateChannel === "x" && (
                        <span className={generatedContent.length > 280 ? " text-destructive" : " text-green-600"}>
                          {" "}({generatedContent.length > 280 ? "over" : "within"} 280 limit)
                        </span>
                      )}
                    </p>

                    {/* Post/Schedule buttons */}
                    {generateChannel === "x" && generatedContent.length <= 280 && (
                      <div className="flex items-center gap-2">
                        {scheduleSuccess ? (
                          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-blue-500/20 text-blue-600">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Scheduled for {scheduleSuccess}
                          </span>
                        ) : postToXSuccess ? (
                          <a
                            href={postToXSuccess}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-green-500/20 text-green-600 hover:bg-green-500/30 transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Posted! View on X
                          </a>
                        ) : socialConnections.find((c) => c.platform === "x") ? (
                          <>
                            <button
                              onClick={() => setShowScheduleModal(true)}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border border-border hover:border-primary/50 transition-colors"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              Schedule
                            </button>
                            <button
                              onClick={handlePostToX}
                              disabled={isPostingToX}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-black text-white hover:bg-black/80 transition-colors disabled:opacity-50"
                            >
                              {isPostingToX ? (
                                <>
                                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                  </svg>
                                  Posting...
                                </>
                              ) : (
                                <>
                                  <span className="text-sm">𝕏</span>
                                  Post Now
                                </>
                              )}
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={handleConnectX}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border border-border hover:border-primary/50 transition-colors"
                          >
                            <span className="text-sm">𝕏</span>
                            Connect X to Post
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Schedule Modal */}
                  {showScheduleModal && (
                    <div className="mt-4 p-4 border border-border rounded-lg bg-muted/30">
                      <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        Schedule Post
                      </h4>
                      <div className="flex gap-3 mb-3">
                        <div className="flex-1">
                          <label className="block text-xs text-muted-foreground mb-1">Date</label>
                          <input
                            type="date"
                            value={scheduleDate}
                            onChange={(e) => setScheduleDate(e.target.value)}
                            min={new Date().toISOString().split("T")[0]}
                            className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                          />
                        </div>
                        <div className="flex-1">
                          <label className="block text-xs text-muted-foreground mb-1">Time</label>
                          <input
                            type="time"
                            value={scheduleTime}
                            onChange={(e) => setScheduleTime(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                          />
                        </div>
                      </div>
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setShowScheduleModal(false)}
                          className="px-3 py-1.5 rounded-lg text-sm font-medium border border-border hover:bg-muted transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleSchedulePost}
                          disabled={isScheduling || !scheduleDate || !scheduleTime}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
                        >
                          {isScheduling ? (
                            <>
                              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                              </svg>
                              Scheduling...
                            </>
                          ) : (
                            <>
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              Schedule Post
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Debug Info Panel */}
                  {showDebugInfo && debugInfo && (
                    <div className="mt-4 border border-border rounded-lg overflow-hidden">
                      <div className="bg-muted/50 px-3 py-2 border-b border-border">
                        <span className="text-xs font-medium text-muted-foreground">API Call Details</span>
                      </div>
                      <div className="divide-y divide-border">
                        {/* Request */}
                        <div className="p-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-medium text-primary">Request</span>
                            <button
                              onClick={() => navigator.clipboard.writeText(JSON.stringify(debugInfo.request, null, 2))}
                              className="text-xs text-muted-foreground hover:text-foreground"
                            >
                              Copy
                            </button>
                          </div>
                          <pre className="text-xs bg-background rounded p-2 overflow-x-auto max-h-[200px] overflow-y-auto">
                            {JSON.stringify(debugInfo.request, null, 2)}
                          </pre>
                        </div>
                        {/* Response */}
                        <div className="p-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-medium text-green-600">Response</span>
                            <button
                              onClick={() => navigator.clipboard.writeText(JSON.stringify(debugInfo.response, null, 2))}
                              className="text-xs text-muted-foreground hover:text-foreground"
                            >
                              Copy
                            </button>
                          </div>
                          <pre className="text-xs bg-background rounded p-2 overflow-x-auto max-h-[200px] overflow-y-auto">
                            {JSON.stringify(debugInfo.response, null, 2)}
                          </pre>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Web Sources */}
                  {webSources.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-border">
                      <div className="flex items-center gap-2 mb-2">
                        <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                        </svg>
                        <span className="text-xs font-medium text-muted-foreground">Sources Used</span>
                      </div>
                      <div className="space-y-1">
                        {webSources.map((source, i) => (
                          <a
                            key={i}
                            href={source.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-xs text-primary hover:underline truncate"
                          >
                            <span className="text-muted-foreground">{i + 1}.</span>
                            {source.title}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Refinement Section */}
                  <div className="mt-4 pt-4 border-t border-border space-y-3">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      <span className="text-sm font-medium">Refine</span>
                      {conversationHistory.length > 0 && (
                        <span className="text-xs text-muted-foreground">
                          ({Math.floor(conversationHistory.length / 2)} refinement{Math.floor(conversationHistory.length / 2) !== 1 ? "s" : ""})
                        </span>
                      )}
                    </div>

                    {/* Quick Actions */}
                    <div className="flex flex-wrap gap-2">
                      {[
                        { label: "Shorter", prompt: "Make it shorter and more concise" },
                        { label: "Longer", prompt: "Expand on the key points with more detail" },
                        { label: "More casual", prompt: "Make it more casual and conversational" },
                        { label: "More professional", prompt: "Make it more professional and polished" },
                        { label: "Add hook", prompt: "Add a stronger hook at the beginning" },
                        { label: "Remove emojis", prompt: "Remove all emojis" },
                      ].map((action) => (
                        <button
                          key={action.label}
                          onClick={() => handleRefinePost(action.prompt)}
                          disabled={isRefining}
                          className="px-2.5 py-1 text-xs rounded-full border border-border hover:border-primary/50 hover:bg-muted/50 transition-colors disabled:opacity-50"
                        >
                          {action.label}
                        </button>
                      ))}
                    </div>

                    {/* Custom Refinement Input */}
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={refinementPrompt}
                        onChange={(e) => setRefinementPrompt(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && !isRefining && handleRefinePost()}
                        placeholder="Ask for specific changes..."
                        className="flex-1 px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                        disabled={isRefining}
                      />
                      <Button
                        size="sm"
                        onClick={() => handleRefinePost()}
                        disabled={isRefining || !refinementPrompt.trim()}
                      >
                        {isRefining ? (
                          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                        ) : (
                          "Refine"
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between p-4 border-t border-border">
              <Button
                variant="outline"
                onClick={() => {
                  setGeneratedContent("");
                  handleGeneratePost();
                }}
                disabled={isGenerating || !generatedContent}
              >
                Regenerate
              </Button>
              <Button variant="outline" onClick={() => setShowGenerateModal(false)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
