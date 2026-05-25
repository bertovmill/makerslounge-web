import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

const SUBMISSION_DEADLINE = new Date("2026-05-25T03:59:59Z");
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface SubmissionBody {
  project_link?: string;
  title?: string | null;
  description?: string | null;
  video_url?: string | null;
  file_urls?: string[];
  team_name?: string | null;
  builder_emails?: string[];
  challenge_track?: string | null;
}

export async function POST(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json({ error: "Server not configured" }, { status: 500 });
    }

    if (Date.now() > SUBMISSION_DEADLINE.getTime()) {
      return NextResponse.json(
        { error: "Submissions are closed. Deadline was May 24 at 11:59 PM EDT." },
        { status: 410 },
      );
    }

    const body = (await request.json()) as SubmissionBody;

    const projectLink = body.project_link?.trim();
    if (!projectLink) {
      return NextResponse.json({ error: "project_link is required" }, { status: 400 });
    }
    try {
      const url = new URL(projectLink);
      if (!/^https?:$/.test(url.protocol)) {
        return NextResponse.json({ error: "project_link must use http or https" }, { status: 400 });
      }
    } catch {
      return NextResponse.json({ error: "project_link is not a valid URL" }, { status: 400 });
    }

    if (body.video_url) {
      try {
        new URL(body.video_url);
      } catch {
        return NextResponse.json({ error: "video_url is not a valid URL" }, { status: 400 });
      }
    }

    const fileUrls = Array.isArray(body.file_urls) ? body.file_urls.slice(0, 10) : [];
    for (const path of fileUrls) {
      if (typeof path !== "string" || !path.startsWith("pending/")) {
        return NextResponse.json({ error: "Invalid file path" }, { status: 400 });
      }
    }

    const builderEmails = Array.isArray(body.builder_emails)
      ? body.builder_emails
          .map((e) => String(e).trim().toLowerCase())
          .filter((e) => e.length > 0)
          .slice(0, 25)
      : [];
    for (const email of builderEmails) {
      if (!EMAIL_RE.test(email)) {
        return NextResponse.json({ error: `Invalid email: ${email}` }, { status: 400 });
      }
    }

    const turnstileSecret = process.env.TURNSTILE_SECRET_KEY;
    if (turnstileSecret) {
      // Token is expected in a header to keep the body schema clean.
      const token = request.headers.get("x-turnstile-token");
      if (!token) {
        return NextResponse.json({ error: "Missing captcha token" }, { status: 400 });
      }
      const verify = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ secret: turnstileSecret, response: token }),
      });
      const verifyJson = (await verify.json()) as { success?: boolean };
      if (!verifyJson.success) {
        return NextResponse.json({ error: "Captcha failed" }, { status: 400 });
      }
    }

    const userAgent = request.headers.get("user-agent") ?? null;
    const forwardedFor = request.headers.get("x-forwarded-for");
    const ip = forwardedFor ? forwardedFor.split(",")[0]!.trim() : null;
    const ipHash = ip ? await sha256(ip) : null;

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const id = crypto.randomUUID();

    const { error } = await supabase
      .from("hackathon_submissions")
      .insert({
        id,
        project_link: projectLink,
        title: trimOrNull(body.title),
        description: trimOrNull(body.description),
        video_url: trimOrNull(body.video_url),
        file_urls: fileUrls,
        team_name: trimOrNull(body.team_name),
        builder_emails: builderEmails,
        challenge_track: trimOrNull(body.challenge_track),
        user_agent: userAgent,
        ip_hash: ipHash,
      });

    if (error) {
      console.error("hackathon_submissions insert error:", error);
      return NextResponse.json({ error: "Could not save submission" }, { status: 500 });
    }

    if (builderEmails.length > 0 && process.env.RESEND_API_KEY) {
      const resend = new Resend(process.env.RESEND_API_KEY);
      const projectTitle = trimOrNull(body.title) ?? projectLink;
      await Promise.allSettled(
        builderEmails.map((email) =>
          resend.emails.send({
            from: "MakersLounge <hello@updates.makerslounge.ca>",
            to: email,
            subject: "Your hackathon submission is confirmed",
            html: confirmationEmail({ id, projectTitle, submissionId: id }),
          }),
        ),
      );
    }

    return NextResponse.json({ id }, { status: 201 });
  } catch (err) {
    console.error("hackathon submit failed:", err);
    return NextResponse.json({ error: "Unexpected server error" }, { status: 500 });
  }
}

function trimOrNull(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function confirmationEmail({
  projectTitle,
  submissionId,
}: {
  id: string;
  projectTitle: string;
  submissionId: string;
}): string {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #111;">
      <p style="font-size: 12px; letter-spacing: 0.15em; text-transform: uppercase; color: #999; margin: 0 0 24px;">2026 Innovation Hackathon</p>
      <h1 style="font-size: 32px; font-weight: 700; margin: 0 0 16px; line-height: 1.1;">Your submission is in.</h1>
      <p style="font-size: 16px; color: #555; margin: 0 0 32px;">We received your project — see you at demo night.</p>

      <table style="width: 100%; border-collapse: collapse; margin-bottom: 32px;">
        <tr>
          <td style="padding: 10px 0; color: #999; font-size: 13px; width: 130px; border-bottom: 1px solid #eee;">Project</td>
          <td style="padding: 10px 0; font-size: 13px; border-bottom: 1px solid #eee;">${projectTitle}</td>
        </tr>
        <tr>
          <td style="padding: 10px 0; color: #999; font-size: 13px; border-bottom: 1px solid #eee;">Submission ID</td>
          <td style="padding: 10px 0; font-size: 13px; font-family: monospace; border-bottom: 1px solid #eee;">${submissionId}</td>
        </tr>
        <tr>
          <td style="padding: 10px 0; color: #999; font-size: 13px;">Demo Night</td>
          <td style="padding: 10px 0; font-size: 13px;">Tuesday May 26 &middot; 5:30&ndash;8:30 PM<br/>510 Front St W, Suite 200, Toronto</td>
        </tr>
      </table>

      <p style="font-size: 14px; color: #555; margin: 0 0 8px;">Keep your submission ID for your records. If you need to reach us, reply to this email.</p>

      <hr style="border: none; border-top: 1px solid #eee; margin: 32px 0 16px;" />
      <p style="color: #999; font-size: 12px; margin: 0;">MakersLounge &mdash; Build. Connect. Create.</p>
    </div>
  `;
}

async function sha256(input: string): Promise<string> {
  const buf = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
