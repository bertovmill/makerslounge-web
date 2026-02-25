"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import AuthButton from "./AuthButton";
import Logo, { LogoIcon } from "./Logo";
import { cn } from "@/lib/utils";
import { useSidebar } from "@/context/SidebarContext";
import { useFeedback } from "@/context/FeedbackContext";
import { useAuth } from "@/context/AuthContext";

export default function Navbar() {
  const { user, isAdmin } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const { collapsed, setCollapsed } = useSidebar();
  const { openFeedback } = useFeedback();
  const pathname = usePathname();

  const closeMenu = () => setMenuOpen(false);

  // Hide navbar on public pages when not logged in
  const isPublicPage = pathname === "/" || pathname === "/auth";
  const shouldHideNavbar = isPublicPage && !user;

  if (shouldHideNavbar) {
    return null;
  }

  // Icons
  const icons = {
    home: (
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
    people: (
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
    events: (
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    workshops: (
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
      </svg>
    ),
    podcast: (
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
      </svg>
    ),
    blog: (
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
    about: (
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    profile: (
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
    admin: (
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    feedback: (
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
      </svg>
    ),
    agents: (
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
    connections: (
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
    matcher: (
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
      </svg>
    ),
    docs: (
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    findIdea: (
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
    settings: (
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  };

  const NavLink = ({ href, children, icon, label }: { href: string; children: React.ReactNode; icon?: React.ReactNode; label?: string }) => {
    const isActive = pathname === href;
    return (
      <Link
        href={href}
        className={cn(
          "relative group px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-3",
          "hover:bg-accent/50 hover:text-foreground",
          isActive
            ? "bg-accent text-foreground"
            : "text-muted-foreground",
          collapsed && "justify-center px-2"
        )}
        onClick={closeMenu}
      >
        {icon && <span className="w-5 h-5 flex-shrink-0">{icon}</span>}
        {!collapsed && children}
        {collapsed && (
          <span className="absolute left-full ml-2 px-2.5 py-1.5 rounded-md bg-popover text-popover-foreground text-xs font-medium whitespace-nowrap shadow-md border border-border opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 z-50 pointer-events-none">
            {label || children}
          </span>
        )}
      </Link>
    );
  };

  const NavDropdown = ({ label, icon, items }: { label: string; icon?: React.ReactNode; items: { href: string; label: string }[] }) => {
    const isAnyActive = items.some((item) => pathname === item.href);
    const [open, setOpen] = useState(false);

    // Desktop sidebar: expandable section
    if (!collapsed) {
      return (
        <div>
          <button
            onClick={() => setOpen(!open)}
            className={cn(
              "relative w-full px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-3",
              "hover:bg-accent/50 hover:text-foreground",
              isAnyActive ? "text-foreground" : "text-muted-foreground"
            )}
          >
            {icon && <span className="w-5 h-5 flex-shrink-0">{icon}</span>}
            <span className="flex-1 text-left">{label}</span>
            <svg className={cn("w-4 h-4 transition-transform duration-200", open && "rotate-180")} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {open && (
            <div className="ml-8 mt-1 space-y-0.5">
              {items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={closeMenu}
                  className={cn(
                    "block px-3 py-1.5 rounded-md text-sm transition-colors duration-150",
                    pathname === item.href
                      ? "text-foreground bg-accent/50 font-medium"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent/30"
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          )}
        </div>
      );
    }

    // Collapsed sidebar: hover flyout
    return (
      <div className="relative group">
        <div
          className={cn(
            "px-2 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center",
            "hover:bg-accent/50 hover:text-foreground cursor-pointer",
            isAnyActive ? "bg-accent text-foreground" : "text-muted-foreground"
          )}
        >
          {icon && <span className="w-5 h-5 flex-shrink-0">{icon}</span>}
        </div>
        <div className="absolute left-full top-0 ml-2 py-1.5 px-1 rounded-lg bg-popover border border-border shadow-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 z-50 min-w-[140px]">
          <p className="px-2.5 py-1 text-xs font-semibold text-muted-foreground">{label}</p>
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={closeMenu}
              className={cn(
                "block px-2.5 py-1.5 rounded-md text-sm transition-colors duration-150",
                pathname === item.href
                  ? "text-foreground bg-accent/50 font-medium"
                  : "text-popover-foreground hover:bg-accent/30"
              )}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className={cn(
        "hidden md:flex fixed left-0 top-0 h-screen border-r border-border bg-background/80 backdrop-blur-md flex-col z-50 transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}>
        <div className={cn("p-6 flex items-center", collapsed ? "justify-center p-4" : "justify-between")}>
          <Link href="/matcher" className="hover:opacity-90 transition-opacity inline-block">
            {collapsed ? (
              <LogoIcon size={32} />
            ) : (
              <Logo size="sm" />
            )}
          </Link>
          {!collapsed && (
            <button
              onClick={() => setCollapsed(true)}
              className="p-1.5 rounded-md hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
              aria-label="Collapse sidebar"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h18v18H3V3z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v18" />
              </svg>
            </button>
          )}
        </div>

        {collapsed && (
          <div className="px-3 mb-2">
            <button
              onClick={() => setCollapsed(false)}
              className="w-full p-2 rounded-lg hover:bg-accent transition-colors text-muted-foreground hover:text-foreground flex justify-center"
              aria-label="Expand sidebar"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h18v18H3V3z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v18" />
              </svg>
            </button>
          </div>
        )}

        <nav className="flex-1 flex flex-col gap-1 px-3 py-4">
          <NavLink href="/people" icon={icons.people}>People</NavLink>
          <NavLink href="/matcher" icon={icons.matcher}>Matcher</NavLink>
          <NavLink href="/agents" icon={icons.agents}>Agents</NavLink>
          <NavLink href="/agents/find-idea" icon={icons.findIdea} label="Find an Idea">Find an Idea</NavLink>
          <NavDropdown
            label="About"
            icon={icons.about}
            items={[
              { href: "/about", label: "Background" },
              { href: "/values", label: "Values" },
            ]}
          />
          <NavLink href="/brand" icon={icons.docs}>Brand</NavLink>
          <NavLink href="/docs" icon={icons.docs}>Docs</NavLink>
          {user && (
            <>
              <div className="my-2 border-t border-border"></div>
              <NavLink href="/profile" icon={icons.profile}>Profile</NavLink>
              <NavLink href="/connections" icon={icons.connections}>Connections</NavLink>
            </>
          )}

          {isAdmin && (
            <>
              <div className="my-2 border-t border-border"></div>
              <NavLink href="/admin" icon={icons.admin}>Admin</NavLink>
              <NavLink href="/feedback" icon={icons.feedback}>Feedback</NavLink>
            </>
          )}
        </nav>

        <div className={cn("p-4 border-t border-border", collapsed && "flex flex-col items-center gap-2")}>
          {user && (
            <NavLink href="/settings" icon={icons.settings}>Settings</NavLink>
          )}
          {user && (
            <button
              onClick={openFeedback}
              className={cn(
                "relative group px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-3 w-full bg-primary text-primary-foreground hover:bg-primary/90",
                collapsed && "justify-center px-2"
              )}
            >
              <span className="w-5 h-5 flex-shrink-0">{icons.feedback}</span>
              {!collapsed && "Feedback"}
              {collapsed && (
                <span className="absolute left-full ml-2 px-2.5 py-1.5 rounded-md bg-popover text-popover-foreground text-xs font-medium whitespace-nowrap shadow-md border border-border opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 z-50 pointer-events-none">
                  Feedback
                </span>
              )}
            </button>
          )}
          {collapsed ? (
            <Link href="/profile" className="p-2 rounded-lg hover:bg-accent transition-colors" title="Profile">
              <svg className="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </Link>
          ) : (
            <AuthButton />
          )}
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="md:hidden sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <nav className="flex items-center justify-between px-4 py-4">
          <Link href="/matcher" className="hover:opacity-90 transition-opacity">
            <Logo size="sm" />
          </Link>

          <div className="flex items-center gap-1">
            {/* Mobile Feedback button */}
            {user && (
              <button
                onClick={openFeedback}
                className="p-2 text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Send feedback"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                </svg>
              </button>
            )}

            {/* Mobile hamburger button */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-2 text-muted-foreground hover:text-foreground"
              aria-label="Toggle menu"
            >
            {menuOpen ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
            </button>
          </div>
        </nav>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="border-t border-border bg-background/95 backdrop-blur-md">
            <div className="flex flex-col gap-1 px-4 py-4">
              <NavLink href="/people" icon={icons.people}>People</NavLink>
              <NavLink href="/matcher" icon={icons.matcher}>Matcher</NavLink>
              <NavLink href="/agents" icon={icons.agents}>Agents</NavLink>
              <NavLink href="/agents/find-idea" icon={icons.findIdea} label="Find an Idea">Find an Idea</NavLink>
              <NavDropdown
                label="About"
                icon={icons.about}
                items={[
                  { href: "/about", label: "Background" },
                  { href: "/values", label: "Values" },
                ]}
              />
              <NavLink href="/brand" icon={icons.docs}>Brand</NavLink>
              <NavLink href="/docs" icon={icons.docs}>Docs</NavLink>
              {user && (
                <>
                  <div className="my-2 border-t border-border"></div>
                  <NavLink href="/profile" icon={icons.profile}>Profile</NavLink>
                  <NavLink href="/connections" icon={icons.connections}>Connections</NavLink>
                  <NavLink href="/settings" icon={icons.settings}>Settings</NavLink>
                </>
              )}

              {isAdmin && (
                <>
                  <div className="my-2 border-t border-border"></div>
                  <NavLink href="/admin" icon={icons.admin}>Admin</NavLink>
                  <NavLink href="/feedback" icon={icons.feedback}>Feedback</NavLink>
                </>
              )}

              <div className="mt-4 pt-4 border-t border-border">
                <AuthButton />
              </div>
            </div>
          </div>
        )}
      </header>
    </>
  );
}
