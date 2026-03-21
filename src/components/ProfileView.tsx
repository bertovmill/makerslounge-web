"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ExternalLink,
  MessageCircle,
  MoreHorizontal,
  Flag,
  Ban,
  Mic,
  Pencil,
  Check,
  X,
  Camera,
  Linkedin,
  Instagram,
  Globe,
  Github,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { useState, useEffect, useRef, KeyboardEvent } from "react";
import {
  PodcastWithGuests,
  fetchPodcastsByGuest,
  formatDuration,
} from "@/lib/podcasts";

interface ProfileData {
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
}

interface ProfileViewProps {
  profile: ProfileData;
}

// Inline editable text component
function InlineEdit({
  value,
  onSave,
  isOwner,
  as = "p",
  placeholder = "Click to add...",
  className = "",
  inputClassName = "",
  multiline = false,
}: {
  value: string;
  onSave: (val: string) => void;
  isOwner: boolean;
  as?: "h1" | "p" | "span";
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  multiline?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  const save = () => {
    setEditing(false);
    if (draft.trim() !== value) {
      onSave(draft.trim());
    }
  };

  const cancel = () => {
    setDraft(value);
    setEditing(false);
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Enter" && !multiline) {
      e.preventDefault();
      save();
    }
    if (e.key === "Escape") {
      cancel();
    }
  };

  if (!isOwner) {
    const Tag = as;
    return value ? (
      <Tag className={className}>{value}</Tag>
    ) : null;
  }

  if (editing) {
    return multiline ? (
      <textarea
        ref={inputRef as React.RefObject<HTMLTextAreaElement>}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={save}
        onKeyDown={handleKeyDown}
        rows={3}
        className={`w-full bg-transparent border border-input rounded-lg px-2 py-1 outline-none focus:ring-2 focus:ring-ring resize-none ${inputClassName || className}`}
      />
    ) : (
      <input
        ref={inputRef as React.RefObject<HTMLInputElement>}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={save}
        onKeyDown={handleKeyDown}
        className={`w-full bg-transparent border border-input rounded-lg px-2 py-0.5 outline-none focus:ring-2 focus:ring-ring ${inputClassName || className}`}
      />
    );
  }

  const Tag = as;
  return (
    <Tag
      onClick={() => setEditing(true)}
      className={`cursor-pointer rounded-lg px-2 py-0.5 -mx-2 hover:bg-secondary/60 transition-colors ${className} ${!value ? "text-muted-foreground/50 italic" : ""}`}
      title="Click to edit"
    >
      {value || placeholder}
    </Tag>
  );
}

// Social icon component
function SocialIcon({
  type,
  href,
}: {
  type: "linkedin" | "twitter" | "instagram" | "website";
  href: string;
}) {
  const icons = {
    linkedin: Linkedin,
    instagram: Instagram,
    website: Globe,
    twitter: () => (
      <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  };
  const Icon = icons[type];
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
      title={type.charAt(0).toUpperCase() + type.slice(1)}
    >
      <Icon className="w-4 h-4" />
    </a>
  );
}

export default function ProfileView({ profile: initialProfile }: ProfileViewProps) {
  const { user } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [profile, setProfile] = useState<ProfileData>(initialProfile);
  const [startingChat, setStartingChat] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportDetails, setReportDetails] = useState("");
  const [reportSubmitted, setReportSubmitted] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [posts, setPosts] = useState<
    {
      id: string;
      title: string;
      description: string | null;
      media_urls: string[] | null;
      created_at: string;
    }[]
  >([]);
  const [podcasts, setPodcasts] = useState<PodcastWithGuests[]>([]);

  const isOwner = !!(user && user.id === profile.id);

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
    fetchPodcastsByGuest(profile.id).then(setPodcasts);
  }, [profile.id]);

  // Save a field to the database
  const saveField = async (field: string, value: unknown) => {
    if (!isOwner) return;
    setSaveStatus("saving");
    const { error } = await supabase
      .from("profiles")
      .update({ [field]: value, updated_at: new Date().toISOString() })
      .eq("id", user!.id);
    if (!error) {
      setProfile((prev) => ({ ...prev, [field]: value }));
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 1500);
    }
  };

  const handlePhotoUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const filePath = `profiles/${user.id}/avatar.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from("media")
        .upload(filePath, file, { upsert: true });
      if (uploadError) throw uploadError;
      const {
        data: { publicUrl },
      } = supabase.storage.from("media").getPublicUrl(filePath);
      setProfile((prev) => ({ ...prev, photo_url: publicUrl }));
      await supabase
        .from("profiles")
        .update({ photo_url: publicUrl })
        .eq("id", user.id);
    } catch (error) {
      console.error("Upload error:", error);
    } finally {
      setUploading(false);
    }
  };

  async function handleMessage() {
    if (!user) {
      router.push("/auth");
      return;
    }
    if (startingChat) return;
    setStartingChat(true);
    const [p1, p2] = [user.id, profile.id].sort();
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

  const initials =
    profile.name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "?";

  const socialLinks = [
    profile.linkedin && { type: "linkedin" as const, href: profile.linkedin },
    profile.twitter && { type: "twitter" as const, href: profile.twitter },
    profile.instagram && { type: "instagram" as const, href: profile.instagram },
    profile.website && { type: "website" as const, href: profile.website },
  ].filter(Boolean) as { type: "linkedin" | "twitter" | "instagram" | "website"; href: string }[];

  let buildingItems: string[] = [];
  if (profile.currently_building) {
    try {
      const parsed = JSON.parse(profile.currently_building);
      buildingItems = Array.isArray(parsed)
        ? parsed
        : [profile.currently_building];
    } catch {
      buildingItems = [profile.currently_building];
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 md:py-12 pb-24">
      {/* Save status indicator */}
      {isOwner && saveStatus !== "idle" && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2 px-3 py-1.5 rounded-full bg-card border border-border shadow-lg text-xs font-medium animate-in fade-in slide-in-from-top-2">
          {saveStatus === "saving" ? (
            <span className="text-muted-foreground">Saving...</span>
          ) : (
            <>
              <Check className="w-3 h-3 text-green-500" />
              <span className="text-green-600">Saved</span>
            </>
          )}
        </div>
      )}

      {/* Profile header — inspired by bertomill.ca */}
      <div className="flex items-start gap-4 mb-2">
        {/* Avatar */}
        <div className="relative shrink-0">
          <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center text-muted-foreground font-semibold text-lg overflow-hidden">
            {profile.photo_url ? (
              <img
                src={profile.photo_url}
                alt={profile.name || ""}
                className="w-full h-full object-cover"
              />
            ) : (
              initials
            )}
          </div>
          {isOwner && (
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="absolute -bottom-0.5 -right-0.5 w-6 h-6 rounded-full bg-card border border-border shadow-sm flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
            >
              <Camera className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Name + bio + social icons */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <InlineEdit
                value={profile.name || ""}
                onSave={(val) => saveField("name", val)}
                isOwner={isOwner}
                as="h1"
                placeholder="Your name"
                className="text-xl font-bold tracking-tight"
              />
              <InlineEdit
                value={profile.bio || ""}
                onSave={(val) => saveField("bio", val)}
                isOwner={isOwner}
                as="p"
                placeholder="Add a bio..."
                className="text-sm text-muted-foreground mt-0.5"
              />
            </div>
            {/* Social icons */}
            {socialLinks.length > 0 && (
              <div className="flex items-center gap-0.5 shrink-0">
                {socialLinks.map((link) => (
                  <SocialIcon
                    key={link.type}
                    type={link.type}
                    href={link.href}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-2 mt-4 mb-8">
        {isOwner ? (
          <Link
            href="/profile"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-secondary text-foreground hover:bg-secondary/80 transition-colors"
          >
            <Pencil className="w-3.5 h-3.5" />
            Full editor
          </Link>
        ) : user && user.id !== profile.id ? (
          <>
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
                    onClick={() => {
                      setShowReportModal(true);
                      setShowMenu(false);
                    }}
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
          </>
        ) : null}
      </div>

      {/* Report Modal */}
      {showReportModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
          onClick={() => setShowReportModal(false)}
        >
          <div
            className="bg-card rounded-xl p-5 w-full max-w-sm border border-border"
            onClick={(e) => e.stopPropagation()}
          >
            {reportSubmitted ? (
              <p className="text-sm text-center text-muted-foreground py-4">
                Report submitted. Thank you.
              </p>
            ) : (
              <>
                <h3 className="text-base font-semibold mb-3">
                  Report {profile.name || "this user"}
                </h3>
                <div className="space-y-2 mb-3">
                  {[
                    "Spam",
                    "Harassment or bullying",
                    "Inappropriate content",
                    "Misinformation",
                    "Other",
                  ].map((reason) => (
                    <label
                      key={reason}
                      className="flex items-center gap-2 text-sm cursor-pointer"
                    >
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

      {/* Content sections */}
      <div className="space-y-6">
        {/* Currently building */}
        {(buildingItems.length > 0 || isOwner) && (
          <section>
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Currently building
            </h2>
            <div className="rounded-xl bg-card border border-border/50 p-4">
              <InlineEdit
                value={(profile.currently_building || "").replace(/[\[\]"]/g, '')}
                onSave={(val) => saveField("currently_building", val)}
                isOwner={isOwner}
                placeholder="What are you working on?"
                className="text-sm text-foreground"
                multiline
              />
            </div>
          </section>
        )}

        {/* Skills */}
        {((profile.skills && profile.skills.length > 0) || isOwner) && (
          <section>
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Skills
            </h2>
            <div className="flex flex-wrap gap-1.5">
              {(profile.skills || []).map((skill) => (
                <span
                  key={skill}
                  className="px-3 py-1.5 rounded-full bg-secondary text-xs font-medium text-muted-foreground"
                >
                  {skill}
                </span>
              ))}
              {isOwner && (
                <Link
                  href="/profile"
                  className="px-3 py-1.5 rounded-full border border-dashed border-border text-xs text-muted-foreground hover:bg-secondary/50 transition-colors"
                >
                  + Edit skills
                </Link>
              )}
            </div>
          </section>
        )}

        {/* Looking for */}
        {((profile.looking_for_skills &&
          profile.looking_for_skills.length > 0) ||
          isOwner) && (
          <section>
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Looking for
            </h2>
            <div className="flex flex-wrap gap-1.5">
              {(profile.looking_for_skills || []).map((skill) => (
                <span
                  key={skill}
                  className="px-3 py-1.5 rounded-full bg-primary/10 text-xs font-medium text-primary"
                >
                  {skill}
                </span>
              ))}
              {isOwner && (
                <Link
                  href="/profile"
                  className="px-3 py-1.5 rounded-full border border-dashed border-border text-xs text-muted-foreground hover:bg-secondary/50 transition-colors"
                >
                  + Edit
                </Link>
              )}
            </div>
          </section>
        )}

        {/* Social links — shown as editable list for owner if empty */}
        {socialLinks.length === 0 && isOwner && (
          <section>
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Links
            </h2>
            <Link
              href="/profile"
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <Globe className="w-4 h-4" />
              Add your social links
            </Link>
          </section>
        )}
      </div>

      {/* Posts */}
      {posts.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Posts
          </h2>
          <div className="space-y-3">
            {posts.map((post) => (
              <div
                key={post.id}
                className="rounded-xl bg-card border border-border/50 p-4"
              >
                <p className="text-sm font-medium text-foreground">
                  {post.title}
                </p>
                {post.description && (
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-3">
                    {post.description}
                  </p>
                )}
                {post.media_urls && post.media_urls.length > 0 && (
                  <div className="mt-2 flex gap-2 overflow-x-auto">
                    {post.media_urls.slice(0, 3).map((url, i) => (
                      <div
                        key={i}
                        className="relative w-24 h-24 rounded-lg overflow-hidden shrink-0 bg-muted"
                      >
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
                  {new Date(post.created_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Podcasts */}
      {podcasts.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Podcasts
          </h2>
          <div className="space-y-3">
            {podcasts.map((ep) => (
              <Link
                key={ep.id}
                href={`/podcasts/${ep.slug}`}
                className="block rounded-xl bg-card border border-border/50 p-4 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <Mic className="w-4 h-4 mt-0.5 text-muted-foreground shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">
                      {ep.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      {ep.episode_number && (
                        <span className="text-[11px] text-muted-foreground">
                          Ep. {ep.episode_number}
                        </span>
                      )}
                      {ep.duration_seconds && (
                        <span className="text-[11px] text-muted-foreground">
                          {formatDuration(ep.duration_seconds)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Back */}
      <div className="mt-10 pt-6 border-t border-border">
        <Link
          href="/people"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          &larr; Back to people
        </Link>
      </div>

      {/* Hidden file input for photo upload */}
      {isOwner && (
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handlePhotoUpload}
          className="hidden"
        />
      )}
    </div>
  );
}
