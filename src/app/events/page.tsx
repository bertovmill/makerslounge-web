"use client";

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
