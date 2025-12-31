"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { User } from "@supabase/supabase-js";
import FeedCard from "@/components/FeedCard";
import ProjectModal from "@/components/ProjectModal";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

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

interface Project {
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
  likeCount: number;
  hasLiked: boolean;
  comments: Comment[];
}

export default function HomePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [postTitle, setPostTitle] = useState("");
  const [postDescription, setPostDescription] = useState("");
  const [isPosting, setIsPosting] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.push("/");
      } else {
        setUser(user);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.user) {
        router.push("/");
      } else {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  useEffect(() => {
    if (!user) return;

    const fetchProjects = async () => {
      // Fetch projects with profiles
      const { data: projectsData, error } = await supabase
        .from("projects")
        .select(`
          id,
          title,
          description,
          media_urls,
          created_at,
          profiles (
            id,
            name,
            photo_url
          )
        `)
        .order("created_at", { ascending: false })
        .limit(10);

      if (error || !projectsData) {
        setLoadingProjects(false);
        return;
      }

      const projectIds = projectsData.map((p) => p.id);

      // Fetch like counts for all projects
      const { data: likesData } = await supabase
        .from("likes")
        .select("project_id")
        .in("project_id", projectIds);

      // Check which projects user has liked
      let userLikes: string[] = [];
      if (user) {
        const { data: userLikesData } = await supabase
          .from("likes")
          .select("project_id")
          .eq("user_id", user.id)
          .in("project_id", projectIds);
        userLikes = userLikesData?.map((l) => l.project_id) || [];
      }

      // Fetch comments for all projects
      const { data: commentsData } = await supabase
        .from("comments")
        .select(`
          id,
          project_id,
          content,
          created_at,
          profiles (
            id,
            name,
            photo_url
          )
        `)
        .in("project_id", projectIds)
        .order("created_at", { ascending: false });

      // Count likes per project
      const likeCountMap: Record<string, number> = {};
      likesData?.forEach((like) => {
        likeCountMap[like.project_id] = (likeCountMap[like.project_id] || 0) + 1;
      });

      // Group comments by project
      const commentsMap: Record<string, Comment[]> = {};
      commentsData?.forEach((comment) => {
        if (!commentsMap[comment.project_id]) {
          commentsMap[comment.project_id] = [];
        }
        commentsMap[comment.project_id].push({
          id: comment.id,
          content: comment.content,
          created_at: comment.created_at,
          profiles: Array.isArray(comment.profiles) ? comment.profiles[0] || null : comment.profiles,
        });
      });

      // Combine all data
      const enrichedProjects = projectsData.map((p) => ({
        ...p,
        profiles: Array.isArray(p.profiles) ? p.profiles[0] || null : p.profiles,
        likeCount: likeCountMap[p.id] || 0,
        hasLiked: userLikes.includes(p.id),
        comments: commentsMap[p.id] || [],
      }));

      setProjects(enrichedProjects as Project[]);
      setLoadingProjects(false);
    };

    fetchProjects();
  }, [user]);

  const handlePost = async () => {
    if (!user || !postTitle.trim()) return;

    setIsPosting(true);
    try {
      const { data: newProject, error } = await supabase
        .from("projects")
        .insert({
          user_id: user.id,
          title: postTitle.trim(),
          description: postDescription.trim() || null,
          media_urls: [],
        })
        .select()
        .single();

      if (error) throw error;

      if (newProject) {
        // Add the new project to the top of the feed
        setProjects([
          {
            ...newProject,
            profiles: {
              id: user.id,
              name: null,
              photo_url: null,
            },
            likeCount: 0,
            hasLiked: false,
            comments: [],
          },
          ...projects,
        ]);

        // Reset form
        setPostTitle("");
        setPostDescription("");
      }
    } catch (error) {
      console.error("Error creating project:", error);
    } finally {
      setIsPosting(false);
    }
  };

  if (!user) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen relative">
      {/* Composer Section */}
      <section className="relative max-w-2xl mx-auto px-4 pt-6 pb-0">
        {/* Twitter-style composer */}
        <Card className="p-5 border-border shadow-sm">
          <div className="flex gap-4">
            {/* User Avatar */}
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 via-teal-500 to-orange-500 flex items-center justify-center text-white font-bold text-lg overflow-hidden flex-shrink-0">
              {user.user_metadata?.avatar_url ? (
                <img
                  src={user.user_metadata.avatar_url}
                  alt="Your avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                user.email?.charAt(0).toUpperCase() || "?"
              )}
            </div>

            {/* Input area */}
            <div className="flex-1">
              <input
                type="text"
                placeholder="What are you working on?"
                value={postTitle}
                onChange={(e) => setPostTitle(e.target.value)}
                className="w-full bg-transparent border-none outline-none text-lg py-2 placeholder:text-muted-foreground"
              />

              {/* Action icons */}
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-border/40">
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowProjectModal(true)}
                    className="w-9 h-9 rounded-full hover:bg-primary/10 flex items-center justify-center text-primary transition-colors"
                    title="Add media"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </button>
                </div>

                <Button
                  size="sm"
                  className="rounded-full px-6"
                  onClick={handlePost}
                  disabled={!postTitle.trim() || isPosting}
                >
                  {isPosting ? "Posting..." : "Post"}
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </section>

      {/* Project Feed */}
      <section className="relative max-w-2xl mx-auto px-4 py-6">
        <div className="space-y-4">
          {loadingProjects ? (
            <div className="text-center py-12 text-muted-foreground">Loading projects...</div>
          ) : projects.length === 0 ? (
            <Card className="p-8 text-center border-dashed">
              <p className="text-muted-foreground mb-4">No projects yet. Be the first to share!</p>
              <Button
                className="rounded-full"
                onClick={() => setShowProjectModal(true)}
              >
                Create a project
              </Button>
            </Card>
          ) : (
            <>
              {projects.map((project) => (
                <FeedCard
                  key={project.id}
                  project={project}
                  currentUserId={user?.id}
                  initialLikeCount={project.likeCount}
                  initialHasLiked={project.hasLiked}
                  initialComments={project.comments}
                />
              ))}
            </>
          )}
        </div>
      </section>

      {/* Project Modal */}
      {showProjectModal && user && (
        <ProjectModal
          userId={user.id}
          onClose={() => setShowProjectModal(false)}
          onSave={(newProject) => {
            // Add the new project to the top of the feed
            setProjects([
              {
                ...newProject,
                created_at: new Date().toISOString(),
                profiles: {
                  id: user.id,
                  name: null,
                  photo_url: null,
                },
                likeCount: 0,
                hasLiked: false,
                comments: [],
              },
              ...projects,
            ]);
            setShowProjectModal(false);
          }}
        />
      )}
    </div>
  );
}
