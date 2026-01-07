"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import EventForm from "@/components/EventForm";

interface Event {
  id: string;
  title: string;
  description: string | null;
  start_time: string;
  end_time: string;
  location: string | null;
  image_url: string | null;
  event_url: string | null;
  is_all_day: boolean;
}

export default function AdminEventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [eventToEdit, setEventToEdit] = useState<Event | null>(null);

  const fetchEvents = async () => {
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .order("start_time", { ascending: false });

    if (error) {
      console.error("Error fetching events:", error);
    } else {
      setEvents(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleDelete = async (eventId: string, eventTitle: string) => {
    if (!confirm(`Are you sure you want to delete "${eventTitle}"?`)) {
      return;
    }

    const { error } = await supabase.from("events").delete().eq("id", eventId);
    if (error) {
      console.error("Error deleting event:", error);
      alert("Failed to delete event. Please try again.");
    } else {
      fetchEvents();
    }
  };

  const handleEdit = (event: Event) => {
    setEventToEdit(event);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEventToEdit(null);
  };

  const handleEventSaved = () => {
    fetchEvents();
    handleFormClose();
  };

  const isUpcoming = (startTime: string) => {
    return new Date(startTime) >= new Date();
  };

  const isPast = (endTime: string) => {
    return new Date(endTime) < new Date();
  };

  const upcomingEvents = events.filter((e) => isUpcoming(e.start_time));
  const pastEvents = events.filter((e) => isPast(e.end_time));

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <Badge variant="secondary" className="mb-4">
            Admin
          </Badge>
          <h1 className="text-4xl font-bold mb-2">Event Planning</h1>
          <p className="text-muted-foreground">
            Create and manage community events
          </p>
        </div>
        <div className="flex gap-3">
          <Button asChild variant="outline">
            <Link href="/events">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              View Calendar
            </Link>
          </Button>
          <Button onClick={() => setShowForm(true)}>
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Event
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <Card className="p-6">
          <p className="text-sm text-muted-foreground mb-1">Total Events</p>
          <p className="text-3xl font-bold">{loading ? "..." : events.length}</p>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-muted-foreground mb-1">Upcoming</p>
          <p className="text-3xl font-bold text-green-500">
            {loading ? "..." : upcomingEvents.length}
          </p>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-muted-foreground mb-1">Past</p>
          <p className="text-3xl font-bold text-muted-foreground">
            {loading ? "..." : pastEvents.length}
          </p>
        </Card>
      </div>

      {/* Events List */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">All Events</h2>

        {loading ? (
          <div className="text-center py-12 text-muted-foreground">
            Loading events...
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">No events yet</p>
            <Button onClick={() => setShowForm(true)}>
              Create your first event
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 font-semibold">Event</th>
                  <th className="text-left py-3 px-4 font-semibold">Date & Time</th>
                  <th className="text-left py-3 px-4 font-semibold">Location</th>
                  <th className="text-left py-3 px-4 font-semibold">Status</th>
                  <th className="text-right py-3 px-4 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {events.map((event) => {
                  const startDate = new Date(event.start_time);
                  const endDate = new Date(event.end_time);
                  const upcoming = isUpcoming(event.start_time);
                  const past = isPast(event.end_time);

                  return (
                    <tr
                      key={event.id}
                      className="border-b border-border/50 hover:bg-muted/30"
                    >
                      <td className="py-4 px-4">
                        <Link
                          href={`/admin/events/${event.id}`}
                          className="flex items-center gap-3 group"
                        >
                          {event.image_url && (
                            <img
                              src={event.image_url}
                              alt={event.title}
                              className="w-12 h-12 rounded-lg object-cover"
                            />
                          )}
                          <div>
                            <p className="font-medium group-hover:text-primary transition-colors">
                              {event.title}
                            </p>
                            {event.description && (
                              <p className="text-sm text-muted-foreground line-clamp-1">
                                {event.description}
                              </p>
                            )}
                          </div>
                        </Link>
                      </td>
                      <td className="py-4 px-4">
                        <p className="text-sm">
                          {startDate.toLocaleDateString("en-US", {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {event.is_all_day
                            ? "All day"
                            : `${startDate.toLocaleTimeString("en-US", {
                                hour: "numeric",
                                minute: "2-digit",
                              })} - ${endDate.toLocaleTimeString("en-US", {
                                hour: "numeric",
                                minute: "2-digit",
                              })}`}
                        </p>
                      </td>
                      <td className="py-4 px-4">
                        <p className="text-sm text-muted-foreground">
                          {event.location || "—"}
                        </p>
                      </td>
                      <td className="py-4 px-4">
                        {past ? (
                          <Badge variant="secondary">Past</Badge>
                        ) : upcoming ? (
                          <Badge variant="default" className="bg-green-500">
                            Upcoming
                          </Badge>
                        ) : (
                          <Badge variant="outline">In Progress</Badge>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex justify-end gap-2">
                          <Button asChild size="sm">
                            <Link href={`/admin/events/${event.id}`}>
                              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                              </svg>
                              Plan
                            </Link>
                          </Button>
                          {event.event_url && (
                            <Button asChild variant="ghost" size="sm">
                              <a href={event.event_url} target="_blank" rel="noopener noreferrer">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                              </a>
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEdit(event);
                            }}
                          >
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            Edit
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(event.id, event.title);
                            }}
                          >
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Event Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">
                {eventToEdit ? "Edit Event" : "Create New Event"}
              </h2>
              <Button variant="ghost" size="sm" onClick={handleFormClose}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </Button>
            </div>
            <EventForm
              onEventCreated={handleEventSaved}
              eventToEdit={eventToEdit}
              onCancelEdit={handleFormClose}
              embedded
            />
          </Card>
        </div>
      )}
    </div>
  );
}
