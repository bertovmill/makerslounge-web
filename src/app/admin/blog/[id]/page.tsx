"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { getPostById } from "@/lib/blog-client";
import { Badge } from "@/components/ui/badge";
import BlogPostForm from "../BlogPostForm";
import type { BlogPostRow } from "@/lib/blog-types";

export default function EditBlogPostPage() {
  const { user: authUser, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const [userId, setUserId] = useState<string | null>(null);
  const [post, setPost] = useState<BlogPostRow | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuthAndLoadPost();
  }, []);

  const checkAuthAndLoadPost = async () => {
    // Check authentication
    const user = authUser;

    if (!user || user.email !== "bertmill19@gmail.com") {
      router.push("/profile");
      return;
    }

    setUserId(user.id);

    // Load the post
    const postData = await getPostById(params.id as string);

    if (!postData) {
      router.push("/admin");
      return;
    }

    setPost(postData);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!userId || !post) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <Badge variant="secondary" className="mb-4">
          Blog Admin
        </Badge>
        <h1 className="text-4xl font-bold mb-2">Edit Blog Post</h1>
        <p className="text-muted-foreground mb-8">
          Update and manage your blog post
        </p>

        <BlogPostForm userId={userId} post={post} />
      </div>
    </div>
  );
}
