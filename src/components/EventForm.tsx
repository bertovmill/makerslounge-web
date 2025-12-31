"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Plus, X } from "lucide-react";

interface EventFormProps {
  onEventCreated: () => void;
}

export default function EventForm({ onEventCreated }: EventFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAllDay, setIsAllDay] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    start_time: "",
    end_time: "",
    location: "",
    image_url: "",
    event_url: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      let startTime = formData.start_time;
      let endTime = formData.end_time;

      // If all-day event, set times to start and end of day
      if (isAllDay) {
        const startDate = formData.start_time.split("T")[0];
        const endDate = formData.end_time.split("T")[0];
        startTime = `${startDate}T00:00:00`;
        endTime = `${endDate}T23:59:59`;
      }

      const { error } = await supabase.from("events").insert({
        title: formData.title,
        description: formData.description || null,
        start_time: startTime,
        end_time: endTime,
        location: formData.location || null,
        image_url: formData.image_url || null,
        event_url: formData.event_url || null,
        is_all_day: isAllDay,
      });

      if (error) throw error;

      // Reset form
      setFormData({
        title: "",
        description: "",
        start_time: "",
        end_time: "",
        location: "",
        image_url: "",
        event_url: "",
      });
      setIsAllDay(false);
      setIsOpen(false);
      onEventCreated();
    } catch (error) {
      console.error("Error creating event:", error);
      alert("Failed to create event. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Add Event Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-24 right-6 bg-primary text-primary-foreground rounded-full p-4 shadow-lg hover:shadow-xl transition-all hover:scale-105 flex items-center gap-2 z-50"
      >
        <Plus className="w-6 h-6" />
        <span className="font-medium pr-2">Add Event</span>
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-background border-b border-border p-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold">Create New Event</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-secondary rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label htmlFor="title" className="block text-sm font-medium mb-2">
                  Event Title *
                </label>
                <input
                  type="text"
                  id="title"
                  required
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Makers Meetup #42"
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium mb-2">
                  Description
                </label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows={3}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Join us for an evening of networking and learning..."
                />
              </div>

              {/* All Day Event Checkbox */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_all_day"
                  checked={isAllDay}
                  onChange={(e) => setIsAllDay(e.target.checked)}
                  className="w-4 h-4 rounded border-border text-primary focus:ring-2 focus:ring-primary"
                />
                <label htmlFor="is_all_day" className="text-sm font-medium cursor-pointer">
                  All day event
                </label>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="start_time" className="block text-sm font-medium mb-2">
                    {isAllDay ? "Start Date *" : "Start Time *"}
                  </label>
                  <input
                    type={isAllDay ? "date" : "datetime-local"}
                    id="start_time"
                    required
                    value={formData.start_time}
                    onChange={(e) =>
                      setFormData({ ...formData, start_time: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <label htmlFor="end_time" className="block text-sm font-medium mb-2">
                    {isAllDay ? "End Date *" : "End Time *"}
                  </label>
                  <input
                    type={isAllDay ? "date" : "datetime-local"}
                    id="end_time"
                    required
                    value={formData.end_time}
                    onChange={(e) =>
                      setFormData({ ...formData, end_time: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="location" className="block text-sm font-medium mb-2">
                  Location
                </label>
                <input
                  type="text"
                  id="location"
                  value={formData.location}
                  onChange={(e) =>
                    setFormData({ ...formData, location: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="123 Main St, San Francisco, CA"
                />
              </div>

              <div>
                <label htmlFor="image_url" className="block text-sm font-medium mb-2">
                  Image URL
                </label>
                <input
                  type="url"
                  id="image_url"
                  value={formData.image_url}
                  onChange={(e) =>
                    setFormData({ ...formData, image_url: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="https://example.com/event-image.jpg"
                />
              </div>

              <div>
                <label htmlFor="event_url" className="block text-sm font-medium mb-2">
                  Event URL
                </label>
                <input
                  type="url"
                  id="event_url"
                  value={formData.event_url}
                  onChange={(e) =>
                    setFormData({ ...formData, event_url: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="https://lu.ma/makerslounge-42"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="flex-1 px-4 py-2 border border-border rounded-lg hover:bg-secondary transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {isSubmitting ? "Creating..." : "Create Event"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
