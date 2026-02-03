"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { User } from "@supabase/supabase-js";
import FeedCard from "@/components/FeedCard";
import ProjectModal from "@/components/ProjectModal";
import { Button } from "@/components/ui/button";

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
  const [authChecked, setAuthChecked] = useState(false);
  const [userProfile, setUserProfile] = useState<{ id: string; name: string | null; photo_url: string | null; username?: string | null } | null>(null);
  const [suggestedProfiles, setSuggestedProfiles] = useState<{ id: string; name: string | null; photo_url: string | null; username?: string | null }[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [postTitle, setPostTitle] = useState("");
  const [postDescription, setPostDescription] = useState("");
  const [isPosting, setIsPosting] = useState(false);
  const [pastedImages, setPastedImages] = useState<File[]>([]);
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]);

  useEffect(() => {
    const checkAuthAndOnboarding = async (userId: string) => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("onboarding_completed")
        .eq("id", userId)
        .single();

      // If no profile or not onboarded, redirect to onboarding
      if (!profile || !profile.onboarding_completed) {
        router.push("/onboarding");
        return false;
      }
      return true;
    };

    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) {
        router.push("/");
      } else {
        const isOnboarded = await checkAuthAndOnboarding(user.id);
        if (isOnboarded) {
          setUser(user);
        }
      }
      setAuthChecked(true);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!session?.user) {
        router.push("/");
      } else {
        const isOnboarded = await checkAuthAndOnboarding(session.user.id);
        if (isOnboarded) {
          setUser(session.user);
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  // Fetch user's profile and suggested profiles
  useEffect(() => {
    if (!user) return;

    const fetchUserProfile = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id, name, photo_url, username")
        .eq("id", user.id)
        .single();

      if (data) {
        setUserProfile(data);
      }
    };

    const fetchSuggestedProfiles = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id, name, photo_url, username")
        .neq("id", user.id)
        .limit(5);

      if (data) {
        setSuggestedProfiles(data);
      }
    };

    fetchUserProfile();
    fetchSuggestedProfiles();
  }, [user]);

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

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    const imageFiles: File[] = [];
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) {
          imageFiles.push(file);
        }
      }
    }

    if (imageFiles.length > 0) {
      // Add new images to existing ones
      setPastedImages(prev => [...prev, ...imageFiles]);

      // Create preview URLs for new images
      const newPreviewUrls = imageFiles.map(file => URL.createObjectURL(file));
      setImagePreviewUrls(prev => [...prev, ...newPreviewUrls]);
    }
  };

  const removeImage = (index: number) => {
    // Revoke the object URL to free memory
    URL.revokeObjectURL(imagePreviewUrls[index]);

    setPastedImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviewUrls(prev => prev.filter((_, i) => i !== index));
  };

  const handlePost = async () => {
    if (!user || !postTitle.trim()) return;

    setIsPosting(true);
    try {
      // Upload images to Supabase storage
      const uploadedUrls: string[] = [];

      for (const file of pastedImages) {
        const fileExt = file.name.split('.').pop() || 'png';
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `projects/${user.id}/new/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('media')
          .upload(filePath, file);

        if (uploadError) {
          console.error('Error uploading image:', uploadError);
          continue;
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('media')
          .getPublicUrl(filePath);

        if (publicUrl) {
          uploadedUrls.push(publicUrl);
        }
      }

      const { data: newProject, error } = await supabase
        .from("projects")
        .insert({
          user_id: user.id,
          title: postTitle.trim(),
          description: postDescription.trim() || null,
          media_urls: uploadedUrls,
        })
        .select()
        .single();

      if (error) throw error;

      if (newProject) {
        // Add the new project to the top of the feed
        setProjects([
          {
            ...newProject,
            profiles: userProfile || {
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

        // Cleanup preview URLs
        imagePreviewUrls.forEach(url => URL.revokeObjectURL(url));

        // Reset form
        setPostTitle("");
        setPostDescription("");
        setPastedImages([]);
        setImagePreviewUrls([]);
      }
    } catch (error) {
      console.error("Error creating project:", error);
    } finally {
      setIsPosting(false);
    }
  };

  if (!authChecked || !user) {
    // Show loading skeleton while checking auth
    return (
      <div className="min-h-screen relative">
        <div className="w-full max-w-[932px] mx-auto px-4 pt-6 flex gap-8">
          <div className="w-full max-w-[600px]">
            {/* Composer skeleton */}
            <div className="pb-4 mb-2 border-b border-border/60">
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-full bg-muted animate-pulse flex-shrink-0" />
                <div className="flex-1 space-y-3">
                  <div className="h-7 bg-muted rounded animate-pulse w-3/4" />
                  <div className="flex justify-between items-center">
                    <div className="w-8 h-8 bg-muted rounded-full animate-pulse" />
                    <div className="w-16 h-8 bg-muted rounded-full animate-pulse" />
                  </div>
                </div>
              </div>
            </div>
            {/* Feed skeleton */}
            <div className="space-y-6 pt-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="space-y-3">
                  <div className="flex gap-3">
                    <div className="w-10 h-10 rounded-full bg-muted animate-pulse" />
                    <div className="space-y-2 flex-1">
                      <div className="h-4 bg-muted rounded animate-pulse w-1/4" />
                      <div className="h-3 bg-muted rounded animate-pulse w-1/6" />
                    </div>
                  </div>
                  <div className="h-4 bg-muted rounded animate-pulse w-full" />
                  <div className="h-4 bg-muted rounded animate-pulse w-2/3" />
                  <div className="h-48 bg-muted rounded-xl animate-pulse" />
                </div>
              ))}
            </div>
          </div>
          {/* Sidebar skeleton - hidden on mobile */}
          <aside className="hidden lg:block w-[300px] flex-shrink-0">
            <div className="sticky top-6 space-y-6">
              <div className="flex items-center gap-3 pb-5 border-b border-border/60">
                <div className="w-12 h-12 rounded-full bg-muted animate-pulse" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-muted rounded animate-pulse w-2/3" />
                  <div className="h-3 bg-muted rounded animate-pulse w-1/2" />
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    );
  }

  const userInitials = userProfile?.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || user.email?.charAt(0).toUpperCase() || "?";

  return (
    <div className="min-h-screen relative">
      <div className="w-full max-w-[932px] mx-auto px-4 pt-6 flex gap-8">
        {/* Main Feed Column */}
        <div className="w-full max-w-[600px]">
          {/* Composer Section - Cleaner design */}
          <div className="pb-4 mb-2 border-b border-border/60">
            <div className="flex gap-3">
              {/* User Avatar */}
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-rose-400 to-orange-400 flex items-center justify-center text-white font-semibold text-sm overflow-hidden flex-shrink-0">
                {userProfile?.photo_url ? (
                  <img
                    src={userProfile.photo_url}
                    alt="Your avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  userInitials
                )}
              </div>

              {/* Input area */}
              <div className="flex-1">
                <textarea
                  placeholder="What are you working on?"
                  value={postTitle}
                  onChange={(e) => setPostTitle(e.target.value)}
                  rows={1}
                  className="w-full bg-transparent border-none outline-none text-[15px] py-1.5 placeholder:text-muted-foreground resize-none overflow-hidden"
                  style={{ minHeight: '28px' }}
                  onInput={(e) => {
                    const target = e.target as HTMLTextAreaElement;
                    target.style.height = 'auto';
                    target.style.height = target.scrollHeight + 'px';
                  }}
                  onKeyDown={(e) => {
                    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                      e.preventDefault();
                      handlePost();
                    }
                  }}
                  onPaste={handlePaste}
                />

                {/* Image Previews */}
                {imagePreviewUrls.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {imagePreviewUrls.map((url, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={url}
                          alt={`Pasted image ${index + 1}`}
                          className="h-20 w-20 object-cover rounded-xl border border-border/40"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute -top-2 -right-2 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Remove image"
                        >
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Action icons - cleaner row */}
                <div className="flex items-center justify-between mt-3">
                  <div className="flex gap-1">
                    <button
                      onClick={() => setShowProjectModal(true)}
                      className="w-8 h-8 rounded-full hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                      title="Add media"
                    >
                      <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </button>
                  </div>

                  <Button
                    size="sm"
                    className="rounded-full px-5 h-8"
                    onClick={handlePost}
                    disabled={!postTitle.trim() || isPosting}
                  >
                    {isPosting ? "Posting..." : "Post"}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Project Feed - cleaner dividers */}
          <div className="pb-6">
            {loadingProjects ? (
              <div className="text-center py-12 text-muted-foreground text-sm">Loading...</div>
            ) : projects.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-muted-foreground text-sm mb-4">No projects yet. Be the first to share!</p>
                <Button
                  variant="outline"
                  className="rounded-full"
                  onClick={() => setShowProjectModal(true)}
                >
                  Create a project
                </Button>
              </div>
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
                    onDelete={(projectId) => {
                      setProjects(projects.filter((p) => p.id !== projectId));
                    }}
                    onUpdate={(projectId, title, description) => {
                      setProjects(projects.map((p) =>
                        p.id === projectId ? { ...p, title, description } : p
                      ));
                    }}
                  />
                ))}
              </>
            )}
          </div>
        </div>

        {/* Right Sidebar - Hidden on mobile */}
        <aside className="hidden lg:block w-[300px] flex-shrink-0">
          <div className="sticky top-6 space-y-6">
            {/* Current User Profile */}
            <div className="flex items-center gap-3 pb-5 border-b border-border/60">
              <Link href="/profile">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-rose-400 to-orange-400 flex items-center justify-center text-white font-semibold overflow-hidden cursor-pointer hover:opacity-90 transition-opacity">
                  {userProfile?.photo_url ? (
                    <img
                      src={userProfile.photo_url}
                      alt={userProfile.name || "You"}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    userInitials
                  )}
                </div>
              </Link>
              <div className="flex-1 min-w-0">
                <Link href="/profile">
                  <p className="font-semibold text-[15px] hover:underline cursor-pointer truncate">
                    {userProfile?.name || "Anonymous"}
                  </p>
                </Link>
                {userProfile?.username && (
                  <p className="text-sm text-muted-foreground truncate">@{userProfile.username}</p>
                )}
              </div>
            </div>

            {/* Suggested Makers */}
            {suggestedProfiles.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-muted-foreground">Suggested for you</h3>
                  <Link href="/people" className="text-xs text-primary hover:underline font-medium">
                    See All
                  </Link>
                </div>
                <div className="space-y-3">
                  {suggestedProfiles.map((profile) => {
                    const initials = profile.name
                      ?.split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2) || "?";

                    return (
                      <div key={profile.id} className="flex items-center gap-3">
                        <Link href={`/profile/${profile.id}`}>
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-rose-400 to-orange-400 flex items-center justify-center text-white font-semibold text-xs overflow-hidden cursor-pointer hover:opacity-90 transition-opacity">
                            {profile.photo_url ? (
                              <img
                                src={profile.photo_url}
                                alt={profile.name || "User"}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              initials
                            )}
                          </div>
                        </Link>
                        <div className="flex-1 min-w-0">
                          <Link href={`/profile/${profile.id}`}>
                            <p className="font-medium text-sm hover:underline cursor-pointer truncate">
                              {profile.name || "Anonymous"}
                            </p>
                          </Link>
                          <p className="text-xs text-muted-foreground truncate">
                            {profile.username ? `@${profile.username}` : "Suggested for you"}
                          </p>
                        </div>
                        <Link
                          href={`/profile/${profile.id}`}
                          className="text-xs font-semibold text-primary hover:text-primary/80"
                        >
                          View
                        </Link>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </aside>
      </div>

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
                profiles: userProfile || {
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
