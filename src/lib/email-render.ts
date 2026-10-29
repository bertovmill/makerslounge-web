import { marked } from "marked";

marked.setOptions({
  gfm: true,
  breaks: true,
});

interface RenderOptions {
  title: string;
  excerpt: string;
  coverImage?: string | null;
  markdown: string;
  postUrl: string;
}

const BRAND_BLUE = "#3A9FF3";
const TEXT = "#1a1a1a";
const MUTED = "#666666";
const BG = "#ffffff";
const BORDER = "#e5e7eb";

function inlineStyledBody(htmlBody: string): string {
  // Apply inline styles by replacing tag openers. Email clients ignore <style>
  // blocks, so we inject style="..." on each rendered element.
  return htmlBody
    .replace(/<h1>/g, `<h1 style="font-size:28px;line-height:1.25;margin:32px 0 16px;color:${TEXT};">`)
    .replace(/<h2>/g, `<h2 style="font-size:22px;line-height:1.3;margin:28px 0 12px;color:${TEXT};">`)
    .replace(/<h3>/g, `<h3 style="font-size:18px;line-height:1.35;margin:24px 0 10px;color:${TEXT};">`)
    .replace(/<p>/g, `<p style="font-size:16px;line-height:1.6;margin:0 0 16px;color:${TEXT};">`)
    .replace(/<ul>/g, `<ul style="font-size:16px;line-height:1.6;margin:0 0 16px;padding-left:22px;color:${TEXT};">`)
    .replace(/<ol>/g, `<ol style="font-size:16px;line-height:1.6;margin:0 0 16px;padding-left:22px;color:${TEXT};">`)
    .replace(/<li>/g, `<li style="margin:0 0 6px;">`)
    .replace(/<blockquote>/g, `<blockquote style="margin:0 0 16px;padding:8px 16px;border-left:3px solid ${BRAND_BLUE};color:${MUTED};font-style:italic;">`)
    .replace(/<a /g, `<a style="color:${BRAND_BLUE};text-decoration:underline;" `)
    .replace(/<code>/g, `<code style="background:#f4f4f5;padding:2px 6px;border-radius:4px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:14px;">`)
    .replace(/<pre>/g, `<pre style="background:#0b1020;color:#e6edf3;padding:14px 16px;border-radius:8px;overflow-x:auto;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:14px;line-height:1.5;margin:0 0 16px;">`)
    .replace(/<img /g, `<img style="max-width:100%;height:auto;border-radius:8px;margin:8px 0;" `)
    .replace(/<hr>/g, `<hr style="border:none;border-top:1px solid ${BORDER};margin:24px 0;">`);
}

export function renderNewsletterEmail(opts: RenderOptions): string {
  const bodyHtml = marked.parse(opts.markdown) as string;
  const styledBody = inlineStyledBody(bodyHtml);

  const cover = opts.coverImage
    ? `<img src="${opts.coverImage}" alt="" style="width:100%;max-height:360px;object-fit:cover;border-radius:12px;margin:0 0 24px;" />`
    : "";

  return `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:${BG};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:${TEXT};">
    <div style="max-width:640px;margin:0 auto;padding:32px 24px;">
      <div style="text-align:center;margin-bottom:32px;">
        <a href="https://makerslounge.ca" style="color:${BRAND_BLUE};text-decoration:none;font-weight:700;font-size:18px;letter-spacing:0.5px;">MakersLounge</a>
      </div>

      ${cover}

      <h1 style="font-size:32px;line-height:1.2;margin:0 0 12px;color:${TEXT};">${escapeHtml(opts.title)}</h1>
      <p style="font-size:17px;line-height:1.5;margin:0 0 32px;color:${MUTED};">${escapeHtml(opts.excerpt)}</p>

      <div>${styledBody}</div>

      <hr style="border:none;border-top:1px solid ${BORDER};margin:40px 0 24px;" />

      <p style="font-size:14px;line-height:1.5;margin:0 0 8px;color:${MUTED};">
        Read this on the web:
        <a href="${opts.postUrl}" style="color:${BRAND_BLUE};">${opts.postUrl}</a>
      </p>
      <p style="font-size:13px;line-height:1.5;margin:16px 0 0;color:${MUTED};">
        You're receiving this because you subscribed at
        <a href="https://makerslounge.ca" style="color:${BRAND_BLUE};">makerslounge.ca</a>.
        Build. Connect. Create.
      </p>
    </div>
  </body>
</html>`;
}

interface EventEmailOptions {
  /** Hidden preview line most inboxes show next to the subject. */
  preheader: string;
  heading: string;
  intro: string;
  event: { title: string; day: string; times: string; location: string | null; mapsUrl: string | null };
  pageUrl: string;
  googleCalendarUrl: string;
  icsUrl: string;
  cancelUrl: string;
}

/**
 * An event RSVP email (confirmation or reminder): the event's details in a card,
 * a button to its page, calendar links, and a cancel link at the foot. Same
 * frame as the newsletter, so every MakersLounge email looks like one family.
 */
export function renderEventEmail(opts: EventEmailOptions): string {
  const { event } = opts;
  const row = (label: string, value: string) => `
        <tr>
          <td style="padding:6px 16px 6px 0;font-size:13px;line-height:1.5;color:${MUTED};vertical-align:top;white-space:nowrap;">${label}</td>
          <td style="padding:6px 0;font-size:15px;line-height:1.5;color:${TEXT};">${value}</td>
        </tr>`;
  const where = event.location
    ? event.mapsUrl
      ? `<a href="${escapeHtml(event.mapsUrl)}" style="color:${TEXT};text-decoration:underline;">${escapeHtml(event.location)}</a>`
      : escapeHtml(event.location)
    : null;

  return `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#f4f7fb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:${TEXT};">
    <span style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(opts.preheader)}</span>
    <div style="max-width:560px;margin:0 auto;padding:32px 16px;">
      <div style="text-align:center;margin-bottom:24px;">
        <a href="https://makerslounge.ca" style="color:${BRAND_BLUE};text-decoration:none;font-weight:700;font-size:18px;letter-spacing:0.5px;">MakersLounge</a>
      </div>

      <div style="background:${BG};border:1px solid ${BORDER};border-radius:16px;overflow:hidden;">
        <div style="height:6px;background:${BRAND_BLUE};background-image:linear-gradient(90deg,#6AC4F7,#3A9FF3,#1A7DE8);"></div>
        <div style="padding:28px 28px 24px;">
          <h1 style="font-size:26px;line-height:1.25;margin:0 0 10px;color:${TEXT};">${escapeHtml(opts.heading)}</h1>
          <p style="font-size:16px;line-height:1.6;margin:0 0 24px;color:${TEXT};">${escapeHtml(opts.intro)}</p>

          <div style="background:#f4f7fb;border-radius:12px;padding:16px 18px;margin:0 0 24px;">
            <p style="font-size:17px;font-weight:700;line-height:1.35;margin:0 0 8px;color:${TEXT};">${escapeHtml(event.title)}</p>
            <table role="presentation" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
              ${row("When", `${escapeHtml(event.day)}<br />${escapeHtml(event.times)} <span style="color:${MUTED};">(Toronto time)</span>`)}
              ${where ? row("Where", where) : ""}
            </table>
          </div>

          <a href="${escapeHtml(opts.pageUrl)}" style="display:inline-block;background:${BRAND_BLUE};color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;padding:12px 22px;border-radius:999px;">View event page</a>

          <p style="font-size:14px;line-height:1.6;margin:20px 0 0;color:${MUTED};">
            Add it to your calendar:
            <a href="${escapeHtml(opts.googleCalendarUrl)}" style="color:${BRAND_BLUE};">Google</a> ·
            <a href="${escapeHtml(opts.icsUrl)}" style="color:${BRAND_BLUE};">Apple / Outlook</a>
          </p>
        </div>
      </div>

      <p style="font-size:13px;line-height:1.6;margin:24px 8px 0;color:${MUTED};text-align:center;">
        Can't make it anymore? <a href="${escapeHtml(opts.cancelUrl)}" style="color:${MUTED};text-decoration:underline;">Cancel your RSVP</a> so someone else can have the spot.
      </p>
      <p style="font-size:13px;line-height:1.6;margin:8px 8px 0;color:${MUTED};text-align:center;">
        You're getting this because you RSVPed at
        <a href="https://makerslounge.ca" style="color:${MUTED};">makerslounge.ca</a>.
        Build. Connect. Create.
      </p>
    </div>
  </body>
</html>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
