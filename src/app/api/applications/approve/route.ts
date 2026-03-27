import { NextResponse } from "next/server";
import { Resend } from "resend";

export async function POST(request: Request) {
  try {
    const { applicationId, email, name } = await request.json();

    if (!applicationId || !email || !name) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (!process.env.RESEND_API_KEY) {
      console.warn("RESEND_API_KEY not set — skipping approval email");
      return NextResponse.json({ success: true, emailSent: false });
    }

    const resend = new Resend(process.env.RESEND_API_KEY);

    await resend.emails.send({
      from: "MakersLounge <hello@makerslounge.com>",
      to: email,
      bcc: "bertmill19@gmail.com",
      subject: "You're in! Welcome to MakersLounge",
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
          <img src="https://makerslounge.ca/logo-blue.svg" alt="MakersLounge" width="40" height="40" style="margin-bottom: 24px;" />
          <h1 style="font-size: 24px; margin-bottom: 8px;">Welcome to MakersLounge, ${name.split(" ")[0]}!</h1>
          <p style="color: #666; font-size: 16px; line-height: 1.6;">
            Great news — your application has been approved. You're now part of a curated community of makers and builders.
          </p>
          <p style="color: #666; font-size: 16px; line-height: 1.6;">
            Create your account to get started:
          </p>
          <a href="https://makerslounge.ca/auth" style="display: inline-block; background: linear-gradient(135deg, #6AC4F7, #1A7DE8); color: white; text-decoration: none; padding: 12px 32px; border-radius: 12px; font-size: 16px; font-weight: 500; margin: 16px 0;">
            Set Up Your Account
          </a>
          <p style="color: #999; font-size: 14px; line-height: 1.6; margin-top: 24px;">
            Once you're in, you can complete your profile, connect with other makers, and start building together.
          </p>
          <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 32px 0 16px;" />
          <p style="color: #999; font-size: 12px;">
            MakersLounge — Build. Connect. Create.
          </p>
        </div>
      `,
    });

    return NextResponse.json({ success: true, emailSent: true });
  } catch (err) {
    console.error("Approval email error:", err);
    return NextResponse.json({ error: "Failed to send approval email" }, { status: 500 });
  }
}
