"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import Calendar from "@/components/Calendar";
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

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [eventToEdit, setEventToEdit] = useState<Event | null>(null);

  const fetchEvents = async () => {
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .order("start_time", { ascending: true });

    if (error) {
      console.error("Error fetching events:", error);
    } else {
      setEvents(data || []);
    }
  };

  useEffect(() => {
    const checkAdmin = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setIsAdmin(user?.email === "bertmill19@gmail.com");
      setLoading(false);
    };

    checkAdmin();
    fetchEvents();
  }, []);

  const handleEditEvent = (event: Event) => {
    setEventToEdit(event);
  };

  const handleDeleteEvent = async (eventId: string) => {
    const { error } = await supabase.from("events").delete().eq("id", eventId);
    if (error) {
      console.error("Error deleting event:", error);
      alert("Failed to delete event. Please try again.");
    } else {
      fetchEvents();
    }
  };

  return (
    <div className="min-h-screen">
      {/* Hero Banner with Event Photos */}
      <div className="relative h-64 md:h-80 overflow-hidden">
        <div className="absolute inset-0 grid grid-cols-3 gap-1">
          <img
            src="/makerslounge-photos/presenting-slides.jpeg"
            alt="MakersLounge presentation"
            className="w-full h-full object-cover"
          />
          <img
            src="/makerslounge-photos/team-photo.jpeg"
            alt="MakersLounge team"
            className="w-full h-full object-cover"
          />
          <img
            src="/makerslounge-photos/lounge-networking.jpeg"
            alt="Networking at MakersLounge"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-8 text-center">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Events</h1>
          <p className="text-muted-foreground">
            Join us at upcoming maker meetups, workshops, and community events
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-12">
        <Calendar
          events={events}
          isAdmin={isAdmin}
          onEditEvent={handleEditEvent}
          onDeleteEvent={handleDeleteEvent}
        />
      </div>

      {/* Event Form - Only visible to admin */}
      {!loading && isAdmin && (
        <EventForm
          onEventCreated={fetchEvents}
          eventToEdit={eventToEdit}
          onCancelEdit={() => setEventToEdit(null)}
        />
      )}
    </div>
  );
}
