"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";

interface Stats {
  blogPosts: number;
  publishedPosts: number;
  subscribers: number;
  activeSubscribers: number;
}

export default function AdminPage() {
  const [stats, setStats] = useState<Stats>({
    blogPosts: 0,
    publishedPosts: 0,
    subscribers: 0,
    activeSubscribers: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch blog posts count
        const { count: blogCount } = await supabase
          .from("blog_posts")
          .select("*", { count: "exact", head: true });

        const { count: publishedCount } = await supabase
          .from("blog_posts")
          .select("*", { count: "exact", head: true })
          .eq("is_published", true);

        // Fetch subscribers count
        const { data: subscribersData } = await supabase
          .from("email_subscriptions")
          .select("is_active");

        const subscribers = subscribersData || [];
        const activeSubscribers = subscribers.filter((s) => s.is_active).length;

        setStats({
          blogPosts: blogCount || 0,
          publishedPosts: publishedCount || 0,
          subscribers: subscribers.length,
          activeSubscribers,
        });
      } catch (err) {
        console.error("Error fetching stats:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const quickLinks = [
    {
      label: "Blog Posts",
      href: "/admin/blog",
      description: "Create and manage blog content",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
        </svg>
      ),
      stat: `${stats.publishedPosts} published`,
    },
    {
      label: "Events",
      href: "/admin/events",
      description: "Plan and manage community events",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      stat: "Calendar & scheduling",
    },
    {
      label: "Subscribers",
      href: "/admin/subscribers",
      description: "View email subscribers",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
      stat: `${stats.activeSubscribers} active`,
    },
    {
      label: "Matching Tool",
      href: "/admin/matching",
      description: "Run AI-powered attendee matching",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      stat: "Luma CSV import",
    },
    {
      label: "New Blog Post",
      href: "/admin/blog/new",
      description: "Write a new article",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      ),
      stat: "Quick action",
    },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <Badge variant="secondary" className="mb-4">
        Admin
      </Badge>
      <h1 className="text-4xl font-bold mb-2">Admin Overview</h1>
      <p className="text-muted-foreground mb-8">
        Manage your content, subscribers, and tools
      </p>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
        <Card className="p-6">
          <p className="text-sm text-muted-foreground mb-1">Total Posts</p>
          <p className="text-3xl font-bold">
            {loading ? "..." : stats.blogPosts}
          </p>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-muted-foreground mb-1">Published</p>
          <p className="text-3xl font-bold text-green-500">
            {loading ? "..." : stats.publishedPosts}
          </p>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-muted-foreground mb-1">Subscribers</p>
          <p className="text-3xl font-bold">
            {loading ? "..." : stats.subscribers}
          </p>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-muted-foreground mb-1">Active</p>
          <p className="text-3xl font-bold text-primary">
            {loading ? "..." : stats.activeSubscribers}
          </p>
        </Card>
      </div>

      {/* Quick Links */}
      <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {quickLinks.map((link) => (
          <Link key={link.href} href={link.href}>
            <Card className="p-6 hover:bg-muted/50 transition-colors cursor-pointer h-full">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-lg bg-primary/10 text-primary">
                  {link.icon}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-1">{link.label}</h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    {link.description}
                  </p>
                  <Badge variant="secondary" className="text-xs">
                    {link.stat}
                  </Badge>
                </div>
                <svg
                  className="w-5 h-5 text-muted-foreground"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
