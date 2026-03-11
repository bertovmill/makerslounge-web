import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const MESSAGE_MONTHLY_LIMIT = 100;

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.supabase_user_id;

        if (userId) {
          const nextReset = new Date();
          nextReset.setMonth(nextReset.getMonth() + 1);

          await supabaseAdmin
            .from("profiles")
            .update({
              is_premium: true,
              stripe_customer_id: session.customer as string,
              stripe_subscription_id: session.subscription as string,
              messages_used: 0,
              message_limit_reset_at: nextReset.toISOString(),
            })
            .eq("id", userId);
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.supabase_user_id;

        if (userId) {
          const isActive = ["active", "trialing"].includes(subscription.status);

          const updates: Record<string, unknown> = {
            is_premium: isActive,
          };

          // Reset message count on renewal
          if (isActive) {
            const sub = subscription as unknown as { current_period_end: number };
            const nextReset = new Date(sub.current_period_end * 1000);
            updates.messages_used = 0;
            updates.message_limit_reset_at = nextReset.toISOString();
          }

          await supabaseAdmin
            .from("profiles")
            .update(updates)
            .eq("id", userId);
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.supabase_user_id;

        if (userId) {
          await supabaseAdmin
            .from("profiles")
            .update({
              is_premium: false,
              stripe_subscription_id: null,
            })
            .eq("id", userId);
        }
        break;
      }

      case "invoice.paid": {
        // Monthly renewal — reset message count
        const invoice = event.data.object as Stripe.Invoice & { subscription?: string };
        const subscriptionId = invoice.subscription;

        if (subscriptionId) {
          const subResponse = await stripe.subscriptions.retrieve(subscriptionId);
          const sub = subResponse as unknown as { metadata?: Record<string, string>; current_period_end: number };
          const userId = sub.metadata?.supabase_user_id;

          if (userId) {
            const nextReset = new Date(sub.current_period_end * 1000);
            await supabaseAdmin
              .from("profiles")
              .update({
                messages_used: 0,
                message_limit_reset_at: nextReset.toISOString(),
              })
              .eq("id", userId);
          }
        }
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook handler error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}
