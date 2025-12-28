import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

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
