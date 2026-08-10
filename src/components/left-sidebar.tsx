"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Presentation, Users } from "lucide-react";

const items = [
  { href: "/", label: "Presentation", icon: Presentation },
  { href: "/room", label: "Meet other people in the room", icon: Users },
];

export function LeftSidebar() {
  const pathname = usePathname();

  return (
    <nav className="group fixed top-0 left-0 z-50 flex h-dvh w-16 flex-col gap-1 overflow-hidden border-r border-white/10 bg-ink/80 py-6 backdrop-blur-md transition-[width] duration-300 ease-out hover:w-64">
      {items.map(({ href, label, icon: Icon }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-4 px-5 py-3 text-white transition-colors ${
              active ? "bg-white/10" : "hover:bg-white/5"
            }`}
          >
            <Icon className="h-5 w-5 shrink-0" />
            <span className="translate-x-[-8px] text-sm font-medium whitespace-nowrap opacity-0 transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100">
              {label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
