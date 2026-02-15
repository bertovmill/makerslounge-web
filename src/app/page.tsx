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
      // Otherwise redirect to matcher
      if (!profile || !profile.onboarding_completed) {
        window.location.href = "/onboarding";
      } else {
        window.location.href = "/matcher";
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
        <header className="fixed top-4 left-4 right-4 z-50">
          <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
            {/* Logo */}
            <Link href="/" className="hover:opacity-90 transition-opacity flex-shrink-0">
              <Logo size="sm" />
            </Link>

            {/* Nav links - floating pill */}
            <nav className="hidden md:flex items-center gap-1 px-2 py-2 rounded-full bg-white/80 backdrop-blur-md border border-slate-200/60 shadow-sm">
              <Link href="/people" className="px-4 py-2 rounded-full text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 transition-colors duration-200">People</Link>
              <Link href="/events" className="px-4 py-2 rounded-full text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 transition-colors duration-200">Events</Link>
              <Link href="/about" className="px-4 py-2 rounded-full text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 transition-colors duration-200">About</Link>
            </nav>

            {/* Auth buttons - floating pill */}
            <div className="flex items-center gap-2 px-2 py-2 rounded-full bg-white/80 backdrop-blur-md border border-slate-200/60 shadow-sm">
              <Link href="/auth" className="px-4 py-2 rounded-full text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 transition-colors duration-200 hidden sm:block">
                Log In
              </Link>
              <Button
                asChild
                size="sm"
                className="rounded-full px-5 bg-[#e54b4b] hover:bg-[#d43d3d] text-white shadow-sm"
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
          {/* Hero with warm background */}
          <section className="relative min-h-screen flex flex-col overflow-hidden bg-gradient-to-br from-[#f5f3ef] via-[#f0ece4] to-[#e8e0d4]">
            {/* Subtle background texture */}
            <div className="absolute inset-0 opacity-[0.03]" style={{
              backgroundImage: `radial-gradient(circle at 1px 1px, #94a3b8 1px, transparent 0)`,
              backgroundSize: '32px 32px',
            }} />
            {/* Warm gradient accent */}
            <div className="absolute top-0 right-0 w-[60%] h-[60%] opacity-20 pointer-events-none" style={{
              background: 'radial-gradient(ellipse at 70% 20%, #e54b4b22 0%, transparent 60%)',
            }} />

            {/* Content */}
            <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 pt-24 pb-16">
              {/* Social platform links */}
              <p className="text-sm font-medium text-slate-500 mb-3 tracking-wide uppercase">Follow our community</p>
              <div className="flex items-center gap-4 mb-10 px-3 py-3 rounded-full bg-white/80 backdrop-blur-md border border-slate-200/60 shadow-sm">
                <a
                  href="https://www.linkedin.com/company/makerslounge"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-14 h-14 rounded-2xl bg-[#0A66C2] flex items-center justify-center text-white shadow-lg shadow-[#0A66C2]/30 hover:shadow-xl hover:shadow-[#0A66C2]/40 hover:scale-105 transition-all duration-200"
                  aria-label="LinkedIn"
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                  </svg>
                </a>
                <a
                  href="https://www.instagram.com/makersloungeto/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-pink-500/30 hover:shadow-xl hover:shadow-pink-500/40 hover:scale-105 transition-all duration-200"
                  style={{ background: 'radial-gradient(circle at 30% 107%, #fdf497 0%, #fdf497 5%, #fd5949 45%, #d6249f 60%, #285AEB 90%)' }}
                  aria-label="Instagram"
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                  </svg>
                </a>
                <a
                  href="https://x.com/makersloungeto"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-14 h-14 rounded-2xl bg-black flex items-center justify-center text-white shadow-lg shadow-black/30 hover:shadow-xl hover:shadow-black/40 hover:scale-105 transition-all duration-200"
                  aria-label="X (Twitter)"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </a>
                <a
                  href="https://makerslounge.slack.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-14 rounded-2xl flex items-center gap-2.5 px-5 text-white shadow-lg shadow-[#611f69]/30 hover:shadow-xl hover:shadow-[#611f69]/40 hover:scale-105 transition-all duration-200"
                  style={{ background: 'linear-gradient(135deg, #611f69 0%, #4A154B 50%, #36C5F0 100%)' }}
                  aria-label="Request to join Slack"
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z" />
                  </svg>
                  <span className="text-base font-semibold">Join Slack</span>
                </a>
              </div>

              {/* Main headline */}
              <h1 className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-serif leading-[1.05] mb-6 text-slate-900 text-center max-w-5xl">
                Find the right people for what you&apos;re building
              </h1>

              {/* Subtitle */}
              <p className="text-lg sm:text-xl text-slate-600 mb-10 text-center max-w-2xl leading-relaxed">
                MakersLounge uses AI to match you with builders who have the skills, experience, and ideas that complement yours.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="rounded-lg px-8 py-6 text-base font-medium border-slate-900 text-slate-900 bg-transparent hover:bg-slate-100 transition-colors duration-200"
                >
                  <Link href="/people">Browse People</Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  className="rounded-lg px-8 py-6 text-base font-medium bg-[#e54b4b] hover:bg-[#d43d3d] text-white shadow-lg shadow-[#e54b4b]/20 transition-all duration-200"
                >
                  <Link href="/matcher">Find Your Match</Link>
                </Button>
              </div>

              {/* Photo banner with overlapping avatars */}
              <div className="relative mt-16 w-full max-w-3xl">
                <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                  <img
                    src="/makerslounge-photos/lounge-networking.jpeg"
                    alt="MakersLounge community networking"
                    className="w-full h-[280px] sm:h-[340px] object-cover"
                  />
                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent" />
                  {/* Bottom text overlay */}
                  <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8">
                    <p className="text-white/90 text-sm sm:text-base font-medium">
                      Join a growing community of builders, designers, and makers in Toronto
                    </p>
                  </div>
                </div>

                {/* Floating social proof card */}
                <div className="absolute -bottom-6 -right-4 sm:right-6 bg-white rounded-xl px-5 py-3 shadow-lg border border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="flex -space-x-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 border-2 border-white" />
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 border-2 border-white" />
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 border-2 border-white" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">600+ makers</p>
                      <p className="text-xs text-slate-500">matched this month</p>
                    </div>
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
                  How matching{" "}
                  <span className="text-gradient">works</span>
                </h2>
                <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                  Tell us about yourself and what you need. Our AI does the rest.
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
                    title: "Share what you're building",
                    description: "Your projects and skills create your matching profile. The more you share, the better your matches.",
                    color: "from-blue-500 to-blue-600",
                  },
                  {
                    icon: (
                      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    ),
                    title: "Get AI-powered matches",
                    description: "Our AI analyzes skills, projects, and goals to find people who have what you need — and need what you have.",
                    color: "from-teal-500 to-teal-600",
                  },
                  {
                    icon: (
                      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    ),
                    title: "Meet and collaborate",
                    description: "Connect with your matches, join group sessions, and build relationships that accelerate your work.",
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

      {/* Project Feed - only for logged-in users */}
      {user && (
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
      )}

      {/* Featured Makers Preview */}
      <section className="relative py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-12">
            <div>
              <Badge variant="secondary" className="mb-4">
                Community
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold">People you could match with</h2>
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
              description="Get updates about new matching features, community events, and makers joining the platform."
            />
          </Card>
        </div>
      </section>

      {/* FAQ Section - Only for non-logged-in users */}
      {!user && (
        <section className="relative py-20 md:py-28">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <Badge variant="secondary" className="mb-4">
                FAQs
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Frequently Asked Questions
              </h2>
              <p className="text-muted-foreground text-lg max-w-xl mx-auto">
                Find answers to common questions. Still need help? Reach out to us anytime.
              </p>
            </div>

            <div className="divide-y divide-border">
              {[
                {
                  q: "What exactly does MakersLounge do?",
                  a: "MakersLounge is a community platform that uses AI to match builders, designers, and makers with complementary skills. Share what you're working on, and we'll connect you with people who have the expertise you need — and need what you bring."
                },
                {
                  q: "How does the AI matching work?",
                  a: "When you create a profile and share your skills, projects, and goals, our AI analyzes what you're building and what you need. It then finds people in the community whose skills, experience, and interests complement yours for the best possible collaboration."
                },
                {
                  q: "Is MakersLounge free to use?",
                  a: "Yes! Creating a profile, browsing the community, and getting matched with other makers is completely free. We want to make it as easy as possible for builders to find each other."
                },
                {
                  q: "Who is MakersLounge for?",
                  a: "MakersLounge is for anyone who builds things — software developers, designers, hardware makers, content creators, entrepreneurs, and more. Whether you're looking for a co-founder, a collaborator, or just someone to bounce ideas off, you'll find them here."
                },
                {
                  q: "How do I join the Slack community?",
                  a: "You can request access to our Slack workspace by clicking the \"Join Slack\" button on the homepage. Once approved, you'll get access to channels for introductions, project showcases, skill-sharing, and local meetup coordination."
                },
                {
                  q: "Is MakersLounge only for people in Toronto?",
                  a: "While our community started in Toronto and we host local events there, MakersLounge is open to makers everywhere. The AI matching works regardless of location, and our Slack community is global."
                },
              ].map((faq, i) => (
                <details key={i} className="group">
                  <summary className="flex items-center justify-between cursor-pointer py-5 text-left">
                    <span className="text-base font-medium text-foreground pr-4">{faq.q}</span>
                    <svg
                      className="w-5 h-5 text-muted-foreground flex-shrink-0 transition-transform duration-200 group-open:rotate-180"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </summary>
                  <p className="pb-5 text-muted-foreground leading-relaxed pr-8">{faq.a}</p>
                </details>
              ))}
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
