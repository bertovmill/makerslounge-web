import { runMeetupMatcher, type Participant } from "@/lib/meetup-matcher";

export const maxDuration = 300;

interface MeetupMatcherRequest {
  meetupName: string;
  participants: Participant[];
  customFieldNames?: string[];
}

export async function POST(request: Request) {
  const { meetupName, participants }: MeetupMatcherRequest = await request.json();

  if (!participants || participants.length < 3) {
    return Response.json({ error: "Need at least 3 participants" }, { status: 400 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        try {
          controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
        } catch { /* closed */ }
      };

      const keepalive = setInterval(() => send("ping", { ts: Date.now() }), 15000);

      try {
        send("step", { message: "Starting analysis..." });

        const { matches } = await runMeetupMatcher({
          meetupName,
          participants,
          onStep: (message) => send("step", { message }),
        });

        if (matches) {
          send("complete", { matches, meetupName });
        } else {
          send("error", { error: "Agent did not produce matches" });
        }
      } catch (error) {
        send("error", { error: error instanceof Error ? error.message : "Unknown error" });
      } finally {
        clearInterval(keepalive);
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
