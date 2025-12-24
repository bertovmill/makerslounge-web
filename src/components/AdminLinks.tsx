"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function AdminLinks() {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setIsAdmin(user?.email === "bertmill19@gmail.com");
    };

    checkAdmin();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAdmin(session?.user?.email === "bertmill19@gmail.com");
    });

    return () => subscription.unsubscribe();
  }, []);

  if (!isAdmin) return null;

  return (
    <a
      href="/feedback"
      className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
    >
      Feedback
    </a>
  );
}
