"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { BlogPostRow, createPost, updatePost } from "@/lib/blog";
import BlogPostContent from "@/components/BlogPostContent";

interface BlogPostFormProps {
  userId: string;
  post?: BlogPostRow;
}

export default function BlogPostForm({ userId, post }: BlogPostFormProps) {
  const router = useRouter();
  const isEditing = !!post;

  // Form state
  const [title, setTitle] = useState(post?.title || "");
  const [slug, setSlug] = useState(post?.slug || "");
  const [excerpt, setExcerpt] = useState(post?.excerpt || "");
  const [content, setContent] = useState(post?.content || "");
  const [coverImage, setCoverImage] = useState(post?.cover_image || "");
  const [tags, setTags] = useState(post?.tags?.join(", ") || "");
  const [readTimeMinutes, setReadTimeMinutes] = useState(post?.read_time_minutes?.toString() || "5");
  const [isFeatured, setIsFeatured] = useState(post?.is_featured || false);
  const [publishDate, setPublishDate] = useState(() => {
    if (post?.published_at) {
      // Format existing date for datetime-local input
      const date = new Date(post.published_at);
      return date.toISOString().slice(0, 16);
    }
    return "";
  });

  const [isSaving, setIsSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // Auto-generate slug from title
  const generateSlug = (titleText: string) => {
    return titleText
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    // Only auto-generate slug if not editing or if slug is empty
    if (!isEditing || !slug) {
      setSlug(generateSlug(newTitle));
    }
  };

  const handleSave = async (publish: boolean) => {
    if (!title.trim() || !slug.trim() || !excerpt.trim() || !content.trim()) {
      alert("Please fill in all required fields (title, slug, excerpt, content)");
      return;
    }

    setIsSaving(true);

    // Determine publish date
    let finalPublishDate = null;
    if (publish) {
      if (publishDate) {
        // Use scheduled date
        finalPublishDate = new Date(publishDate).toISOString();
      } else if (post?.published_at) {
        // Keep existing publish date
        finalPublishDate = post.published_at;
      } else {
        // Publish now
        finalPublishDate = new Date().toISOString();
      }
    }

    const postData = {
      title: title.trim(),
      slug: slug.trim(),
      excerpt: excerpt.trim(),
      content: content.trim(),
      cover_image: coverImage.trim() || null,
      author_id: userId,
      tags: tags
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0),
      read_time_minutes: parseInt(readTimeMinutes) || 5,
      is_featured: isFeatured,
      is_published: publish,
      published_at: finalPublishDate,
    };

    const result = isEditing
      ? await updatePost(post.id, postData)
      : await createPost(postData);

    if (result.success) {
      router.push("/admin/blog");
      router.refresh();
    } else {
      alert(`Error saving post: ${result.error}`);
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-semibold mb-2">
              Title <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={handleTitleChange}
              placeholder="Enter post title..."
              className="w-full px-4 py-3 bg-muted rounded-lg border-0 focus:ring-2 focus:ring-primary/20 outline-none text-lg font-semibold"
            />
          </div>

          {/* Slug */}
          <div>
            <label className="block text-sm font-semibold mb-2">
              Slug <span className="text-destructive">*</span>
              <span className="text-xs text-muted-foreground font-normal ml-2">
                (URL: /blog/{slug || "your-post-slug"})
              </span>
            </label>
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="your-post-slug"
              className="w-full px-4 py-3 bg-muted rounded-lg border-0 focus:ring-2 focus:ring-primary/20 outline-none font-mono text-sm"
            />
          </div>

          {/* Excerpt */}
          <div>
            <label className="block text-sm font-semibold mb-2">
              Excerpt <span className="text-destructive">*</span>
              <span className="text-xs text-muted-foreground font-normal ml-2">
                (Brief description for blog cards)
              </span>
            </label>
            <textarea
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              placeholder="Write a brief excerpt..."
              rows={3}
              className="w-full px-4 py-3 bg-muted rounded-lg border-0 focus:ring-2 focus:ring-primary/20 outline-none resize-none"
            />
          </div>

          {/* Cover Image */}
          <div>
            <label className="block text-sm font-semibold mb-2">
              Cover Image URL
              <span className="text-xs text-muted-foreground font-normal ml-2">
                (Optional - enter image URL)
              </span>
            </label>
            <input
              type="text"
              value={coverImage}
              onChange={(e) => setCoverImage(e.target.value)}
              placeholder="https://example.com/image.jpg"
              className="w-full px-4 py-3 bg-muted rounded-lg border-0 focus:ring-2 focus:ring-primary/20 outline-none"
            />
            {coverImage && (
              <div className="mt-3">
                <img
                  src={coverImage}
                  alt="Cover preview"
                  className="rounded-lg max-h-48 object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              </div>
            )}
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-semibold mb-2">
              Tags
              <span className="text-xs text-muted-foreground font-normal ml-2">
                (Comma-separated)
              </span>
            </label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="AI, Startup, Productivity"
              className="w-full px-4 py-3 bg-muted rounded-lg border-0 focus:ring-2 focus:ring-primary/20 outline-none"
            />
          </div>

          {/* Read Time & Featured */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-2">
                Read Time (minutes)
              </label>
              <input
                type="number"
                value={readTimeMinutes}
                onChange={(e) => setReadTimeMinutes(e.target.value)}
                min="1"
                className="w-full px-4 py-3 bg-muted rounded-lg border-0 focus:ring-2 focus:ring-primary/20 outline-none"
              />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-3 px-4 py-3 bg-muted rounded-lg cursor-pointer hover:bg-muted/80 transition-colors w-full">
                <input
                  type="checkbox"
                  checked={isFeatured}
                  onChange={(e) => setIsFeatured(e.target.checked)}
                  className="w-5 h-5 rounded border-border"
                />
                <span className="text-sm font-medium">Featured Post</span>
              </label>
            </div>
          </div>

          {/* Publish Date (Optional Scheduling) */}
          <div>
            <label className="block text-sm font-semibold mb-2">
              Publish Date (Optional)
              <span className="text-xs text-muted-foreground font-normal ml-2">
                (Leave empty to publish immediately, or set a future date to schedule)
              </span>
            </label>
            <input
              type="datetime-local"
              value={publishDate}
              onChange={(e) => setPublishDate(e.target.value)}
              className="w-full px-4 py-3 bg-muted rounded-lg border-0 focus:ring-2 focus:ring-primary/20 outline-none"
            />
            {publishDate && (
              <p className="mt-2 text-xs text-muted-foreground">
                Will publish on: {new Date(publishDate).toLocaleString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </p>
            )}
          </div>

          {/* Content */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-semibold">
                Content (Markdown) <span className="text-destructive">*</span>
              </label>
              <button
                type="button"
                onClick={() => setShowPreview(!showPreview)}
                className="text-sm text-primary hover:underline"
              >
                {showPreview ? "Hide Preview" : "Show Preview"}
              </button>
            </div>

            <div className="space-y-4">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write your blog post in markdown..."
                rows={20}
                className="w-full px-4 py-3 bg-muted rounded-lg border-0 focus:ring-2 focus:ring-primary/20 outline-none resize-none font-mono text-sm"
              />

              {showPreview && (
                <div className="border border-border rounded-lg p-6 overflow-y-auto max-h-[600px]">
                  <BlogPostContent content={content} />
                </div>
              )}
            </div>

            <div className="mt-2 text-xs text-muted-foreground">
              <p className="mb-1">Markdown tips:</p>
              <ul className="list-disc list-inside space-y-1">
                <li># H1, ## H2, ### H3 for headings</li>
                <li>**bold**, *italic* for emphasis</li>
                <li>- or * for bullet lists, 1. for numbered lists</li>
                <li>`code` for inline code, ``` for code blocks</li>
                <li>&gt; for blockquotes</li>
                <li>| Table | Syntax | for tables</li>
              </ul>
            </div>
          </div>
        </div>
      </Card>

      {/* Action Buttons */}
      <div className="flex items-center justify-between">
        <Button asChild variant="ghost">
          <Link href="/admin/blog">Cancel</Link>
        </Button>

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => handleSave(false)}
            disabled={isSaving}
          >
            {isSaving ? "Saving..." : "Save as Draft"}
          </Button>
          <Button
            onClick={() => handleSave(true)}
            disabled={isSaving}
            className="bg-green-500 hover:bg-green-600"
          >
            {isSaving ? "Publishing..." : isEditing ? "Update & Publish" : "Publish"}
          </Button>
        </div>
      </div>
    </div>
  );
}
