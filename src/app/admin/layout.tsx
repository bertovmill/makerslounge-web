"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, isAdmin, signOut } = useAuth();

  // Gate every admin page here, once. A signed-out visitor used to get the admin
  // sidebar plus a bare "Access denied", which read as a permissions bug rather
  // than "you need to sign in". Now they go to sign-in and come straight back.
  useEffect(() => {
    if (!loading && !user) {
      router.replace(`/auth?next=${encodeURIComponent(pathname)}`);
    }
  }, [loading, user, pathname, router]);

  if (loading || !user) return null;

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="max-w-sm text-center space-y-4">
          <h1 className="text-lg font-semibold">This page is for MakersLounge admins</h1>
          <p className="text-sm text-muted-foreground">
            You&apos;re signed in as {user.email ?? "an account"} without admin access.
          </p>
          <div className="flex justify-center gap-2">
            <Button
              onClick={async () => {
                await signOut();
                router.replace(`/auth?next=${encodeURIComponent(pathname)}`);
              }}
            >
              Switch account
            </Button>
            <Button variant="outline" asChild>
              <Link href="/home">Go home</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // The admin nav lives in the main sidebar (see `components/admin/admin-nav.ts`),
  // so this layout is only the top bar over the page.
  return (
    <div className="min-h-svh">
      <AdminTopBar />
      {children}
    </div>
  );
}

/**
 * Shopify-style top bar: one search box over every admin page. It searches
 * contacts, the resource looked up most, and lands on the contacts index.
 */
function AdminTopBar() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");

  // ⌘K / Ctrl+K focuses the search from anywhere in the console.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center border-b border-[var(--frame-edge)] bg-background pl-14 pr-4 md:px-6 md:pr-20">
      <form
        role="search"
        className="relative mx-auto w-full max-w-[560px]"
        onSubmit={(e) => {
          e.preventDefault();
          const q = query.trim();
          router.push(q ? `/admin/contacts?q=${encodeURIComponent(q)}` : "/admin/contacts");
          inputRef.current?.blur();
        }}
      >
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/45" />
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search contacts"
          aria-label="Search contacts"
          className="h-9 w-full rounded-lg border border-[var(--frame-edge)] bg-foreground/[0.04] pl-9 pr-14 text-sm outline-none placeholder:text-foreground/45 focus:border-primary/40 focus:bg-card focus:ring-2 focus:ring-primary/15 transition-colors"
        />
        <kbd className="pointer-events-none absolute right-2.5 top-1/2 hidden -translate-y-1/2 rounded border border-[var(--frame-edge)] bg-card px-1.5 py-px text-[11px] font-medium text-foreground/50 sm:block">
          ⌘K
        </kbd>
      </form>
    </header>
  );
}
