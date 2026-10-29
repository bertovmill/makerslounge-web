"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, MapPin } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { eventPath, formatEventDayShort, formatEventTimes, type PublicEvent } from "@/lib/events/format";
import { EventRecapCard } from "./EventRecapCard";
import { recaps } from "./recaps";

export default function EventsPage() {
  const [upcoming, setUpcoming] = useState<PublicEvent[] | null>(null);

  useEffect(() => {
    fetch("/api/events?upcoming=1", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : { data: [] }))
      .then((body: { data?: PublicEvent[] }) => setUpcoming(body.data ?? []))
      .catch(() => setUpcoming([]));
  }, []);

  const sortedRecaps = [...recaps].sort((a, b) =>
    b.date.localeCompare(a.date)
  );

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 md:py-8 pb-24">
      <div className="mb-6 md:mb-8">
        <h1 className="text-[28px] md:text-2xl font-bold md:font-semibold tracking-tight mb-0.5">Events</h1>
        <p className="text-[13px] md:text-sm text-muted-foreground">
          Upcoming meetups, workshops, and recaps from past events
        </p>
      </div>

      <Tabs defaultValue="upcoming" className="w-full">
        <TabsList>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="recaps">Event Recaps</TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming">
          {upcoming === null ? (
            <div className="flex flex-col gap-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-24 animate-pulse rounded-xl border border-border bg-card" />
              ))}
            </div>
          ) : upcoming.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nothing scheduled right now. Check back soon.
            </p>
          ) : (
            <ul id="upcoming-events" className="flex flex-col gap-3">
              {upcoming.map((event) => (
                <li key={event.id}>
                  <Link
                    href={eventPath(event)}
                    className="group flex items-center gap-4 rounded-xl border border-border bg-card px-4 py-4 transition-colors hover:bg-secondary/60 md:gap-6 md:px-5"
                  >
                    <div className="flex w-16 shrink-0 flex-col items-center border-r border-border pr-4 md:w-20 md:pr-6">
                      <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                        {formatEventDayShort(event.start_time).split(" ")[0]}
                      </span>
                      <span className="font-display text-2xl leading-none tracking-tight md:text-3xl">
                        {formatEventDayShort(event.start_time).split(" ").slice(1).join(" ")}
                      </span>
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col gap-1">
                      <span className="text-[15px] font-semibold tracking-tight md:text-base">{event.title}</span>
                      <span className="text-[13px] text-muted-foreground md:text-sm">
                        {formatEventTimes(event.start_time, event.end_time)}
                        {event.going > 0 && ` · ${event.going} going`}
                      </span>
                      {event.location && (
                        <span className="flex items-center gap-1 truncate text-[13px] text-muted-foreground md:text-sm">
                          <MapPin className="size-3.5 shrink-0" />
                          <span className="truncate">{event.location}</span>
                        </span>
                      )}
                    </div>
                    <ArrowUpRight className="size-5 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </TabsContent>

        <TabsContent value="recaps">
          {sortedRecaps.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No recaps yet — check back after our next event.
            </p>
          ) : (
            <div className="flex flex-col gap-6">
              {sortedRecaps.map((recap) => (
                <EventRecapCard key={recap.id} recap={recap} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
