"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { User } from "@supabase/supabase-js";
import FeedCard from "@/components/FeedCard";
import ProjectModal from "@/components/ProjectModal";
import EmailSignup from "@/components/EmailSignup";
import Logo from "@/components/Logo";
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
    const checkOnboardingStatus = async (userId: string) => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("onboarding_completed")
        .eq("id", userId)
        .single();

      // If logged in but not onboarded, redirect to onboarding
      // Otherwise redirect to home
      if (!profile || !profile.onboarding_completed) {
        window.location.href = "/onboarding";
      } else {
        window.location.href = "/home";
      }
    };

    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      if (user) {
        checkOnboardingStatus(user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        checkOnboardingStatus(session.user.id);
      }
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
      {/* Top header with login - for non-logged-in users */}
      {!user && (
        <header className="absolute top-0 left-0 right-0 z-50 px-4 sm:px-6 lg:px-8 py-4 bg-[#f5f3ef]">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            {/* Logo */}
            <Link href="/" className="hover:opacity-90 transition-opacity">
              <Logo size="sm" />
            </Link>

            {/* Nav links */}
            <nav className="hidden md:flex items-center gap-8 text-sm text-slate-700">
              <Link href="/people" className="hover:text-slate-900">People</Link>
              <Link href="/events" className="hover:text-slate-900">Events</Link>
              <Link href="/about" className="hover:text-slate-900">About</Link>
            </nav>

            {/* Auth buttons */}
            <div className="flex items-center gap-4">
              <Link href="/auth" className="text-sm text-slate-700 hover:text-slate-900 hidden sm:block">
                Log In
              </Link>
              <Button
                asChild
                size="sm"
                className="rounded-lg px-5 bg-[#e54b4b] hover:bg-[#d43d3d] text-white"
              >
                <Link href="/auth?mode=signup">Get Started</Link>
              </Button>
            </div>
          </div>
        </header>
      )}

      {/* Hero Section for non-logged-in users */}
      {!user ? (
        <>
          {/* Jasper-style hero with light background */}
          <section className="relative min-h-screen flex flex-col overflow-hidden bg-[#f5f3ef]">
            {/* Content */}
            <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 pt-24 pb-8">
              {/* Announcement pill */}
              <div className="mb-8 inline-flex items-center gap-2 px-4 py-2 rounded-full border border-slate-200 bg-white shadow-sm">
                <span className="px-2 py-0.5 text-xs font-semibold bg-[#e54b4b] text-white rounded">New!</span>
                <span className="text-sm text-slate-700">Toronto&apos;s maker community is growing</span>
                <svg className="w-4 h-4 text-[#e54b4b]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </div>

              {/* Main headline - serif style */}
              <h1 className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-serif leading-[1.05] mb-6 text-slate-900 text-center max-w-5xl">
                Where builders connect and create
              </h1>

              {/* Subtitle */}
              <p className="text-lg sm:text-xl text-slate-600 mb-10 text-center max-w-2xl leading-relaxed">
                MakersLounge is the community that connects builders, accelerates collaboration, and supports makers&mdash;at scale.
              </p>

              {/* CTA Buttons - Jasper style */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="rounded-lg px-8 py-6 text-base font-medium border-slate-900 text-slate-900 bg-transparent hover:bg-slate-100"
                >
                  <Link href="/people">Explore Makers</Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  className="rounded-lg px-8 py-6 text-base font-medium bg-[#e54b4b] hover:bg-[#d43d3d] text-white"
                >
                  <Link href="/auth">Get Started</Link>
                </Button>
              </div>
            </div>

            {/* Visual collage section */}
            <div className="relative w-full max-w-5xl mx-auto px-4 pb-8">
              {/* Grid background */}
              <div className="relative rounded-2xl overflow-hidden">
                <div
                  className="absolute inset-0 opacity-100"
                  style={{
                    backgroundImage: `linear-gradient(to right, #7dd3fc 1px, transparent 1px), linear-gradient(to bottom, #7dd3fc 1px, transparent 1px)`,
                    backgroundSize: '40px 40px',
                    backgroundColor: '#bae6fd',
                  }}
                />

                {/* Decorative shapes */}
                <div className="absolute bottom-0 left-8 flex gap-2">
                  <div className="w-16 h-16 rounded-full bg-green-800" />
                  <div className="w-12 h-12 rounded-full bg-green-800 self-end" />
                  <div className="w-10 h-10 rounded-full bg-green-800" />
                </div>

                {/* Yellow diagonal bars */}
                <div className="absolute bottom-4 right-16 flex gap-2 transform rotate-[-35deg]">
                  <div className="w-4 h-24 bg-yellow-400 rounded-full" />
                  <div className="w-4 h-32 bg-yellow-400 rounded-full" />
                  <div className="w-4 h-20 bg-yellow-400 rounded-full" />
                </div>

                {/* Blue bar chart */}
                <div className="absolute bottom-0 right-8 flex items-end gap-1">
                  <div className="w-6 h-12 bg-blue-500 rounded-t" />
                  <div className="w-6 h-20 bg-blue-500 rounded-t" />
                  <div className="w-6 h-16 bg-blue-500 rounded-t" />
                  <div className="w-6 h-24 bg-blue-500 rounded-t" />
                </div>

                {/* Main content area with photo */}
                <div className="relative flex items-end justify-center py-12 px-8 min-h-[320px]">
                  {/* Floating stat card - left */}
                  <div className="absolute left-8 top-1/2 -translate-y-1/2 bg-white rounded-xl p-4 shadow-lg max-w-[200px]">
                    <div className="flex items-start gap-2">
                      <span className="w-5 h-5 rounded-full bg-[#e54b4b] flex items-center justify-center text-white text-xs">!</span>
                      <div>
                        <p className="text-slate-900 font-semibold text-sm leading-tight">Connect with 400+ makers instantly</p>
                      </div>
                    </div>
                  </div>

                  {/* Center photo */}
                  <div className="relative z-10">
                    <img
                      src="/makerslounge-photos/lounge-networking.jpeg"
                      alt="MakersLounge community"
                      className="w-64 h-64 object-cover rounded-full border-4 border-white shadow-xl"
                    />
                  </div>

                  {/* Floating stat card - right */}
                  <div className="absolute right-16 top-8 bg-green-600 text-white rounded-xl px-4 py-2 shadow-lg">
                    <p className="text-xs font-medium opacity-80">active members</p>
                    <p className="text-3xl font-bold">+67%</p>
                  </div>
                </div>
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
      <section className="relative max-w-2xl mx-auto px-4 py-6">
        {/* Section title for non-logged-in users */}
        {!user && (
          <div className="text-center mb-8">
            <Badge variant="secondary" className="mb-3">
              Community
            </Badge>
            <h2 className="text-2xl md:text-3xl font-bold">Preview community posts</h2>
            <p className="text-muted-foreground mt-2">See what makers are building</p>
          </div>
        )}
        <div className="space-y-4">
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
                <Button asChild className="rounded-full">
                  <Link href="/auth?mode=signup">Sign up to post</Link>
                </Button>
              )}
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
                  onAuthRequired={user ? undefined : handleAuthRequired}
                />
              ))}
            </>
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

      {/* Email Signup Section */}
      <section className="relative py-20 md:py-28 bg-muted/30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="glass-card p-8 md:p-12">
            <EmailSignup
              title="Stay in the loop"
              description="Get updates about new events, podcast episodes, and community highlights delivered straight to your inbox."
            />
          </Card>
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
                  asChild
                  size="lg"
                  className="rounded-full px-10 py-6 text-lg bg-white text-slate-900 hover:bg-white/90 shadow-lg"
                >
                  <Link href="/auth?mode=signup">Get started — it&apos;s free</Link>
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
