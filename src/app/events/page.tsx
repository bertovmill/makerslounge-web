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
      const { data: { user } } = await supabase.auth.getUser();
      setIsAdmin(user?.email === "bertmill19@gmail.com");
      setLoading(false);
    };

    checkAdmin();
    fetchEvents();
  }, []);

  const handleDeleteEvent = async (eventId: string) => {
    const { error } = await supabase.from("events").delete().eq("id", eventId);
    if (!error) fetchEvents();
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 md:py-8">
      <div className="mb-6 md:mb-8">
        <h1 className="text-[28px] md:text-2xl font-bold md:font-semibold tracking-tight mb-0.5">Events</h1>
        <p className="text-[13px] md:text-sm text-muted-foreground">
          Upcoming meetups, workshops, and community events
        </p>
      </div>

      <Calendar
        events={events}
        isAdmin={isAdmin}
        onEditEvent={(event) => setEventToEdit(event)}
        onDeleteEvent={handleDeleteEvent}
      />

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
