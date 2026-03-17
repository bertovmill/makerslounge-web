"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { X } from "lucide-react";
import {
  PodcastWithGuests,
  PodcastGuest,
  createPodcast,
  updatePodcast,
  addGuest,
  removeGuest,
  searchProfiles,
  uploadPodcastAudio,
  uploadPodcastCover,
} from "@/lib/podcasts";

interface PodcastFormProps {
  userId: string;
  podcast?: PodcastWithGuests;
}

export default function PodcastForm({ userId, podcast }: PodcastFormProps) {
  const router = useRouter();
  const isEditing = !!podcast;

  const [title, setTitle] = useState(podcast?.title || "");
  const [slug, setSlug] = useState(podcast?.slug || "");
  const [description, setDescription] = useState(podcast?.description || "");
  const [transcript, setTranscript] = useState(podcast?.transcript || "");
  const [episodeNumber, setEpisodeNumber] = useState(podcast?.episode_number?.toString() || "");
  const [durationSeconds, setDurationSeconds] = useState(podcast?.duration_seconds?.toString() || "");
  const [audioUrl, setAudioUrl] = useState(podcast?.audio_url || "");
  const [coverUrl, setCoverUrl] = useState(podcast?.cover_image_url || "");
  const [guests, setGuests] = useState<PodcastGuest[]>(podcast?.guests || []);

  const [guestQuery, setGuestQuery] = useState("");
  const [guestResults, setGuestResults] = useState<PodcastGuest[]>([]);
  const [showGuestDropdown, setShowGuestDropdown] = useState(false);
  const searchTimeout = useRef<NodeJS.Timeout>(undefined);

  const [uploadingAudio, setUploadingAudio] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const generateSlug = (t: string) =>
    t.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
    if (!isEditing || !slug) setSlug(generateSlug(e.target.value));
  };

  // Guest search with debounce
  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (guestQuery.length < 2) {
      setGuestResults([]);
      setShowGuestDropdown(false);
      return;
    }
    searchTimeout.current = setTimeout(async () => {
      const results = await searchProfiles(guestQuery);
      // Filter out already-added guests
      const filtered = results.filter((r) => !guests.some((g) => g.id === r.id));
      setGuestResults(filtered);
      setShowGuestDropdown(filtered.length > 0);
    }, 300);
  }, [guestQuery, guests]);

  const handleAddGuest = (guest: PodcastGuest) => {
    setGuests([...guests, guest]);
    setGuestQuery("");
    setShowGuestDropdown(false);
  };

  const handleRemoveGuest = (guestId: string) => {
    setGuests(guests.filter((g) => g.id !== guestId));
  };

  const handleAudioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAudio(true);

    // If editing, use existing ID; otherwise we need to create first
    // For now, use a temp ID and re-upload after create
    const tempId = podcast?.id || crypto.randomUUID();
    const { url, error } = await uploadPodcastAudio(tempId, file);
    if (url) {
      setAudioUrl(url);
      // Try to get duration from file
      const audio = document.createElement("audio");
      audio.src = URL.createObjectURL(file);
      audio.onloadedmetadata = () => {
        if (isFinite(audio.duration)) {
          setDurationSeconds(Math.round(audio.duration).toString());
        }
        URL.revokeObjectURL(audio.src);
      };
    } else {
      alert(`Upload failed: ${error}`);
    }
    setUploadingAudio(false);
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingCover(true);
    const tempId = podcast?.id || crypto.randomUUID();
    const { url, error } = await uploadPodcastCover(tempId, file);
    if (url) setCoverUrl(url);
    else alert(`Upload failed: ${error}`);
    setUploadingCover(false);
  };

  const handleSave = async (publish: boolean) => {
    if (!title.trim() || !slug.trim()) {
      alert("Title and slug are required");
      return;
    }
    setIsSaving(true);

    const publishedAt = publish
      ? podcast?.published_at || new Date().toISOString()
      : null;

    if (isEditing) {
      const result = await updatePodcast(podcast.id, {
        title: title.trim(),
        slug: slug.trim(),
        description: description.trim() || null,
        transcript: transcript.trim() || null,
        audio_url: audioUrl || null,
        cover_image_url: coverUrl || null,
        duration_seconds: durationSeconds ? parseInt(durationSeconds) : null,
        episode_number: episodeNumber ? parseInt(episodeNumber) : null,
        is_published: publish,
        published_at: publishedAt,
      });

      if (!result.success) {
        alert(`Error: ${result.error}`);
        setIsSaving(false);
        return;
      }

      // Sync guests: remove old, add new
      const oldGuestIds = podcast.guests.map((g) => g.id);
      const newGuestIds = guests.map((g) => g.id);
      for (const id of oldGuestIds) {
        if (!newGuestIds.includes(id)) await removeGuest(podcast.id, id);
      }
      for (const id of newGuestIds) {
        if (!oldGuestIds.includes(id)) await addGuest(podcast.id, id);
      }
    } else {
      const result = await createPodcast({
        title: title.trim(),
        slug: slug.trim(),
        description: description.trim() || undefined,
        transcript: transcript.trim() || undefined,
        audio_url: audioUrl || undefined,
        cover_image_url: coverUrl || undefined,
        duration_seconds: durationSeconds ? parseInt(durationSeconds) : undefined,
        episode_number: episodeNumber ? parseInt(episodeNumber) : undefined,
        is_published: publish,
        published_at: publishedAt,
        created_by: userId,
      });

      if (!result.success || !result.id) {
        alert(`Error: ${result.error}`);
        setIsSaving(false);
        return;
      }

      // Add guests
      for (const guest of guests) {
        await addGuest(result.id, guest.id);
      }
    }

    router.push("/admin/podcasts");
    router.refresh();
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-semibold mb-2">
              Title <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={handleTitleChange}
              placeholder="Episode title..."
              className="w-full px-4 py-3 bg-muted rounded-lg border-0 focus:ring-2 focus:ring-primary/20 outline-none text-lg font-semibold"
            />
          </div>

          {/* Slug */}
          <div>
            <label className="block text-sm font-semibold mb-2">
              Slug
              <span className="text-xs text-muted-foreground font-normal ml-2">
                (/podcasts/{slug || "episode-slug"})
              </span>
            </label>
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="episode-slug"
              className="w-full px-4 py-3 bg-muted rounded-lg border-0 focus:ring-2 focus:ring-primary/20 outline-none font-mono text-sm"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold mb-2">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What's this episode about?"
              rows={3}
              className="w-full px-4 py-3 bg-muted rounded-lg border-0 focus:ring-2 focus:ring-primary/20 outline-none resize-none"
            />
          </div>

          {/* Episode Number & Duration */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-2">Episode #</label>
              <input
                type="number"
                value={episodeNumber}
                onChange={(e) => setEpisodeNumber(e.target.value)}
                placeholder="1"
                min="1"
                className="w-full px-4 py-3 bg-muted rounded-lg border-0 focus:ring-2 focus:ring-primary/20 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">Duration (seconds)</label>
              <input
                type="number"
                value={durationSeconds}
                onChange={(e) => setDurationSeconds(e.target.value)}
                placeholder="Auto-detected from audio"
                min="0"
                className="w-full px-4 py-3 bg-muted rounded-lg border-0 focus:ring-2 focus:ring-primary/20 outline-none"
              />
            </div>
          </div>

          {/* Audio Upload */}
          <div>
            <label className="block text-sm font-semibold mb-2">Audio File</label>
            {audioUrl ? (
              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                <span className="text-sm text-muted-foreground truncate flex-1">{audioUrl}</span>
                <button
                  onClick={() => setAudioUrl("")}
                  className="text-xs text-destructive hover:underline shrink-0"
                >
                  Remove
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-muted-foreground/50 transition-colors">
                <span className="text-sm text-muted-foreground">
                  {uploadingAudio ? "Uploading..." : "Click to upload audio (mp3, wav, m4a)"}
                </span>
                <input
                  type="file"
                  accept="audio/*"
                  onChange={handleAudioUpload}
                  className="hidden"
                  disabled={uploadingAudio}
                />
              </label>
            )}
          </div>

          {/* Cover Image Upload */}
          <div>
            <label className="block text-sm font-semibold mb-2">Cover Image</label>
            {coverUrl ? (
              <div className="space-y-2">
                <img src={coverUrl} alt="Cover" className="rounded-lg max-h-48 object-cover" />
                <button
                  onClick={() => setCoverUrl("")}
                  className="text-xs text-destructive hover:underline"
                >
                  Remove
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-muted-foreground/50 transition-colors">
                <span className="text-sm text-muted-foreground">
                  {uploadingCover ? "Uploading..." : "Click to upload cover image"}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleCoverUpload}
                  className="hidden"
                  disabled={uploadingCover}
                />
              </label>
            )}
          </div>

          {/* Guest Tagging */}
          <div>
            <label className="block text-sm font-semibold mb-2">Guests</label>

            {/* Added guests */}
            {guests.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {guests.map((guest) => (
                  <span
                    key={guest.id}
                    className="inline-flex items-center gap-1.5 pl-1.5 pr-2 py-1 rounded-full bg-secondary text-sm"
                  >
                    {guest.photo_url ? (
                      <img
                        src={guest.photo_url}
                        alt=""
                        className="w-5 h-5 rounded-full object-cover"
                      />
                    ) : (
                      <span className="w-5 h-5 rounded-full bg-muted flex items-center justify-center text-[10px] font-medium">
                        {guest.name?.[0] || "?"}
                      </span>
                    )}
                    <span>{guest.name || guest.username || "Unknown"}</span>
                    <button
                      onClick={() => handleRemoveGuest(guest.id)}
                      className="ml-0.5 text-muted-foreground hover:text-foreground"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Search input */}
            <div className="relative">
              <input
                type="text"
                value={guestQuery}
                onChange={(e) => setGuestQuery(e.target.value)}
                placeholder="Search by name or username..."
                className="w-full px-4 py-3 bg-muted rounded-lg border-0 focus:ring-2 focus:ring-primary/20 outline-none"
                onBlur={() => setTimeout(() => setShowGuestDropdown(false), 200)}
              />
              {showGuestDropdown && (
                <div className="absolute left-0 right-0 top-full mt-1 bg-card border border-border rounded-lg shadow-lg z-10 overflow-hidden">
                  {guestResults.map((profile) => (
                    <button
                      key={profile.id}
                      onMouseDown={() => handleAddGuest(profile)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-left hover:bg-secondary transition-colors"
                    >
                      {profile.photo_url ? (
                        <img
                          src={profile.photo_url}
                          alt=""
                          className="w-7 h-7 rounded-full object-cover"
                        />
                      ) : (
                        <span className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
                          {profile.name?.[0] || "?"}
                        </span>
                      )}
                      <div>
                        <p className="font-medium">{profile.name || "Unknown"}</p>
                        {profile.username && (
                          <p className="text-xs text-muted-foreground">@{profile.username}</p>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Transcript */}
          <div>
            <label className="block text-sm font-semibold mb-2">Transcript</label>
            <textarea
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              placeholder="Paste the transcript here..."
              rows={15}
              className="w-full px-4 py-3 bg-muted rounded-lg border-0 focus:ring-2 focus:ring-primary/20 outline-none resize-none font-mono text-sm"
            />
          </div>
        </div>
      </Card>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <Button asChild variant="ghost">
          <Link href="/admin/podcasts">Cancel</Link>
        </Button>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => handleSave(false)} disabled={isSaving}>
            {isSaving ? "Saving..." : "Save as Draft"}
          </Button>
          <Button
            onClick={() => handleSave(true)}
            disabled={isSaving}
            className="bg-green-500 hover:bg-green-600"
          >
            {isSaving ? "Publishing..." : isEditing ? "Update & Publish" : "Publish"}
          </Button>
        </div>
      </div>
    </div>
  );
}
