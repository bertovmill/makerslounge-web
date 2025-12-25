"use client";

import { useState } from "react";
import { toPng } from "html-to-image";
import { supabase } from "@/lib/supabase";
import ScreenshotEditor from "./ScreenshotEditor";

export default function FeedbackButton() {
  const [showModal, setShowModal] = useState(false);
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [capturing, setCapturing] = useState(false);

  const captureScreenshot = async () => {
    setCapturing(true);
    // Temporarily hide the feedback modal
    setShowModal(false);

    // Wait for modal to close
    await new Promise((resolve) => setTimeout(resolve, 100));

    try {
      const dataUrl = await toPng(document.body, {
        cacheBust: true,
        skipFonts: true,
        filter: (node) => {
          // Skip images that might cause CORS issues
          if (node instanceof HTMLImageElement) {
            const src = node.src || "";
            // Allow data URLs and same-origin images
            if (src.startsWith("data:") || src.startsWith(window.location.origin)) {
              return true;
            }
            // Skip external images to avoid CORS errors
            return false;
          }
          return true;
        },
      });
      setScreenshot(dataUrl);
      setShowEditor(true);
    } catch (err) {
      console.error("Screenshot failed:", err);
    } finally {
      setCapturing(false);
      setShowModal(true);
    }
  };

  const handleEditorSave = (editedScreenshot: string) => {
    setScreenshot(editedScreenshot);
    setShowEditor(false);
  };

  const handleEditorCancel = () => {
    setShowEditor(false);
  };

  const uploadScreenshot = async (dataUrl: string): Promise<string | null> => {
    try {
      // Convert data URL to blob
      const res = await fetch(dataUrl);
      const blob = await res.blob();

      const fileName = `feedback/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.png`;

      const { error: uploadError } = await supabase.storage
        .from("media")
        .upload(fileName, blob, { contentType: "image/png" });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("media")
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (err) {
      console.error("Screenshot upload failed:", err);
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();

    let screenshotUrl: string | null = null;
    if (screenshot) {
      screenshotUrl = await uploadScreenshot(screenshot);
    }

    await supabase.from("feedback").insert({
      message,
      email: user?.email || email || null,
      user_id: user?.id || null,
      screenshot_url: screenshotUrl,
    });

    setLoading(false);
    setSubmitted(true);
    setMessage("");
    setEmail("");
    setScreenshot(null);

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

                  {/* Screenshot section */}
                  {screenshot ? (
                    <div className="mb-4 relative">
                      <div className="max-h-48 overflow-y-auto rounded-xl border border-gray-200">
                        <img
                          src={screenshot}
                          alt="Screenshot"
                          className="w-full"
                        />
                      </div>
                      <div className="absolute top-2 right-2 flex gap-2">
                        <button
                          type="button"
                          onClick={() => setShowEditor(true)}
                          className="bg-white/90 hover:bg-white p-1.5 rounded-full shadow-sm"
                          title="Edit screenshot"
                        >
                          <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          onClick={() => setScreenshot(null)}
                          className="bg-white/90 hover:bg-white p-1.5 rounded-full shadow-sm"
                          title="Remove screenshot"
                        >
                          <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={captureScreenshot}
                      disabled={capturing}
                      className="w-full border-2 border-dashed border-gray-300 rounded-xl p-4 mb-4 text-center hover:border-gray-400 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span className="text-sm text-gray-500">
                        {capturing ? "Capturing..." : "Add Screenshot"}
                      </span>
                    </button>
                  )}

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

      {/* Screenshot Editor */}
      {showEditor && screenshot && (
        <ScreenshotEditor
          screenshot={screenshot}
          onSave={handleEditorSave}
          onCancel={handleEditorCancel}
        />
      )}
    </>
  );
}
