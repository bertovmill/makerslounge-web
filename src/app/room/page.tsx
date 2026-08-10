import { Badge } from "@/components/ui/badge";
import { LeftSidebar } from "@/components/left-sidebar";

type Guest = {
  name: string;
  role: string;
  bio?: string;
  tags?: string[];
};

// Drop the real guest list in here — one entry per attendee.
const guests: Guest[] = [
  {
    name: "Berto Mill",
    role: "Host — Makers Lounge",
    bio: "Organizing tonight's session and building with Eve.",
    tags: ["Host"],
  },
];

export default function RoomPage() {
  return (
    <main className="min-h-dvh bg-[#f7fafd] pl-16 text-ink">
      <LeftSidebar />

      <div className="mx-auto w-full max-w-5xl px-6 py-16">
        <div className="mb-12 text-center">
          <Badge className="mb-4 border-brand/20 bg-brand/10 text-xs font-bold tracking-[0.18em] text-brand-dark uppercase">
            Who&apos;s here tonight
          </Badge>
          <h1 className="mb-3 text-3xl font-extrabold tracking-tight md:text-5xl">
            Meet other people in the room
          </h1>
          <p className="mx-auto max-w-[560px] text-sm text-ink-muted md:text-base">
            Say hi — everyone here is building something. Find someone new and swap notes.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {guests.map((guest) => (
            <div
              key={guest.name}
              className="rounded-2xl border border-[#e3ecf5] bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-brand to-brand-dark text-base font-bold text-white">
                {guest.name
                  .split(" ")
                  .map((part) => part[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase()}
              </div>
              <h3 className="text-base font-bold tracking-tight">{guest.name}</h3>
              <p className="mb-2 text-sm text-brand-dark">{guest.role}</p>
              {guest.bio && (
                <p className="text-sm leading-relaxed text-ink-muted">{guest.bio}</p>
              )}
              {guest.tags && guest.tags.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {guest.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-brand/10 px-2.5 py-1 text-[11px] font-semibold tracking-wide text-brand-dark uppercase"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
