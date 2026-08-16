"use client";

import { useAuth } from "@/context/AuthContext";

export default function AdminLinks() {
  // AuthContext already tracks the session and derives isAdmin from the Clerk
  // email, so the local state and auth listener this used to keep are gone.
  const { isAdmin } = useAuth();

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
