"use client";

import Image from "next/image";
import Link from "next/link";
import { Calendar, MapPin, Users, ExternalLink } from "lucide-react";
import type { EventRecap } from "./recaps";

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "long",
  day: "numeric",
  year: "numeric",
});

export function EventRecapCard({ recap }: { recap: EventRecap }) {
  const formattedDate = dateFormatter.format(new Date(recap.date));
  const gallery = recap.photos?.filter((p) => p !== recap.coverImage) ?? [];

  return (
    <article className="rounded-xl border border-border bg-card overflow-hidden shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-card-hover)] transition-shadow">
      <div className="relative aspect-[16/9] w-full bg-muted">
        <Image
          src={recap.coverImage}
          alt={recap.title}
          fill
          sizes="(max-width: 768px) 100vw, 768px"
          className="object-cover"
          priority
        />
      </div>

      <div className="p-5 md:p-6">
        <h2 className="text-lg md:text-xl font-semibold tracking-tight mb-3">
          {recap.title}
        </h2>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground mb-4">
          <span className="inline-flex items-center gap-1.5">
            <Calendar className="size-4" aria-hidden />
            {formattedDate}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <MapPin className="size-4" aria-hidden />
            {recap.location}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Users className="size-4" aria-hidden />
            {recap.attendees} attended
          </span>
        </div>

        <p className="text-sm md:text-[15px] leading-relaxed text-foreground/90 mb-4">
          {recap.description}
        </p>

        <p className="text-xs text-muted-foreground mb-5">
          Hosted by {recap.hosts.join(", ")}
        </p>

        {gallery.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-5">
            {gallery.map((src) => (
              <div
                key={src}
                className="relative aspect-square rounded-lg overflow-hidden bg-muted"
              >
                <Image
                  src={src}
                  alt=""
                  fill
                  sizes="(max-width: 640px) 50vw, 240px"
                  className="object-cover"
                />
              </div>
            ))}
          </div>
        )}

        {recap.links && recap.links.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
            {recap.links.map((link) => (
              <Link
                key={link.url}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
              >
                {link.label}
                <ExternalLink className="size-3.5" aria-hidden />
              </Link>
            ))}
          </div>
        )}
      </div>
    </article>
  );
}
