"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { User } from "@supabase/supabase-js";

type Status = "idea" | "in_progress" | "published";

interface BroadcastIdea {
  id: string;
  title: string;
  notes: string;
  media_urls: string[];
  status: Status;
  created_at: string;
}

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
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check auth and load ideas
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (!user) {
        router.push("/auth");
        return;
      }

      await loadIdeas();
      setLoading(false);
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (!session?.user) {
        router.push("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  const loadIdeas = async () => {
    const { data, error } = await supabase
      .from("broadcast_ideas")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading ideas:", error);
      return;
    }

    setIdeas(data || []);
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
      })
      .select()
      .single();

    setSaving(false);

    if (error) {
      console.error("Error creating idea:", error);
      return;
    }

    setIdeas([data, ...ideas]);
    setNewTitle("");
    setNewNotes("");
    setNewMedia([]);
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
        <div className="mb-8">
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

        {/* Kanban Board */}
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
                      className={cn(
                        "bg-background border border-border rounded-lg p-4 cursor-grab active:cursor-grabbing shadow-sm hover:shadow-md transition-all",
                        draggedId === idea.id && "opacity-50"
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-medium text-sm">{idea.title}</h3>
                        <button
                          onClick={() => handleDeleteIdea(idea.id)}
                          className="text-muted-foreground hover:text-destructive transition-colors p-1 -m-1"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>

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
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl transition-all hover:scale-105 flex items-center justify-center"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
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
    </div>
  );
}
