import { NextResponse } from "next/server";
import { Resend } from "resend";
import { clerkClient } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { getSiteDb } from "@/db/site";
import { profiles } from "@/db/site/schema";
import { requireAdmin } from "@/lib/api/auth";
import { badRequest, handleApiError } from "@/lib/api/respond";

/**
 * Mark an application approved or rejected, and email the applicant on approval.
 *
 * SECURITY: this had no authentication. Anyone could approve arbitrary
 * applications and make the site send a branded welcome email to any address they
 * named. Now admin-only.
 *
 * Two Supabase Auth calls had to go, both of which stopped working at the Clerk
 * cutover and were failing silently:
 *
 *  - `auth.admin.listUsers()` to find the account by email. Clerk owns identities
 *    now, and `profiles` has no email column at all, so the lookup goes through
 *    Clerk and then maps the Clerk id onto `profiles.clerk_user_id`.
 *  - `auth.admin.generateLink({ type: "magiclink" })` for one-click sign-in. That
 *    already errored, and the code fell back to a plain /auth link — so the email
 *    has in practice been sending the plain link for a while. It now sends that
 *    link deliberately, and the copy no longer claims to log the reader in
 *    automatically. Clerk sign-in tokens could restore one-click, but that needs
 *    the /auth page to accept a ticket, which is its own change.
 */
export async function POST(request: Request) {
  try {
    await requireAdmin();

    const { email, name, status = "approved" } = (await request.json()) as {
      email?: string;
      name?: string;
      status?: string;
    };

    if (!email || !name) return badRequest("email and name are required");
    if (status !== "approved" && status !== "rejected") {
      return badRequest("status must be 'approved' or 'rejected'");
    }

    // Find the account through Clerk, then map it to the profile row.
    const clerk = await clerkClient();
    const { data: matches } = await clerk.users.getUserList({
      emailAddress: [email.toLowerCase()],
    });
    const clerkUserId = matches[0]?.id;

    if (clerkUserId) {
      await getSiteDb()
        .update(profiles)
        .set({ applicationStatus: status })
        .where(eq(profiles.clerkUserId, clerkUserId));
    }

    // Only approvals get an email.
    if (status !== "approved") {
      return NextResponse.json({ success: true, emailSent: false });
    }

    if (!process.env.RESEND_API_KEY) {
      console.warn("RESEND_API_KEY not set — skipping approval email");
      return NextResponse.json({ success: true, emailSent: false });
    }

    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: "MakersLounge <hello@makerslounge.ca>",
      to: email,
      bcc: "bertmill19@gmail.com",
      subject: "You're in! Welcome to MakersLounge",
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
          <img src="https://makerslounge.ca/logos/logo-blue.svg" alt="MakersLounge" width="40" height="40" style="margin-bottom: 24px;" />
          <h1 style="font-size: 24px; margin-bottom: 8px;">Welcome to MakersLounge, ${name.split(" ")[0]}!</h1>
          <p style="color: #666; font-size: 16px; line-height: 1.6;">
            Great news — your application has been approved. You're now part of a curated community of makers and builders.
          </p>
          <a href="https://makerslounge.ca/auth" style="display: inline-block; background: linear-gradient(135deg, #6AC4F7, #1A7DE8); color: white; text-decoration: none; padding: 12px 32px; border-radius: 12px; font-size: 16px; font-weight: 500; margin: 16px 0;">
            Sign in to MakersLounge
          </a>
          <p style="color: #999; font-size: 14px; line-height: 1.6; margin-top: 24px;">
            Sign in with Google, or with the email and password you signed up with, at <a href="https://makerslounge.ca/auth" style="color: #3A9FF3;">makerslounge.ca/auth</a>.
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
    return handleApiError(err, "api/applications/approve");
  }
}
