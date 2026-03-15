import { NextResponse } from "next/server";
import { Resend } from "resend";

const NOTIFY_EMAIL = "bertmill19@gmail.com";

export async function POST(request: Request) {
  try {
    const { message, email, screenshotUrl } = await request.json();

    if (!message) {
      return NextResponse.json({ error: "Missing message" }, { status: 400 });
    }

    if (!process.env.RESEND_API_KEY) {
      console.warn("RESEND_API_KEY not set — skipping feedback email notification");
      return NextResponse.json({ success: true });
    }

    const resend = new Resend(process.env.RESEND_API_KEY);

    await resend.emails.send({
      from: "MakersLounge <feedback@makerslounge.com>",
      to: NOTIFY_EMAIL,
      subject: "New Feedback on MakersLounge",
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="margin-bottom: 4px;">New Feedback</h2>
          <p style="color: #666; margin-top: 0; font-size: 14px;">From: ${email || "Anonymous"}</p>
          <div style="background: #f5f5f5; border-radius: 8px; padding: 16px; margin: 16px 0;">
            <p style="margin: 0; white-space: pre-wrap;">${message}</p>
          </div>
          ${screenshotUrl ? `<p><a href="${screenshotUrl}" style="color: #2563eb;">View attached screenshot</a></p>` : ""}
          <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 24px 0;" />
          <p style="color: #999; font-size: 12px;">
            <a href="https://makerslounge.com/feedback" style="color: #999;">View all feedback</a>
          </p>
        </div>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Feedback notify error:", err);
    return NextResponse.json({ error: "Failed to send notification" }, { status: 500 });
  }
}
