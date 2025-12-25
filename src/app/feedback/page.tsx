"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { User } from "@supabase/supabase-js";

interface Feedback {
  id: string;
  message: string;
  email: string | null;
  completed: boolean;
  created_at: string;
  screenshot_url: string | null;
}

export default function FeedbackPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [enlargedScreenshot, setEnlargedScreenshot] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user?.email === "bertmill19@gmail.com") {
        const { data } = await supabase
          .from("feedback")
          .select("*")
          .order("created_at", { ascending: false });
        setFeedback(data || []);
      }
      setLoading(false);
    };
    init();
  }, []);

  const toggleCompleted = async (id: string, completed: boolean) => {
    await supabase
      .from("feedback")
      .update({ completed: !completed })
      .eq("id", id);

    setFeedback(feedback.map(f =>
      f.id === id ? { ...f, completed: !completed } : f
    ));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  if (user?.email !== "bertmill19@gmail.com") {
    return (
      <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-serif font-bold mb-2">Access Denied</h1>
          <p className="text-gray-600">You don&apos;t have permission to view this page.</p>
          <a href="/" className="text-blue-600 hover:underline mt-4 inline-block">
            Go home
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF9F6]">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-serif font-bold mb-8">Feedback</h1>

        {feedback.length === 0 ? (
          <p className="text-gray-500">No feedback yet.</p>
        ) : (
          <div className="space-y-4">
            {feedback.map((item) => (
              <div
                key={item.id}
                className={`bg-white rounded-xl p-5 border border-gray-200 ${
                  item.completed ? "opacity-60" : ""
                }`}
              >
                <div className="flex items-start gap-4">
                  <input
                    type="checkbox"
                    checked={item.completed}
                    onChange={() => toggleCompleted(item.id, item.completed)}
                    className="mt-1 w-5 h-5 rounded cursor-pointer"
                  />
                  <div className="flex-1">
                    <p className={`text-gray-800 ${item.completed ? "line-through" : ""}`}>
                      {item.message}
                    </p>
                    {item.screenshot_url && (
                      <button
                        onClick={() => setEnlargedScreenshot(item.screenshot_url)}
                        className="mt-3 block"
                      >
                        <img
                          src={item.screenshot_url}
                          alt="Feedback screenshot"
                          className="max-w-xs rounded-lg border border-gray-200 hover:border-gray-400 transition-colors cursor-pointer"
                        />
                      </button>
                    )}
                    <div className="flex gap-4 mt-2 text-sm text-gray-500">
                      {item.email && <span>{item.email}</span>}
                      <span>
                        {new Date(item.created_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Enlarged screenshot modal */}
      {enlargedScreenshot && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={() => setEnlargedScreenshot(null)}
        >
          <button
            onClick={() => setEnlargedScreenshot(null)}
            className="absolute top-4 right-4 text-white hover:text-gray-300"
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <img
            src={enlargedScreenshot}
            alt="Screenshot"
            className="max-w-full max-h-full object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
