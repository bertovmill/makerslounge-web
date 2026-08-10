"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignOutButton } from "@clerk/nextjs";
import { BookOpen, LogOut, Presentation, Users } from "lucide-react";

const items = [
  { href: "/", label: "Presentation", icon: Presentation },
  { href: "/room", label: "Meet other people in the room", icon: Users },
  { href: "/resources", label: "Resources", icon: BookOpen },
];

export function LeftSidebar() {
  const pathname = usePathname();

  return (
    <nav className="group fixed top-0 left-0 z-50 flex h-dvh w-16 flex-col gap-1 overflow-hidden border-r border-[#e3ecf5] bg-white/95 py-5 shadow-[1px_0_0_rgba(15,28,46,0.02)] backdrop-blur-md transition-[width] duration-300 ease-out hover:w-64">
      <div className="mb-4 flex items-center gap-3 px-[18px]">
        <Image
          src="/icon.png"
          alt="Makers Lounge"
          width={28}
          height={28}
          className="h-7 w-7 shrink-0 rounded-md"
        />
        <span className="translate-x-[-8px] text-sm font-semibold whitespace-nowrap text-ink opacity-0 transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100">
          Makers Lounge
        </span>
      </div>

      {items.map(({ href, label, icon: Icon }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className={`mx-2.5 flex items-center gap-4 rounded-lg px-3.5 py-2.5 transition-colors ${
              active
                ? "bg-brand/10 text-brand-dark"
                : "text-ink-muted hover:bg-[#f0f5fa] hover:text-ink"
            }`}
          >
            <Icon className={`h-5 w-5 shrink-0 ${active ? "text-brand-dark" : ""}`} />
            <span className="translate-x-[-8px] text-sm font-medium whitespace-nowrap opacity-0 transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100">
              {label}
            </span>
          </Link>
        );
      })}

      <div className="mt-auto">
        <SignOutButton>
          <button
            type="button"
            className="mx-2.5 flex w-[calc(100%-20px)] items-center gap-4 rounded-lg px-3.5 py-2.5 text-ink-muted transition-colors hover:bg-[#f0f5fa] hover:text-ink"
          >
            <LogOut className="h-5 w-5 shrink-0" />
            <span className="translate-x-[-8px] text-sm font-medium whitespace-nowrap opacity-0 transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100">
              Log out
            </span>
          </button>
        </SignOutButton>
      </div>
    </nav>
  );
}
