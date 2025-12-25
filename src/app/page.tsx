"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { User } from "@supabase/supabase-js";
import FeedCard from "@/components/FeedCard";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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
}

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);

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
      const { data, error } = await supabase
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

      if (!error && data) {
        const normalized = data.map((p) => ({
          ...p,
          profiles: Array.isArray(p.profiles) ? p.profiles[0] || null : p.profiles,
        }));
        setProjects(normalized as Project[]);
      }
      setLoadingProjects(false);
    };

    fetchProjects();
  }, []);

  const handleAuthRequired = () => {
    document.querySelector<HTMLButtonElement>('[data-auth-button]')?.click();
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Subtle warm gradient background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[800px] h-[600px] bg-gradient-to-bl from-primary/8 via-transparent to-transparent" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[400px] bg-gradient-to-tr from-accent/10 via-transparent to-transparent" />
      </div>

      {/* Hero Section */}
      {!user ? (
        <section className="relative max-w-6xl mx-auto px-4 py-20 md:py-32">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <Badge variant="secondary" className="mb-6 px-4 py-1.5 text-sm">
                For makers, by makers
              </Badge>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6 tracking-tight">
                Connect with makers{" "}
                <span className="text-gradient">building the future</span>
              </h1>
              <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                Share your projects, discover collaborators, and grow your network in a community of builders.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button asChild size="lg" className="rounded-full px-8">
                  <Link href="/people">Explore makers</Link>
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="rounded-full px-8 glass"
                  onClick={handleAuthRequired}
                >
                  Join now
                </Button>
              </div>
            </div>
            <div className="relative hidden md:block">
              <div className="relative">
                {/* Subtle warm glow */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/15 via-accent/10 to-transparent rounded-3xl blur-2xl" />

                {/* Card grid */}
                <div className="relative glass-card rounded-3xl p-8 aspect-square flex items-center justify-center">
                  <div className="grid grid-cols-2 gap-4 w-full max-w-xs">
                    {[
                      { color: "from-rose-400 to-orange-400", rotate: "-rotate-3" },
                      { color: "from-emerald-400 to-teal-400", rotate: "rotate-3 translate-y-4" },
                      { color: "from-sky-400 to-blue-400", rotate: "rotate-2 -translate-y-2" },
                      { color: "from-amber-400 to-yellow-400", rotate: "-rotate-2 translate-y-2" },
                    ].map((item, i) => (
                      <div
                        key={i}
                        className={`bg-white rounded-2xl p-4 shadow-sm border border-border transform ${item.rotate} hover:scale-105 transition-all duration-300 hover:shadow-md`}
                      >
                        <div className={`w-10 h-10 bg-gradient-to-br ${item.color} rounded-full mb-3`} />
                        <div className="h-2 bg-muted rounded w-3/4 mb-1.5" />
                        <div className="h-2 bg-muted/60 rounded w-1/2" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      ) : (
        <section className="relative max-w-6xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl md:text-3xl font-bold">Welcome back</h1>
            <Button asChild size="sm" className="rounded-full">
              <Link href="/profile">Add project</Link>
            </Button>
          </div>
        </section>
      )}

      {/* Project Feed */}
      <section className="relative py-8 md:py-12">
        <div className="max-w-2xl mx-auto px-4">
          <h2 className="text-xl md:text-2xl font-bold mb-6">Recent Projects</h2>

          {loadingProjects ? (
            <div className="text-center py-12 text-muted-foreground">Loading projects...</div>
          ) : projects.length === 0 ? (
            <Card className="glass-card p-8 text-center">
              <p className="text-muted-foreground mb-4">No projects yet. Be the first to share!</p>
              {user ? (
                <Button asChild className="rounded-full">
                  <Link href="/profile">Create a project</Link>
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
                  onAuthRequired={user ? undefined : handleAuthRequired}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* What you can do - Only show for non-logged-in users */}
      {!user && (
        <section className="relative py-16 md:py-24">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
              What you can do on MakersLounge
            </h2>
            <p className="text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
              Whether you&apos;re looking for collaborators, feedback, or inspiration — find your people here.
            </p>

            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  icon: "🚀",
                  title: "Share your projects",
                  description: "Showcase what you're building with images, videos, and descriptions.",
                  gradient: "from-rose-100 to-orange-100",
                },
                {
                  icon: "🤝",
                  title: "Connect with makers",
                  description: "Find people with complementary skills or similar interests.",
                  gradient: "from-sky-100 to-blue-100",
                },
                {
                  icon: "💬",
                  title: "Get feedback",
                  description: "Share ideas and get input from a supportive community of builders.",
                  gradient: "from-emerald-100 to-teal-100",
                },
              ].map((item, i) => (
                <Card
                  key={i}
                  className="glass-card p-6 text-center group hover:scale-[1.02] transition-all duration-300"
                >
                  <div
                    className={`w-16 h-16 bg-gradient-to-br ${item.gradient} rounded-2xl mx-auto mb-4 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform duration-300`}
                  >
                    {item.icon}
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
                  <p className="text-muted-foreground text-sm">{item.description}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured Makers Preview */}
      <section className="relative py-16 md:py-24">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl md:text-3xl font-bold">Discover makers</h2>
            <Link
              href="/people"
              className="text-primary font-medium hover:underline underline-offset-4"
            >
              View all →
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { initials: "VS", name: "Viraj Shah", role: "AI & Sales", gradient: "from-violet-500 to-purple-600" },
              { initials: "HY", name: "Hossein Yousefi", role: "AI & Community", gradient: "from-orange-400 to-red-500" },
              { initials: "AK", name: "Alok Kumar", role: "E-commerce & Finance", gradient: "from-emerald-400 to-teal-500" },
              { initials: "ED", name: "Eduardo", role: "UX/UI & Web Dev", gradient: "from-blue-400 to-indigo-500" },
            ].map((maker, i) => (
              <Card
                key={i}
                className="glass-card p-5 hover:scale-[1.02] transition-transform duration-300 cursor-pointer"
              >
                <div
                  className={`w-12 h-12 bg-gradient-to-br ${maker.gradient} rounded-full mb-3 flex items-center justify-center text-white font-bold text-sm`}
                >
                  {maker.initials}
                </div>
                <p className="font-semibold text-sm">{maker.name}</p>
                <p className="text-xs text-muted-foreground mt-1">{maker.role}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section - Only for non-logged-in users */}
      {!user && (
        <section className="relative py-16 md:py-24">
          <div className="max-w-4xl mx-auto px-4">
            <Card className="relative overflow-hidden rounded-3xl p-8 md:p-12 text-center bg-gradient-to-br from-primary/5 via-accent/5 to-background border-primary/10">
              <div className="relative">
                <h2 className="text-2xl md:text-4xl font-bold mb-4">
                  Ready to join the community?
                </h2>
                <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
                  Create your profile, share your projects, and connect with makers who share your passion.
                </p>
                <Button
                  size="lg"
                  className="rounded-full px-8"
                  onClick={handleAuthRequired}
                >
                  Get started — it&apos;s free
                </Button>
              </div>
            </Card>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="relative border-t border-border py-8">
        <div className="max-w-6xl mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>MakersLounge — Where builders connect</p>
        </div>
      </footer>
    </div>
  );
}
