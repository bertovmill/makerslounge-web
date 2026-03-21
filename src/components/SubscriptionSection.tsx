"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { User } from "@supabase/supabase-js";

interface SubscriptionSectionProps {
  user: User;
  isPremium: boolean;
  stripeCustomerId: string | null;
}

export default function SubscriptionSection({ user, isPremium, stripeCustomerId }: SubscriptionSectionProps) {
  const [upgradeLoading, setUpgradeLoading] = useState(false);

  const handleUpgrade = async () => {
    if (!user) return;
    setUpgradeLoading(true);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, userEmail: user.email }),
      });
      const { url } = await res.json();
      if (url) window.location.href = url;
    } catch (err) {
      console.error("Upgrade error:", err);
    }
    setUpgradeLoading(false);
  };

  const handleManageSubscription = async () => {
    if (!stripeCustomerId) return;
    try {
      const res = await fetch("/api/stripe/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerId: stripeCustomerId }),
      });
      const { url } = await res.json();
      if (url) window.location.href = url;
    } catch (err) {
      console.error("Portal error:", err);
    }
  };

  return (
    <section className="mb-6 md:mb-8">
      <h2 className="text-[13px] font-medium text-muted-foreground uppercase tracking-wider mb-2 md:mb-4 px-1 md:px-0 md:text-lg md:font-semibold md:normal-case md:tracking-normal md:text-foreground">Subscription</h2>
      <div className="rounded-xl md:rounded-lg bg-card md:border md:border-border p-4">
        {isPremium ? (
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">MakersLounge Pro</p>
              <p className="text-xs text-muted-foreground">100 messages/month included</p>
            </div>
            <Button variant="outline" onClick={handleManageSubscription}>
              Manage
            </Button>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Free plan</p>
              <p className="text-xs text-muted-foreground">Subscribe to unlock messaging</p>
            </div>
            <Button onClick={handleUpgrade} disabled={upgradeLoading}>
              {upgradeLoading ? "Loading..." : "Upgrade — $10/mo"}
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}
