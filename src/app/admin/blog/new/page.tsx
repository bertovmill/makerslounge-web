"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Badge } from "@/components/ui/badge";
import BlogPostForm from "../BlogPostForm";

export default function NewBlogPostPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user || user.email !== "bertmill19@gmail.com") {
      router.push("/profile");
      return;
    }

    setUserId(user.id);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!userId) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <Badge variant="secondary" className="mb-4">
          Blog Admin
        </Badge>
        <h1 className="text-4xl font-bold mb-2">Create New Blog Post</h1>
        <p className="text-muted-foreground mb-8">
          Write and publish a new blog post
        </p>

        <BlogPostForm userId={userId} />
      </div>
    </div>
  );
}
