import type { Metadata } from "next";
import Link from "next/link";
import MarketingShell from "@/components/MarketingShell";
import { fetchPublishedTalks, formatTalkDuration, formatSpeaker } from "@/lib/talks";

export const metadata: Metadata = {
  title: "Talks | Makerslounge",
  description: "Recorded talks from builders and guests at Makerslounge events.",
};

export default async function TalksPage() {
  const talks = await fetchPublishedTalks();

  return (
    <MarketingShell>
      <div className="mx-auto max-w-2xl px-4 py-8 md:py-12">
        <h1 className="mb-2 text-3xl font-bold">Talks</h1>
        <p className="mb-8 text-muted-foreground">
          Recorded sessions from builders and guests at Makerslounge events.
        </p>

        {talks.length === 0 ? (
          <p className="text-sm text-muted-foreground">No talks yet. Stay tuned.</p>
        ) : (
          <div className="space-y-4">
            {talks.map((talk) => {
              const speaker = formatSpeaker(talk);
              const duration = formatTalkDuration(talk.duration_seconds);

              return (
                <Link
                  key={talk.id}
                  href={`/talks/${talk.slug}`}
                  className="block rounded-xl border border-border bg-card p-4 transition-colors hover:bg-muted/50"
                >
                  <div className="flex gap-4">
                    {talk.thumbnail_url && (
                      <img
                        src={talk.thumbnail_url}
                        alt=""
                        className="h-20 w-32 shrink-0 rounded-lg object-cover"
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      {duration && (
                        <p className="mb-1 text-xs text-muted-foreground">{duration}</p>
                      )}
                      <h2 className="mb-1 line-clamp-2 text-base font-semibold">{talk.title}</h2>
                      {speaker && (
                        <p className="line-clamp-1 text-sm text-muted-foreground">{speaker}</p>
                      )}
                      {talk.description && (
                        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                          {talk.description}
                        </p>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </MarketingShell>
  );
}
