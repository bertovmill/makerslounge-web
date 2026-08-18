import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import MarketingShell from "@/components/MarketingShell";
import TalkPlayer from "@/components/TalkPlayer";
import TalkSignupGate from "@/components/TalkSignupGate";
import { getServerAppUser } from "@/lib/clerk-server";
import { fetchTalkBySlug, fetchTalkContent, formatTalkDuration, formatSpeaker } from "@/lib/talks";

interface TalkPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: TalkPageProps): Promise<Metadata> {
  const { slug } = await params;
  const talk = await fetchTalkBySlug(slug);

  if (!talk) return { title: "Talk not found | Makerslounge" };

  const speaker = formatSpeaker(talk);
  const description = talk.description || (speaker ? `A talk by ${speaker}.` : undefined);

  // The teaser is deliberately shareable — the page sells the signup, the
  // video behind it is what's gated.
  return {
    title: `${talk.title} | Makerslounge`,
    description,
    openGraph: {
      title: talk.title,
      description,
      images: talk.thumbnail_url ? [talk.thumbnail_url] : undefined,
      type: "video.other",
    },
  };
}

export default async function TalkPage({ params }: TalkPageProps) {
  const { slug } = await params;

  const talk = await fetchTalkBySlug(slug);
  if (!talk) notFound();

  const user = await getServerAppUser();

  // The gate is `fetchTalkContent` itself: it takes the viewer id and returns null
  // without one. RLS used to be the backstop behind this call; now this call *is*
  // the gate, which is why the id is passed rather than checked here.
  const content = await fetchTalkContent(talk.id, user?.id ?? null);

  const speaker = formatSpeaker(talk);
  const duration = formatTalkDuration(talk.duration_seconds);

  return (
    <MarketingShell>
      <div className="mx-auto max-w-2xl px-4 py-8 md:py-12">
        <Link
          href="/talks"
          className="mb-6 inline-block text-sm text-muted-foreground hover:text-foreground"
        >
          &larr; All talks
        </Link>

        <div className="mb-6">
          <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
            {duration && <span>{duration}</span>}
            {talk.recorded_at && (
              <>
                {duration && <span>·</span>}
                <span>
                  {new Date(talk.recorded_at).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </>
            )}
          </div>
          <h1 className="mb-3 text-2xl font-bold md:text-3xl">{talk.title}</h1>
          {talk.description && <p className="text-muted-foreground">{talk.description}</p>}
        </div>

        <div className="mb-8">
          {content ? (
            <TalkPlayer videoId={content.video_id} title={talk.title} />
          ) : (
            <TalkSignupGate
              slug={talk.slug}
              thumbnailUrl={talk.thumbnail_url}
              title={talk.title}
            />
          )}
        </div>

        {speaker && (
          <div className="mb-8">
            <h2 className="mb-3 text-sm font-medium text-muted-foreground">Speaker</h2>
            <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
              {talk.speaker_photo_url ? (
                <img
                  src={talk.speaker_photo_url}
                  alt=""
                  className="h-10 w-10 rounded-full object-cover"
                />
              ) : (
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-sm font-medium">
                  {talk.speaker_name?.[0] || "?"}
                </span>
              )}
              <div className="min-w-0">
                <p className="text-sm font-medium">{talk.speaker_name}</p>
                {(talk.speaker_title || talk.speaker_company) && (
                  <p className="truncate text-sm text-muted-foreground">
                    {[talk.speaker_title, talk.speaker_company].filter(Boolean).join(" at ")}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* The transcript is stored in `talk_content`, so it simply isn't
            fetched for signed-out visitors — no UI check to forget. */}
        {content?.transcript && (
          <div>
            <h2 className="mb-3 text-sm font-medium text-muted-foreground">Transcript</h2>
            <div className="rounded-xl border border-border bg-card p-5">
              <div className="prose prose-sm max-w-none whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
                {content.transcript}
              </div>
            </div>
          </div>
        )}
      </div>
    </MarketingShell>
  );
}
