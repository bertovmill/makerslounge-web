"use client";

import { useTheme } from "@/context/ThemeContext";

export default function EventsPage() {
  const { resolved } = useTheme();

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 md:py-8 pb-24">
      <div className="mb-6 md:mb-8">
        <h1 className="text-[28px] md:text-2xl font-bold md:font-semibold tracking-tight mb-0.5">Events</h1>
        <p className="text-[13px] md:text-sm text-muted-foreground">
          Upcoming meetups, workshops, and community events
        </p>
      </div>

      <div className="w-full rounded-xl overflow-hidden border border-border">
        <iframe
          src={`https://lu.ma/embed/calendar/cal-FGHayLJ6ZAmkYJi/events?lt=${resolved}`}
          width="100%"
          height="600"
          frameBorder="0"
          style={{ border: "none" }}
          allowFullScreen
          aria-hidden="false"
          tabIndex={0}
        />
      </div>
    </div>
  );
}
