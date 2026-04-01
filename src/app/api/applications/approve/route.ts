import { NextResponse } from "next/server";
import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const { applicationId, email, name, status = "approved" } = await request.json();

    if (!email || !name) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Find the auth user by email and update their profile's application_status
    const { data: users } = await supabaseAdmin.auth.admin.listUsers();
    const authUser = users?.users?.find(
      (u) => u.email?.toLowerCase() === email.toLowerCase()
    );

    if (authUser) {
      await supabaseAdmin
        .from("profiles")
        .update({ application_status: status })
        .eq("id", authUser.id);
    }

    // Only send email on approval
    if (status !== "approved") {
      return NextResponse.json({ success: true, emailSent: false });
    }

    if (!process.env.RESEND_API_KEY) {
      console.warn("RESEND_API_KEY not set — skipping approval email");
      return NextResponse.json({ success: true, emailSent: false });
    }

    const resend = new Resend(process.env.RESEND_API_KEY);

    // Generate a magic link so the user can log in with one click
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: "magiclink",
      email,
      options: {
        redirectTo: "https://makerslounge.ca/auth/callback",
      },
    });

    const magicLink = !linkError && linkData?.properties?.action_link
      ? linkData.properties.action_link
      : "https://makerslounge.ca/auth";

    await resend.emails.send({
      from: "MakersLounge <hello@makerslounge.ca>",
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
          <a href="${magicLink}" style="display: inline-block; background: linear-gradient(135deg, #6AC4F7, #1A7DE8); color: white; text-decoration: none; padding: 12px 32px; border-radius: 12px; font-size: 16px; font-weight: 500; margin: 16px 0;">
            Join MakersLounge
          </a>
          <p style="color: #999; font-size: 14px; line-height: 1.6; margin-top: 24px;">
            This link will log you in automatically. It expires in 24 hours — if it stops working, you can always sign in at <a href="https://makerslounge.ca/auth" style="color: #3A9FF3;">makerslounge.ca/auth</a> with your email and password.
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
