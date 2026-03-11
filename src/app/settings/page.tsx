"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Subscription
  const [isPremium, setIsPremium] = useState(false);
  const [stripeCustomerId, setStripeCustomerId] = useState<string | null>(null);
  const [upgradeLoading, setUpgradeLoading] = useState(false);

  // Password change
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordMessage, setPasswordMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Notification preferences (local state placeholder)
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [weeklyDigest, setWeeklyDigest] = useState(false);

  // Delete account
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) {
        router.push("/auth");
        return;
      }
      setUser(user);

      // Fetch subscription status
      const { data: profile } = await supabase
        .from("profiles")
        .select("is_premium, stripe_customer_id")
        .eq("id", user.id)
        .single();

      if (profile) {
        setIsPremium(profile.is_premium || false);
        setStripeCustomerId(profile.stripe_customer_id || null);
      }

      setLoading(false);
    });
  }, [router]);

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

  const handleDeleteAccount = async () => {
    if (!user || deleteConfirmText !== "DELETE") return;

    setDeleteLoading(true);
    try {
      const res = await fetch("/api/account/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id }),
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      await supabase.auth.signOut();
      router.push("/");
    } catch (err) {
      console.error("Delete account error:", err);
      setDeleteLoading(false);
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

      {/* Subscription */}
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
      <section className="mb-6 md:mb-8">
        <Button variant="outline" onClick={handleSignOut} className="text-red-500 border-red-500/30 hover:bg-red-500/10">
          Sign Out
        </Button>
      </section>

      {/* Delete Account */}
      <section className="mb-12">
        <h2 className="text-[13px] font-medium text-muted-foreground uppercase tracking-wider mb-2 md:mb-4 px-1 md:px-0 md:text-lg md:font-semibold md:normal-case md:tracking-normal md:text-foreground">Danger Zone</h2>
        <div className="rounded-xl md:rounded-lg border border-red-500/30 p-4">
          {!showDeleteConfirm ? (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Delete Account</p>
                <p className="text-xs text-muted-foreground">Permanently delete your account and all data</p>
              </div>
              <Button
                variant="outline"
                onClick={() => setShowDeleteConfirm(true)}
                className="text-red-500 border-red-500/30 hover:bg-red-500/10"
              >
                Delete Account
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-red-500 font-medium">
                This action is permanent and cannot be undone.
              </p>
              <p className="text-sm text-muted-foreground">
                This will delete your profile, projects, and all associated data. Type <span className="font-mono font-medium text-foreground">DELETE</span> to confirm.
              </p>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="Type DELETE to confirm"
                className="w-full rounded-md border border-red-500/30 bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30"
              />
              <div className="flex gap-3">
                <Button
                  onClick={handleDeleteAccount}
                  disabled={deleteConfirmText !== "DELETE" || deleteLoading}
                  className="bg-red-500 text-white hover:bg-red-600"
                >
                  {deleteLoading ? "Deleting..." : "Permanently Delete Account"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => { setShowDeleteConfirm(false); setDeleteConfirmText(""); }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
