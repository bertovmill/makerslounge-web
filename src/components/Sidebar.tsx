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
  type LucideIcon,
} from "lucide-react";
import UserMenu from "./UserMenu";
import { useState } from "react";
import { useUnreadCount } from "@/hooks/useUnreadCount";
import { useFeedback } from "@/context/FeedbackContext";
import { Menu, X } from "lucide-react";

type NavItem = { href: string; label: string; icon: LucideIcon };

// Grouped like Shopify admin: the everyday destinations up top with no
// label, then labelled sections for the rest.
const NAV_SECTIONS: { label?: string; items: NavItem[] }[] = [
  {
    items: [
      { href: "/home", label: "Home", icon: Search },
      { href: "/messages", label: "Messages", icon: MessageCircle },
      { href: "/people", label: "People", icon: Users },
      { href: "/events", label: "Events", icon: Calendar },
    ],
  },
  {
    label: "Community",
    items: [
      { href: "/updates", label: "Updates", icon: Newspaper },
      { href: "/community", label: "Community", icon: BarChart3 },
      { href: "/meetup-matcher", label: "Matcher", icon: Sparkles },
      { href: "/hackathons", label: "Hackathons", icon: Trophy },
    ],
  },
  {
    label: "Content",
    items: [
      { href: "/blog", label: "Blog", icon: BookOpen },
      { href: "/brand", label: "Branding", icon: Palette },
      { href: "/about", label: "About Us", icon: Info },
    ],
  },
];

// Polaris-style rows: compact, 13px, white raised pill when active.
const rowBase =
  "relative flex items-center w-full rounded-lg text-[13px] font-medium transition-colors";
const rowIdle =
  "text-foreground/75 hover:text-foreground hover:bg-[var(--frame-hover)]";
const rowActive =
  "text-foreground font-semibold bg-[var(--frame-active)] shadow-[var(--frame-active-shadow)]";

function UnreadBadge({ count, collapsed }: { count: number; collapsed?: boolean }) {
  if (count <= 0) return null;
  const label = count > 9 ? "9+" : count;
  return collapsed ? (
    <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 rounded-full bg-primary text-primary-foreground text-[9px] font-semibold flex items-center justify-center">
      {label}
    </span>
  ) : (
    <span className="ml-auto min-w-5 h-5 px-1.5 rounded-md bg-primary text-primary-foreground text-[11px] font-semibold flex items-center justify-center">
      {label}
    </span>
  );
}

export default function Sidebar() {
  const { user, isAdmin, signOut } = useAuth();
  const pathname = usePathname();
  const { collapsed, toggleCollapsed } = useSidebar();
  const { openFeedback } = useFeedback();
  // Polled, shared with Navbar — Realtime has no Neon equivalent.
  const unreadCount = useUnreadCount(!!user);
  const [logoHovered, setLogoHovered] = useState(false);
  // The mobile drawer remembers the path it was opened on, so navigating
  // anywhere closes it without an effect.
  const [drawerPath, setDrawerPath] = useState<string | null>(null);
  const mobileOpen = drawerPath === pathname;
  const setMobileOpen = (open: boolean) => setDrawerPath(open ? pathname : null);

  // `/eve-workshop` ships its own sidebar (see `components/eve-workshop/left-sidebar.tsx`).
  const isHidden = pathname === "/" || pathname === "/auth" || pathname === "/onboarding" || pathname.startsWith("/hackathons") || pathname.startsWith("/podcasts") || pathname.startsWith("/eve-workshop");

  if (isHidden || !user) return null;

  function isActive(href: string) {
    if (href === "/home") return pathname === "/home";
    return pathname === href || pathname.startsWith(href + "/");
  }

  async function handleSignOut() {
    await signOut();
    window.location.assign("/");
  }

  // `compact` is the collapsed desktop rail: icons only, labels as tooltips.
  function renderLink({ href, label, icon: Icon }: NavItem, compact = false) {
    const active = isActive(href);
    return (
      <Link
        key={href}
        href={href}
        title={compact ? label : undefined}
        aria-current={active ? "page" : undefined}
        className={cn(
          rowBase,
          compact ? "justify-center h-9" : "gap-2.5 h-8 px-2.5",
          active ? rowActive : rowIdle
        )}
      >
        <Icon
          className={cn("w-[18px] h-[18px] shrink-0", active ? "text-foreground" : "text-foreground/60")}
          strokeWidth={active ? 2.2 : 1.9}
        />
        {!compact && label}
        {href === "/messages" && <UnreadBadge count={unreadCount} collapsed={compact} />}
      </Link>
    );
  }

  function renderButton(label: string, Icon: LucideIcon, onClick: () => void, compact = false) {
    return (
      <button
        onClick={onClick}
        title={compact ? label : undefined}
        className={cn(rowBase, compact ? "justify-center h-9" : "gap-2.5 h-8 px-2.5", rowIdle)}
      >
        <Icon className="w-[18px] h-[18px] shrink-0 text-foreground/60" strokeWidth={1.9} />
        {!compact && label}
      </button>
    );
  }

  function renderNav(compact = false) {
    return NAV_SECTIONS.map((section, i) => (
      <div key={section.label ?? "main"} className={cn("space-y-px", i > 0 && "mt-4")}>
        {section.label && !compact && (
          <div className="px-2.5 pb-1 text-xs font-medium text-foreground/50">
            {section.label}
          </div>
        )}
        {section.label && compact && <div className="mx-2 mb-2 border-t border-foreground/10" />}
        {section.items.map((item) => renderLink(item, compact))}
      </div>
    ));
  }

  function renderFooter(compact = false) {
    return (
      <>
        {renderLink({ href: "/profile", label: "Profile", icon: UserCircle }, compact)}
        {isAdmin && renderLink({ href: "/admin", label: "Admin", icon: Shield }, compact)}
        {renderButton("Feedback", MessageSquarePlus, openFeedback, compact)}
        {renderButton("Log out", LogOut, handleSignOut, compact)}
      </>
    );
  }

  const wordmark = (
    <Link href="/home" className="flex items-center gap-1.5 hover:opacity-70 transition-opacity">
      <Image src="/logos/logo.svg" alt="MakersLounge" width={18} height={19} className="dark:hidden" />
      <Image src="/logos/logo-light.svg" alt="MakersLounge" width={18} height={19} className="hidden dark:block" />
      <span className="text-[17px] font-sans font-semibold tracking-tight text-foreground">makerslounge</span>
    </Link>
  );

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
          <div className="relative flex flex-col w-72 h-full bg-[var(--frame)] shadow-xl">
            <div className="flex items-center justify-between px-4 py-4">
              {wordmark}
              <button
                onClick={() => setMobileOpen(false)}
                className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-[var(--frame-hover)] transition-colors"
                aria-label="Close menu"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto px-2">{renderNav()}</nav>
            <div className="py-3 px-2 space-y-px">{renderFooter()}</div>
          </div>
        </div>
      )}

      {/* Left sidebar — desktop only. No border: the page sits on an inset
          panel (see AppShell), so the frame colour alone separates them. */}
      <aside
        className={cn(
          "hidden md:flex flex-col h-svh fixed left-0 top-0 bg-[var(--frame)] z-50 transition-[width] duration-200 ease-in-out",
          collapsed ? "w-16" : "w-60"
        )}
      >
        {/* Logo / Toggle area */}
        <div className={cn("pt-3.5 pb-3", collapsed ? "px-2" : "pl-4 pr-3")}>
          {collapsed ? (
            /* Collapsed: show logo icon, on hover show panel toggle icon */
            <button
              onClick={toggleCollapsed}
              onMouseEnter={() => setLogoHovered(true)}
              onMouseLeave={() => setLogoHovered(false)}
              className="relative group w-10 h-10 flex items-center justify-center rounded-lg hover:bg-[var(--frame-hover)] transition-colors mx-auto"
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
              {wordmark}
              <button
                onClick={toggleCollapsed}
                className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-[var(--frame-hover)] transition-colors"
                title="Close sidebar"
              >
                <PanelLeft className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        <nav className={cn("flex-1 overflow-y-auto pb-2", collapsed ? "px-2" : "px-2.5")}>
          {renderNav(collapsed)}
        </nav>

        {/* Bottom section — Profile, Admin, Feedback, Log out */}
        <div className={cn("py-3 space-y-px", collapsed ? "px-2" : "px-2.5")}>
          {renderFooter(collapsed)}
        </div>
      </aside>

      {/* User menu in top-right corner — desktop only */}
      <div className="hidden md:block fixed top-4 right-5 z-[60]">
        <UserMenu />
      </div>
    </>
  );
}
