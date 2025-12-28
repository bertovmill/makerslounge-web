"use client";

import { Suspense } from "react";
import WorkshopCard from "@/components/WorkshopCard";
import { Card } from "@/components/ui/card";
import { getUpcomingWorkshops, getPastWorkshops } from "@/lib/workshops";

function WorkshopsContent() {
  const upcomingWorkshops = getUpcomingWorkshops();
  const pastWorkshops = getPastWorkshops();

  return (
    <div className="min-h-screen">
      {/* Hero Banner with Workshop Photos */}
      <div className="relative h-64 md:h-80 overflow-hidden">
        <div className="absolute inset-0 grid grid-cols-3 gap-1">
          <img
            src="/makerslounge-photos/hackathon-working.jpeg"
            alt="Makers working together"
            className="w-full h-full object-cover"
          />
          <img
            src="/makerslounge-photos/presenting-slides.jpeg"
            alt="Workshop presentation"
            className="w-full h-full object-cover"
          />
          <img
            src="/makerslounge-photos/lounge-working.jpeg"
            alt="Hands-on learning"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-8 text-center">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Workshops</h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Hands-on learning sessions led by community makers. Build real
            skills, meet fellow creators, and level up your craft.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-12">

        {/* Upcoming Workshops */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            Upcoming
          </h2>

          {upcomingWorkshops.length === 0 ? (
            <Card className="glass-card p-8 text-center">
              <p className="text-muted-foreground mb-3">
                No upcoming workshops scheduled yet.
              </p>
              <a
                href="https://lu.ma/makerslounge"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline text-sm"
              >
                Check our Luma calendar for updates →
              </a>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {upcomingWorkshops.map((workshop) => (
                <WorkshopCard key={workshop.id} workshop={workshop} />
              ))}
            </div>
          )}
        </section>

        {/* Past Workshops */}
        {pastWorkshops.length > 0 && (
          <section>
            <h2 className="text-xl font-semibold mb-4 text-muted-foreground">
              Past Workshops
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 opacity-60">
              {pastWorkshops.map((workshop) => (
                <WorkshopCard key={workshop.id} workshop={workshop} />
              ))}
            </div>
          </section>
        )}

        {/* CTA */}
        <div className="mt-16 text-center">
          <Card className="glass-card p-8 max-w-lg mx-auto">
            <h3 className="font-semibold text-lg mb-2">Want to lead a workshop?</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Share your skills with the community. We&apos;re always looking
              for makers to teach what they know.
            </p>
            <a
              href="mailto:hello@makerslounge.com?subject=Workshop Proposal"
              className="inline-flex items-center gap-2 text-primary hover:underline text-sm font-medium"
            >
              Get in touch
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M14 5l7 7m0 0l-7 7m7-7H3"
                />
              </svg>
            </a>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function WorkshopsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-muted-foreground">Loading workshops...</div>
        </div>
      }
    >
      <WorkshopsContent />
    </Suspense>
  );
}
