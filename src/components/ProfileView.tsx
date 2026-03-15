"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ExternalLink, MessageCircle, MoreHorizontal, Flag, Ban } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { useState, useEffect } from "react";

interface ProfileViewProps {
  profile: {
    id: string;
    name: string | null;
    photo_url: string | null;
    bio: string | null;
    skills: string[] | null;
    looking_for_skills: string[] | null;
    currently_building: string | null;
    linkedin: string | null;
    twitter: string | null;
    instagram: string | null;
    website: string | null;
  };
}

export default function ProfileView({ profile }: ProfileViewProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [startingChat, setStartingChat] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportDetails, setReportDetails] = useState("");
  const [reportSubmitted, setReportSubmitted] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [posts, setPosts] = useState<
    { id: string; title: string; description: string | null; media_urls: string[] | null; created_at: string }[]
  >([]);

  useEffect(() => {
    async function fetchPosts() {
      const { data } = await supabase
        .from("projects")
        .select("id, title, description, media_urls, created_at")
        .eq("user_id", profile.id)
        .order("created_at", { ascending: false })
        .limit(10);
      if (data) setPosts(data);
    }
    fetchPosts();
  }, [profile.id]);

  async function handleMessage() {
    if (!user) {
      router.push("/auth");
      return;
    }
    if (startingChat) return;
    setStartingChat(true);

    // Order IDs so participant_1 < participant_2
    const [p1, p2] = [user.id, profile.id].sort();

    // Check if conversation already exists
    const { data: existing } = await supabase
      .from("conversations")
      .select("id")
      .eq("participant_1", p1)
      .eq("participant_2", p2)
      .single();

    if (existing) {
      router.push(`/messages/${existing.id}`);
      return;
    }

    // Create new conversation
    const { data: newConvo, error } = await supabase
      .from("conversations")
      .insert({ participant_1: p1, participant_2: p2 })
      .select("id")
      .single();

    setStartingChat(false);

    if (newConvo) {
      router.push(`/messages/${newConvo.id}`);
    } else if (error) {
      console.error("Failed to create conversation:", error);
    }
  }

  async function handleReport() {
    if (!user || !reportReason) return;
    await supabase.from("reports").insert({
      reporter_id: user.id,
      reported_user_id: profile.id,
      reason: reportReason,
      details: reportDetails || null,
    });
    setReportSubmitted(true);
    setTimeout(() => {
      setShowReportModal(false);
      setReportSubmitted(false);
      setReportReason("");
      setReportDetails("");
    }, 2000);
  }

  async function handleBlock() {
    if (!user) return;
    await supabase.from("blocked_users").insert({
      blocker_id: user.id,
      blocked_id: profile.id,
    });
    setBlocked(true);
    setShowMenu(false);
  }

  const initials = profile.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "?";

  const socialLinks = [
    profile.linkedin && { label: "LinkedIn", href: profile.linkedin },
    profile.twitter && { label: "X", href: profile.twitter },
    profile.instagram && { label: "Instagram", href: profile.instagram },
    profile.website && { label: "Website", href: profile.website },
  ].filter(Boolean) as { label: string; href: string }[];

  let buildingItems: string[] = [];
  if (profile.currently_building) {
    try {
      const parsed = JSON.parse(profile.currently_building);
      buildingItems = Array.isArray(parsed) ? parsed : [profile.currently_building];
    } catch {
      buildingItems = [profile.currently_building];
    }
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6 md:py-12">
      {/* Avatar + Name */}
      <div className="flex flex-col items-center text-center md:flex-row md:text-left gap-4 mb-8 md:mb-6">
        <div className="w-20 h-20 md:w-16 md:h-16 rounded-full bg-secondary flex items-center justify-center text-muted-foreground font-semibold text-lg overflow-hidden shrink-0">
          {profile.photo_url ? (
            <img src={profile.photo_url} alt={profile.name || ""} className="w-full h-full object-cover" />
          ) : (
            initials
          )}
        </div>
        <div>
          <h1 className="text-xl font-bold md:font-semibold">{profile.name || "Anonymous"}</h1>
          {profile.bio && (
            <p className="text-[14px] md:text-sm text-muted-foreground mt-1 md:mt-0.5">{profile.bio}</p>
          )}
        </div>
      </div>

      {/* Edit profile (own profile) */}
      {user && user.id === profile.id && (
        <div className="mb-6">
          <Link
            href="/profile"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-secondary text-foreground hover:bg-secondary/80 transition-colors"
          >
            Edit Profile
          </Link>
        </div>
      )}

      {/* Message + Report/Block (don't show on own profile) */}
      {user && user.id !== profile.id && (
        <div className="mb-6 flex items-center gap-2">
          <button
            onClick={handleMessage}
            disabled={startingChat}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:opacity-90 active:opacity-80 transition-opacity disabled:opacity-50"
          >
            <MessageCircle className="w-4 h-4" />
            Message
          </button>
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 rounded-lg text-muted-foreground hover:bg-secondary transition-colors"
            >
              <MoreHorizontal className="w-5 h-5" />
            </button>
            {showMenu && (
              <div className="absolute left-0 top-full mt-1 w-48 bg-card border border-border rounded-lg shadow-lg z-10 overflow-hidden">
                <button
                  onClick={() => { setShowReportModal(true); setShowMenu(false); }}
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-left hover:bg-secondary transition-colors"
                >
                  <Flag className="w-4 h-4" />
                  Report user
                </button>
                <button
                  onClick={handleBlock}
                  disabled={blocked}
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-left text-red-500 hover:bg-secondary transition-colors disabled:opacity-50"
                >
                  <Ban className="w-4 h-4" />
                  {blocked ? "Blocked" : "Block user"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4" onClick={() => setShowReportModal(false)}>
          <div className="bg-card rounded-xl p-5 w-full max-w-sm border border-border" onClick={(e) => e.stopPropagation()}>
            {reportSubmitted ? (
              <p className="text-sm text-center text-muted-foreground py-4">Report submitted. Thank you.</p>
            ) : (
              <>
                <h3 className="text-base font-semibold mb-3">Report {profile.name || "this user"}</h3>
                <div className="space-y-2 mb-3">
                  {["Spam", "Harassment or bullying", "Inappropriate content", "Misinformation", "Other"].map((reason) => (
                    <label key={reason} className="flex items-center gap-2 text-sm cursor-pointer">
                      <input
                        type="radio"
                        name="report-reason"
                        value={reason}
                        checked={reportReason === reason}
                        onChange={() => setReportReason(reason)}
                        className="accent-primary"
                      />
                      {reason}
                    </label>
                  ))}
                </div>
                <textarea
                  placeholder="Additional details (optional)"
                  value={reportDetails}
                  onChange={(e) => setReportDetails(e.target.value)}
                  rows={2}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm mb-3 resize-none focus:outline-none focus:ring-1 focus:ring-primary/50"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleReport}
                    disabled={!reportReason}
                    className="flex-1 py-2 text-sm font-medium rounded-lg bg-red-500 text-white hover:bg-red-600 disabled:opacity-50 transition-colors"
                  >
                    Submit Report
                  </button>
                  <button
                    onClick={() => setShowReportModal(false)}
                    className="flex-1 py-2 text-sm font-medium rounded-lg bg-secondary hover:bg-secondary/80 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Info sections in iOS grouped style on mobile */}
      <div className="space-y-4 md:space-y-6">
        {/* Currently building */}
        {buildingItems.length > 0 && (
          <div className="rounded-xl md:rounded-none bg-card md:bg-transparent p-4 md:p-0">
            <h2 className="text-[13px] md:text-sm font-medium text-muted-foreground md:text-foreground mb-2">Currently building</h2>
            <ul className="space-y-1">
              {buildingItems.map((item, i) => (
                <li key={i} className="text-[15px] md:text-sm text-foreground md:text-muted-foreground">{item}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Skills */}
        {profile.skills && profile.skills.length > 0 && (
          <div className="rounded-xl md:rounded-none bg-card md:bg-transparent p-4 md:p-0">
            <h2 className="text-[13px] md:text-sm font-medium text-muted-foreground md:text-foreground mb-2">Skills</h2>
            <div className="flex flex-wrap gap-1.5">
              {profile.skills.map((skill) => (
                <span key={skill} className="px-2.5 py-1 rounded-full md:rounded-md bg-secondary text-xs text-muted-foreground">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Looking for */}
        {profile.looking_for_skills && profile.looking_for_skills.length > 0 && (
          <div className="rounded-xl md:rounded-none bg-card md:bg-transparent p-4 md:p-0">
            <h2 className="text-[13px] md:text-sm font-medium text-muted-foreground md:text-foreground mb-2">Looking for</h2>
            <div className="flex flex-wrap gap-1.5">
              {profile.looking_for_skills.map((skill) => (
                <span key={skill} className="px-2.5 py-1 rounded-full md:rounded-md bg-secondary text-xs text-muted-foreground">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Social links */}
        {socialLinks.length > 0 && (
          <div className="rounded-xl md:rounded-none bg-card md:bg-transparent overflow-hidden">
            <h2 className="text-[13px] md:text-sm font-medium text-muted-foreground md:text-foreground px-4 md:px-0 pt-4 md:pt-0 mb-1 md:mb-2">Links</h2>
            {socialLinks.map((link, i) => (
              <a
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex items-center justify-between px-4 md:px-0 py-3 md:py-1 text-[15px] md:text-sm active:bg-secondary/50 md:active:bg-transparent transition-colors ${
                  i < socialLinks.length - 1 ? "border-b border-border/50 md:border-none" : ""
                }`}
              >
                <span className="text-foreground md:text-muted-foreground">{link.label}</span>
                <ExternalLink className="w-4 h-4 md:w-3 md:h-3 text-muted-foreground" />
              </a>
            ))}
          </div>
        )}
      </div>

      {/* Posts */}
      {posts.length > 0 && (
        <div className="mt-6 md:mt-8">
          <h2 className="text-[13px] md:text-sm font-medium text-muted-foreground md:text-foreground mb-3">Posts</h2>
          <div className="space-y-3">
            {posts.map((post) => (
              <div key={post.id} className="rounded-xl bg-card md:bg-muted/30 border border-border/50 p-4">
                <p className="text-sm font-medium text-foreground">{post.title}</p>
                {post.description && (
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-3">{post.description}</p>
                )}
                {post.media_urls && post.media_urls.length > 0 && (
                  <div className="mt-2 flex gap-2 overflow-x-auto">
                    {post.media_urls.slice(0, 3).map((url, i) => (
                      <div key={i} className="relative w-24 h-24 rounded-lg overflow-hidden shrink-0 bg-muted">
                        <Image
                          src={url}
                          alt=""
                          fill
                          className="object-cover"
                          sizes="96px"
                        />
                      </div>
                    ))}
                  </div>
                )}
                <p className="text-[11px] text-muted-foreground/50 mt-2">
                  {new Date(post.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Back */}
      <div className="mt-8 md:mt-10 pt-6 border-t border-border">
        <Link href="/people" className="text-sm text-muted-foreground hover:text-foreground">
          &larr; Back to people
        </Link>
      </div>
    </div>
  );
}
