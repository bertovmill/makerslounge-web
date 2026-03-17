import { supabase } from "./supabase";

export interface PodcastRow {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  transcript: string | null;
  audio_url: string | null;
  cover_image_url: string | null;
  duration_seconds: number | null;
  episode_number: number | null;
  is_published: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface PodcastGuest {
  id: string;
  name: string | null;
  username: string | null;
  photo_url: string | null;
}

export interface PodcastWithGuests extends PodcastRow {
  guests: PodcastGuest[];
}

// Fetch all published podcasts with guests
export async function fetchPublishedPodcasts(): Promise<PodcastWithGuests[]> {
  const { data: podcasts } = await supabase
    .from("podcasts")
    .select("*")
    .eq("is_published", true)
    .order("published_at", { ascending: false });

  if (!podcasts) return [];

  // Fetch guests for each podcast
  const results: PodcastWithGuests[] = [];
  for (const podcast of podcasts) {
    const guests = await fetchGuestsForPodcast(podcast.id);
    results.push({ ...podcast, guests });
  }
  return results;
}

// Fetch all podcasts (admin - includes drafts)
export async function fetchAllPodcasts(): Promise<PodcastWithGuests[]> {
  const { data: podcasts } = await supabase
    .from("podcasts")
    .select("*")
    .order("created_at", { ascending: false });

  if (!podcasts) return [];

  const results: PodcastWithGuests[] = [];
  for (const podcast of podcasts) {
    const guests = await fetchGuestsForPodcast(podcast.id);
    results.push({ ...podcast, guests });
  }
  return results;
}

// Fetch single podcast by slug
export async function fetchPodcastBySlug(slug: string): Promise<PodcastWithGuests | null> {
  const { data: podcast } = await supabase
    .from("podcasts")
    .select("*")
    .eq("slug", slug)
    .single();

  if (!podcast) return null;

  const guests = await fetchGuestsForPodcast(podcast.id);
  return { ...podcast, guests };
}

// Fetch single podcast by ID (admin)
export async function fetchPodcastById(id: string): Promise<PodcastWithGuests | null> {
  const { data: podcast } = await supabase
    .from("podcasts")
    .select("*")
    .eq("id", id)
    .single();

  if (!podcast) return null;

  const guests = await fetchGuestsForPodcast(podcast.id);
  return { ...podcast, guests };
}

// Fetch podcasts where a user is a guest
export async function fetchPodcastsByGuest(profileId: string): Promise<PodcastWithGuests[]> {
  const { data: guestRows } = await supabase
    .from("podcast_guests")
    .select("podcast_id")
    .eq("profile_id", profileId);

  if (!guestRows || guestRows.length === 0) return [];

  const podcastIds = guestRows.map((r) => r.podcast_id);
  const { data: podcasts } = await supabase
    .from("podcasts")
    .select("*")
    .in("id", podcastIds)
    .eq("is_published", true)
    .order("published_at", { ascending: false });

  if (!podcasts) return [];

  const results: PodcastWithGuests[] = [];
  for (const podcast of podcasts) {
    const guests = await fetchGuestsForPodcast(podcast.id);
    results.push({ ...podcast, guests });
  }
  return results;
}

// Fetch guests for a podcast
async function fetchGuestsForPodcast(podcastId: string): Promise<PodcastGuest[]> {
  const { data } = await supabase
    .from("podcast_guests")
    .select("profile_id")
    .eq("podcast_id", podcastId);

  if (!data || data.length === 0) return [];

  const profileIds = data.map((r) => r.profile_id);
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, name, username, photo_url")
    .in("id", profileIds);

  return (profiles || []) as PodcastGuest[];
}

// Create podcast
export async function createPodcast(data: {
  title: string;
  slug: string;
  description?: string;
  transcript?: string;
  audio_url?: string;
  cover_image_url?: string;
  duration_seconds?: number;
  episode_number?: number;
  is_published: boolean;
  published_at?: string | null;
  created_by: string;
}): Promise<{ success: boolean; id?: string; error?: string }> {
  const { data: result, error } = await supabase
    .from("podcasts")
    .insert(data)
    .select("id")
    .single();

  if (error) return { success: false, error: error.message };
  return { success: true, id: result.id };
}

// Update podcast
export async function updatePodcast(
  id: string,
  data: Partial<PodcastRow>
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from("podcasts")
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

// Delete podcast
export async function deletePodcast(id: string): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase.from("podcasts").delete().eq("id", id);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

// Add guest to podcast
export async function addGuest(podcastId: string, profileId: string) {
  return supabase.from("podcast_guests").insert({ podcast_id: podcastId, profile_id: profileId });
}

// Remove guest from podcast
export async function removeGuest(podcastId: string, profileId: string) {
  return supabase
    .from("podcast_guests")
    .delete()
    .eq("podcast_id", podcastId)
    .eq("profile_id", profileId);
}

// Search profiles for guest tagging
export async function searchProfiles(query: string): Promise<PodcastGuest[]> {
  if (!query || query.length < 2) return [];

  const { data } = await supabase
    .from("profiles")
    .select("id, name, username, photo_url")
    .or(`name.ilike.%${query}%,username.ilike.%${query}%`)
    .limit(5);

  return (data || []) as PodcastGuest[];
}

// Upload audio file
export async function uploadPodcastAudio(
  podcastId: string,
  file: File
): Promise<{ url: string | null; error?: string }> {
  const ext = file.name.split(".").pop();
  const path = `${podcastId}/audio.${ext}`;

  const { error } = await supabase.storage
    .from("podcasts")
    .upload(path, file, { upsert: true });

  if (error) return { url: null, error: error.message };

  const { data } = supabase.storage.from("podcasts").getPublicUrl(path);
  return { url: data.publicUrl };
}

// Upload cover image
export async function uploadPodcastCover(
  podcastId: string,
  file: File
): Promise<{ url: string | null; error?: string }> {
  const ext = file.name.split(".").pop();
  const path = `${podcastId}/cover.${ext}`;

  const { error } = await supabase.storage
    .from("podcasts")
    .upload(path, file, { upsert: true });

  if (error) return { url: null, error: error.message };

  const { data } = supabase.storage.from("podcasts").getPublicUrl(path);
  return { url: data.publicUrl };
}

// Format duration
export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins >= 60) {
    const hrs = Math.floor(mins / 60);
    const remainMins = mins % 60;
    return `${hrs}h ${remainMins}m`;
  }
  return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
}
