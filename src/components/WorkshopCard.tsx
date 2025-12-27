"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Workshop } from "@/lib/workshops";

interface WorkshopCardProps {
  workshop: Workshop;
}

export default function WorkshopCard({ workshop }: WorkshopCardProps) {
  const formattedDate = new Date(workshop.date).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  const initials = workshop.instructor.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const isVirtual = workshop.location.toLowerCase().includes("virtual");
  const spotsText =
    workshop.spotsAvailable !== undefined && workshop.maxSpots
      ? `${workshop.spotsAvailable}/${workshop.maxSpots} spots left`
      : null;

  return (
    <a
      href={workshop.lumaUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="block"
    >
      <Card className="glass-card overflow-hidden hover:scale-[1.02] transition-all duration-200 cursor-pointer h-full flex flex-col">
        {/* Cover image or gradient placeholder */}
        <div className="relative h-32 bg-gradient-to-br from-rose-400/20 to-orange-400/20">
          {workshop.coverImage ? (
            <img
              src={workshop.coverImage}
              alt={workshop.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <svg
                className="w-12 h-12 text-primary/30"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
                />
              </svg>
            </div>
          )}
          {/* Date badge */}
          <div className="absolute top-3 left-3 bg-background/90 backdrop-blur-sm px-3 py-1.5 rounded-lg shadow-sm">
            <p className="text-xs font-semibold text-foreground">
              {formattedDate}
            </p>
            <p className="text-xs text-muted-foreground">{workshop.time}</p>
          </div>
          {/* Virtual badge */}
          {isVirtual && (
            <div className="absolute top-3 right-3 bg-blue-500/90 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full">
              Virtual
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4 flex-1 flex flex-col">
          <h3 className="font-semibold text-lg mb-1 line-clamp-2">
            {workshop.title}
          </h3>
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
            {workshop.description}
          </p>

          {/* Tags */}
          <div className="flex flex-wrap gap-1.5 mb-4">
            {workshop.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>

          {/* Footer */}
          <div className="mt-auto pt-3 border-t border-border flex items-center justify-between">
            {/* Instructor */}
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-gradient-to-br from-rose-400 to-orange-400 rounded-full flex items-center justify-center text-white text-xs font-bold overflow-hidden">
                {workshop.instructor.photo ? (
                  <img
                    src={workshop.instructor.photo}
                    alt={workshop.instructor.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  initials
                )}
              </div>
              <span className="text-xs text-muted-foreground">
                {workshop.instructor.name}
              </span>
            </div>

            {/* Spots */}
            {spotsText && (
              <span
                className={`text-xs font-medium ${
                  workshop.spotsAvailable! <= 3
                    ? "text-orange-500"
                    : "text-muted-foreground"
                }`}
              >
                {spotsText}
              </span>
            )}
          </div>
        </div>
      </Card>
    </a>
  );
}
