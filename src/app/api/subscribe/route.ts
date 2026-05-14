import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { supabase } from "@/lib/supabase";

async function sendWelcomeEmail(email: string) {
  if (!process.env.RESEND_API_KEY || !process.env.RESEND_FROM_EMAIL) {
    console.warn("Resend env vars missing — skipping welcome email");
    return;
  }

  const resend = new Resend(process.env.RESEND_API_KEY);

  const { error } = await resend.emails.send({
    from: `MakersLounge <${process.env.RESEND_FROM_EMAIL}>`,
    to: email,
    subject: "Welcome to MakersLounge",
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; color: #1a1a1a;">
        <h1 style="font-size: 24px; margin-bottom: 16px;">Welcome to MakersLounge 👋</h1>
        <p style="font-size: 16px; line-height: 1.5;">Thanks for subscribing! You'll be the first to hear about:</p>
        <ul style="font-size: 16px; line-height: 1.6;">
          <li>New podcast episodes</li>
          <li>Upcoming events like Maker Mondays</li>
          <li>Maker stories and what we're building</li>
        </ul>
        <p style="font-size: 16px; line-height: 1.5; margin-top: 24px;">Build. Connect. Create.</p>
        <p style="font-size: 14px; color: #666; margin-top: 32px;">
          — The MakersLounge team<br/>
          <a href="https://makerslounge.ca" style="color: #3A9FF3;">makerslounge.ca</a>
        </p>
      </div>
    `,
  });

  if (error) {
    console.error("Resend welcome email error:", error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, subscribed_to } = body;

    // Validate email
    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Normalize email (lowercase, trim)
    const normalizedEmail = email.toLowerCase().trim();

    // Default subscription types if not provided
    const subscriptionTypes = subscribed_to || ["events", "podcasts"];

    // Check if email already exists
    const { data: existingSubscription, error: checkError } = await supabase
      .from("email_subscriptions")
      .select("id, is_active, subscribed_to")
      .eq("email", normalizedEmail)
      .single();

    // If email already exists and is active
    if (existingSubscription && existingSubscription.is_active) {
      return NextResponse.json(
        {
          message: "This email is already subscribed",
          subscription: existingSubscription,
        },
        { status: 200 }
      );
    }

    // If email exists but was unsubscribed, reactivate it
    if (existingSubscription && !existingSubscription.is_active) {
      const { data: updatedSubscription, error: updateError } = await supabase
        .from("email_subscriptions")
        .update({
          is_active: true,
          subscribed_to: subscriptionTypes,
        })
        .eq("email", normalizedEmail)
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }

      await sendWelcomeEmail(normalizedEmail);

      return NextResponse.json(
        {
          message: "Subscription reactivated successfully",
          subscription: updatedSubscription,
        },
        { status: 200 }
      );
    }

    // Create new subscription
    const { data: newSubscription, error: insertError } = await supabase
      .from("email_subscriptions")
      .insert({
        email: normalizedEmail,
        subscribed_to: subscriptionTypes,
        is_active: true,
      })
      .select()
      .single();

    if (insertError) {
      // Handle unique constraint violation (23505 is PostgreSQL unique violation code)
      if (insertError.code === "23505") {
        return NextResponse.json(
          { error: "This email is already subscribed" },
          { status: 409 }
        );
      }
      throw insertError;
    }

    await sendWelcomeEmail(normalizedEmail);

    return NextResponse.json(
      {
        message: "Successfully subscribed",
        subscription: newSubscription,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Subscription error:", error);
    return NextResponse.json(
      {
        error: "Failed to process subscription. Please try again later.",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// Optional: Add a GET endpoint to check subscription status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");

    if (!email) {
      return NextResponse.json(
        { error: "Email parameter is required" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    const { data: subscription, error } = await supabase
      .from("email_subscriptions")
      .select("id, email, subscribed_to, is_active, created_at")
      .eq("email", normalizedEmail)
      .single();

    if (error || !subscription) {
      return NextResponse.json(
        { subscribed: false, message: "Email not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        subscribed: subscription.is_active,
        subscription,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error checking subscription:", error);
    return NextResponse.json(
      { error: "Failed to check subscription status" },
      { status: 500 }
    );
  }
}
