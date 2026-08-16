"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { Clock, RefreshCw, LogOut, Instagram, Linkedin } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function PendingPage() {
  const router = useRouter();
  const { user, loading, signOut } = useAuth();
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    // If not logged in, redirect to auth
    if (!loading && !user) router.push("/auth");
  }, [loading, user, router]);

  const checkStatus = async () => {
    setChecking(true);
    if (!user) { router.push("/auth"); return; }

    const { data: profile } = await supabase
      .from("profiles")
      .select("application_status")
      .eq("id", user.id)
      .single();

    if (profile?.application_status === "approved") {
      router.push("/home");
    }
    setChecking(false);
  };

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  return (
    <div className="min-h-svh flex flex-col items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {/* Logo */}
        <Link href="/" className="inline-block mb-8">
          <Image src="/logos/logo-blue.svg" alt="MakersLounge" width={48} height={48} className="mx-auto dark:hidden" />
          <Image src="/logos/logo-light.svg" alt="MakersLounge" width={48} height={48} className="mx-auto hidden dark:block" />
        </Link>

        {/* Icon */}
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#6AC4F7]/10 to-[#1A7DE8]/10 flex items-center justify-center mx-auto mb-6">
          <Clock className="w-10 h-10 text-[#3A9FF3]" />
        </div>

        <h1 className="text-2xl font-semibold mb-2">Application Received</h1>
        <p className="text-muted-foreground mb-8 leading-relaxed">
          Thanks for applying to MakersLounge! We&apos;re reviewing your application and will reach out to you shortly. Keep an eye on your LinkedIn messages.
        </p>

        {/* Check status */}
        <button
          onClick={checkStatus}
          disabled={checking}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full border border-border text-sm font-medium hover:bg-secondary transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${checking ? "animate-spin" : ""}`} />
          Check Status
        </button>

        {/* Social links */}
        <div className="mt-10 pt-6 border-t border-border">
          <p className="text-xs text-muted-foreground mb-3">Follow us while you wait</p>
          <div className="flex items-center justify-center gap-3">
            <a
              href="https://instagram.com/makersloungeto"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
            >
              <Instagram className="w-4 h-4" />
              Instagram
            </a>
            <a
              href="https://linkedin.com/company/makerslounge"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
            >
              <Linkedin className="w-4 h-4" />
              LinkedIn
            </a>
          </div>
        </div>

        {/* Sign out */}
        <button
          onClick={handleSignOut}
          className="mt-8 text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1.5"
        >
          <LogOut className="w-3.5 h-3.5" />
          Sign out
        </button>
      </div>
    </div>
  );
}
