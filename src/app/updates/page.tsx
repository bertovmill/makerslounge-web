"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { fetchFeed as fetchFeedPosts, createPost } from "@/lib/feed-client";
import { uploadToBlob, projectMediaPath } from "@/lib/upload-client";
import FeedCard from "@/components/FeedCard";
import { ImagePlus, X, Loader2 } from "lucide-react";
import { containsObjectionableContent } from "@/lib/content-filter";

interface FeedProject {
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

interface FeedItem {
  project: FeedProject;
  likeCount: number;
  hasLiked: boolean;
  comments: Comment[];
}

export default function UpdatesPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [feedLoading, setFeedLoading] = useState(true);

  // Compose state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [posting, setPosting] = useState(false);
  const [composeFocused, setComposeFocused] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) loadFeed();
  }, [user]);

  async function loadFeed() {
    setFeedLoading(true);

    // One request. This used to be five: the viewer's blocks, the posts, the like
    // counts, the viewer's own likes, and the comments — then a client-side join of
    // all of it. Blocked authors are filtered in the query now.
    const posts = await fetchFeedPosts({ limit: 50, withComments: true });

    const items: FeedItem[] = posts.map((p) => ({
      project: {
        id: p.id,
        title: p.title,
        description: p.description,
        media_urls: p.media_urls,
        created_at: p.created_at ?? "",
        profiles: p.profiles,
      },
      likeCount: p.like_count,
      hasLiked: p.liked_by_me,
      comments: p.comments,
    }));

    setFeed(items);
    setFeedLoading(false);
  }

  async function handleMediaUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0 || !user) return;

    setUploading(true);
    try {
      const newUrls: string[] = [];
      for (const file of Array.from(files)) {
        const { url } = await uploadToBlob(projectMediaPath(user.id, file), file);
        newUrls.push(url);
      }
      setMediaUrls((prev) => [...prev, ...newUrls]);
    } catch (err) {
      console.error("Upload error:", err);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handlePaste(e: React.ClipboardEvent) {
    const items = e.clipboardData?.items;
    if (!items || !user) return;

    const imageFiles: File[] = [];
    for (const item of Array.from(items)) {
      if (item.type.startsWith("image/")) {
        const file = item.getAsFile();
        if (file) imageFiles.push(file);
      }
    }
    if (imageFiles.length === 0) return;

    e.preventDefault();
    setUploading(true);
    setComposeFocused(true);
    try {
      const newUrls: string[] = [];
      for (const file of imageFiles) {
        // A pasted image has no filename; `projectMediaPath` falls back to
        // "media" and the extension comes from the content type via Blob.
        const { url } = await uploadToBlob(projectMediaPath(user.id, file), file);
        newUrls.push(url);
      }
      setMediaUrls((prev) => [...prev, ...newUrls]);
    } catch (err) {
      console.error("Paste upload error:", err);
    } finally {
      setUploading(false);
    }
  }

  async function handlePost() {
    if (!title.trim() || !user) return;

    const contentToCheck = `${title.trim()} ${description.trim()}`;
    const filterResult = containsObjectionableContent(contentToCheck);
    if (filterResult.flagged) {
      alert(filterResult.reason || "Your post contains content that violates our community guidelines.");
      return;
    }

    setPosting(true);
    const result = await createPost({
      title: title.trim(),
      description: description.trim() || null,
      media_urls: mediaUrls.length > 0 ? mediaUrls : null,
    });

    if (result.success && result.id) {
      // The route returns the id; the author is the signed-in user, so the card can
      // be built locally rather than asking the server to echo the row back with its
      // profile joined.
      const newItem: FeedItem = {
        project: {
          id: result.id,
          title: title.trim(),
          description: description.trim() || null,
          media_urls: mediaUrls.length > 0 ? mediaUrls : null,
          created_at: new Date().toISOString(),
          profiles: {
            id: user.id,
            name: user.fullName ?? null,
            photo_url: user.imageUrl ?? null,
          },
        },
        likeCount: 0,
        hasLiked: false,
        comments: [],
      };
      setFeed((prev) => [newItem, ...prev]);
      setTitle("");
      setDescription("");
      setMediaUrls([]);
      setComposeFocused(false);
    }
    setPosting(false);
  }

  function handleDelete(projectId: string) {
    setFeed((prev) => prev.filter((item) => item.project.id !== projectId));
  }

  function handleBlock(blockedUserId: string) {
    // Dropped the `blockedUserIds` set that used to be maintained alongside this:
    // nothing read it. Removing the cards is the whole effect, and the next load
    // filters blocked authors in the query.
    setFeed((prev) => prev.filter((item) => item.project.profiles?.id !== blockedUserId));
  }

  function handleUpdate(projectId: string, newTitle: string, newDescription: string | null) {
    setFeed((prev) =>
      prev.map((item) =>
        item.project.id === projectId
          ? {
              ...item,
              project: { ...item.project, title: newTitle, description: newDescription },
            }
          : item
      )
    );
  }

  if (loading || !user) return null;

  return (
    <div className="max-w-[600px] mx-auto px-4 py-6">
      {/* Compose box */}
      <div className="mb-8">
        <div
          className={`rounded-2xl border transition-colors ${
            composeFocused ? "border-border bg-card shadow-sm" : "border-border/60 bg-card/50"
          }`}
          onPaste={handlePaste}
        >
          <div className="px-4 pt-4">
            <textarea
              ref={titleRef}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onFocus={() => setComposeFocused(true)}
              placeholder="What are you building?"
              rows={1}
              className="w-full resize-none bg-transparent text-[15px] font-semibold placeholder:text-muted-foreground/50 focus:outline-none"
            />
            {composeFocused && (
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Tell the community more... share a link, describe your stack, ask for feedback"
                rows={3}
                className="w-full resize-none bg-transparent text-[15px] text-muted-foreground placeholder:text-muted-foreground/40 focus:outline-none mt-1"
              />
            )}
          </div>

          {/* Media preview */}
          {mediaUrls.length > 0 && (
            <div className="px-4 pb-2">
              <div className="flex gap-2 flex-wrap">
                {mediaUrls.map((url, i) => (
                  <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden border border-border/40">
                    <img src={url} alt="" className="w-full h-full object-cover" />
                    <button
                      onClick={() => setMediaUrls((prev) => prev.filter((_, idx) => idx !== i))}
                      className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions bar */}
          <div className="flex items-center justify-between px-4 py-3 border-t border-border/40">
            <div className="flex items-center gap-1">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleMediaUpload}
                className="hidden"
              />
              <button
                onClick={() => { try { fileInputRef.current?.click(); } catch { /* camera access may fail on some devices */ } }}
                disabled={uploading}
                className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors disabled:opacity-50"
                title="Add image"
              >
                {uploading ? (
                  <Loader2 className="w-[18px] h-[18px] animate-spin" />
                ) : (
                  <ImagePlus className="w-[18px] h-[18px]" />
                )}
              </button>
            </div>
            <button
              onClick={handlePost}
              disabled={posting || !title.trim()}
              className="px-4 py-1.5 rounded-full bg-foreground text-background text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-30"
            >
              {posting ? "Posting..." : "Post"}
            </button>
          </div>
        </div>
      </div>

      {/* Feed */}
      {feedLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : feed.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-lg font-semibold mb-1">No posts yet</p>
          <p className="text-muted-foreground text-sm">
            Be the first to share what you&apos;re building.
          </p>
        </div>
      ) : (
        <div>
          {feed.map((item) => (
            <FeedCard
              key={item.project.id}
              project={item.project}
              currentUserId={user.id}
              initialLikeCount={item.likeCount}
              initialHasLiked={item.hasLiked}
              initialComments={item.comments}
              onDelete={handleDelete}
              onUpdate={handleUpdate}
              onBlock={handleBlock}
            />
          ))}
        </div>
      )}
    </div>
  );
}
