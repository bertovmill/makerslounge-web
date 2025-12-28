"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface Profile {
  avatar_url?: string;
  username?: string;
  full_name?: string;
}

export default function AuthButton() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      if (user) {
        fetchProfile(user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("avatar_url, username, full_name")
      .eq("id", userId)
      .single();

    if (data) {
      setProfile(data);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const getInitials = () => {
    if (profile?.full_name) {
      return profile.full_name
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

  if (user) {
    return (
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <Avatar className="size-9">
            <AvatarImage src={profile?.avatar_url} alt={profile?.username || user.email || ""} />
            <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
              {getInitials()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">
              {profile?.username || profile?.full_name || user.email?.split("@")[0]}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {user.email}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleSignOut}
          className="w-full text-muted-foreground hover:text-foreground justify-start"
        >
          Sign out
        </Button>
      </div>
    );
  }

  return (
    <Button
      asChild
      variant="ghost"
      size="sm"
      className="text-muted-foreground hover:text-foreground"
    >
      <Link href="/auth">Sign in</Link>
    </Button>
  );
}
