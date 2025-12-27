"use client";

import { useState } from "react";

export default function EventsPage() {
  const [activeTab, setActiveTab] = useState<"upcoming" | "past">("upcoming");

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
          <h1 className="text-3xl md:text-4xl font-bold mb-2">
            Events
          </h1>
          <p className="text-muted-foreground">
            Join us at upcoming maker meetups, workshops, and community events
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-12">

        {/* Tab Switcher */}
        <div className="flex justify-center gap-2 mb-6">
          <button
            onClick={() => setActiveTab("upcoming")}
            className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
              activeTab === "upcoming"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-card text-muted-foreground hover:bg-secondary border border-border"
            }`}
          >
            Upcoming
          </button>
          <button
            onClick={() => setActiveTab("past")}
            className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
              activeTab === "past"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-card text-muted-foreground hover:bg-secondary border border-border"
            }`}
          >
            Past Events
          </button>
        </div>

        {/* Luma Calendar Embed */}
        <div className="w-full rounded-xl overflow-hidden border border-border bg-card">
          {activeTab === "upcoming" ? (
            <iframe
              key="upcoming"
              src="https://lu.ma/embed/calendar/cal-mQ6KN9ZNyE5Rlic/events?k=c"
              width="100%"
              height="800"
              frameBorder="0"
              style={{ border: "none", background: "transparent" }}
              allowFullScreen
              aria-hidden="false"
            />
          ) : (
            <iframe
              key="past"
              src="https://lu.ma/embed/calendar/cal-mQ6KN9ZNyE5Rlic/events?k=c&period=past"
              width="100%"
              height="800"
              frameBorder="0"
              style={{ border: "none", background: "transparent" }}
              allowFullScreen
              aria-hidden="false"
            />
          )}
        </div>

        {/* Direct Link */}
        <div className="text-center mt-6">
          <a
            href="https://lu.ma/makerslounge"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            View on Luma →
          </a>
        </div>
      </div>
    </div>
  );
}
