import { NextResponse } from "next/server";
import { Resend } from "resend";

const ADMIN_EMAIL = "bertmill19@gmail.com";

export async function POST(request: Request) {
  try {
    const { name, email, building, linkedin } = await request.json();

    if (!process.env.RESEND_API_KEY) {
      console.warn("RESEND_API_KEY not set — skipping application notification");
      return NextResponse.json({ success: true, emailSent: false });
    }

    const resend = new Resend(process.env.RESEND_API_KEY);

    await resend.emails.send({
      from: "MakersLounge <hello@makerslounge.com>",
      to: ADMIN_EMAIL,
      subject: `New Application: ${name}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
          <h2 style="font-size: 20px; margin-bottom: 16px;">New Application Received</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #999; font-size: 14px; width: 100px;">Name</td>
              <td style="padding: 8px 0; font-size: 14px;">${name}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #999; font-size: 14px;">Email</td>
              <td style="padding: 8px 0; font-size: 14px;">${email}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #999; font-size: 14px; vertical-align: top;">Building</td>
              <td style="padding: 8px 0; font-size: 14px;">${building || "—"}</td>
            </tr>
            ${linkedin ? `
            <tr>
              <td style="padding: 8px 0; color: #999; font-size: 14px;">LinkedIn</td>
              <td style="padding: 8px 0; font-size: 14px;"><a href="${linkedin}" style="color: #2563eb;">${linkedin}</a></td>
            </tr>
            ` : ""}
          </table>
          <a href="https://makerslounge.ca/admin/applications" style="display: inline-block; background: linear-gradient(135deg, #6AC4F7, #1A7DE8); color: white; text-decoration: none; padding: 12px 32px; border-radius: 12px; font-size: 14px; font-weight: 500; margin-top: 24px;">
            Review Application
          </a>
          <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 32px 0 16px;" />
          <p style="color: #999; font-size: 12px;">MakersLounge — Build. Connect. Create.</p>
        </div>
      `,
    });

    return NextResponse.json({ success: true, emailSent: true });
  } catch (err) {
    console.error("Application notification error:", err);
    return NextResponse.json({ error: "Failed to send notification" }, { status: 500 });
  }
}
