"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { User } from "@supabase/supabase-js";
import FeedCard from "@/components/FeedCard";
import ProjectModal from "@/components/ProjectModal";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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

interface FeaturedMaker {
  id: string;
  name: string | null;
  photo_url: string | null;
  skills: string[] | null;
}

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [featuredMakers, setFeaturedMakers] = useState<FeaturedMaker[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [postTitle, setPostTitle] = useState("");
  const [postDescription, setPostDescription] = useState("");
  const [isComposerExpanded, setIsComposerExpanded] = useState(false);
  const [isPosting, setIsPosting] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
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

      // If user is logged in, check which projects they've liked
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

    const fetchFeaturedMakers = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id, name, photo_url, skills")
        .not("name", "is", null)
        .limit(4);

      if (data) {
        setFeaturedMakers(data);
      }
    };

    fetchProjects();
    fetchFeaturedMakers();
  }, [user]);

  const handleAuthRequired = () => {
    document.querySelector<HTMLButtonElement>('[data-auth-button]')?.click();
  };

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
        setIsComposerExpanded(false);
      }
    } catch (error) {
      console.error("Error creating project:", error);
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <div className="min-h-screen relative">
      {/* Hero Section for non-logged-in users */}
      {!user ? (
        <>
          {/* Full-width hero with gradient background */}
          <section className="relative min-h-[90vh] flex items-center overflow-hidden">
            {/* Animated gradient background */}
            <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
              {/* Grid pattern overlay */}
              <div
                className="absolute inset-0 opacity-[0.03]"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                }}
              />
              {/* Gradient orbs */}
              <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-blue-500/20 rounded-full blur-[120px] animate-pulse" />
              <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-orange-500/15 rounded-full blur-[100px]" />
              <div className="absolute top-1/2 right-1/3 w-[400px] h-[400px] bg-teal-500/10 rounded-full blur-[80px]" />
            </div>

            {/* Wave gradient accent bar */}
            <div className="absolute top-0 left-0 right-0 h-1 gradient-wave" />

            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
              <div className="grid lg:grid-cols-2 gap-16 items-center">
                {/* Left content */}
                <div className="text-center lg:text-left">
                  <Badge
                    variant="outline"
                    className="mb-8 px-4 py-2 text-sm border-white/20 text-white/80 bg-white/5 backdrop-blur-sm"
                  >
                    Toronto&apos;s maker community
                  </Badge>

                  <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold leading-[1.1] mb-8 text-white tracking-tight">
                    Where builders{" "}
                    <span className="relative">
                      <span className="bg-gradient-to-r from-blue-400 via-teal-400 to-orange-400 bg-clip-text text-transparent">
                        connect
                      </span>
                    </span>{" "}
                    and{" "}
                    <span className="bg-gradient-to-r from-orange-400 to-yellow-400 bg-clip-text text-transparent">
                      create
                    </span>
                  </h1>

                  <p className="text-xl text-white/60 mb-10 leading-relaxed max-w-xl mx-auto lg:mx-0">
                    Share your projects, discover collaborators, and grow your network in Toronto&apos;s most supportive community for makers.
                  </p>

                  <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                    <Button
                      asChild
                      size="lg"
                      className="rounded-full px-8 py-6 text-lg bg-white text-slate-900 hover:bg-white/90 shadow-lg shadow-white/10"
                    >
                      <Link href="/people">Explore makers</Link>
                    </Button>
                    <Button
                      variant="outline"
                      size="lg"
                      className="rounded-full px-8 py-6 text-lg border-white/20 text-white bg-white/5 backdrop-blur-sm hover:bg-white/10"
                      onClick={handleAuthRequired}
                    >
                      Join the community
                    </Button>
                  </div>

                  {/* Social proof */}
                  <div className="mt-12 flex items-center gap-6 justify-center lg:justify-start">
                    <div className="flex -space-x-3">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div
                          key={i}
                          className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-teal-500 border-2 border-slate-900 flex items-center justify-center text-white text-xs font-bold"
                        >
                          {String.fromCharCode(64 + i)}
                        </div>
                      ))}
                    </div>
                    <p className="text-white/60 text-sm">
                      <span className="text-white font-semibold">80+ makers</span> already connected
                    </p>
                  </div>
                </div>

                {/* Right side - Event photo with floating cards */}
                <div className="relative hidden lg:block">
                  {/* Main image */}
                  <div className="relative">
                    <div className="absolute -inset-4 bg-gradient-to-r from-blue-500/20 via-teal-500/20 to-orange-500/20 rounded-3xl blur-2xl" />
                    <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
                      <img
                        src="/makerslounge-photos/lounge-networking.jpeg"
                        alt="MakersLounge community event"
                        className="w-full h-auto object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent" />
                    </div>
                  </div>

                  {/* Floating stat card */}
                  <div className="absolute -bottom-6 -left-6 bg-white/10 backdrop-blur-xl rounded-2xl p-5 border border-white/20 shadow-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-yellow-500 flex items-center justify-center">
                        <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-white">4+</p>
                        <p className="text-white/60 text-sm">Events hosted</p>
                      </div>
                    </div>
                  </div>

                  {/* Floating project card */}
                  <div className="absolute -top-4 -right-4 bg-white/10 backdrop-blur-xl rounded-2xl p-4 border border-white/20 shadow-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-teal-500 flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">Projects shared</p>
                        <p className="text-white/60 text-xs">Weekly updates</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Scroll indicator */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/40">
              <span className="text-xs uppercase tracking-widest">Scroll</span>
              <div className="w-6 h-10 border-2 border-white/20 rounded-full flex justify-center pt-2">
                <div className="w-1 h-2 bg-white/40 rounded-full animate-bounce" />
              </div>
            </div>
          </section>

          {/* What you can do section */}
          <section className="relative py-24 bg-background">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-16">
                <Badge variant="secondary" className="mb-4">
                  Platform features
                </Badge>
                <h2 className="text-4xl md:text-5xl font-bold mb-6">
                  Everything you need to{" "}
                  <span className="text-gradient">level up</span>
                </h2>
                <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                  Whether you&apos;re looking for collaborators, feedback, or inspiration — find your people here.
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-8">
                {[
                  {
                    icon: (
                      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    ),
                    title: "Share your projects",
                    description: "Showcase what you're building with images, videos, and detailed descriptions. Get visibility in the community.",
                    color: "from-blue-500 to-blue-600",
                  },
                  {
                    icon: (
                      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    ),
                    title: "Connect with makers",
                    description: "Find people with complementary skills or similar interests. Build your network of builders and creators.",
                    color: "from-teal-500 to-teal-600",
                  },
                  {
                    icon: (
                      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    ),
                    title: "Get feedback",
                    description: "Share ideas early and get constructive input from a supportive community of experienced builders.",
                    color: "from-orange-500 to-orange-600",
                  },
                ].map((item, i) => (
                  <Card
                    key={i}
                    className="group relative overflow-hidden border-0 bg-gradient-to-b from-muted/50 to-muted/30 p-8 hover:shadow-xl transition-all duration-500"
                  >
                    <div className="absolute top-0 left-0 right-0 h-1 gradient-wave opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div
                      className={`w-14 h-14 bg-gradient-to-br ${item.color} rounded-2xl mb-6 flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform duration-300`}
                    >
                      {item.icon}
                    </div>
                    <h3 className="font-bold text-xl mb-3">{item.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">{item.description}</p>
                  </Card>
                ))}
              </div>
            </div>
          </section>
        </>
      ) : (
        /* Logged-in user header */
        <section className="relative max-w-2xl mx-auto px-4 py-8">
          <h1 className="text-2xl md:text-3xl font-bold mb-6">Welcome back</h1>

          {/* Twitter-style composer */}
          <Card className="p-4 border-border/40">
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
                  onChange={(e) => {
                    setPostTitle(e.target.value);
                    if (!isComposerExpanded) setIsComposerExpanded(true);
                  }}
                  onFocus={() => setIsComposerExpanded(true)}
                  className="w-full bg-transparent border-none outline-none text-lg py-2 placeholder:text-muted-foreground"
                />

                {/* Expanded description field */}
                {isComposerExpanded && (
                  <textarea
                    placeholder="Add more details... (optional)"
                    value={postDescription}
                    onChange={(e) => setPostDescription(e.target.value)}
                    rows={3}
                    className="w-full bg-transparent border-none outline-none text-base mt-2 resize-none placeholder:text-muted-foreground"
                  />
                )}

                {/* Action icons - always visible */}
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
      )}

      {/* Project Feed */}
      <section className="relative py-12 md:py-20 bg-muted/30">
        <div className="max-w-2xl mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl md:text-3xl font-bold">Recent Projects</h2>
          </div>

          {loadingProjects ? (
            <div className="text-center py-12 text-muted-foreground">Loading projects...</div>
          ) : projects.length === 0 ? (
            <Card className="p-8 text-center border-dashed">
              <p className="text-muted-foreground mb-4">No projects yet. Be the first to share!</p>
              {user ? (
                <Button
                  className="rounded-full"
                  onClick={() => setShowProjectModal(true)}
                >
                  Create a project
                </Button>
              ) : (
                <Button onClick={handleAuthRequired} className="rounded-full">
                  Sign up to post
                </Button>
              )}
            </Card>
          ) : (
            <div className="space-y-6">
              {projects.map((project) => (
                <FeedCard
                  key={project.id}
                  project={project}
                  currentUserId={user?.id}
                  initialLikeCount={project.likeCount}
                  initialHasLiked={project.hasLiked}
                  initialComments={project.comments}
                  onAuthRequired={user ? undefined : handleAuthRequired}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Featured Makers Preview */}
      <section className="relative py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-12">
            <div>
              <Badge variant="secondary" className="mb-4">
                Community
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold">Discover makers</h2>
            </div>
            <Link
              href="/people"
              className="text-primary font-medium hover:underline underline-offset-4 flex items-center gap-2"
            >
              View all
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {featuredMakers.map((maker) => {
              const initials = maker.name
                ?.split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()
                .slice(0, 2) || "?";
              const skillsDisplay = maker.skills?.slice(0, 2).join(" & ") || "";

              return (
                <Link key={maker.id} href={`/profile/${maker.id}`}>
                  <Card className="group p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer h-full border-0 bg-gradient-to-b from-card to-muted/20">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 via-teal-500 to-orange-500 rounded-2xl mb-4 flex items-center justify-center text-white font-bold text-lg overflow-hidden shadow-lg group-hover:scale-105 transition-transform duration-300">
                      {maker.photo_url ? (
                        <img
                          src={maker.photo_url}
                          alt={maker.name || "Maker"}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        initials
                      )}
                    </div>
                    <p className="font-semibold text-lg">{maker.name}</p>
                    {skillsDisplay && (
                      <p className="text-sm text-muted-foreground mt-1">{skillsDisplay}</p>
                    )}
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section - Only for non-logged-in users */}
      {!user && (
        <section className="relative py-20 md:py-28">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="relative overflow-hidden rounded-3xl">
              {/* Background */}
              <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
                <div className="absolute top-0 left-1/4 w-[400px] h-[400px] bg-blue-500/20 rounded-full blur-[100px]" />
                <div className="absolute bottom-0 right-1/4 w-[300px] h-[300px] bg-orange-500/20 rounded-full blur-[80px]" />
              </div>

              {/* Wave accent */}
              <div className="absolute bottom-0 left-0 right-0 h-1 gradient-wave" />

              <div className="relative px-8 py-16 md:px-16 md:py-24 text-center">
                <h2 className="text-3xl md:text-5xl font-bold mb-6 text-white">
                  Ready to join the community?
                </h2>
                <p className="text-white/60 mb-10 max-w-2xl mx-auto text-lg">
                  Create your profile, share your projects, and connect with makers who share your passion for building.
                </p>
                <Button
                  size="lg"
                  className="rounded-full px-10 py-6 text-lg bg-white text-slate-900 hover:bg-white/90 shadow-lg"
                  onClick={handleAuthRequired}
                >
                  Get started — it&apos;s free
                </Button>
              </div>
            </div>
          </div>
        </section>
      )}

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
