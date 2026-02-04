"use client";

import { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { User } from "@supabase/supabase-js";
import { useSidebar } from "@/context/SidebarContext";

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

// Dynamic import for Image Generator
const ImageGenerator = dynamic(
  () => import("@/components/broadcast/ImageGenerator").then((mod) => mod.ImageGenerator),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-[600px] flex items-center justify-center bg-muted/30 rounded-xl">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-sm text-muted-foreground">Loading image generator...</p>
        </div>
      </div>
    ),
  }
);

export default function BuildPage() {
  const router = useRouter();
  const { collapsed, setCollapsed } = useSidebar();
  const prevCollapsed = useRef(collapsed);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [contentType, setContentType] = useState<"video" | "image" | "text">("video");

  // Collapse sidebar on mount, restore on unmount
  useEffect(() => {
    prevCollapsed.current = collapsed;
    setCollapsed(true);
    return () => {
      setCollapsed(prevCollapsed.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    <div className={cn("min-h-screen", contentType === "video" ? "p-0" : "p-3 sm:p-6")}>
      <div className={cn(contentType !== "video" && "max-w-7xl mx-auto")}>
        {/* Condensed Header Bar */}
        <div className={cn(
          "flex items-center justify-between",
          contentType === "video" ? "px-3 py-2 border-b border-border" : "mb-4 sm:mb-6"
        )}>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/broadcast"
              className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </Link>
            <h1 className="text-sm sm:text-lg font-semibold">Build</h1>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/20 text-primary font-medium">
              Beta
            </span>

            <div className="w-px h-5 bg-border mx-1" />

            {/* Content Type Selector - inline */}
            <div className="inline-flex items-center p-0.5 rounded-lg bg-muted/50 border border-border">
              <button
                onClick={() => setContentType("video")}
                className={cn(
                  "px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm font-medium rounded-md transition-all duration-200 flex items-center gap-1.5",
                  contentType === "video"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Video
              </button>
              <button
                onClick={() => setContentType("image")}
                className={cn(
                  "px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm font-medium rounded-md transition-all duration-200 flex items-center gap-1.5",
                  contentType === "image"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Image
              </button>
              <button
                onClick={() => setContentType("text")}
                className={cn(
                  "px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm font-medium rounded-md transition-all duration-200 flex items-center gap-1.5",
                  contentType === "text"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Text
              </button>
            </div>
          </div>
        </div>

        {/* Video Editor - full width, no container */}
        {contentType === "video" && <VideoEditor className="rounded-none border-0 shadow-none h-[calc(100vh-41px)]" />}

        {/* Editor Area */}
        {contentType !== "video" && (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          {/* AI Image Generator */}
          {contentType === "image" && <ImageGenerator />}

          {/* Text Editor */}
          {contentType === "text" && (
            <div className="min-h-[400px] sm:min-h-[600px] flex flex-col">
              <div className="flex items-center justify-between p-2 sm:p-4 border-b border-border bg-muted/30">
                <div className="flex items-center gap-2 sm:gap-3">
                  <span className="text-xs sm:text-sm font-medium">Text Editor</span>
                  <span className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded-full bg-green-500/20 text-green-600 dark:text-green-400">
                    Rich Text
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" className="text-xs sm:text-sm h-7 sm:h-9 px-2 sm:px-3">Preview</Button>
                </div>
              </div>

              {/* Toolbar */}
              <div className="flex items-center gap-0.5 sm:gap-1 p-1.5 sm:p-2 border-b border-border bg-muted/20 overflow-x-auto">
                {[
                  { icon: "M6 12h8m-8 4h12M6 8h12", label: "Paragraph" },
                  { icon: "M4 6h16M4 12h8m-8 6h16", label: "Heading" },
                  { icon: "M13 10V3L4 14h7v7l9-11h-7z", label: "Bold" },
                  { icon: "M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4", label: "Code" },
                  { icon: "M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1", label: "Link" },
                  { icon: "M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z", label: "Image" },
                ].map((tool, i) => (
                  <button key={i} className="p-1.5 sm:p-2 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground flex-shrink-0" title={tool.label}>
                    <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tool.icon} />
                    </svg>
                  </button>
                ))}
                <div className="w-px h-5 sm:h-6 bg-border mx-1 sm:mx-2 flex-shrink-0" />
                <select className="px-1.5 sm:px-2 py-1 rounded border border-border bg-background text-xs sm:text-sm flex-shrink-0">
                  <option>Paragraph</option>
                  <option>Heading 1</option>
                  <option>Heading 2</option>
                  <option>Heading 3</option>
                </select>
              </div>

              {/* Editor Content */}
              <div className="flex-1 p-4 sm:p-8">
                <div className="max-w-3xl mx-auto prose prose-neutral dark:prose-invert prose-sm sm:prose-base">
                  <div
                    contentEditable
                    className="min-h-[200px] sm:min-h-[400px] focus:outline-none"
                    suppressContentEditableWarning
                  >
                    <h1 className="text-xl sm:text-3xl font-bold text-foreground">Start writing...</h1>
                    <p className="text-muted-foreground text-sm sm:text-base">
                      Create blog posts, newsletters, social media captions, and more.
                      Use the toolbar above to format your text.
                    </p>
                  </div>
                </div>
              </div>

              {/* Word Count */}
              <div className="flex items-center justify-between p-2 sm:p-3 border-t border-border bg-muted/30 text-[10px] sm:text-xs text-muted-foreground">
                <span>0 words • 0 characters</span>
                <span className="hidden sm:inline">Last saved: Never</span>
              </div>
            </div>
          )}
        </div>
        )}
      </div>
    </div>
  );
}
