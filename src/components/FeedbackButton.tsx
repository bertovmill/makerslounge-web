"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function FeedbackButton() {
  const [showModal, setShowModal] = useState(false);
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();

    await supabase.from("feedback").insert({
      message,
      email: user?.email || email || null,
      user_id: user?.id || null,
    });

    setLoading(false);
    setSubmitted(true);
    setMessage("");
    setEmail("");

    setTimeout(() => {
      setShowModal(false);
      setSubmitted(false);
    }, 2000);
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="fixed bottom-6 right-6 bg-[#1a1a1a] text-white px-4 py-2 rounded-full shadow-lg hover:bg-[#333] transition-colors text-sm font-medium z-40"
      >
        Feedback
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full relative">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {submitted ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-4">Thanks!</div>
                <p className="text-gray-600">Your feedback has been submitted.</p>
              </div>
            ) : (
              <>
                <h2 className="text-2xl font-serif font-bold mb-2">Send Feedback</h2>
                <p className="text-gray-600 text-sm mb-6">
                  Help us improve MakersLounge
                </p>

                <form onSubmit={handleSubmit}>
                  <input
                    type="email"
                    placeholder="Your email (optional)"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl mb-3 outline-none focus:border-gray-400"
                  />
                  <textarea
                    placeholder="What's on your mind?"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl mb-4 outline-none focus:border-gray-400 resize-none"
                    required
                  />
                  <button
                    type="submit"
                    disabled={loading || !message.trim()}
                    className="w-full bg-[#1a1a1a] text-white px-4 py-3 rounded-full font-medium hover:bg-[#333] transition-colors disabled:opacity-50"
                  >
                    {loading ? "Sending..." : "Send Feedback"}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
