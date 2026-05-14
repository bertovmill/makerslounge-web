import { supabase } from "./supabase";

export interface BlogAuthor {
  name: string;
  photo?: string;
  role?: string;
}

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string; // markdown
  coverImage?: string;
  publishDate: string; // ISO date string
  author: BlogAuthor;
  tags: string[];
  readTimeMinutes: number;
  isFeatured: boolean;
}

// Database types (matches Supabase schema)
export interface BlogPostRow {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  cover_image: string | null;
  author_id: string;
  tags: string[];
  read_time_minutes: number;
  is_published: boolean;
  is_featured: boolean;
  published_at: string | null;
  newsletter_sent_at: string | null;
  created_at: string;
  updated_at: string;
  profiles?: {
    id: string;
    name: string | null;
    photo_url: string | null;
  };
}

// Convert database row to BlogPost format
function dbRowToBlogPost(row: BlogPostRow): BlogPost {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    content: row.content,
    coverImage: row.cover_image || undefined,
    publishDate: row.published_at || row.created_at,
    author: {
      name: row.profiles?.name || "MakersLounge",
      photo: row.profiles?.photo_url || undefined,
      role: "Founder, MakersLounge",
    },
    tags: row.tags || [],
    readTimeMinutes: row.read_time_minutes || 5,
    isFeatured: row.is_featured || false,
  };
}

// Get all published posts sorted by date (only those published in the past)
export async function getAllPosts(): Promise<BlogPost[]> {
  const { data, error } = await supabase
    .from("blog_posts")
    .select(`
      *,
      profiles (
        id,
        name,
        photo_url
      )
    `)
    .eq("is_published", true)
    .lte("published_at", new Date().toISOString())
    .order("published_at", { ascending: false });

  if (error) {
    console.error("Error fetching blog posts:", error);
    return [];
  }

  return (data || []).map(dbRowToBlogPost);
}

// Get featured posts (only those published in the past)
export async function getFeaturedPosts(): Promise<BlogPost[]> {
  const { data, error } = await supabase
    .from("blog_posts")
    .select(`
      *,
      profiles (
        id,
        name,
        photo_url
      )
    `)
    .eq("is_published", true)
    .eq("is_featured", true)
    .lte("published_at", new Date().toISOString())
    .order("published_at", { ascending: false });

  if (error) {
    console.error("Error fetching featured posts:", error);
    return [];
  }

  return (data || []).map(dbRowToBlogPost);
}

// Get a single post by slug (only if published in the past)
export async function getPostBySlug(slug: string): Promise<BlogPost | null> {
  const { data, error } = await supabase
    .from("blog_posts")
    .select(`
      *,
      profiles (
        id,
        name,
        photo_url
      )
    `)
    .eq("slug", slug)
    .eq("is_published", true)
    .lte("published_at", new Date().toISOString())
    .single();

  if (error) {
    console.error("Error fetching post by slug:", error);
    return null;
  }

  return data ? dbRowToBlogPost(data) : null;
}

// Get posts by tag (only those published in the past)
export async function getPostsByTag(tag: string): Promise<BlogPost[]> {
  const { data, error } = await supabase
    .from("blog_posts")
    .select(`
      *,
      profiles (
        id,
        name,
        photo_url
      )
    `)
    .eq("is_published", true)
    .lte("published_at", new Date().toISOString())
    .contains("tags", [tag])
    .order("published_at", { ascending: false });

  if (error) {
    console.error("Error fetching posts by tag:", error);
    return [];
  }

  return (data || []).map(dbRowToBlogPost);
}

// Get all unique tags (only from posts published in the past)
export async function getAllTags(): Promise<string[]> {
  const { data, error } = await supabase
    .from("blog_posts")
    .select("tags")
    .eq("is_published", true)
    .lte("published_at", new Date().toISOString());

  if (error) {
    console.error("Error fetching tags:", error);
    return [];
  }

  const tagSet = new Set<string>();
  data?.forEach((post) => {
    post.tags?.forEach((tag: string) => tagSet.add(tag));
  });

  return Array.from(tagSet).sort();
}

// Admin functions

// Get ALL posts (including drafts) for admin
export async function getAllPostsAdmin(): Promise<BlogPostRow[]> {
  const { data, error } = await supabase
    .from("blog_posts")
    .select(`
      *,
      profiles (
        id,
        name,
        photo_url
      )
    `)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching all posts:", error);
    return [];
  }

  return data || [];
}

// Get a single post by ID (for editing)
export async function getPostById(id: string): Promise<BlogPostRow | null> {
  const { data, error } = await supabase
    .from("blog_posts")
    .select(`
      *,
      profiles (
        id,
        name,
        photo_url
      )
    `)
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error fetching post by ID:", error);
    return null;
  }

  return data;
}

// Create a new blog post
export async function createPost(post: Partial<BlogPostRow>): Promise<{ success: boolean; data?: BlogPostRow; error?: string }> {
  const { data, error } = await supabase
    .from("blog_posts")
    .insert(post)
    .select()
    .single();

  if (error) {
    console.error("Error creating post:", error);
    return { success: false, error: error.message };
  }

  return { success: true, data };
}

// Update an existing blog post
export async function updatePost(id: string, updates: Partial<BlogPostRow>): Promise<{ success: boolean; data?: BlogPostRow; error?: string }> {
  const { data, error } = await supabase
    .from("blog_posts")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating post:", error);
    return { success: false, error: error.message };
  }

  return { success: true, data };
}

// Delete a blog post
export async function deletePost(id: string): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from("blog_posts")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Error deleting post:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
}
