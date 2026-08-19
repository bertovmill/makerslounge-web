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
  Palette,
  BookOpen,
  Trophy,
  Info,
} from "lucide-react";
import UserMenu from "./UserMenu";
import { useEffect, useState } from "react";
import { useUnreadCount } from "@/hooks/useUnreadCount";
import { useFeedback } from "@/context/FeedbackContext";
import { Menu, X } from "lucide-react";

const NAV_ITEMS = [
  { href: "/home", label: "Home", icon: Search },
  { href: "/updates", label: "Updates", icon: Newspaper },
  { href: "/people", label: "People", icon: Users },
  { href: "/community", label: "Community", icon: BarChart3 },
  { href: "/messages", label: "Messages", icon: MessageCircle },
  { href: "/meetup-matcher", label: "Matcher", icon: Sparkles },
  { href: "/events", label: "Events", icon: Calendar },
  { href: "/hackathons", label: "Hackathons", icon: Trophy },
  { href: "/blog", label: "Blog", icon: BookOpen },
  { href: "/brand", label: "Branding", icon: Palette },
  { href: "/about", label: "About Us", icon: Info },
];

export default function Sidebar() {
  const { user, isAdmin, signOut } = useAuth();
  const pathname = usePathname();
  const { collapsed, toggleCollapsed } = useSidebar();
  const { openFeedback } = useFeedback();
  // Polled, shared with Navbar — Realtime has no Neon equivalent.
  const unreadCount = useUnreadCount(!!user);
  const [logoHovered, setLogoHovered] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // `/eve-workshop` ships its own sidebar (see `components/eve-workshop/left-sidebar.tsx`).
  const isHidden = pathname === "/" || pathname === "/auth" || pathname === "/onboarding" || pathname.startsWith("/hackathons") || pathname.startsWith("/podcasts") || pathname.startsWith("/eve-workshop");


  // Close mobile drawer on navigation
  useEffect(() => { setMobileOpen(false); }, [pathname]);

  if (isHidden || !user) return null;

  function isActive(href: string) {
    if (href === "/home") return pathname === "/home";
    return pathname === href || pathname.startsWith(href + "/");
  }

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="md:hidden fixed top-3 left-4 z-50 p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
        aria-label="Open menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Mobile drawer overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-[60] flex">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          {/* Drawer */}
          <div className="relative flex flex-col w-72 h-full bg-background border-r border-border shadow-xl">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-4">
              <Link href="/home" className="flex items-center gap-1.5 hover:opacity-70 transition-opacity">
                <Image src="/logos/logo.svg" alt="MakersLounge" width={18} height={19} className="dark:hidden" />
                <Image src="/logos/logo-light.svg" alt="MakersLounge" width={18} height={19} className="hidden dark:block" />
                <span className="text-lg font-sans font-normal tracking-normal text-foreground">makerslounge</span>
              </Link>
              <button
                onClick={() => setMobileOpen(false)}
                className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            {/* Nav */}
            <nav className="flex-1 px-2 space-y-0.5">
              {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
                    isActive(href)
                      ? "text-foreground bg-secondary font-medium"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                  )}
                >
                  <Icon className="w-[18px] h-[18px] shrink-0" strokeWidth={isActive(href) ? 2.2 : 1.8} />
                  {label}
                  {href === "/messages" && unreadCount > 0 && (
                    <span className="ml-auto w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-medium flex items-center justify-center">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </Link>
              ))}
            </nav>
            {/* Bottom */}
            <div className="border-t border-border py-3 px-2 space-y-0.5">
              <Link
                href="/profile"
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
                  isActive("/profile") ? "text-foreground bg-secondary font-medium" : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                )}
              >
                <UserCircle className="w-[18px] h-[18px] shrink-0" strokeWidth={isActive("/profile") ? 2.2 : 1.8} />
                Profile
              </Link>
              {isAdmin && (
                <Link
                  href="/admin"
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
                    isActive("/admin") ? "text-foreground bg-secondary font-medium" : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                  )}
                >
                  <Shield className="w-[18px] h-[18px] shrink-0" strokeWidth={isActive("/admin") ? 2.2 : 1.8} />
                  Admin
                </Link>
              )}
              <button
                onClick={openFeedback}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors w-full text-muted-foreground hover:text-foreground hover:bg-secondary/50"
              >
                <MessageSquarePlus className="w-[18px] h-[18px] shrink-0" strokeWidth={1.8} />
                Feedback
              </button>
              <button
                onClick={async () => { await signOut(); window.location.href = "/"; }}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors w-full text-muted-foreground hover:text-foreground hover:bg-secondary/50"
              >
                <LogOut className="w-[18px] h-[18px] shrink-0" strokeWidth={1.8} />
                Log out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Left sidebar — desktop only */}
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
                  <Image src="/logos/logo.svg" alt="MakersLounge" width={20} height={21} className="dark:hidden" />
                  <Image src="/logos/logo-light.svg" alt="MakersLounge" width={20} height={21} className="hidden dark:block" />
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
                <Image src="/logos/logo.svg" alt="MakersLounge" width={18} height={19} className="dark:hidden" />
                <Image src="/logos/logo-light.svg" alt="MakersLounge" width={18} height={19} className="hidden dark:block" />
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
              await signOut();
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

      {/* User menu in top-right corner — desktop only */}
      <div className="hidden md:block fixed top-3 right-4 z-[60]">
        <UserMenu />
      </div>
    </>
  );
}
