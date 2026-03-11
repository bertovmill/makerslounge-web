"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useSidebar } from "@/context/SidebarContext";
import { cn } from "@/lib/utils";
import { useTheme } from "@/context/ThemeContext";
import {
  Users,
  Calendar,
  User,
  MessageCircle,
  Search,
  SquarePen,
  Sun,
  Moon,
  Settings,
  PanelLeft,
} from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

const NAV_ITEMS = [
  { href: "/home", label: "New task", icon: SquarePen },
  { href: "/people", label: "People", icon: Users },
  { href: "/messages", label: "Messages", icon: MessageCircle },
  { href: "/matcher", label: "AI Match", icon: Search },
  { href: "/events", label: "Events", icon: Calendar },
];

const BOTTOM_ITEMS = [
  { href: "/profile", label: "Profile", icon: User },
  { href: "/settings", label: "Settings", icon: Settings },
];

const MOBILE_TABS = [
  { href: "/home", label: "Home", icon: SquarePen },
  { href: "/people", label: "People", icon: Users },
  { href: "/messages", label: "Messages", icon: MessageCircle },
  { href: "/events", label: "Events", icon: Calendar },
  { href: "/profile", label: "Profile", icon: User },
];

export default function Sidebar() {
  const { user } = useAuth();
  const pathname = usePathname();
  const { resolved, setTheme } = useTheme();
  const { collapsed, toggleCollapsed } = useSidebar();
  const [unreadCount, setUnreadCount] = useState(0);
  const [logoHovered, setLogoHovered] = useState(false);

  const toggleTheme = () => setTheme(resolved === "dark" ? "light" : "dark");

  const isHidden = pathname === "/" || pathname === "/auth" || pathname === "/onboarding";

  useEffect(() => {
    if (!user) return;

    async function fetchUnread() {
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
      .channel("sidebar-unread")
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

  if (isHidden || !user) return null;

  function isActive(href: string) {
    if (href === "/home") return pathname === "/home";
    return pathname === href || pathname.startsWith(href + "/");
  }

  return (
    <>
      {/* Desktop: Left sidebar */}
      <aside
        className={cn(
          "hidden md:flex flex-col h-svh fixed left-0 top-0 border-r border-border bg-background z-50 transition-[width] duration-200 ease-in-out",
          collapsed ? "w-16" : "w-60"
        )}
      >
        {/* Logo / Toggle area */}
        <div className={cn("py-4", collapsed ? "px-2" : "px-4")}>
          {collapsed ? (
            /* Collapsed: show logo icon, on hover show panel toggle icon */
            <button
              onClick={toggleCollapsed}
              onMouseEnter={() => setLogoHovered(true)}
              onMouseLeave={() => setLogoHovered(false)}
              className="relative group w-10 h-10 flex items-center justify-center rounded-lg hover:bg-secondary/50 transition-colors mx-auto"
              title="Open sidebar"
            >
              {logoHovered ? (
                <PanelLeft className="w-5 h-5 text-muted-foreground" />
              ) : (
                <>
                  <Image src="/logo.svg" alt="MakersLounge" width={20} height={21} className="dark:hidden" />
                  <Image src="/logo-light.svg" alt="MakersLounge" width={20} height={21} className="hidden dark:block" />
                </>
              )}
              {/* Tooltip */}
              {logoHovered && (
                <span className="absolute left-full ml-2 px-2 py-1 rounded-md bg-foreground text-background text-xs whitespace-nowrap z-50">
                  Open sidebar
                </span>
              )}
            </button>
          ) : (
            /* Expanded: logo + text + toggle button */
            <div className="flex items-center justify-between">
              <Link href="/home" className="flex items-center gap-1.5 hover:opacity-70 transition-opacity">
                <Image src="/logo.svg" alt="MakersLounge" width={18} height={19} className="dark:hidden" />
                <Image src="/logo-light.svg" alt="MakersLounge" width={18} height={19} className="hidden dark:block" />
                <span className="text-lg font-serif tracking-tight text-foreground">
                  makerslounge
                </span>
              </Link>
              <button
                onClick={toggleCollapsed}
                className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
                title="Close sidebar"
              >
                <PanelLeft className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Nav items */}
        <nav className={cn("flex-1 space-y-0.5", collapsed ? "px-1.5" : "px-2")}>
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              title={collapsed ? label : undefined}
              className={cn(
                "relative flex items-center rounded-lg text-sm transition-colors",
                collapsed ? "justify-center p-2.5" : "gap-3 px-3 py-2",
                isActive(href)
                  ? "text-foreground bg-secondary font-medium"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
              )}
            >
              <Icon className="w-[18px] h-[18px] shrink-0" strokeWidth={isActive(href) ? 2.2 : 1.8} />
              {!collapsed && label}
              {href === "/messages" && unreadCount > 0 && (
                collapsed ? (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-primary text-primary-foreground text-[9px] font-medium flex items-center justify-center">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                ) : (
                  <span className="ml-auto w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-medium flex items-center justify-center">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )
              )}
            </Link>
          ))}
        </nav>

        {/* Bottom section */}
        <div className={cn("pb-3 space-y-0.5 border-t border-border pt-2", collapsed ? "px-1.5" : "px-2")}>
          {BOTTOM_ITEMS.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              title={collapsed ? label : undefined}
              className={cn(
                "flex items-center rounded-lg text-sm transition-colors",
                collapsed ? "justify-center p-2.5" : "gap-3 px-3 py-2",
                isActive(href)
                  ? "text-foreground bg-secondary font-medium"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
              )}
            >
              <Icon className="w-[18px] h-[18px] shrink-0" strokeWidth={isActive(href) ? 2.2 : 1.8} />
              {!collapsed && label}
            </Link>
          ))}
          <button
            onClick={toggleTheme}
            title={collapsed ? (resolved === "dark" ? "Light mode" : "Dark mode") : undefined}
            className={cn(
              "flex items-center rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors w-full",
              collapsed ? "justify-center p-2.5" : "gap-3 px-3 py-2"
            )}
          >
            {resolved === "dark" ? <Sun className="w-[18px] h-[18px] shrink-0" /> : <Moon className="w-[18px] h-[18px] shrink-0" />}
            {!collapsed && (resolved === "dark" ? "Light mode" : "Dark mode")}
          </button>
        </div>
      </aside>

      {/* Mobile: Top bar */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between h-[calc(2.75rem+env(safe-area-inset-top))] px-4 pt-[env(safe-area-inset-top)] border-b border-border/50 bg-background/80 backdrop-blur-lg">
        <Link href="/home" className="flex items-center gap-1.5">
          <Image src="/logo.svg" alt="MakersLounge" width={16} height={17} className="dark:hidden" />
          <Image src="/logo-light.svg" alt="MakersLounge" width={16} height={17} className="hidden dark:block" />
          <span className="text-base font-serif tracking-tight text-foreground">makerslounge</span>
        </Link>
        <div className="flex items-center gap-1">
          <button
            onClick={toggleTheme}
            className="p-2 text-muted-foreground active:opacity-60"
            aria-label="Toggle theme"
          >
            {resolved === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </div>
      </header>
      <div className="md:hidden h-[calc(2.75rem+env(safe-area-inset-top))]" />

      {/* Mobile: Bottom tab bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-t border-border/50 pb-[env(safe-area-inset-bottom,0px)]">
        <div className="flex items-center justify-around h-[50px]">
          {MOBILE_TABS.map(({ href, label, icon: Icon }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "relative flex flex-col items-center justify-center gap-[2px] w-full h-full active:opacity-60 transition-opacity",
                  active ? "text-primary" : "text-muted-foreground"
                )}
              >
                <Icon className="w-[22px] h-[22px]" strokeWidth={active ? 2.2 : 1.8} />
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
