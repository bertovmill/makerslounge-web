"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Logo from "./Logo";
import { cn } from "@/lib/utils";
import { useTheme } from "@/context/ThemeContext";
import { Users, Calendar, User, Settings, Sun, Moon, MessageCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

const NAV_ITEMS = [
  { href: "/people", label: "People", icon: Users },
  { href: "/messages", label: "Messages", icon: MessageCircle, authRequired: true },
  { href: "/events", label: "Events", icon: Calendar },
  { href: "/profile", label: "Profile", icon: User, authRequired: true },
];

export default function Navbar() {
  const { user } = useAuth();
  const pathname = usePathname();
  const { resolved, setTheme } = useTheme();
  const [unreadCount, setUnreadCount] = useState(0);

  const toggleTheme = () => setTheme(resolved === "dark" ? "light" : "dark");

  useEffect(() => {
    if (!user) return;

    async function fetchUnread() {
      // Get all conversations where user is a participant
      const { data: convos } = await supabase
        .from("conversations")
        .select("id")
        .or(`participant_1.eq.${user!.id},participant_2.eq.${user!.id}`);

      if (!convos || convos.length === 0) {
        setUnreadCount(0);
        return;
      }

      const convoIds = convos.map((c) => c.id);
      const { count } = await supabase
        .from("messages")
        .select("*", { count: "exact", head: true })
        .in("conversation_id", convoIds)
        .neq("sender_id", user!.id)
        .is("read_at", null);

      setUnreadCount(count || 0);
    }

    fetchUnread();

    const channel = supabase
      .channel("navbar-unread")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "messages" },
        () => fetchUnread()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const isLanding = pathname === "/";
  if (isLanding && !user) return null;
  if (pathname === "/auth") return null;

  return (
    <>
      {/* Desktop: Top bar */}
      <header className="hidden md:flex items-center justify-between h-14 px-6 border-b border-border bg-background sticky top-0 z-50">
        <div className="flex items-center gap-8">
          <Logo />
          <nav className="flex items-center gap-1">
            {NAV_ITEMS.map(({ href, label, icon: Icon, authRequired }) => (
              <Link
                key={href}
                href={authRequired && !user ? "/auth" : href}
                className={cn(
                  "relative px-3 py-1.5 text-sm rounded-md transition-colors",
                  pathname === href || (href === "/messages" && pathname.startsWith("/messages"))
                    ? "text-foreground font-medium bg-secondary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {label}
                {href === "/messages" && unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary text-primary-foreground text-[10px] font-medium flex items-center justify-center">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="p-2 text-muted-foreground hover:text-foreground transition-colors rounded-md"
            aria-label="Toggle theme"
          >
            {resolved === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          {user && (
            <Link
              href="/settings"
              className="p-2 text-muted-foreground hover:text-foreground transition-colors rounded-md"
            >
              <Settings className="w-4 h-4" />
            </Link>
          )}
          {!user && (
            <Link
              href="/auth"
              className="text-sm font-medium px-4 py-1.5 rounded-md bg-gradient-blue text-white hover:opacity-90 transition-opacity"
            >
              Sign in
            </Link>
          )}
        </div>
      </header>

      {/* Mobile: Fixed top bar with logo */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between h-[calc(2.75rem+env(safe-area-inset-top))] px-4 pt-[env(safe-area-inset-top)] border-b border-border/50 bg-background/80 backdrop-blur-lg">
        <Logo />
        <div className="flex items-center gap-1">
          <button
            onClick={toggleTheme}
            className="p-2 text-muted-foreground active:opacity-60"
            aria-label="Toggle theme"
          >
            {resolved === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
          {user ? (
            <Link
              href="/settings"
              className="p-2 text-muted-foreground active:opacity-60"
            >
              <Settings className="w-5 h-5" />
            </Link>
          ) : (
            <Link
              href="/auth"
              className="text-sm font-medium px-3 py-1 rounded-full bg-gradient-blue text-white active:opacity-80"
            >
              Sign in
            </Link>
          )}
        </div>
      </header>
      {/* Spacer for fixed header */}
      <div className="md:hidden h-[calc(2.75rem+env(safe-area-inset-top))]" />

      {/* Mobile: Bottom tab bar (iOS style) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-t border-border/50 pb-[env(safe-area-inset-bottom,0px)]">
        <div className="flex items-center justify-around h-[50px]">
          {NAV_ITEMS.map(({ href, label, icon: Icon, authRequired }) => {
            const isActive = pathname === href || (href === "/messages" && pathname.startsWith("/messages"));
            return (
              <Link
                key={href}
                href={authRequired && !user ? "/auth" : href}
                className={cn(
                  "relative flex flex-col items-center justify-center gap-[2px] w-full h-full active:opacity-60 transition-opacity",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
              >
                <Icon className="w-[22px] h-[22px]" strokeWidth={isActive ? 2.2 : 1.8} />
                <span className="text-[10px] font-medium leading-none">{label}</span>
                {href === "/messages" && unreadCount > 0 && (
                  <span className="absolute top-0.5 left-1/2 ml-1.5 w-4 h-4 rounded-full bg-primary text-primary-foreground text-[10px] font-medium flex items-center justify-center">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
