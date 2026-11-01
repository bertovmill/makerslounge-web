import { NextResponse } from "next/server";
import { badRequest, handleApiError } from "@/lib/api/respond";
import { sendHostMessage } from "@/lib/events/emails";
import { HOST_CONTACT_EMAIL } from "@/lib/events/hosts";
import { getEventBySlugOrId } from "@/lib/events/server";

/**
 * "Contact the host" on an event page, like Luma's. Public: name, email and a
 * message, emailed to the host with the guest as Reply-To. The host's address
 * stays on the server.
 *
 * `website` is a honeypot: the form hides it, so anything filled in is a bot,
 * and it gets a success response so it has no reason to try again.
 */

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = (await request.json().catch(() => ({}))) as {
      name?: unknown;
      email?: unknown;
      message?: unknown;
      website?: unknown;
    };
    if (typeof body.website === "string" && body.website.trim()) return NextResponse.json({ status: "sent" });

    // Header-breaking characters out, since the name goes into Reply-To.
    const name = typeof body.name === "string" ? body.name.replace(/[<>",\r\n]/g, "").trim() : "";
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const message = typeof body.message === "string" ? body.message.trim() : "";

    if (!name || name.length > 120) return badRequest("Please enter your name.");
    if (!EMAIL.test(email) || email.length > 254) return badRequest("Please enter a valid email.");
    if (!message) return badRequest("Please write a message.");
    if (message.length > 2000) return badRequest("Keep your message under 2,000 characters.");

    const event = await getEventBySlugOrId(id);
    if (!event) return NextResponse.json({ error: "not_found" }, { status: 404 });

    const sent = await sendHostMessage(event, HOST_CONTACT_EMAIL, { name, email, message });
    if (!sent) {
      return NextResponse.json(
        { error: "send_failed", detail: "Your message didn't go through. Please try again." },
        { status: 502 },
      );
    }
    return NextResponse.json({ status: "sent" });
  } catch (err) {
    return handleApiError(err, "api/events/[id]/contact POST");
  }
}
