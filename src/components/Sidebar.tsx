"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useSidebar } from "@/context/SidebarContext";
import { cn } from "@/lib/utils";
import {
  Search,
  Calendar,
  MessageCircle,
  PanelLeft,
  BarChart3,
  MessageSquarePlus,
  Newspaper,
  Users,
  UserCircle,
  LogOut,
  Shield,
  Sparkles,
} from "lucide-react";
import UserMenu from "./UserMenu";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useFeedback } from "@/context/FeedbackContext";

const NAV_ITEMS = [
  { href: "/home", label: "Home", icon: Search },
  { href: "/updates", label: "Updates", icon: Newspaper },
  { href: "/people", label: "People", icon: Users },
  { href: "/community", label: "Community", icon: BarChart3 },
  { href: "/messages", label: "Messages", icon: MessageCircle },
  { href: "/meetup-matcher", label: "Matcher", icon: Sparkles },
  { href: "/events", label: "Events", icon: Calendar },
];

export default function Sidebar() {
  const { user, isAdmin } = useAuth();
  const pathname = usePathname();
  const { collapsed, toggleCollapsed } = useSidebar();
  const { openFeedback } = useFeedback();
  const [unreadCount, setUnreadCount] = useState(0);
  const [logoHovered, setLogoHovered] = useState(false);

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
      {/* Left sidebar — always visible, collapsed on small screens */}
      <aside
        className={cn(
          "flex flex-col h-svh fixed left-0 top-0 border-r border-border bg-background z-50 transition-[width] duration-200 ease-in-out",
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
                <span className="text-lg font-sans font-normal tracking-normal text-foreground">
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

        {/* Bottom section — Profile, Feedback, Log out */}
        <div className={cn("border-t border-border py-3 space-y-0.5", collapsed ? "px-1.5" : "px-2")}>
          <Link
            href="/profile"
            title={collapsed ? "Profile" : undefined}
            className={cn(
              "flex items-center rounded-lg text-sm transition-colors w-full",
              collapsed ? "justify-center p-2.5" : "gap-3 px-3 py-2",
              isActive("/profile")
                ? "text-foreground bg-secondary font-medium"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
            )}
          >
            <UserCircle className="w-[18px] h-[18px] shrink-0" strokeWidth={isActive("/profile") ? 2.2 : 1.8} />
            {!collapsed && "Profile"}
          </Link>
          {isAdmin && (
            <Link
              href="/admin"
              title={collapsed ? "Admin" : undefined}
              className={cn(
                "flex items-center rounded-lg text-sm transition-colors w-full",
                collapsed ? "justify-center p-2.5" : "gap-3 px-3 py-2",
                isActive("/admin")
                  ? "text-foreground bg-secondary font-medium"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
              )}
            >
              <Shield className="w-[18px] h-[18px] shrink-0" strokeWidth={isActive("/admin") ? 2.2 : 1.8} />
              {!collapsed && "Admin"}
            </Link>
          )}
          <button
            onClick={openFeedback}
            className={cn(
              "flex items-center rounded-lg text-sm transition-colors w-full",
              collapsed ? "justify-center p-2.5" : "gap-3 px-3 py-2",
              "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
            )}
            title={collapsed ? "Send Feedback" : undefined}
          >
            <MessageSquarePlus className="w-[18px] h-[18px] shrink-0" strokeWidth={1.8} />
            {!collapsed && "Feedback"}
          </button>
          <button
            onClick={async () => {
              await supabase.auth.signOut();
              window.location.href = "/";
            }}
            className={cn(
              "flex items-center rounded-lg text-sm transition-colors w-full",
              collapsed ? "justify-center p-2.5" : "gap-3 px-3 py-2",
              "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
            )}
            title={collapsed ? "Log out" : undefined}
          >
            <LogOut className="w-[18px] h-[18px] shrink-0" strokeWidth={1.8} />
            {!collapsed && "Log out"}
          </button>
        </div>
      </aside>

      {/* User menu in top-right corner */}
      <div className="fixed top-3 right-4 z-[60]">
        <UserMenu />
      </div>
    </>
  );
}
