"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { User } from "@supabase/supabase-js";

// Dynamic import for Remotion (avoid SSR issues)
const VideoEditor = dynamic(
  () => import("@/components/broadcast/VideoEditor").then((mod) => mod.VideoEditor),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-[600px] flex items-center justify-center bg-muted/30 rounded-xl">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-sm text-muted-foreground">Loading video editor...</p>
        </div>
      </div>
    ),
  }
);

export default function BuildPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [contentType, setContentType] = useState<"video" | "image" | "text">("video");

  // Check auth
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (!user) {
        router.push("/auth");
        return;
      }

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
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <Link
              href="/broadcast"
              className="p-2 -ml-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-3xl font-bold">Build</h1>
                <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary font-medium">
                  Beta
                </span>
              </div>
              <p className="text-muted-foreground text-sm">
                Create videos, images, and text content for your broadcasts.
              </p>
            </div>
          </div>
        </div>

        {/* Content Type Selector */}
        <div className="mb-6">
          <div className="inline-flex items-center p-1 rounded-lg bg-muted/50 border border-border">
            <button
              onClick={() => setContentType("video")}
              className={cn(
                "px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 flex items-center gap-2",
                contentType === "video"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Video
            </button>
            <button
              onClick={() => setContentType("image")}
              className={cn(
                "px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 flex items-center gap-2",
                contentType === "image"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Image
            </button>
            <button
              onClick={() => setContentType("text")}
              className={cn(
                "px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 flex items-center gap-2",
                contentType === "text"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Text
            </button>
          </div>
        </div>

        {/* Editor Area */}
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          {/* Video Editor */}
          {contentType === "video" && <VideoEditor />}

          {/* Image Editor */}
          {contentType === "image" && (
            <div className="min-h-[600px] flex flex-col">
              <div className="flex items-center justify-between p-4 border-b border-border bg-muted/30">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium">Image Editor</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-600 dark:text-purple-400">
                    Canvas
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>1080 × 1080</span>
                  <span>•</span>
                  <span>PNG</span>
                </div>
              </div>

              {/* Canvas Area */}
              <div className="flex-1 bg-[#1a1a1a] flex">
                {/* Tools Sidebar */}
                <div className="w-14 border-r border-border bg-muted/30 p-2 flex flex-col gap-1">
                  {[
                    { icon: "M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z", label: "Draw" },
                    { icon: "M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z", label: "Image" },
                    { icon: "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z", label: "Text" },
                    { icon: "M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z", label: "Shapes" },
                  ].map((tool, i) => (
                    <button key={i} className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground" title={tool.label}>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tool.icon} />
                      </svg>
                    </button>
                  ))}
                </div>

                {/* Canvas */}
                <div className="flex-1 flex items-center justify-center p-8">
                  <div className="aspect-square w-full max-w-lg bg-white rounded-lg shadow-2xl flex items-center justify-center">
                    <div className="text-center text-gray-400">
                      <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p className="text-sm">Click to add elements</p>
                    </div>
                  </div>
                </div>

                {/* Properties Panel */}
                <div className="w-64 border-l border-border bg-muted/30 p-4">
                  <h3 className="text-sm font-medium mb-4">Properties</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs text-muted-foreground">Background</label>
                      <div className="flex gap-2 mt-1">
                        {["#ffffff", "#f3f4f6", "#1f2937", "#3b82f6", "#10b981"].map((color) => (
                          <button
                            key={color}
                            className="w-8 h-8 rounded-lg border border-border"
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">Size</label>
                      <select className="w-full mt-1 px-3 py-2 rounded-lg border border-border bg-background text-sm">
                        <option>1080 × 1080 (Square)</option>
                        <option>1920 × 1080 (16:9)</option>
                        <option>1080 × 1920 (9:16)</option>
                        <option>1200 × 628 (OG Image)</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Text Editor */}
          {contentType === "text" && (
            <div className="min-h-[600px] flex flex-col">
              <div className="flex items-center justify-between p-4 border-b border-border bg-muted/30">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium">Text Editor</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-600 dark:text-green-400">
                    Rich Text
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm">Preview</Button>
                </div>
              </div>

              {/* Toolbar */}
              <div className="flex items-center gap-1 p-2 border-b border-border bg-muted/20">
                {[
                  { icon: "M6 12h8m-8 4h12M6 8h12", label: "Paragraph" },
                  { icon: "M4 6h16M4 12h8m-8 6h16", label: "Heading" },
                  { icon: "M13 10V3L4 14h7v7l9-11h-7z", label: "Bold" },
                  { icon: "M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4", label: "Code" },
                  { icon: "M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1", label: "Link" },
                  { icon: "M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z", label: "Image" },
                ].map((tool, i) => (
                  <button key={i} className="p-2 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground" title={tool.label}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tool.icon} />
                    </svg>
                  </button>
                ))}
                <div className="w-px h-6 bg-border mx-2" />
                <select className="px-2 py-1 rounded border border-border bg-background text-sm">
                  <option>Paragraph</option>
                  <option>Heading 1</option>
                  <option>Heading 2</option>
                  <option>Heading 3</option>
                </select>
              </div>

              {/* Editor Content */}
              <div className="flex-1 p-8">
                <div className="max-w-3xl mx-auto prose prose-neutral dark:prose-invert">
                  <div
                    contentEditable
                    className="min-h-[400px] focus:outline-none"
                    suppressContentEditableWarning
                  >
                    <h1 className="text-3xl font-bold text-foreground">Start writing...</h1>
                    <p className="text-muted-foreground">
                      Create blog posts, newsletters, social media captions, and more.
                      Use the toolbar above to format your text.
                    </p>
                  </div>
                </div>
              </div>

              {/* Word Count */}
              <div className="flex items-center justify-between p-3 border-t border-border bg-muted/30 text-xs text-muted-foreground">
                <span>0 words • 0 characters</span>
                <span>Last saved: Never</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
