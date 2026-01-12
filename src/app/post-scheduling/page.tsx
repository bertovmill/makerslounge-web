"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { User } from "@supabase/supabase-js";
import { cn } from "@/lib/utils";
import Link from "next/link";

type PostStatus = "not_started" | "draft_ready" | "posted";

interface ScheduledPost {
  id: string;
  event_id: string;
  platform: string;
  platform_icon: string;
  status: PostStatus;
  scheduled_date: string;
  notes?: string;
}

interface ContentEvent {
  id: string;
  name: string;
  description: string;
  event_date: string;
  color: string;
  posts: ScheduledPost[];
}

const platforms = [
  { id: "linkedin", name: "LinkedIn", icon: "in" },
  { id: "x", name: "X", icon: "X" },
  { id: "instagram", name: "Instagram", icon: "IG" },
  { id: "newsletter", name: "Newsletter", icon: "@" },
  { id: "youtube", name: "YouTube", icon: "YT" },
  { id: "tiktok", name: "TikTok", icon: "TT" },
  { id: "facebook", name: "Facebook", icon: "fb" },
  { id: "threads", name: "Threads", icon: "Th" },
];

const eventColors = [
  { id: "coral", bg: "bg-orange-100 dark:bg-orange-900/30", text: "text-orange-700 dark:text-orange-400", border: "border-orange-400", dot: "bg-orange-500" },
  { id: "blue", bg: "bg-blue-100 dark:bg-blue-900/30", text: "text-blue-700 dark:text-blue-400", border: "border-blue-400", dot: "bg-blue-500" },
  { id: "purple", bg: "bg-purple-100 dark:bg-purple-900/30", text: "text-purple-700 dark:text-purple-400", border: "border-purple-400", dot: "bg-purple-500" },
  { id: "green", bg: "bg-emerald-100 dark:bg-emerald-900/30", text: "text-emerald-700 dark:text-emerald-400", border: "border-emerald-400", dot: "bg-emerald-500" },
  { id: "pink", bg: "bg-pink-100 dark:bg-pink-900/30", text: "text-pink-700 dark:text-pink-400", border: "border-pink-400", dot: "bg-pink-500" },
  { id: "yellow", bg: "bg-amber-100 dark:bg-amber-900/30", text: "text-amber-700 dark:text-amber-400", border: "border-amber-400", dot: "bg-amber-500" },
];

const statusStyles: Record<PostStatus, { bg: string; text: string; border: string }> = {
  not_started: { bg: "bg-gray-100 dark:bg-gray-800", text: "text-gray-600 dark:text-gray-400", border: "border-gray-300 dark:border-gray-600" },
  draft_ready: { bg: "bg-blue-100 dark:bg-blue-900/30", text: "text-blue-700 dark:text-blue-400", border: "border-blue-400" },
  posted: { bg: "bg-green-100 dark:bg-green-900/30", text: "text-green-700 dark:text-green-400", border: "border-green-500" },
};

const statusLabels: Record<PostStatus, string> = {
  not_started: "Not Started",
  draft_ready: "Draft Ready",
  posted: "Posted",
};

export default function PostSchedulingPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<ContentEvent[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<ContentEvent | null>(null);

  // Modals
  const [showNewEvent, setShowNewEvent] = useState(false);
  const [showAddPost, setShowAddPost] = useState(false);
  const [editingPost, setEditingPost] = useState<{ post: ScheduledPost; event: ContentEvent } | null>(null);

  // New event form
  const [newEventName, setNewEventName] = useState("");
  const [newEventDescription, setNewEventDescription] = useState("");
  const [newEventDate, setNewEventDate] = useState("");
  const [newEventColor, setNewEventColor] = useState("coral");

  // New post form
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
  const [postEventId, setPostEventId] = useState<string | null>(null);

  // Fetch events and posts from Supabase
  const fetchEvents = useCallback(async (userId: string) => {
    setLoading(true);

    // Fetch events
    const { data: eventsData, error: eventsError } = await supabase
      .from("content_events")
      .select("*")
      .eq("user_id", userId)
      .order("event_date", { ascending: true });

    if (eventsError) {
      console.error("Error fetching events:", eventsError);
      setLoading(false);
      return;
    }

    // Fetch all posts for this user
    const { data: postsData, error: postsError } = await supabase
      .from("scheduled_posts")
      .select("*")
      .eq("user_id", userId);

    if (postsError) {
      console.error("Error fetching posts:", postsError);
      setLoading(false);
      return;
    }

    // Combine events with their posts
    const eventsWithPosts: ContentEvent[] = (eventsData || []).map((event) => ({
      id: event.id,
      name: event.name,
      description: event.description || "",
      event_date: event.event_date,
      color: event.color || "coral",
      posts: (postsData || [])
        .filter((post) => post.event_id === event.id)
        .map((post) => ({
          id: post.id,
          event_id: post.event_id,
          platform: post.platform,
          platform_icon: post.platform_icon,
          status: post.status as PostStatus,
          scheduled_date: post.scheduled_date,
          notes: post.notes || "",
        })),
    }));

    setEvents(eventsWithPosts);
    setLoading(false);
  }, []);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      if (user) {
        fetchEvents(user.id);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchEvents(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchEvents]);

  useEffect(() => {
    if (user === null && !loading) {
      const timer = setTimeout(() => {
        window.location.href = "/auth";
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [user, loading]);

  // Calendar helpers
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days: (Date | null)[] = [];
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  };

  const formatDateKey = (date: Date) => {
    return date.toISOString().split("T")[0];
  };

  const getPostsForDate = (date: Date) => {
    const dateKey = formatDateKey(date);
    const posts: { post: ScheduledPost; event: ContentEvent }[] = [];
    events.forEach((event) => {
      event.posts.forEach((post) => {
        if (post.scheduled_date === dateKey) {
          posts.push({ post, event });
        }
      });
    });
    return posts;
  };

  const getEventsForDate = (date: Date) => {
    const dateKey = formatDateKey(date);
    return events.filter((event) => event.event_date === dateKey);
  };

  const navigateMonth = (direction: number) => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + direction, 1)
    );
  };

  const getEventColor = (colorId: string) => {
    return eventColors.find((c) => c.id === colorId) || eventColors[0];
  };

  const createEvent = async () => {
    if (!newEventName.trim() || !newEventDate || !user) return;

    const { data, error } = await supabase
      .from("content_events")
      .insert({
        user_id: user.id,
        name: newEventName,
        description: newEventDescription,
        event_date: newEventDate,
        color: newEventColor,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating event:", error);
      return;
    }

    const newEvent: ContentEvent = {
      id: data.id,
      name: data.name,
      description: data.description || "",
      event_date: data.event_date,
      color: data.color,
      posts: [],
    };

    setEvents([...events, newEvent]);
    setNewEventName("");
    setNewEventDescription("");
    setNewEventDate("");
    setNewEventColor("coral");
    setShowNewEvent(false);
  };

  const addPostToEvent = async () => {
    if (!selectedPlatform || !postEventId || !selectedDate || !user) return;

    const platform = platforms.find((p) => p.id === selectedPlatform)!;

    const { data, error } = await supabase
      .from("scheduled_posts")
      .insert({
        user_id: user.id,
        event_id: postEventId,
        platform: platform.name,
        platform_icon: platform.icon,
        status: "not_started",
        scheduled_date: selectedDate,
        notes: "",
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating post:", error);
      return;
    }

    const newPost: ScheduledPost = {
      id: data.id,
      event_id: data.event_id,
      platform: data.platform,
      platform_icon: data.platform_icon,
      status: data.status as PostStatus,
      scheduled_date: data.scheduled_date,
      notes: data.notes || "",
    };

    setEvents(
      events.map((event) =>
        event.id === postEventId
          ? { ...event, posts: [...event.posts, newPost] }
          : event
      )
    );

    // Update selectedEvent if it's open
    if (selectedEvent && selectedEvent.id === postEventId) {
      setSelectedEvent({
        ...selectedEvent,
        posts: [...selectedEvent.posts, newPost],
      });
    }

    setSelectedPlatform(null);
    setPostEventId(null);
    setShowAddPost(false);
  };

  const updatePostStatus = async (eventId: string, postId: string, status: PostStatus) => {
    const { error } = await supabase
      .from("scheduled_posts")
      .update({ status })
      .eq("id", postId);

    if (error) {
      console.error("Error updating post status:", error);
      return;
    }

    setEvents(
      events.map((event) =>
        event.id === eventId
          ? {
              ...event,
              posts: event.posts.map((post) =>
                post.id === postId ? { ...post, status } : post
              ),
            }
          : event
      )
    );

    // Update selectedEvent if open
    if (selectedEvent && selectedEvent.id === eventId) {
      setSelectedEvent({
        ...selectedEvent,
        posts: selectedEvent.posts.map((post) =>
          post.id === postId ? { ...post, status } : post
        ),
      });
    }
  };

  const updatePostNotes = async (eventId: string, postId: string, notes: string) => {
    const { error } = await supabase
      .from("scheduled_posts")
      .update({ notes })
      .eq("id", postId);

    if (error) {
      console.error("Error updating post notes:", error);
      return;
    }

    setEvents(
      events.map((event) =>
        event.id === eventId
          ? {
              ...event,
              posts: event.posts.map((post) =>
                post.id === postId ? { ...post, notes } : post
              ),
            }
          : event
      )
    );
  };

  const updatePostDate = async (eventId: string, postId: string, newDate: string) => {
    const { error } = await supabase
      .from("scheduled_posts")
      .update({ scheduled_date: newDate })
      .eq("id", postId);

    if (error) {
      console.error("Error updating post date:", error);
      return;
    }

    setEvents(
      events.map((event) =>
        event.id === eventId
          ? {
              ...event,
              posts: event.posts.map((post) =>
                post.id === postId ? { ...post, scheduled_date: newDate } : post
              ),
            }
          : event
      )
    );
  };

  const deletePost = async (eventId: string, postId: string) => {
    const { error } = await supabase
      .from("scheduled_posts")
      .delete()
      .eq("id", postId);

    if (error) {
      console.error("Error deleting post:", error);
      return;
    }

    setEvents(
      events.map((event) =>
        event.id === eventId
          ? { ...event, posts: event.posts.filter((post) => post.id !== postId) }
          : event
      )
    );

    // Update selectedEvent if open
    if (selectedEvent && selectedEvent.id === eventId) {
      setSelectedEvent({
        ...selectedEvent,
        posts: selectedEvent.posts.filter((post) => post.id !== postId),
      });
    }

    setEditingPost(null);
  };

  const deleteEvent = async (eventId: string) => {
    const { error } = await supabase
      .from("content_events")
      .delete()
      .eq("id", eventId);

    if (error) {
      console.error("Error deleting event:", error);
      return;
    }

    setEvents(events.filter((event) => event.id !== eventId));
    setSelectedEvent(null);
  };

  const days = getDaysInMonth(currentDate);
  const monthName = currentDate.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
  const today = formatDateKey(new Date());

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <main className="max-w-7xl mx-auto px-4 sm:px-8 py-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Link
                href="/tools"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Tools
              </Link>
              <h1 className="text-3xl font-bold tracking-tight">Post Scheduling</h1>
              <p className="text-muted-foreground">Plan posts leading up to your events</p>
            </div>
            <button
              onClick={() => setShowNewEvent(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Event
            </button>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <span className="text-muted-foreground">Post Status:</span>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-gray-400" />
              <span className="text-muted-foreground">Not Started</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500" />
              <span className="text-blue-600 dark:text-blue-400">Draft Ready</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span className="text-green-600 dark:text-green-400">Posted</span>
            </div>
          </div>

          <div className="grid lg:grid-cols-[280px_1fr] gap-6">
            {/* Events Sidebar */}
            <div className="space-y-4">
              <h2 className="font-semibold text-lg">Your Events</h2>

              {events.length === 0 ? (
                <div className="glass-card rounded-xl p-6 text-center">
                  <p className="text-sm text-muted-foreground mb-3">No events yet</p>
                  <button
                    onClick={() => setShowNewEvent(true)}
                    className="text-sm text-primary hover:underline"
                  >
                    Create your first event
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {events
                    .sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime())
                    .map((event) => {
                      const color = getEventColor(event.color);
                      const postedCount = event.posts.filter((p) => p.status === "posted").length;
                      const totalCount = event.posts.length;

                      return (
                        <button
                          key={event.id}
                          onClick={() => setSelectedEvent(event)}
                          className={cn(
                            "w-full text-left p-3 rounded-lg border-l-4 transition-all",
                            color.bg,
                            color.border,
                            "hover:shadow-md"
                          )}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <div className={cn("font-medium truncate", color.text)}>
                                {event.name}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {new Date(event.event_date + "T00:00:00").toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                })}
                              </div>
                            </div>
                            <div className="text-xs text-muted-foreground whitespace-nowrap">
                              {postedCount}/{totalCount} posts
                            </div>
                          </div>
                        </button>
                      );
                    })}
                </div>
              )}
            </div>

            {/* Calendar */}
            <div className="glass-card rounded-xl overflow-hidden">
              {/* Calendar Header */}
              <div className="flex items-center justify-between p-4 border-b border-border">
                <button
                  onClick={() => navigateMonth(-1)}
                  className="p-2 hover:bg-muted rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <h2 className="text-xl font-semibold">{monthName}</h2>
                <button
                  onClick={() => navigateMonth(1)}
                  className="p-2 hover:bg-muted rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>

              {/* Day Headers */}
              <div className="grid grid-cols-7 border-b border-border">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                  <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7">
                {days.map((day, index) => {
                  if (!day) {
                    return (
                      <div
                        key={`empty-${index}`}
                        className="min-h-[100px] bg-muted/20 border-r border-b border-border last:border-r-0"
                      />
                    );
                  }

                  const dateKey = formatDateKey(day);
                  const dayPosts = getPostsForDate(day);
                  const dayEvents = getEventsForDate(day);
                  const isToday = dateKey === today;

                  return (
                    <div
                      key={dateKey}
                      className={cn(
                        "min-h-[100px] p-1 border-r border-b border-border last:border-r-0 hover:bg-muted/30 transition-colors cursor-pointer",
                        isToday && "bg-primary/5"
                      )}
                      onClick={() => {
                        if (events.length > 0) {
                          setSelectedDate(dateKey);
                          setShowAddPost(true);
                        } else {
                          setShowNewEvent(true);
                        }
                      }}
                    >
                      <div className="flex items-center gap-1">
                        <div
                          className={cn(
                            "text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full",
                            isToday && "bg-primary text-primary-foreground"
                          )}
                        >
                          {day.getDate()}
                        </div>
                        {/* Event indicators */}
                        {dayEvents.map((event) => {
                          const color = getEventColor(event.color);
                          return (
                            <div
                              key={event.id}
                              className={cn("w-2 h-2 rounded-full", color.dot)}
                              title={`Event: ${event.name}`}
                            />
                          );
                        })}
                      </div>

                      {/* Event day banner */}
                      {dayEvents.map((event) => {
                        const color = getEventColor(event.color);
                        return (
                          <div
                            key={event.id}
                            className={cn(
                              "text-xs px-1.5 py-0.5 rounded mt-1 font-medium truncate",
                              color.bg,
                              color.text
                            )}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedEvent(event);
                            }}
                          >
                            {event.name}
                          </div>
                        );
                      })}

                      {/* Posts */}
                      <div className="space-y-0.5 mt-1">
                        {dayPosts.slice(0, 3).map(({ post, event }) => {
                          const eventColor = getEventColor(event.color);
                          return (
                            <button
                              key={post.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingPost({ post, event });
                              }}
                              className={cn(
                                "w-full text-left px-1.5 py-0.5 rounded text-xs font-medium truncate flex items-center gap-1",
                                statusStyles[post.status].bg,
                                statusStyles[post.status].text
                              )}
                            >
                              <span className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", eventColor.dot)} />
                              {post.platform_icon}
                            </button>
                          );
                        })}
                        {dayPosts.length > 3 && (
                          <div className="text-xs text-muted-foreground px-1">
                            +{dayPosts.length - 3} more
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* New Event Modal */}
      {showNewEvent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Create Event</h2>
              <button
                onClick={() => {
                  setShowNewEvent(false);
                  setNewEventName("");
                  setNewEventDescription("");
                  setNewEventDate("");
                }}
                className="p-2 hover:bg-muted rounded-lg"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Event Name *</label>
                <input
                  type="text"
                  value={newEventName}
                  onChange={(e) => setNewEventName(e.target.value)}
                  placeholder="e.g., MakersLounge Show & Tell #7"
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <input
                  type="text"
                  value={newEventDescription}
                  onChange={(e) => setNewEventDescription(e.target.value)}
                  placeholder="e.g., Monthly community showcase"
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Event Date *</label>
                <input
                  type="date"
                  value={newEventDate}
                  onChange={(e) => setNewEventDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Color</label>
                <div className="flex gap-2">
                  {eventColors.map((color) => (
                    <button
                      key={color.id}
                      onClick={() => setNewEventColor(color.id)}
                      className={cn(
                        "w-8 h-8 rounded-full transition-all",
                        color.dot,
                        newEventColor === color.id && "ring-2 ring-offset-2 ring-primary"
                      )}
                    />
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={createEvent}
                  disabled={!newEventName.trim() || !newEventDate}
                  className="flex-1 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Create Event
                </button>
                <button
                  onClick={() => {
                    setShowNewEvent(false);
                    setNewEventName("");
                    setNewEventDescription("");
                    setNewEventDate("");
                  }}
                  className="px-4 py-2 rounded-lg border border-border hover:bg-muted transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Post Modal */}
      {showAddPost && selectedDate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">
                Add Post for{" "}
                {new Date(selectedDate + "T00:00:00").toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })}
              </h2>
              <button
                onClick={() => {
                  setShowAddPost(false);
                  setSelectedDate(null);
                  setSelectedPlatform(null);
                  setPostEventId(null);
                }}
                className="p-2 hover:bg-muted rounded-lg"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">For which event?</label>
                <div className="space-y-2">
                  {events.map((event) => {
                    const color = getEventColor(event.color);
                    return (
                      <button
                        key={event.id}
                        onClick={() => setPostEventId(event.id)}
                        className={cn(
                          "w-full text-left p-3 rounded-lg border-2 transition-all",
                          postEventId === event.id
                            ? cn(color.bg, color.border)
                            : "border-border hover:border-primary/50"
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <div className={cn("w-3 h-3 rounded-full", color.dot)} />
                          <span className="font-medium">{event.name}</span>
                        </div>
                        <div className="text-xs text-muted-foreground ml-5">
                          Event date:{" "}
                          {new Date(event.event_date + "T00:00:00").toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Platform</label>
                <div className="grid grid-cols-4 gap-2">
                  {platforms.map((platform) => (
                    <button
                      key={platform.id}
                      onClick={() => setSelectedPlatform(platform.id)}
                      className={cn(
                        "p-2 rounded-lg text-center transition-all",
                        selectedPlatform === platform.id
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      )}
                    >
                      <div className="font-bold text-lg">{platform.icon}</div>
                      <div className="text-xs mt-0.5">{platform.name}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={addPostToEvent}
                  disabled={!selectedPlatform || !postEventId}
                  className="flex-1 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add Post
                </button>
                <button
                  onClick={() => {
                    setShowAddPost(false);
                    setSelectedDate(null);
                    setSelectedPlatform(null);
                    setPostEventId(null);
                  }}
                  className="px-4 py-2 rounded-lg border border-border hover:bg-muted transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Post Modal */}
      {editingPost && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span
                  className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center font-bold",
                    statusStyles[editingPost.post.status].bg,
                    statusStyles[editingPost.post.status].text
                  )}
                >
                  {editingPost.post.platform_icon}
                </span>
                <div>
                  <h2 className="font-semibold">{editingPost.post.platform}</h2>
                  <p className="text-sm text-muted-foreground">
                    for {editingPost.event.name}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditingPost(null)}
                className="p-2 hover:bg-muted rounded-lg"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <div className="flex gap-2">
                  {(Object.keys(statusStyles) as PostStatus[]).map((status) => (
                    <button
                      key={status}
                      onClick={() => {
                        updatePostStatus(editingPost.event.id, editingPost.post.id, status);
                        setEditingPost({
                          ...editingPost,
                          post: { ...editingPost.post, status },
                        });
                      }}
                      className={cn(
                        "flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all border-2",
                        editingPost.post.status === status
                          ? cn(
                              statusStyles[status].bg,
                              statusStyles[status].text,
                              statusStyles[status].border
                            )
                          : "border-border hover:border-primary/50"
                      )}
                    >
                      {statusLabels[status]}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Scheduled Date</label>
                <input
                  type="date"
                  value={editingPost.post.scheduled_date}
                  onChange={(e) => {
                    const newDate = e.target.value;
                    updatePostDate(editingPost.event.id, editingPost.post.id, newDate);
                    setEditingPost({
                      ...editingPost,
                      post: { ...editingPost.post, scheduled_date: newDate },
                    });
                  }}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Notes</label>
                <textarea
                  value={editingPost.post.notes || ""}
                  onChange={(e) => {
                    updatePostNotes(editingPost.event.id, editingPost.post.id, e.target.value);
                    setEditingPost({
                      ...editingPost,
                      post: { ...editingPost.post, notes: e.target.value },
                    });
                  }}
                  placeholder="Add notes, links to drafts, content ideas..."
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setEditingPost(null)}
                  className="flex-1 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
                >
                  Done
                </button>
                <button
                  onClick={() => deletePost(editingPost.event.id, editingPost.post.id)}
                  className="px-4 py-2 rounded-lg border border-red-300 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Event Details Sidebar */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black/50 flex justify-end z-50">
          <div
            className="absolute inset-0"
            onClick={() => setSelectedEvent(null)}
          />
          <div className="relative bg-background w-full max-w-md h-full overflow-y-auto p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={cn("w-4 h-4 rounded-full", getEventColor(selectedEvent.color).dot)} />
                <h2 className="text-xl font-semibold">{selectedEvent.name}</h2>
              </div>
              <button
                onClick={() => setSelectedEvent(null)}
                className="p-2 hover:bg-muted rounded-lg"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-1 text-sm">
              <div className="text-muted-foreground">Event Date</div>
              <div className="font-medium">
                {new Date(selectedEvent.event_date + "T00:00:00").toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </div>
              {selectedEvent.description && (
                <div className="text-muted-foreground mt-2">{selectedEvent.description}</div>
              )}
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Scheduled Posts ({selectedEvent.posts.length})</h3>
                <button
                  onClick={() => {
                    setPostEventId(selectedEvent.id);
                    setSelectedDate(selectedEvent.event_date);
                    setShowAddPost(true);
                  }}
                  className="text-sm text-primary hover:underline"
                >
                  + Add post
                </button>
              </div>

              {selectedEvent.posts.length === 0 ? (
                <p className="text-sm text-muted-foreground">No posts scheduled yet</p>
              ) : (
                <div className="space-y-2">
                  {selectedEvent.posts
                    .sort((a, b) => new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime())
                    .map((post) => (
                      <button
                        key={post.id}
                        onClick={() => setEditingPost({ post, event: selectedEvent })}
                        className={cn(
                          "w-full text-left p-3 rounded-lg border-l-4 transition-all",
                          statusStyles[post.status].bg,
                          statusStyles[post.status].border,
                          "hover:shadow-md"
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className={cn("font-bold", statusStyles[post.status].text)}>
                              {post.platform_icon}
                            </span>
                            <span className="font-medium">{post.platform}</span>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {new Date(post.scheduled_date + "T00:00:00").toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                        </div>
                        <div className={cn("text-xs mt-1", statusStyles[post.status].text)}>
                          {statusLabels[post.status]}
                        </div>
                        {post.notes && (
                          <div className="text-xs text-muted-foreground mt-1 truncate">
                            {post.notes}
                          </div>
                        )}
                      </button>
                    ))}
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-border">
              <button
                onClick={() => deleteEvent(selectedEvent.id)}
                className="text-sm text-red-600 hover:underline"
              >
                Delete event
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
