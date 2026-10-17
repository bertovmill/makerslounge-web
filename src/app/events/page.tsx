"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EventRecapCard } from "./EventRecapCard";
import { recaps } from "./recaps";

export default function EventsPage() {
  const { resolved } = useTheme();

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

      <Link
        href="/hackathons/better-toronto-buildathon"
        className="group mb-6 flex items-center justify-between gap-4 rounded-xl border border-border bg-card px-4 py-4 transition-colors hover:bg-secondary/60 md:px-5"
      >
        <div className="flex flex-col gap-0.5">
          <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
            Featured · Oct 24 to 25 · Apply by Oct 20
          </span>
          <span className="text-[15px] font-semibold tracking-tight md:text-base">
            Better Toronto Buildathon
          </span>
          <span className="text-[13px] text-muted-foreground md:text-sm">
            A weekend building for housing, transit, safer streets and efficient government. The best work goes to City Hall.
          </span>
        </div>
        <ArrowUpRight className="size-5 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground" />
      </Link>

      <Tabs defaultValue="upcoming" className="w-full">
        <TabsList>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="recaps">Event Recaps</TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming">
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
