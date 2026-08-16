"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { User, Settings, LogOut, Sun, Moon } from "lucide-react";

interface Profile {
  photo_url?: string;
  username?: string;
  name?: string;
}

export default function UserMenu() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { resolved, setTheme } = useTheme();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      supabase
        .from("profiles")
        .select("photo_url, username, name")
        .eq("id", user.id)
        .single()
        .then(({ data }) => {
          if (data) setProfile(data);
        });
    } else {
      setProfile(null);
    }
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuOpen]);

  if (!user) return null;

  const toggleTheme = () => setTheme(resolved === "dark" ? "light" : "dark");

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  const getInitials = () => {
    if (profile?.name) {
      return profile.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    if (profile?.username) {
      return profile.username.slice(0, 2).toUpperCase();
    }
    if (user?.email) {
      return user.email.slice(0, 2).toUpperCase();
    }
    return "U";
  };

  const displayName = profile?.name || profile?.username || user.email?.split("@")[0];

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setMenuOpen(!menuOpen)}
        className="rounded-full transition-opacity hover:opacity-80"
        aria-label="User menu"
      >
        <Avatar className="size-8">
          <AvatarImage src={profile?.photo_url} alt={displayName || ""} />
          <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
            {getInitials()}
          </AvatarFallback>
        </Avatar>
      </button>

      {menuOpen && (
        <div className="absolute right-0 top-full mt-2 w-64 bg-popover border border-border rounded-xl shadow-lg overflow-hidden z-[60]">
          {/* User info header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
            <Avatar className="size-10">
              <AvatarImage src={profile?.photo_url} alt={displayName || ""} />
              <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                {getInitials()}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-foreground truncate">
                {displayName}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {user.email}
              </p>
            </div>
          </div>

          {/* Menu items */}
          <div className="py-1">
            <Link
              href="/profile"
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-secondary/50 transition-colors"
            >
              <User className="w-4 h-4 text-muted-foreground" />
              Profile
            </Link>
            <Link
              href="/settings"
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-secondary/50 transition-colors"
            >
              <Settings className="w-4 h-4 text-muted-foreground" />
              Settings
            </Link>
            <button
              onClick={() => {
                toggleTheme();
              }}
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-secondary/50 transition-colors w-full"
            >
              {resolved === "dark" ? (
                <Sun className="w-4 h-4 text-muted-foreground" />
              ) : (
                <Moon className="w-4 h-4 text-muted-foreground" />
              )}
              {resolved === "dark" ? "Light mode" : "Dark mode"}
            </button>
          </div>

          {/* Sign out */}
          <div className="border-t border-border py-1">
            <button
              onClick={() => {
                handleSignOut();
                setMenuOpen(false);
              }}
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-secondary/50 transition-colors w-full"
            >
              <LogOut className="w-4 h-4" />
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
