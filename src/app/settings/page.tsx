"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";

export default function SettingsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    }>
      <SettingsContent />
    </Suspense>
  );
}

function SettingsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Premium state
  const [isPremium, setIsPremium] = useState(false);
  const [stripeCustomerId, setStripeCustomerId] = useState<string | null>(null);
  const [stripeSubscriptionId, setStripeSubscriptionId] = useState<string | null>(null);
  const [premiumLoading, setPremiumLoading] = useState(false);
  const [showUpgradeSuccess, setShowUpgradeSuccess] = useState(false);
  const [subscriptionDetails, setSubscriptionDetails] = useState<{
    status: string;
    cancelAtPeriodEnd: boolean;
    cancelAt: number | null;
    billingCycleAnchor: number;
    nextBillingDate: number | null;
  } | null>(null);

  // Password change
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordMessage, setPasswordMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Notification preferences (local state placeholder)
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [weeklyDigest, setWeeklyDigest] = useState(false);

  useEffect(() => {
    if (searchParams.get("upgraded") === "true") {
      setShowUpgradeSuccess(true);
    }
  }, [searchParams]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.push("/auth");
        return;
      }
      setUser(user);

      // Fetch premium status from profile
      supabase
        .from("profiles")
        .select("is_premium, stripe_customer_id, stripe_subscription_id")
        .eq("id", user.id)
        .single()
        .then(async ({ data }) => {
          if (data) {
            setIsPremium(data.is_premium ?? false);
            setStripeCustomerId(data.stripe_customer_id ?? null);
            setStripeSubscriptionId(data.stripe_subscription_id ?? null);

            // Fetch subscription details from Stripe if premium
            if (data.stripe_subscription_id) {
              try {
                const res = await fetch("/api/stripe/subscription", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ subscriptionId: data.stripe_subscription_id }),
                });
                const subData = await res.json();
                if (!subData.error) {
                  setSubscriptionDetails(subData);
                }
              } catch {
                // Subscription details are non-critical
              }
            }
          }
          setLoading(false);
        });
    });
  }, [router]);

  const handleUpgrade = async () => {
    if (!user) return;
    setPremiumLoading(true);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, userEmail: user.email }),
      });
      const { url, error } = await res.json();
      if (error) throw new Error(error);
      if (url) window.location.href = url;
    } catch (err) {
      console.error("Upgrade error:", err);
      setPremiumLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    if (!stripeCustomerId) return;
    setPremiumLoading(true);
    try {
      const res = await fetch("/api/stripe/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerId: stripeCustomerId }),
      });
      const { url, error } = await res.json();
      if (error) throw new Error(error);
      if (url) window.location.href = url;
    } catch (err) {
      console.error("Portal error:", err);
      setPremiumLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMessage(null);

    if (newPassword.length < 6) {
      setPasswordMessage({ type: "error", text: "Password must be at least 6 characters." });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: "error", text: "Passwords do not match." });
      return;
    }

    setPasswordLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setPasswordLoading(false);

    if (error) {
      setPasswordMessage({ type: "error", text: error.message });
    } else {
      setPasswordMessage({ type: "success", text: "Password updated successfully." });
      setNewPassword("");
      setConfirmPassword("");
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-6 md:py-8 px-4 max-w-2xl mx-auto">
      <h1 className="text-[28px] md:text-2xl font-bold tracking-tight mb-6 md:mb-8">Settings</h1>

      {/* Upgrade Success Banner */}
      {showUpgradeSuccess && (
        <div className="mb-6 rounded-lg border border-green-500/30 bg-green-500/10 p-4 flex items-center justify-between">
          <p className="text-sm text-green-400">You&apos;ve been upgraded to Premium! Enjoy your new features.</p>
          <button
            onClick={() => setShowUpgradeSuccess(false)}
            className="text-green-400 hover:text-green-300 text-sm ml-4"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Account Info */}
      <section className="mb-6 md:mb-8">
        <h2 className="text-[13px] font-medium text-muted-foreground uppercase tracking-wider mb-2 md:mb-4 px-1 md:px-0 md:text-lg md:font-semibold md:normal-case md:tracking-normal md:text-foreground">Account</h2>
        <div className="rounded-xl md:rounded-lg bg-card md:border md:border-border">
          <div className="px-4 py-3 md:p-4">
            <label className="text-[13px] md:text-sm text-muted-foreground">Email</label>
            <p className="text-[15px] md:text-base text-foreground">{user?.email}</p>
          </div>
        </div>
      </section>

      {/* Premium Section */}
      <section className="mb-6 md:mb-8">
        <h2 className="text-[13px] font-medium text-muted-foreground uppercase tracking-wider mb-2 md:mb-4 px-1 md:px-0 md:text-lg md:font-semibold md:normal-case md:tracking-normal md:text-foreground">Premium</h2>
        <div className="rounded-xl md:rounded-lg bg-card md:border md:border-border p-4">
          {isPremium ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center rounded-full bg-primary/15 px-3 py-1 text-sm font-medium text-primary">
                  Premium Active
                </span>
                {subscriptionDetails?.cancelAtPeriodEnd && (
                  <span className="inline-flex items-center rounded-full bg-yellow-500/15 px-3 py-1 text-sm font-medium text-yellow-500">
                    Cancels at period end
                  </span>
                )}
              </div>

              {subscriptionDetails && (
                <div className="text-sm text-muted-foreground space-y-1">
                  {subscriptionDetails.cancelAtPeriodEnd ? (
                    <p>
                      Your subscription is canceled and will expire on{" "}
                      <span className="text-foreground font-medium">
                        {new Date((subscriptionDetails.cancelAt ?? subscriptionDetails.billingCycleAnchor) * 1000).toLocaleDateString("en-US", {
                          month: "long", day: "numeric", year: "numeric",
                        })}
                      </span>
                      . You&apos;ll keep premium access until then.
                    </p>
                  ) : subscriptionDetails.nextBillingDate ? (
                    <p>
                      Next renewal:{" "}
                      <span className="text-foreground font-medium">
                        {new Date(subscriptionDetails.nextBillingDate * 1000).toLocaleDateString("en-US", {
                          month: "long", day: "numeric", year: "numeric",
                        })}
                      </span>{" "}
                      &middot; $5/mo
                    </p>
                  ) : null}
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  onClick={handleManageSubscription}
                  disabled={premiumLoading}
                  variant="outline"
                >
                  {premiumLoading ? "Loading..." : "Manage Subscription"}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Upgrade to Premium to unlock exclusive features:
              </p>
              <ul className="text-sm text-muted-foreground space-y-1.5 list-disc list-inside">
                <li>Priority access to new features</li>
                <li>Advanced analytics on your profile</li>
                <li>Premium badge on your profile</li>
                <li>Priority support</li>
              </ul>
              <Button
                onClick={handleUpgrade}
                disabled={premiumLoading}
              >
                {premiumLoading ? "Redirecting..." : "Upgrade to Premium — $5/mo"}
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* Change Password */}
      <section className="mb-6 md:mb-8">
        <h2 className="text-[13px] font-medium text-muted-foreground uppercase tracking-wider mb-2 md:mb-4 px-1 md:px-0 md:text-lg md:font-semibold md:normal-case md:tracking-normal md:text-foreground">Change Password</h2>
        <form onSubmit={handlePasswordChange} className="rounded-xl md:rounded-lg bg-card md:border md:border-border p-4 space-y-4">
          <div>
            <label htmlFor="new-password" className="block text-sm text-muted-foreground mb-1">
              New Password
            </label>
            <input
              id="new-password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
              placeholder="Enter new password"
            />
          </div>
          <div>
            <label htmlFor="confirm-password" className="block text-sm text-muted-foreground mb-1">
              Confirm New Password
            </label>
            <input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
              placeholder="Confirm new password"
            />
          </div>
          {passwordMessage && (
            <p className={passwordMessage.type === "error" ? "text-sm text-red-500" : "text-sm text-green-500"}>
              {passwordMessage.text}
            </p>
          )}
          <Button type="submit" disabled={passwordLoading}>
            {passwordLoading ? "Updating..." : "Update Password"}
          </Button>
        </form>
      </section>

      {/* Notification Preferences */}
      <section className="mb-6 md:mb-8">
        <h2 className="text-[13px] font-medium text-muted-foreground uppercase tracking-wider mb-2 md:mb-4 px-1 md:px-0 md:text-lg md:font-semibold md:normal-case md:tracking-normal md:text-foreground">Notifications</h2>
        <div className="rounded-xl md:rounded-lg bg-card md:border md:border-border p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Email Notifications</p>
              <p className="text-xs text-muted-foreground">Receive updates about activity on your profile</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={emailNotifications}
              onClick={() => setEmailNotifications(!emailNotifications)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                emailNotifications ? "bg-primary" : "bg-muted"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  emailNotifications ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Weekly Digest</p>
              <p className="text-xs text-muted-foreground">Get a weekly summary of new makers and projects</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={weeklyDigest}
              onClick={() => setWeeklyDigest(!weeklyDigest)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                weeklyDigest ? "bg-primary" : "bg-muted"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  weeklyDigest ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        </div>
      </section>

      {/* Sign Out */}
      <section>
        <Button variant="outline" onClick={handleSignOut} className="text-red-500 border-red-500/30 hover:bg-red-500/10">
          Sign Out
        </Button>
      </section>
    </div>
  );
}
