"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { User } from "@supabase/supabase-js";
import FeedCard from "@/components/FeedCard";

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
        // Supabase returns profiles as array from join, normalize to single object
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
    <div className="min-h-screen bg-[#FAF9F6]">
      {/* Hero Section - Compact for logged-in users */}
      {!user ? (
        <section className="max-w-6xl mx-auto px-4 py-16 md:py-24">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold leading-tight mb-6">
                Connect with makers building the future
              </h1>
              <p className="text-xl text-gray-600 mb-8">
                Share your projects, discover collaborators, and grow your network in a community of builders.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/people"
                  className="bg-[#1a1a1a] text-white px-8 py-4 rounded-full font-medium hover:bg-[#333] transition-colors text-center"
                >
                  Explore makers
                </Link>
                <button
                  onClick={handleAuthRequired}
                  className="border-2 border-[#1a1a1a] text-[#1a1a1a] px-8 py-4 rounded-full font-medium hover:bg-[#1a1a1a] hover:text-white transition-colors"
                >
                  Join now
                </button>
              </div>
            </div>
            <div className="relative hidden md:block">
              <div className="bg-gradient-to-br from-[#F4A261] to-[#E76F51] rounded-3xl p-8 aspect-square flex items-center justify-center">
                <div className="grid grid-cols-2 gap-4 w-full max-w-xs">
                  <div className="bg-white/90 backdrop-blur rounded-2xl p-4 shadow-lg transform -rotate-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-pink-400 to-purple-500 rounded-full mb-2"></div>
                    <div className="h-2 bg-gray-200 rounded w-3/4 mb-1"></div>
                    <div className="h-2 bg-gray-100 rounded w-1/2"></div>
                  </div>
                  <div className="bg-white/90 backdrop-blur rounded-2xl p-4 shadow-lg transform rotate-3 translate-y-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-teal-500 rounded-full mb-2"></div>
                    <div className="h-2 bg-gray-200 rounded w-3/4 mb-1"></div>
                    <div className="h-2 bg-gray-100 rounded w-1/2"></div>
                  </div>
                  <div className="bg-white/90 backdrop-blur rounded-2xl p-4 shadow-lg transform rotate-2 -translate-y-2">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full mb-2"></div>
                    <div className="h-2 bg-gray-200 rounded w-3/4 mb-1"></div>
                    <div className="h-2 bg-gray-100 rounded w-1/2"></div>
                  </div>
                  <div className="bg-white/90 backdrop-blur rounded-2xl p-4 shadow-lg transform -rotate-2 translate-y-2">
                    <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full mb-2"></div>
                    <div className="h-2 bg-gray-200 rounded w-3/4 mb-1"></div>
                    <div className="h-2 bg-gray-100 rounded w-1/2"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      ) : (
        <section className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl md:text-3xl font-serif font-bold">
              Welcome back
            </h1>
            <Link
              href="/profile"
              className="bg-[#1a1a1a] text-white px-6 py-2 rounded-full font-medium hover:bg-[#333] transition-colors text-sm"
            >
              Add project
            </Link>
          </div>
        </section>
      )}

      {/* Project Feed */}
      <section className="py-8 md:py-12">
        <div className="max-w-2xl mx-auto px-4">
          <h2 className="text-xl md:text-2xl font-serif font-bold mb-6">
            Recent Projects
          </h2>

          {loadingProjects ? (
            <div className="text-center py-12 text-gray-500">Loading projects...</div>
          ) : projects.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center border border-gray-100">
              <p className="text-gray-500 mb-4">No projects yet. Be the first to share!</p>
              {user ? (
                <Link
                  href="/profile"
                  className="inline-block bg-[#1a1a1a] text-white px-6 py-3 rounded-full font-medium hover:bg-[#333] transition-colors"
                >
                  Create a project
                </Link>
              ) : (
                <button
                  onClick={handleAuthRequired}
                  className="bg-[#1a1a1a] text-white px-6 py-3 rounded-full font-medium hover:bg-[#333] transition-colors"
                >
                  Sign up to post
                </button>
              )}
            </div>
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
        <section className="bg-white py-16 md:py-24">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-center mb-4">
              What you can do on MakersLounge
            </h2>
            <p className="text-gray-600 text-center mb-12 max-w-2xl mx-auto">
              Whether you&apos;re looking for collaborators, feedback, or inspiration — find your people here.
            </p>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center p-6">
                <div className="w-16 h-16 bg-[#F9A8D4] rounded-2xl mx-auto mb-4 flex items-center justify-center text-2xl">
                  🚀
                </div>
                <h3 className="font-semibold text-lg mb-2">Share your projects</h3>
                <p className="text-gray-600 text-sm">
                  Showcase what you&apos;re building with images, videos, and descriptions.
                </p>
              </div>

              <div className="text-center p-6">
                <div className="w-16 h-16 bg-[#FDBA74] rounded-2xl mx-auto mb-4 flex items-center justify-center text-2xl">
                  🤝
                </div>
                <h3 className="font-semibold text-lg mb-2">Connect with makers</h3>
                <p className="text-gray-600 text-sm">
                  Find people with complementary skills or similar interests.
                </p>
              </div>

              <div className="text-center p-6">
                <div className="w-16 h-16 bg-[#86EFAC] rounded-2xl mx-auto mb-4 flex items-center justify-center text-2xl">
                  💬
                </div>
                <h3 className="font-semibold text-lg mb-2">Get feedback</h3>
                <p className="text-gray-600 text-sm">
                  Share ideas and get input from a supportive community of builders.
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Featured Makers Preview */}
      <section className="py-16 md:py-24">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl md:text-3xl font-serif font-bold">
              Discover makers
            </h2>
            <Link
              href="/people"
              className="text-[#1a1a1a] font-medium hover:underline"
            >
              View all →
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <div className="w-12 h-12 bg-gradient-to-br from-pink-400 to-purple-500 rounded-full mb-3 flex items-center justify-center text-white font-bold">
                VS
              </div>
              <p className="font-semibold text-sm">Viraj Shah</p>
              <p className="text-xs text-gray-500 mt-1">AI & Sales</p>
            </div>

            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-red-500 rounded-full mb-3 flex items-center justify-center text-white font-bold">
                HY
              </div>
              <p className="font-semibold text-sm">Hossein Yousefi</p>
              <p className="text-xs text-gray-500 mt-1">AI & Community</p>
            </div>

            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-teal-500 rounded-full mb-3 flex items-center justify-center text-white font-bold">
                AK
              </div>
              <p className="font-semibold text-sm">Alok Kumar</p>
              <p className="text-xs text-gray-500 mt-1">E-commerce & Finance</p>
            </div>

            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full mb-3 flex items-center justify-center text-white font-bold">
                ED
              </div>
              <p className="font-semibold text-sm">Eduardo</p>
              <p className="text-xs text-gray-500 mt-1">UX/UI & Web Dev</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section - Only for non-logged-in users */}
      {!user && (
        <section className="py-16 md:py-24">
          <div className="max-w-4xl mx-auto px-4">
            <div className="bg-[#1a1a1a] rounded-3xl p-8 md:p-12 text-center text-white">
              <h2 className="text-2xl md:text-4xl font-serif font-bold mb-4">
                Ready to join the community?
              </h2>
              <p className="text-gray-300 mb-8 max-w-xl mx-auto">
                Create your profile, share your projects, and connect with makers who share your passion.
              </p>
              <button
                onClick={handleAuthRequired}
                className="bg-white text-[#1a1a1a] px-8 py-4 rounded-full font-medium hover:bg-gray-100 transition-colors"
              >
                Get started — it&apos;s free
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="border-t border-gray-200 py-8">
        <div className="max-w-6xl mx-auto px-4 text-center text-sm text-gray-500">
          <p>MakersLounge — Where builders connect</p>
        </div>
      </footer>
    </div>
  );
}
