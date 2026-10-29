import { Resend } from "resend";
import { renderEventEmail } from "@/lib/email-render";
import {
  eventIcs,
  eventPath,
  formatEventDay,
  formatEventDayShort,
  formatEventTimes,
  googleCalendarUrl,
  type PublicEvent,
} from "./format";

/**
 * RSVP emails: the confirmation sent on RSVP and the reminder sent the day
 * before. Both carry the guest's cancel link, which is their only way to manage
 * an RSVP, since guests don't need an account.
 *
 * Sent through Resend, like the welcome email and the newsletter. With the
 * Resend env vars unset (local dev, previews) sending is a logged no-op.
 */

// Links in emails must work from an inbox, so production always points at the
// real domain. Locally they point at the dev server, so the cancel flow can be
// clicked through end to end.
export const SITE_URL =
  process.env.NODE_ENV === "production"
    ? "https://makerslounge.ca"
    : (process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000");

export interface RsvpGuest {
  name: string;
  email: string;
  cancelToken: string;
}

export interface OutgoingEmail {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export function cancelRsvpUrl(event: Pick<PublicEvent, "id" | "slug">, cancelToken: string) {
  return `${SITE_URL}${eventPath(event)}/cancel-rsvp?token=${encodeURIComponent(cancelToken)}`;
}

function firstName(name: string) {
  return name.trim().split(/\s+/)[0] || "there";
}

function compose(
  event: PublicEvent,
  guest: RsvpGuest,
  copy: { subject: string; heading: string; intro: string },
): OutgoingEmail {
  const pageUrl = `${SITE_URL}${eventPath(event)}`;
  const icsUrl = `${pageUrl}/calendar.ics`;
  const cancelUrl = cancelRsvpUrl(event, guest.cancelToken);
  const calendarUrl = googleCalendarUrl(event, pageUrl);
  const day = formatEventDay(event.start_time);
  const times = formatEventTimes(event.start_time, event.end_time);
  const mapsUrl = event.location
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.location)}`
    : null;

  const html = renderEventEmail({
    preheader: [`${day}, ${times}`, event.location].filter(Boolean).join(" at "),
    heading: copy.heading,
    intro: copy.intro,
    event: { title: event.title, day, times, location: event.location, mapsUrl },
    pageUrl,
    googleCalendarUrl: calendarUrl,
    icsUrl,
    cancelUrl,
  });

  const text = [
    copy.heading,
    "",
    copy.intro,
    "",
    event.title,
    `When: ${day}, ${times} (Toronto time)`,
    event.location ? `Where: ${event.location}` : null,
    "",
    `Event page: ${pageUrl}`,
    `Add to calendar: ${icsUrl}`,
    "",
    `Can't make it anymore? Cancel your RSVP: ${cancelUrl}`,
    "",
    "MakersLounge · Build. Connect. Create.",
  ]
    .filter((line) => line !== null)
    .join("\n");

  return { to: guest.email, subject: copy.subject, html, text };
}

export function rsvpConfirmationEmail(event: PublicEvent, guest: RsvpGuest): OutgoingEmail {
  return compose(event, guest, {
    subject: `You're going: ${event.title}, ${formatEventDayShort(event.start_time)}`,
    heading: `You're going, ${firstName(guest.name)}!`,
    intro: "Your spot is saved. Here are the details, and the event is attached for your calendar.",
  });
}

export function rsvpReminderEmail(event: PublicEvent, guest: RsvpGuest): OutgoingEmail {
  return compose(event, guest, {
    subject: `Tomorrow: ${event.title}`,
    heading: `See you tomorrow, ${firstName(guest.name)}`,
    intro: `A quick reminder that ${event.title} is tomorrow. Bring something to work on.`,
  });
}

function resendClient() {
  if (!process.env.RESEND_API_KEY || !process.env.RESEND_FROM_EMAIL) return null;
  return { resend: new Resend(process.env.RESEND_API_KEY), from: `MakersLounge <${process.env.RESEND_FROM_EMAIL}>` };
}

/** Send the confirmation, with the event attached as an .ics. Never throws. */
export async function sendRsvpConfirmation(event: PublicEvent, guest: RsvpGuest) {
  const client = resendClient();
  if (!client) {
    console.warn("[events] Resend env vars missing, skipping RSVP confirmation");
    return;
  }
  const email = rsvpConfirmationEmail(event, guest);
  const pageUrl = `${SITE_URL}${eventPath(event)}`;
  try {
    const { error } = await client.resend.emails.send({
      from: client.from,
      to: email.to,
      subject: email.subject,
      html: email.html,
      text: email.text,
      attachments: [
        {
          filename: `${event.slug ?? event.id}.ics`,
          content: Buffer.from(eventIcs(event, pageUrl)),
          contentType: "text/calendar; charset=utf-8; method=PUBLISH",
        },
      ],
    });
    if (error) console.error("[events] RSVP confirmation failed:", error);
  } catch (err) {
    console.error("[events] RSVP confirmation failed:", err);
  }
}

/**
 * Send reminders in Resend batches (100 per call). Returns how many went out
 * and which recipients failed, so the caller can release their claim and let
 * the next run retry them.
 */
export async function sendReminderBatch<T extends OutgoingEmail>(emails: T[]) {
  const client = resendClient();
  if (!client) {
    console.warn("[events] Resend env vars missing, skipping reminders");
    return { sent: 0, failed: emails };
  }
  let sent = 0;
  const failed: T[] = [];
  for (let i = 0; i < emails.length; i += 100) {
    const chunk = emails.slice(i, i + 100);
    try {
      const { error } = await client.resend.batch.send(
        chunk.map(({ to, subject, html, text }) => ({ from: client.from, to, subject, html, text })),
      );
      if (error) throw error;
      sent += chunk.length;
    } catch (err) {
      console.error("[events] reminder batch failed:", err);
      failed.push(...chunk);
    }
  }
  return { sent, failed };
}
