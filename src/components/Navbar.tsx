"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { User } from "@supabase/supabase-js";
import AuthButton from "./AuthButton";

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setIsAdmin(user?.email === "bertmill19@gmail.com");
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setIsAdmin(session?.user?.email === "bertmill19@gmail.com");
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <nav className="flex items-center justify-between px-4 md:px-8 py-4">
      <Link href="/" className="text-xl font-serif font-bold">
        MakersLounge
      </Link>

      <div className="flex items-center gap-4">
        <Link
          href="/people"
          className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
        >
          People
        </Link>
        {user && (
          <Link
            href="/profile"
            className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            Profile
          </Link>
        )}
        {isAdmin && (
          <>
            <Link
              href="/admin"
              className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              Admin
            </Link>
            <Link
              href="/feedback"
              className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              Feedback
            </Link>
          </>
        )}
        <AuthButton />
      </div>
    </nav>
  );
}
