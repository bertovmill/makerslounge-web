import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(request: Request) {
  try {
    const { subscriptionId } = await request.json();

    if (!subscriptionId) {
      return NextResponse.json({ error: "Missing subscriptionId" }, { status: 400 });
    }

    const subscription = await stripe.subscriptions.retrieve(subscriptionId);

    // Get the next billing date from a preview invoice if subscription is active
    let nextBillingDate: number | null = null;
    if (subscription.status === "active" && !subscription.cancel_at_period_end) {
      try {
        const previewInvoice = await stripe.invoices.createPreview({
          subscription: subscriptionId,
        });
        nextBillingDate = previewInvoice.period_end;
      } catch {
        // Preview invoice may not be available if canceling
      }
    }

    return NextResponse.json({
      status: subscription.status,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      cancelAt: subscription.cancel_at,
      billingCycleAnchor: subscription.billing_cycle_anchor,
      nextBillingDate,
    });
  } catch (error) {
    console.error("Stripe subscription fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch subscription" },
      { status: 500 }
    );
  }
}
