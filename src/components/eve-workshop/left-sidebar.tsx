"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { BookOpen, LogOut, Presentation, User, Users, Wifi } from "lucide-react";
import { useTourActiveHref } from "@/components/eve-workshop/welcome-tour";
import { signOutAction } from "@/app/eve-workshop/profile/actions";

const items = [
  { href: "/eve-workshop", label: "Presentation", icon: Presentation },
  { href: "/eve-workshop/attendees", label: "Attendees", icon: Users },
  { href: "/eve-workshop/wifi", label: "Wi-Fi", icon: Wifi },
  { href: "/eve-workshop/resources", label: "Resources", icon: BookOpen },
  { href: "/eve-workshop/profile", label: "Profile", icon: User },
];

export function LeftSidebar() {
  const pathname = usePathname();
  const [signingOut, setSigningOut] = useState(false);
  const tourActiveHref = useTourActiveHref();
  const touring = tourActiveHref !== null;

  const labelClasses = touring
    ? "translate-x-0 text-sm font-medium whitespace-nowrap opacity-100 transition-all duration-200"
    : "translate-x-[-8px] text-sm font-medium whitespace-nowrap opacity-0 transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100";

  return (
    <nav
      className={`group fixed top-0 left-0 z-50 flex h-dvh w-16 flex-col gap-1 overflow-hidden border-r border-[#e3ecf5] bg-white/95 py-5 shadow-[1px_0_0_rgba(15,28,46,0.02)] backdrop-blur-md transition-[width] duration-300 ease-out hover:w-64 ${
        touring ? "w-64" : ""
      }`}
    >
      <div className="mb-4 flex items-center gap-3 px-[18px]">
        <Image
          src="/eve-workshop/icon.png"
          alt="Makers Lounge"
          width={28}
          height={28}
          className="h-7 w-7 shrink-0 rounded-md"
        />
        <span
          className={`translate-x-[-8px] text-sm font-semibold whitespace-nowrap text-ink opacity-0 transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100 ${
            touring ? "translate-x-0 opacity-100" : ""
          }`}
        >
          Makers Lounge
        </span>
      </div>

      {items.map(({ href, label, icon: Icon }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            id={`tour-target-${href}`}
            href={href}
            className={`mx-2.5 flex items-center gap-4 rounded-lg px-3.5 py-2.5 transition-colors ${
              active
                ? "bg-brand/10 text-brand-dark"
                : "text-ink-muted hover:bg-[#f0f5fa] hover:text-ink"
            }`}
          >
            <Icon className={`h-5 w-5 shrink-0 ${active ? "text-brand-dark" : ""}`} />
            <span className={labelClasses}>{label}</span>
          </Link>
        );
      })}

      <div className="mt-auto">
        {/* Sign-out runs as a server action rather than Clerk's client-side
            `signOut()`, then hard-navigates: `/` is a public route, so Clerk's
            default landing spot looks identical to being signed in, and the
            full page load is what rebuilds Clerk's client state from the
            now-cleared cookies. */}
        <button
          type="button"
          disabled={signingOut}
          onClick={async () => {
            setSigningOut(true);
            try {
              await signOutAction();
            } finally {
              window.location.href = "/eve-workshop/sign-in";
            }
          }}
          className="mx-2.5 flex w-[calc(100%-20px)] items-center gap-4 rounded-lg px-3.5 py-2.5 text-ink-muted transition-colors hover:bg-[#f0f5fa] hover:text-ink disabled:opacity-60"
        >
          <LogOut className="h-5 w-5 shrink-0" />
          <span className={labelClasses}>{signingOut ? "Logging out…" : "Log out"}</span>
        </button>
      </div>
    </nav>
  );
}
